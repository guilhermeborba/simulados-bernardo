/// <reference types="jest" />
import React from 'react';
import { StyleSheet } from 'react-native';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Simulations from '../../app/simulations';
import Home from '../../app/index';
let mockAttempts: any[] = [];
let mockTrack: 'kids' | 'escola' | 'tecnico' = 'kids';
let mockTurmas: any[] = [];
const mockPush=jest.fn();
const mockCatalog=[
 {id:'geo-av1',title:'Mapas e caminhos',subtitle:null,schoolYear:3,bimester:1,assessment:'AV1',totalQuestions:30,discipline:{id:'geo',name:'Geografia'}},
 {id:'geo-av2',title:'Mapas da nossa escola',subtitle:null,turmaId:'turma-3',schoolYear:3,bimester:2,assessment:'AV2',totalQuestions:30,discipline:{id:'geo',name:'Geografia'}},
 {id:'math-av1',title:'Caminhos dos números',subtitle:null,schoolYear:3,bimester:1,assessment:'AV1',totalQuestions:30,discipline:{id:'math',name:'Matemática'}},
 {id:'hist-7',title:'Brasil colonial',subtitle:null,schoolYear:7,bimester:1,assessment:'AV1',totalQuestions:30,discipline:{id:'hist',name:'História'}},
 {id:'bio-2em',title:'Genética',subtitle:null,schoolYear:11,bimester:1,assessment:'AV1',totalQuestions:30,discipline:{id:'bio',name:'Biologia'}},
 {id:'technical',title:'Conteúdo técnico',subtitle:null,schoolYear:0,bimester:0,assessment:'AV1',totalQuestions:30,discipline:{id:'tech',name:'Técnico'}},
];
jest.mock('expo-router',()=>({router:{push:(...args:unknown[])=>mockPush(...args),replace:jest.fn()},usePathname:()=>'/simulations'}));
let mockAnswered:Record<string,number>={};
const mockClient={request:(path:string)=>{const id=decodeURIComponent(path.split('/')[2]);return Promise.resolve(Array.from({length:30},(_,i)=>({id:`q${i}`,answer:i<(mockAnswered[id]??0)?{answer:'A'}:null})));}};
jest.mock('../../src/session-context',()=>({useSession:()=>({client:mockClient,session:{status:'authenticated',generation:1,user:{id:'test-user',name:'Pessoa de teste',role:'STUDENT'}}})}));
jest.mock('../../src/data',()=>({useRemote:(path:string)=>({data:path==='/me/attempts'?mockAttempts:path==='/me/pontuacao'?null:path==='/me/turmas'?mockTurmas:mockCatalog,error:null,loading:false,reload:jest.fn()})}));
jest.mock('../../src/Auth',()=>()=>null);
jest.mock('../../src/theme',()=>{const source=require('../../src/generated/tokens').tokens;return{tokens:source,useTheme:()=>({colors:Object.fromEntries(Object.entries(source.color.light).map(([key,value]:[string,any])=>[key,value.value])),tokens:source,ready:true,track:mockTrack})};});
jest.mock('react-native-safe-area-context',()=>{const{View}=require('react-native');return{SafeAreaView:({children,...props}:any)=><View {...props}>{children}</View>};});
jest.mock('react-native-svg',()=>({SvgXml:()=>null}));
afterEach(()=>{cleanup();mockTrack='kids';mockTurmas=[];mockAnswered={};mockAttempts=[];});
test.each([[390,'100%'],[768,'50%'],[1440,`${100/3}%`]])('catalog at %i uses cells %s wide with unrestricted text scaling',async(width,expected)=>{
 const native=require('react-native');
 const dimensions=jest.spyOn(native,'useWindowDimensions').mockReturnValue({width,height:1024,scale:1,fontScale:2});
 try {
  await render(<Simulations/>);
  const cells=screen.getAllByTestId('simulation-grid-cell');
  expect(cells).toHaveLength(3);
  expect(StyleSheet.flatten(cells[0].props.style)).toMatchObject({width:expected,minWidth:0});
  expect(screen.queryByText('Conteúdo técnico')).toBeNull();
 } finally { dimensions.mockRestore(); }
});
test('search and steps combine, the sheet counts its choices, clearing resets both, and the whole row opens its detail',async()=>{
 await render(<Simulations/>);
 expect(screen.getByText('3 simulados')).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Limpar escolhas'})).toBeNull();
 await fireEvent.changeText(screen.getByLabelText('Buscar simulado'),'Mapas');
 await waitFor(()=>expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(2));
 await fireEvent.press(screen.getByRole('button',{name:'Ano, bimestre e avaliação'}));
 await fireEvent.press(screen.getByRole('button',{name:'AV1, 1ª avaliação'}));
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(1);
 await fireEvent.press(screen.getByRole('button',{name:'Ver 1 simulado'}));
 expect(screen.getByRole('button',{name:'Ano, bimestre e avaliação, 1 escolhidas'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Tirar AV1'})).toBeTruthy();
 await fireEvent.press(screen.getByRole('button',{name:'Geografia, 1º bimestre, AV1, 30 questões, novo'}));
 expect(mockPush).toHaveBeenCalledWith({pathname:'/detail/[id]',params:{id:'geo-av1'}});
 await fireEvent.press(screen.getByRole('button',{name:'Limpar escolhas'}));
 expect(screen.getByLabelText('Buscar simulado').props.value).toBe('');
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(3);
});
test('a subject is chosen and removed by touching it again, and the chip removes it too',async()=>{
 await render(<Simulations/>);
 await fireEvent.press(screen.getByRole('button',{name:'Matemática'}));
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(1);
 expect(screen.getByRole('button',{name:'Matemática'}).props.accessibilityState).toMatchObject({selected:true});
 await fireEvent.press(screen.getByRole('button',{name:'Matemática'}));
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(3);
 await fireEvent.press(screen.getByRole('button',{name:'Geografia'}));
 await fireEvent.press(screen.getByRole('button',{name:'Tirar Geografia'}));
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(3);
 expect(screen.getByRole('button',{name:'Todas'}).props.accessibilityState).toMatchObject({selected:true});
});
test('rows show progress and score, in progress first and done last',async()=>{
 mockAnswered={'math-attempt':12};
 mockAttempts=[{id:'math-attempt',simulationId:'math-av1',status:'IN_PROGRESS',finishedAt:null,simulation:{title:'Caminhos dos números'}},{id:'geo-attempt',simulationId:'geo-av1',status:'FINISHED',finishedAt:'2026-10-20T10:00:00Z',correctCount:25,simulation:{title:'Mapas e caminhos'}}];
 await render(<Simulations/>);
 const rows=await screen.findAllByRole('button',{name:/questões|respondidas|certas/});
 expect(rows.map(row=>row.props.accessibilityLabel)).toEqual(['Matemática, 1º bimestre, AV1, 12 de 30 respondidas, em andamento','Geografia, 2º bimestre, AV2, 30 questões, novo','Geografia, 1º bimestre, AV1, 25 de 30 certas, concluído']);
});
test('a year without simulations says they are coming and leads back to the default year',async()=>{
 await render(<Simulations/>);
 await fireEvent.press(screen.getByRole('button',{name:'Ano, bimestre e avaliação'}));
 await fireEvent.press(screen.getByRole('button',{name:'4º ano'}));
 expect(screen.getByText('Os simulados do 4º ano chegam em breve')).toBeTruthy();
 expect(screen.getByText('0 simulados')).toBeTruthy();
 expect(screen.getByText('Por enquanto, temos simulados do 3º ano.')).toBeTruthy();
 await fireEvent.press(screen.getByRole('button',{name:'Ver 0 simulados'}));
 await fireEvent.press(screen.getByRole('button',{name:'Voltar ao 3º ano'}));
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(3);
});

test.each([false,true])('home resumes only available Kids simulations (has Kids attempt: %s)',async(hasKids)=>{
 mockAnswered={'technical-attempt':5,'kids-attempt':12};
 mockAttempts=[{id:'technical-attempt',simulationId:'technical',status:'IN_PROGRESS',simulation:{title:'Em andamento técnico'}},...(hasKids?[{id:'kids-attempt',simulationId:'geo-av1',status:'IN_PROGRESS',simulation:{title:'Mapas e caminhos'}}]:[])];
 await render(<Home/>);
 await screen.findByText('Novos para você');
 expect(Boolean(screen.queryByText('Continuar de onde parou'))).toBe(hasKids);
 if(hasKids){
  expect(screen.getByText('12 de 30')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button',{name:'Continuar simulado'}));
  expect(mockPush).toHaveBeenLastCalledWith({pathname:'/simulation/[id]',params:{id:'geo-av1',attempt:'kids-attempt'}});
 }
});
test('an attempt without answers is not resumed and its simulation stays new',async()=>{
 mockAnswered={'kids-attempt':0};
 mockAttempts=[{id:'kids-attempt',simulationId:'geo-av1',status:'IN_PROGRESS',simulation:{title:'Mapas e caminhos'}}];
 await render(<Home/>);
 const card=await screen.findByRole('button',{name:'Geografia, 1º bimestre, AV1, 30 questões, novo'});
 expect(screen.queryByText('Continuar de onde parou')).toBeNull();
 await fireEvent.press(card);
 expect(mockPush).toHaveBeenLastCalledWith({pathname:'/detail/[id]',params:{id:'geo-av1'}});
});

test('Giz Escola lists only Fundamental II and Médio, starting at the first year with content, with years by série',async()=>{
 mockTrack='escola';
 await render(<Simulations/>);
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(1);
 expect(screen.getByRole('button',{name:'História, 1º bimestre, AV1, 30 questões, novo'})).toBeTruthy();
 expect(screen.queryByText('Mapas e caminhos')).toBeNull();
 await fireEvent.press(screen.getByRole('button',{name:'Ano, bimestre e avaliação'}));
 await fireEvent.press(screen.getByRole('button',{name:'2ª série'}));
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(1);
 expect(screen.getByRole('button',{name:'Biologia, 1º bimestre, AV1, 30 questões, novo'})).toBeTruthy();
});
test('Giz Técnico lists the technical course without year, bimester or assessment steps',async()=>{
 mockTrack='tecnico';
 await render(<Simulations/>);
 expect(screen.getAllByTestId('simulation-grid-cell')).toHaveLength(1);
 expect(screen.getByRole('button',{name:/^Técnico, /})).toBeTruthy();
 expect(screen.queryByRole('button',{name:/Ano, bimestre e avaliação/})).toBeNull();
 expect(screen.queryByRole('button',{name:'Ano'})).toBeNull();
});

test('turma members see their class simulations first, marked, with their year preselected',async()=>{
 mockTurmas=[{id:'turma-3',name:'3º ano',slug:'turma-3',schoolYear:3}];
 await render(<Simulations/>);
 const cells=screen.getAllByTestId('simulation-grid-cell');
 expect(cells).toHaveLength(3);
 const turma=screen.getAllByRole('button',{name:/, da sua turma, /});
 expect(turma).toHaveLength(1);
 expect(turma[0].props.accessibilityLabel).toBe('Geografia, 2º bimestre, AV2, da sua turma, 30 questões, novo');
 expect(screen.getAllByRole('button',{name:/questões/})[0]).toBe(turma[0]);
 expect(screen.queryByRole('button',{name:'Outras faixas e avaliações na web'})).toBeNull();
});
