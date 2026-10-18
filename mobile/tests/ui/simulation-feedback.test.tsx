/// <reference types="jest" />
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import SimulationScreen from '../../app/simulation/[id]';
import AttemptResultScreen from '../../src/simulation/AttemptResultScreen';
import { Options } from '../../src/simulation/Options';
import { ApiError, ApiNetworkError } from '../../src/core/session';
import { mapApiQuestion } from '../../src/simulation/questions';
import type { ApiAttemptResult, ApiQuestion } from '../../../packages/api-contracts/src';
import type { RunnerSnapshot } from '../../src/simulation/model';

const mockRequest = jest.fn();
const mockPush = jest.fn();
const mockSession = { status: 'authenticated', generation: 1, user: { id: 'student', name: 'Pessoa de teste', role: 'STUDENT' } };
const mockClient = { request: mockRequest, getSnapshot: () => mockSession };
let mockParams: { id: string; attempt?: string; timer?: string } = { id: 'simulation', timer: '0' };
let mockCache: RunnerSnapshot | null = null;
const mockSaved = jest.fn((..._args: unknown[]) => true);
const question: ApiQuestion = { id: 'q1', type: 'MULTIPLE_CHOICE', statement: 'Escolha uma alternativa.', tip: null, funFact: null, points: '1', order: 1, options: [{ id: 'option-a', optionKey: 'A', text: 'Primeira opção', groupKey: null, order: 1 }, { id: 'option-b', optionKey: 'B', text: 'Segunda opção', groupKey: null, order: 2 }] };
const attempt = { id: 'attempt', simulationId: 'simulation', status: 'IN_PROGRESS', immediateFeedback: true };
const wrongFeedback = { isCorrect: false, correctAnswer: { answer: 'B' }, tip: 'Compare as duas opções.', explanation: 'A segunda opção atende ao enunciado.' };
const correctFeedback = { isCorrect: true, correctAnswer: { answer: 'B' }, funFact: 'Uma curiosidade enviada pela API.' };

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), replace: (...args: unknown[]) => mockPush(...args), canGoBack: () => false },
  usePathname: () => '/simulation/simulation',
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (callback: () => (() => void) | void) => { const { useEffect } = require('react'); useEffect(callback, [callback]); },
}));
jest.mock('../../src/session-context', () => ({ useSession: () => ({ client: mockClient, session: mockSession, foreground: 0 }) }));
jest.mock('../../src/simulation/storage', () => ({ readProgress: () => mockCache, saveProgress: (...args: unknown[]) => mockSaved(...args) }));
jest.mock('../../src/theme', () => { const source = require('../../src/generated/tokens').tokens; return { tokens: source, useTheme: () => ({ colors: Object.fromEntries(Object.entries(source.color.light).map(([key, value]: [string, any]) => [key, value.value])), tokens: source, timer: false }) }; });
jest.mock('react-native-safe-area-context', () => { const { View } = require('react-native'); return { SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View> }; });
jest.mock('react-native-svg', () => ({ __esModule: true, default: () => null, Circle: () => null, SvgXml: () => null }));

beforeEach(() => { mockParams = { id: 'simulation', timer: '0' }; mockCache = null; mockRequest.mockReset(); mockSaved.mockClear(); });
afterEach(cleanup);
function configureQuestions(questions: ApiQuestion[], response: unknown = { feedback: correctFeedback }, legacy = false) {
  mockRequest.mockImplementation(async (path: string) => {
    if (path === '/simulations/simulation/attempts' || path === '/attempts/attempt') return legacy ? {id:attempt.id,simulationId:attempt.simulationId,status:attempt.status} : attempt;
    if (path === '/attempts/attempt/questions') return questions;
    if (path.endsWith('/answer')) return response;
    throw new Error(`Unexpected test route ${path}`);
  });
}

async function chooseAndConfirm(name: string) {
  await screen.findByRole('radio', { name });
  await fireEvent.press(screen.getByRole('radio', { name }));
  await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));
}

test('opt-in confirmation waits for API feedback, shows the real correct option after an error, and never guesses before it arrives', async () => {
  let resolve!: (value: unknown) => void;
  const response = new Promise(yes => { resolve = yes; });
  configureQuestions([question], response);
  await render(<SimulationScreen />);
  await screen.findByRole('radio', { name: 'A. Primeira opção' });
  expect(mockRequest).toHaveBeenCalledWith('/simulations/simulation/attempts', { method: 'POST', body: JSON.stringify({ immediateFeedback: true }) });
  expect(screen.queryAllByRole('radio', { name: /Certa/ })).toHaveLength(0);
  await chooseAndConfirm('A. Primeira opção');
  expect(screen.getByRole('button', { name: 'Enviando…' }).props.accessibilityState.disabled).toBe(true);
  expect(screen.queryAllByRole('radio', { name: /Certa/ })).toHaveLength(0);
  await act(async () => { resolve({ feedback: wrongFeedback }); await response; });
  await screen.findByText('Compare as duas opções.');
  expect(screen.getByRole('radio', { name: /A\. Primeira opção, Sua resposta, Vamos revisar/ })).toBeTruthy();
  expect(screen.getByRole('radio', { name: /B\. Segunda opção, Certa/ })).toBeTruthy();
  expect(screen.getByText(wrongFeedback.explanation)).toBeTruthy();
});

