'use client';

import { trackOfSchoolYear } from '@/lib/gizTrack';
import { useEffect, useRef, useState } from 'react';
import { mapApiQuestion, parseStoredAnswer } from '@/lib/questionMapper';
import { isBlankAnswer, questionsFromResult, type RunnerSnapshot } from '@/lib/gizRunner';
import { AppShell, Badge, Button, FeedbackBlock, Icon, Progress, Tuca } from './ui';
import QuestionAnswers from './QuestionAnswers';

interface Props {
  snapshot: RunnerSnapshot;
  review: boolean;
  onReview: () => void;
  onResult: () => void;
  onRetry: () => void;
  onExit: () => void;
}

export default function RunnerResult({ snapshot, review, onReview, onResult, onRetry, onExit }: Props) {
  const [filter, setFilter] = useState('all');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0 }); }, [review]);
  const result = snapshot.result;
  if (!result) return null;
  const questions = [...result.questions].sort((a, b) => a.order - b.order);
  const sourceQuestions = questionsFromResult(result, snapshot.questions);
  const topics = result.topics?.filter((topic) => typeof topic.theme === 'string' && topic.theme.trim() && Number.isInteger(topic.total) && topic.total > 0 && Number.isInteger(topic.correct) && topic.correct >= 0 && topic.correct <= topic.total);
  const unclassified = typeof result.unclassifiedQuestions === 'number' && result.unclassifiedQuestions > 0 ? result.unclassifiedQuestions : 0;
  const total = questions.length;
  const correct = questions.filter((question) => question.isCorrect).length;
  const blank = questions.filter((question) => isBlankAnswer(question.answer)).length;
  const wrong = Math.max(0, total - correct - blank);
  const percentage = total ? Math.round(correct / total * 100) : 0;
  const message = percentage >= 80 ? { title: 'Mandou bem!', detail: `Você acertou ${correct} de ${total}.` } : percentage >= 50 ? { title: 'Bom caminho!', detail: 'Vamos rever as dicas?' } : { title: 'Vale tentar de novo!', detail: 'Cada tentativa te deixa mais forte.' };
  const recordedTimes = questions.map((question) => snapshot.spentMs[question.id]);
  const averageSeconds = recordedTimes.length && recordedTimes.every((time) => typeof time === 'number') ? Math.round(recordedTimes.reduce((sum, time) => sum + time, 0) / total / 1000) : null;
  const schoolYear = snapshot.attempt.simulation?.schoolYear;
  const isKids = schoolYear !== undefined && trackOfSchoolYear(schoolYear) === 'kids';
  const simulationTitle = snapshot.attempt.simulation?.title ?? 'Simulado';
  const visible = questions.filter((question) => filter === 'blank' ? isBlankAnswer(question.answer) : filter === 'wrong' ? !question.isCorrect && !isBlankAnswer(question.answer) : true);

  return (
    <AppShell title={review ? 'Revisar respostas' : 'Seu resultado'} subtitle={simulationTitle} flow backHref={review ? `/simulado/${snapshot.attempt.simulationId}?attemptId=${snapshot.attempt.id}&view=result` : '/'}>
      {review ? <>
        <div className="giz-review-heading"><div><h1 ref={heading} tabIndex={-1}>Vamos rever juntos?</h1><p className="muted">Veja suas respostas e relembre as dicas.</p></div>{isKids && <Tuca pose="lupa" size={72} />}</div>
        <div className="giz-review-filters" role="group" aria-label="Filtrar respostas">{[{ key: 'all', label: `Todas (${total})` }, { key: 'wrong', label: `Erradas (${wrong})` }, { key: 'blank', label: `Em branco (${blank})` }].map((item) => <button key={item.key} className="chip" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}</button>)}</div>
        <div className="giz-review-layout">
          <aside className="card giz-review-index" aria-label="Índice das questões"><h2>Questões</h2><div className="giz-question-map">{questions.map((question, index) => <a key={question.id} href={`#review-${question.id}`} className="giz-map-cell" data-state={isBlankAnswer(question.answer) ? 'blank' : question.isCorrect ? 'correct' : 'wrong'} aria-label={`Questão ${index + 1}, ${isBlankAnswer(question.answer) ? 'em branco' : question.isCorrect ? 'certa' : 'para revisar'}`} onClick={() => { setFilter('all'); window.setTimeout(() => document.getElementById(`review-${question.id}`)?.focus(), 0); }}><span>{index + 1}</span><Icon name={isBlankAnswer(question.answer) ? 'clock' : question.isCorrect ? 'check' : 'x'} size={20} /></a>)}</div><div className="muted giz-map-legend"><span><Icon name="check" size={20} />Certa</span><span><Icon name="x" size={20} />Revisar</span><span><Icon name="clock" size={20} />Em branco</span></div></aside>
          <div className="stack">{visible.length === 0 && <div className="card"><p>Nenhuma questão neste filtro.</p><Button variant="secondary" onClick={() => setFilter('all')}>Ver todas</Button></div>}{visible.map((question) => {
            const index = questions.findIndex((item) => item.id === question.id);
            const source = sourceQuestions.find((item) => item.id === question.id);
            const mapped = source ? mapApiQuestion(source) : null;
            const value = mapped ? parseStoredAnswer(mapped.type, question.answer) : undefined;
            const isBlank = isBlankAnswer(question.answer);
            return <article className="card giz-review-question" id={`review-${question.id}`} tabIndex={-1} key={question.id}>
              <div className="cluster"><span className="giz-question-label">Questão {index + 1}</span><Badge tone={question.isCorrect ? 'ok' : 'soft'}>{!question.isCorrect && <Icon name={isBlank ? 'clock' : 'bulb'} size={20} />}{question.isCorrect ? 'Certa' : isBlank ? 'Em branco' : 'Vamos revisar'}</Badge></div>
              <h2>{question.statement}</h2>
              {mapped && mapped.type !== 'multiple_choice' && !isBlank && <p className="giz-answer-note"><strong>Sua resposta</strong></p>}{mapped ? <QuestionAnswers question={mapped} value={value} locked isCorrect={isBlank ? undefined : question.isCorrect} correctAnswer={question.correctAnswer} review /> : <p>Sua resposta: {isBlank ? 'Em branco' : formatAnswer(question.answer)}</p>}
              {isBlank && <p className="muted">Você deixou esta questão em branco.</p>}
              {!question.isCorrect && isBlankAnswer(question.correctAnswer) && <p className="muted giz-answer-note">A resposta certa ainda não está disponível. Relembre a Dica de Ouro e tente novamente.</p>}
              {question.isCorrect && question.funFact && <FeedbackBlock correct>{question.funFact}</FeedbackBlock>}
              {!question.isCorrect && question.tip && <FeedbackBlock correct={false}>{question.tip}</FeedbackBlock>}
              {question.explanation && <details className="giz-answer-explanation"><summary>Entenda a resposta</summary><p>{question.explanation}</p></details>}
            </article>;
          })}<Button variant="secondary" onClick={onResult}>Voltar ao resultado</Button></div>
        </div>
      </> : <>
        <h1 ref={heading} tabIndex={-1} className="sr-only">Seu resultado: {message.title}</h1>
        <div className="giz-result-layout">
          <section className="card giz-result-summary" aria-label="Resumo do resultado">
            {isKids && <Tuca pose={percentage >= 80 ? 'trofeu' : 'errou-tenta-de-novo'} size={140} />}
            <div className="giz-score-ring" role="img" aria-label={`${correct} acertos em ${total} questões`}><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="68" /><circle cx="80" cy="80" r="68" className="giz-score-ring__fill" pathLength="100" strokeDasharray={`${percentage} 100`} /></svg><div><strong>{correct}</strong><span>de {total} acertos</span></div></div>
            <h2>{message.title}</h2><p className="muted">{message.detail}</p>
            <Button onClick={onReview}>Revisar respostas <Icon name="book" /></Button>
            <Button variant="secondary" onClick={onRetry}>Refazer simulado</Button>
            <Button variant="text" onClick={onExit}>Voltar ao início</Button>
          </section>
          <div className="stack">
            <section className="card"><h2>Seu caminho neste simulado</h2><dl className="giz-result-stats"><div data-tone="correct"><dt><Icon name="check" />Certas</dt><dd>{correct}</dd></div><div data-tone="wrong"><dt><Icon name="bulb" />Erradas</dt><dd>{wrong}</dd></div><div><dt><Icon name="clock" />Em branco</dt><dd>{blank}</dd></div><div><dt><Icon name="clock" />Tempo médio</dt><dd>{averageSeconds === null ? '—' : `${averageSeconds} s`}</dd></div></dl>{averageSeconds === null && <p className="muted">O tempo por questão não foi registrado nesta tentativa.</p>}</section>
            {(Boolean(topics?.length) || unclassified > 0) && <section className="card"><h2>Acertos por tema</h2>{Boolean(topics?.length) && <div className="giz-topic-list">{topics!.map((topic) => <div className="giz-topic-row" key={topic.theme}><h3>{topic.theme}</h3><Progress value={topic.correct} max={topic.total} /></div>)}</div>}{unclassified > 0 && <p className="muted giz-topic-unclassified">{unclassified === 1 ? '1 questão ainda não tem tema definido.' : `${unclassified} questões ainda não têm tema definido.`}</p>}</section>}
            <section className="card"><h2>Revisar respostas</h2><p className="muted">Uma dica para cada nova descoberta.</p><div className="giz-result-list">{questions.map((question, index) => <details key={question.id}><summary><span className="giz-result-mark" data-correct={question.isCorrect}><Icon name={question.isCorrect ? 'check' : isBlankAnswer(question.answer) ? 'clock' : 'bulb'} /></span><span>Questão {index + 1}</span><span className="muted">{question.isCorrect ? 'Certa' : isBlankAnswer(question.answer) ? 'Em branco' : 'Revisar'}</span></summary><p>{question.statement}</p>{question.isCorrect && question.funFact && <FeedbackBlock correct>{question.funFact}</FeedbackBlock>}{!question.isCorrect && question.tip && <FeedbackBlock correct={false}>{question.tip}</FeedbackBlock>}<Button variant="text" onClick={onReview}>Ver a questão na revisão</Button></details>)}</div></section>
          </div>
        </div>
      </>}
    </AppShell>
  );
}

function formatAnswer(answer: unknown): string {
  if (!answer || typeof answer !== 'object') return String(answer ?? 'Em branco');
  return Object.entries(answer as Record<string, unknown>).map(([key, value]) => `${key}: ${String(value)}`).join(' · ');
}