test('a correct confirmation shows the API curiosity and labels the selected correct option', async () => {
  configureQuestions([question]);
  await render(<SimulationScreen />);
  await chooseAndConfirm('B. Segunda opção');
  await screen.findByText(correctFeedback.funFact);
  expect(screen.getByRole('radio', { name: /B\. Segunda opção, Sua resposta, Certa/ })).toBeTruthy();
  expect(screen.queryByText('Dica de Ouro')).toBeNull();
});

test('resume shows authorized server feedback on another device and reveals the right option for a confirmed blank', async () => {
  mockParams = { id: 'simulation', attempt: 'attempt', timer: '0' };
  configureQuestions([{ ...question, answer: {}, confirmedAt: '2026-10-17T12:00:00Z', feedback: wrongFeedback }]);
  await render(<SimulationScreen />);
  await screen.findByText('Compare as duas opções.');
  expect(screen.getAllByText('O tempo acabou').length).toBeGreaterThan(0);
  expect(screen.getByRole('radio', { name: /B\. Segunda opção, Certa/ })).toBeTruthy();
  expect(mockRequest.mock.calls.filter(([path]) => String(path).endsWith('/answer'))).toHaveLength(0);
});

test('a conflicting different confirmation restores the server answer instead of retrying it forever', async () => {
  let reads = 0;
  mockRequest.mockImplementation(async (path: string) => {
    if (path === '/simulations/simulation/attempts') return attempt;
    if (path === '/attempts/attempt/questions') return reads++ ? [{ ...question, answer: { answer: 'B' }, confirmedAt: '2026-10-17T12:00:00Z', feedback: correctFeedback }] : [question];
    if (path.endsWith('/answer')) throw new ApiError(409);
    throw new Error('Unexpected route');
  });
  await render(<SimulationScreen />);
  await chooseAndConfirm('A. Primeira opção');
  await screen.findByText(correctFeedback.funFact);
  expect(screen.getByRole('radio', { name: /B\. Segunda opção, Sua resposta, Certa/ }).props.accessibilityState.checked).toBe(true);
  expect(mockRequest.mock.calls.filter(([path]) => String(path).endsWith('/answer'))).toHaveLength(1);
});

test('compound correction uses each authorized map entry rather than colouring every chosen answer wrong', async () => {
  const compound: ApiQuestion = { ...question, type: 'TRUE_FALSE_MULTIPLE', options: [{ id: 'one', optionKey: 'one', text: 'Primeiro item', groupKey: null, order: 1 }, { id: 'two', optionKey: 'two', text: 'Segundo item', groupKey: null, order: 2 }] };
  await render(<Options question={mapApiQuestion(compound)} value={{ one: 'V', two: 'F' }} locked isCorrect={false} correctAnswer={{ one: 'F', two: 'F' }} />);
  expect(screen.getByText('Primeiro item')).toBeTruthy();
  expect(screen.getAllByRole('radio', { name: /Falso.*Certa/ })).toHaveLength(2);
  expect(screen.getByRole('radio', { name: /Verdadeiro, Sua resposta, Vamos revisar/ })).toBeTruthy();
  expect(screen.getByRole('radio', { name: /Falso, Sua resposta, Certa/ })).toBeTruthy();
});

function resultFixture(): ApiAttemptResult {
  return { attempt: { ...attempt, status: 'FINISHED', score: '1', maxScore: '2', percentage: '50', correctCount: 1, wrongCount: 1 }, questions: [{ ...question, answer: { answer: 'B' }, isCorrect: true, pointsEarned: '1', correctAnswer: { answer: 'B' } }, { ...question, id: 'q2', order: 2, answer: {}, isCorrect: false, pointsEarned: '0', correctAnswer: { answer: 'B' } }], topics: [{ theme: 'Mapas', correct: 1, total: 1 }], unclassifiedQuestions: 1 };
}

test('results consume the server topic counts and review uses result options without an extra questions dependency', async () => {
  mockParams = { id: 'attempt' };
  mockRequest.mockImplementation(async (path: string) => { if (path === '/attempts/attempt/result') return resultFixture(); throw new Error('An extra question fetch should not be needed.'); });
  const view = await render(<AttemptResultScreen />);
  await screen.findByText('Mapas');
  expect(screen.getByText('1 questão sem tema cadastrado.')).toBeTruthy();
  expect(screen.getByRole('progressbar').props.accessibilityValue).toMatchObject({ now: 1, max: 1 });
  await view.rerender(<AttemptResultScreen review />);
  await waitFor(() => expect(screen.getAllByRole('radio', { name: /Segunda opção.*Certa/ })).toHaveLength(2));
  expect(screen.queryByText(/A resposta certa ainda não está disponível/)).toBeNull();
  expect(mockRequest.mock.calls.some(([path]) => String(path).endsWith('/questions'))).toBe(false);
});

test('legacy attempts keep receipt-only feedback', async () => {
  configureQuestions([question], { answer: { answer: 'A' } }, true);
  await render(<SimulationScreen />);
  await chooseAndConfirm('A. Primeira opção');
  await screen.findByText('Você verá a correção e as dicas ao finalizar o simulado.');
  expect(screen.queryAllByRole('radio', { name: /Certa/ })).toHaveLength(0);
});


test('an equivalent retry after a lost confirmation response keeps the same body and receives real feedback',async()=>{
 let posts=0;
 mockRequest.mockImplementation(async(path:string)=>{
  if(path==='/simulations/simulation/attempts')return attempt;
  if(path==='/attempts/attempt/questions')return [question];
  if(path.endsWith('/answer')){if(posts++===0)throw new ApiNetworkError();return {feedback:correctFeedback};}
  throw new Error('Unexpected route');
 });
 await render(<SimulationScreen/>);
 await chooseAndConfirm('B. Segunda opção');
 await screen.findByText('Sem conexão. Seu progresso está salvo neste aparelho.');
 expect(screen.queryAllByRole('radio',{name:/Certa/})).toHaveLength(0);
 await fireEvent.press(screen.getByRole('button',{name:'Tentar sincronizar'}));
 await screen.findByText(correctFeedback.funFact);
 const posted=mockRequest.mock.calls.filter(([path])=>String(path).endsWith('/answer'));
 expect(posted).toHaveLength(2);
 expect(posted[0][1].body).toBe(JSON.stringify({answer:{answer:'B'}}));
 expect(posted[1][1].body).toBe(posted[0][1].body);
});

test('resume replaces a stale cached selection and feedback with the confirmed server answer',async()=>{
 mockParams={id:'simulation',attempt:'attempt',timer:'0'};
 mockCache={version:1,userId:'student',attempt,questions:[question],answers:{q1:{value:'B',body:{answer:'B'},synced:true,feedback:correctFeedback}},drafts:{},spentMs:{},currentIndex:0,remainingMs:45000,timerEnabled:false};
 configureQuestions([{...question,answer:{answer:'A'},confirmedAt:'2026-10-17T12:00:00Z',feedback:wrongFeedback}]);
 await render(<SimulationScreen/>);
 await screen.findByText(wrongFeedback.tip);
 expect(screen.getByRole('radio',{name:/A\. Primeira opção, Sua resposta, Vamos revisar/}).props.accessibilityState.checked).toBe(true);
 expect(screen.getByRole('radio',{name:/B\. Segunda opção, Certa/}).props.accessibilityState.checked).toBe(false);
 expect(screen.queryByText(correctFeedback.funFact)).toBeNull();
});

test('a legacy result remains readable if optional option enrichment fails and never invents topic bars or an answer key',async()=>{
 mockParams={id:'attempt'};
 const legacy=resultFixture();legacy.topics=undefined;legacy.unclassifiedQuestions=undefined;
 legacy.questions=legacy.questions.map(({correctAnswer:_key,options:_options,...rest})=>rest);
 mockRequest.mockImplementation(async(path:string)=>{if(path==='/attempts/attempt/result')return legacy;throw new ApiNetworkError();});
 const view=await render(<AttemptResultScreen/>);
 await screen.findByText('A divisão por tema ainda não está disponível para esta tentativa.');
 expect(screen.queryAllByRole('progressbar')).toHaveLength(0);
 await view.rerender(<AttemptResultScreen review/>);
 await screen.findByText('A resposta certa ainda não está disponível. Relembre a Dica de Ouro e tente novamente.');
 expect(screen.queryAllByRole('radio',{name:/Certa/})).toHaveLength(0);
});


test('an explicitly redacted result answer key never revives a cached answer key',async()=>{
 mockParams={id:'attempt'};
 const redacted=resultFixture();
 redacted.questions=[{...question,answer:{answer:'A'},isCorrect:false,pointsEarned:'0',correctAnswer:null}];
 mockCache={version:1,userId:'student',attempt:redacted.attempt,questions:[question],answers:{q1:{value:'A',body:{answer:'A'},synced:true,feedback:wrongFeedback}},drafts:{},spentMs:{},currentIndex:0,remainingMs:45000,timerEnabled:false};
 mockRequest.mockImplementation(async(path:string)=>{if(path==='/attempts/attempt/result')return redacted;throw new Error('Unexpected route');});
 await render(<AttemptResultScreen review/>);
 await screen.findByText('A resposta certa ainda não está disponível. Relembre a Dica de Ouro e tente novamente.');
 expect(screen.getByRole('radio',{name:/A\. Primeira opção, Sua resposta, Vamos revisar/})).toBeTruthy();
 expect(screen.queryAllByRole('radio',{name:/Certa/})).toHaveLength(0);
});
