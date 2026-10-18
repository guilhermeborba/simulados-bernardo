'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiRequestError, finishAttempt, getAttemptQuestions, getAttemptResult, getMe, startAttempt, submitAttemptAnswer } from '@/lib/apiClient';
import { mapApiQuestion } from '@/lib/questionMapper';
import { getTimerDefault } from '@/lib/gizPreferences';
import { answerIsComplete, feedbackContent, getAttemptDetails, makeAnswer, persistSnapshot, QUESTION_TIME_MS, questionsFromResult, readSnapshot, responseFeedback, restoreAnswers, SESSION_USER_KEY, type RunnerSnapshot } from '@/lib/gizRunner';
import { AppShell, Badge, Button, FeedbackBlock, Icon, Modal, Progress, ScreenState } from './giz/ui';
import QuestionAnswers from './giz/QuestionAnswers';
import RunnerResult from './giz/RunnerResult';
import './giz/runner.css';

type Screen = 'loading' | 'ready' | 'result' | 'review' | 'error';

export default function SimuladoRunner({ simulationId }: { simulationId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const requestedAttempt = params.get('attemptId');
  const requestedView = params.get('view');
  const requestedTimer = params.get('timer');
  const [screen, setScreen] = useState<Screen>('loading');
  const [snapshot, setSnapshot] = useState<RunnerSnapshot | null>(null);
  const snapshotRef = useRef<RunnerSnapshot | null>(null);
  const [offline, setOffline] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [timerAnnouncement, setTimerAnnouncement] = useState('');
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const feedbackHeading = useRef<HTMLHeadingElement>(null);
  const revision = useRef(0);
  const syncing = useRef<Promise<void> | null>(null);
  const screenRef = useRef(screen);
  const exitRef = useRef(exitOpen);
  const clockBase = useRef(0);
  const confirmRef = useRef<(blank?: boolean) => void>(() => undefined);
  screenRef.current = screen;
  exitRef.current = exitOpen;

  function commit(next: RunnerSnapshot) {
    snapshotRef.current = next;
    setSnapshot(next);
    setStorageOk(persistSnapshot(next));
  }

  async function load() {
    const loadRevision = ++revision.current;
    if (requestedAttempt && snapshotRef.current?.attempt.id === requestedAttempt && snapshotRef.current.result) {
      setScreen(requestedView === 'review' ? 'review' : 'result');
      return;
    }
    setScreen('loading');
    setError('');
    try {
      const user = await getMe();
      try { sessionStorage.setItem(SESSION_USER_KEY, user.id); } catch { /* Browser storage is optional. */ }
      const attempt = requestedAttempt ? await getAttemptDetails(requestedAttempt) : await startAttempt(simulationId);
      if (attempt.simulationId !== simulationId) throw new Error('Esta tentativa pertence a outro simulado. Abra pelo seu histórico.');
      const cached = readSnapshot(user.id, simulationId, attempt.id);
      const result = attempt.status === 'FINISHED' ? await getAttemptResult(attempt.id) : undefined;
      let apiQuestions;
      if (result) {
        let fallback = cached?.questions ?? [];
        if (result.questions.some((question) => !Array.isArray(question.options))) {
          try { fallback = await getAttemptQuestions(attempt.id); } catch { /* The authorized result remains usable if its legacy alternatives are unavailable. */ }
        }
        apiQuestions = questionsFromResult(result, fallback);
      } else {
        apiQuestions = (await getAttemptQuestions(attempt.id)).sort((a, b) => a.order - b.order);
      }
      const answers = restoreAnswers(apiQuestions, cached);
      const firstOpen = apiQuestions.findIndex((question) => !answers[question.id]);
      const currentIndex = Math.min(Math.max(cached?.currentIndex ?? (firstOpen < 0 ? apiQuestions.length - 1 : firstOpen), 0), Math.max(apiQuestions.length - 1, 0));
      const next: RunnerSnapshot = {
        version: 1, userId: user.id, attempt, questions: apiQuestions, answers,
        drafts: cached?.drafts ?? {}, spentMs: cached?.spentMs ?? {}, currentIndex,
        remainingMs: QUESTION_TIME_MS,
        timerEnabled: requestedTimer === '0' ? false : requestedTimer === '1' ? true : cached?.timerEnabled ?? getTimerDefault(),
        result,
      };
      if (loadRevision !== revision.current) return;
      commit(next);
      setOffline(false);
      setScreen(result ? requestedView === 'review' ? 'review' : 'result' : 'ready');
      clockBase.current = performance.now();
      void synchronize().catch(() => undefined);
    } catch (cause) {
      if (loadRevision !== revision.current) return;
      const disconnected = !navigator.onLine || cause instanceof TypeError;
      let cached: RunnerSnapshot | null = null;
      if (disconnected) {
        try {
          const userId = sessionStorage.getItem(SESSION_USER_KEY);
          if (userId) cached = readSnapshot(userId, simulationId, requestedAttempt);
        } catch { /* An offline cache requires the same verified browser session. */ }
      }
      if (cached && (!(requestedView === 'result' || requestedView === 'review') || cached.result)) {
        commit({ ...cached, remainingMs: QUESTION_TIME_MS });
        setOffline(true);
        setScreen(cached.result ? requestedView === 'review' ? 'review' : 'result' : 'ready');
        clockBase.current = performance.now();
      } else {
        setOffline(disconnected);
        setError(disconnected ? 'Conecte-se para abrir este simulado. Respostas já salvas neste aparelho continuam guardadas.' : cause instanceof Error ? cause.message : 'Não foi possível abrir o simulado.');
        setScreen('error');
      }
    }
  }

  useEffect(() => {
    void load();
    return () => { revision.current += 1; };
    // Query parameters also support direct links from history and review.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationId, requestedAttempt, requestedView, requestedTimer]);

  async function synchronize() {
    if (syncing.current) return syncing.current;
    const operation = (async () => {
      const initial = snapshotRef.current;
      if (!initial || initial.result) return;
      for (const question of initial.questions) {
        const current = snapshotRef.current;
        if (!current || current.attempt.id !== initial.attempt.id) return;
        const answer = current.answers[question.id];
        if (!answer || answer.synced) continue;
        let response;
        try { response = await submitAttemptAnswer(current.attempt.id, question.id, answer.body); }
        catch (cause) {
          if (!(cause instanceof ApiRequestError) || cause.status !== 409) throw cause;
          // Another tab/device may have confirmed first. Restore that response
          // instead of repeatedly attempting to overwrite an immutable answer.
          const refreshed = (await getAttemptQuestions(current.attempt.id)).sort((a, b) => a.order - b.order);
          const latest = snapshotRef.current;
          if (!latest || latest.attempt.id !== initial.attempt.id) return;
          const answers = restoreAnswers(refreshed, latest);
          if (!answers[question.id]?.synced) throw cause;
          commit({ ...latest, questions: refreshed, answers });
          continue;
        }
        const latest = snapshotRef.current;
        if (!latest || latest.attempt.id !== initial.attempt.id) return;
        commit({ ...latest, answers: { ...latest.answers, [question.id]: { ...answer, synced: true, feedback: responseFeedback(response) } } });
      }
      setOffline(false);
    })();
    syncing.current = operation;
    try { await operation; } finally { if (syncing.current === operation) syncing.current = null; }
  }

  useEffect(() => {
    const online = () => {
      setOffline(false);
      void synchronize().catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível sincronizar. Tente de novo.'));
    };
    const disconnected = () => setOffline(true);
    const visibility = () => { clockBase.current = performance.now(); };
    window.addEventListener('online', online);
    window.addEventListener('offline', disconnected);
    document.addEventListener('visibilitychange', visibility);
    const interval = window.setInterval(() => {
      const now = performance.now();
      const elapsed = Math.min(Math.max(now - clockBase.current, 0), 1500);
      clockBase.current = now;
      const current = snapshotRef.current;
      if (screenRef.current !== 'ready' || exitRef.current || document.hidden || !current) return;
      const question = current.questions[current.currentIndex];
      if (!question || current.answers[question.id]) return;
      const remainingMs = current.timerEnabled ? Math.max(0, current.remainingMs - elapsed) : current.remainingMs;
      const previousSeconds = Math.ceil(current.remainingMs / 1000);
      const seconds = Math.ceil(remainingMs / 1000);
      if (current.timerEnabled && previousSeconds > 30 && seconds <= 30) setTimerAnnouncement('Faltam 30 segundos.');
      if (current.timerEnabled && previousSeconds > 10 && seconds <= 10) setTimerAnnouncement('Faltam 10 segundos.');
      commit({ ...current, remainingMs, spentMs: { ...current.spentMs, [question.id]: (current.spentMs[question.id] ?? 0) + elapsed } });
      if (current.timerEnabled && remainingMs === 0) confirmRef.current(true);
    }, 1000);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', disconnected);
      document.removeEventListener('visibilitychange', visibility);
      window.clearInterval(interval);
    };
    // State is read through refs so rendering never restarts the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuestion = snapshot?.questions[snapshot.currentIndex];
  const confirmation = currentQuestion && snapshot?.answers[currentQuestion.id];
  useEffect(() => {
    if (screen !== 'ready' || exitOpen) return;
    if (confirmation) feedbackHeading.current?.focus();
    else questionHeading.current?.focus();
    // Move focus when the real verdict arrives, without reacting to unrelated sync updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, currentQuestion?.id, Boolean(confirmation), confirmation?.feedback?.isCorrect, exitOpen]);

  function choose(value: unknown) {
    const current = snapshotRef.current;
    if (!current) return;
    const question = current.questions[current.currentIndex];
    if (current.answers[question.id]) return;
    commit({ ...current, drafts: { ...current.drafts, [question.id]: value } });
  }

  function confirm(blank = false) {
    const current = snapshotRef.current;
    if (!current) return;
    const question = current.questions[current.currentIndex];
    if (!question || current.answers[question.id]) return;
    const mapped = mapApiQuestion(question);
    const value = current.drafts[question.id];
    if (!blank && !answerIsComplete(mapped, value)) return;
    const now = performance.now();
    const partial = document.hidden || exitRef.current ? 0 : Math.min(Math.max(now - clockBase.current, 0), 1500);
    clockBase.current = now;
    commit({ ...current, spentMs: { ...current.spentMs, [question.id]: (current.spentMs[question.id] ?? 0) + partial }, answers: { ...current.answers, [question.id]: makeAnswer(mapped, value, blank) } });
    setError('');
    if (navigator.onLine) void synchronize().catch((cause) => {
      if (cause instanceof TypeError || !navigator.onLine) setOffline(true);
      else setError(cause instanceof Error ? cause.message : 'Sua resposta está no aparelho. Tente sincronizar de novo.');
    });
    else setOffline(true);
  }
  confirmRef.current = confirm;

  function goTo(index: number) {
    const current = snapshotRef.current;
    if (!current || index < 0 || index >= current.questions.length) return;
    commit({ ...current, currentIndex: index, remainingMs: QUESTION_TIME_MS });
    setTimerAnnouncement('');
    clockBase.current = performance.now();
    window.scrollTo({ top: 0 });
  }

  async function showResult() {
    const current = snapshotRef.current;
    if (!current || busy) return;
    setBusy(true);
    setError('');
    try {
      await synchronize();
      const latest = snapshotRef.current!;
      if (latest.questions.some((question) => !latest.answers[question.id]?.synced)) throw new Error('Conecte-se para enviar as respostas salvas e ver seu resultado.');
      let result;
      try { result = await finishAttempt(current.attempt.id); }
      catch (cause) {
        // A finish response can be lost after the server commits. Recover that
        // result before retrying a non-idempotent finish operation.
        try { result = await getAttemptResult(current.attempt.id); } catch { throw cause; }
      }
      commit({ ...snapshotRef.current!, attempt: result.attempt, result });
      setScreen('result');
      router.replace(`/simulado/${simulationId}?attemptId=${encodeURIComponent(current.attempt.id)}&view=result`);
    } catch (cause) {
      if (cause instanceof TypeError || !navigator.onLine) setOffline(true);
      setError(!navigator.onLine ? 'Seu progresso está guardado. Conecte-se para finalizar e ver o resultado.' : cause instanceof Error ? cause.message : 'Não foi possível finalizar. Tente de novo.');
    } finally { setBusy(false); }
  }

  async function leave() {
    if (!snapshotRef.current) return;
    if (!storageOk) {
      setBusy(true);
      try { await synchronize(); } catch { setError('Não foi possível guardar as respostas. Tente sincronizar antes de sair.'); setBusy(false); return; }
      setBusy(false);
    }
    router.push('/');
  }

  function closeExit() {
    const current = snapshotRef.current;
    if (current) commit({ ...current, remainingMs: QUESTION_TIME_MS });
    clockBase.current = performance.now();
    setExitOpen(false);
  }

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (screen !== 'ready' || exitOpen || busy || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      const target = event.target as HTMLElement;
      if (target.closest('select, textarea, input:not([type="radio"]), [contenteditable="true"]')) return;
      const current = snapshotRef.current;
      if (!current) return;
      const question = current.questions[current.currentIndex];
      if (!question) return;
      const answered = current.answers[question.id];
      if (/^[a-d]$/i.test(event.key) && question.type === 'MULTIPLE_CHOICE' && !answered) {
        const options = mapApiQuestion(question).options;
        const option = options?.[event.key.toUpperCase().charCodeAt(0) - 65];
        if (option) {
          event.preventDefault();
          choose(option.id);
          document.querySelector<HTMLInputElement>(`input[name="question-${question.id}"][value="${CSS.escape(option.id)}"]`)?.focus();
        }
      }
      if (event.key === 'Enter' && !target.closest('button, a, summary')) {
        event.preventDefault();
        if (!answered) confirm();
        else if (current.attempt.immediateFeedback === true && !answered.synced && !offline) return;
        else if (current.currentIndex === current.questions.length - 1) void showResult();
        else goTo(current.currentIndex + 1);
      }
    };
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, exitOpen, busy, offline]);

  if (screen === 'loading') return <AppShell title="Preparando o simulado" flow><ScreenState kind="loading" title="Preparando suas questões…" /></AppShell>;
  if (screen === 'error') return <AppShell title="Seu simulado" backHref="/" flow><ScreenState kind={offline ? 'offline' : 'error'} message={error} action={<Button onClick={() => void load()}>Tentar de novo</Button>} /></AppShell>;
  if ((screen === 'result' || screen === 'review') && snapshot?.result) return <RunnerResult snapshot={snapshot} review={screen === 'review'} onReview={() => router.replace(`/simulado/${simulationId}?attemptId=${encodeURIComponent(snapshot.attempt.id)}&view=review`)} onResult={() => router.replace(`/simulado/${simulationId}?attemptId=${encodeURIComponent(snapshot.attempt.id)}&view=result`)} onRetry={() => { snapshotRef.current = null; setScreen('loading'); router.replace(`/simulado/${simulationId}?timer=${snapshot.timerEnabled ? '1' : '0'}`); if (!requestedAttempt) void load(); }} onExit={() => router.push('/')} />;

  if (!snapshot || snapshot.questions.length === 0) return <AppShell title="Seu simulado" backHref="/" flow><ScreenState kind="empty" title="As questões ainda não chegaram" message="Escolha outro simulado e volte para conferir." action={<a className="btn" href="/simulados">Escolher um simulado</a>} /></AppShell>;

  const rawQuestion = snapshot.questions[snapshot.currentIndex];
  const question = mapApiQuestion(rawQuestion);
  const record = snapshot.answers[question.id];
  const value = record ? record.value : snapshot.drafts[question.id];
  const confirmedCount = Object.keys(snapshot.answers).length;
  const pending = Object.values(snapshot.answers).filter((answer) => !answer.synced).length;
  const seconds = Math.ceil(snapshot.remainingMs / 1000);
  const last = snapshot.currentIndex === snapshot.questions.length - 1;
  const heading = snapshot.attempt.simulation?.title ?? 'Seu simulado';
  const feedback = record?.feedback;
  const feedbackTip = feedbackContent(feedback?.tip, rawQuestion.tip);
  const feedbackFunFact = feedbackContent(feedback?.funFact, rawQuestion.funFact);
  const blank = record?.value === -1;
  const feedbackTitle = blank ? 'O tempo acabou' : feedback?.isCorrect === true ? 'Resposta certa!' : feedback?.isCorrect === false ? 'Quase! Vamos olhar a dica?' : 'Resposta guardada!';
  let streak = 0;
  for (let i = snapshot.currentIndex; i >= 0; i -= 1) {
    if (snapshot.answers[snapshot.questions[i].id]?.feedback?.isCorrect !== true) break;
    streak += 1;
  }
  const retrySync = () => { setError(''); setBusy(true); void synchronize().catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível sincronizar.')).finally(() => setBusy(false)); };
  const waitingFeedback = snapshot.attempt.immediateFeedback === true && Boolean(record && !record.synced && !offline);
  const controls = <Button disabled={busy || waitingFeedback || (!record && !answerIsComplete(question, value))} onClick={() => record ? last ? void showResult() : goTo(snapshot.currentIndex + 1) : confirm()}>{busy ? 'Enviando…' : waitingFeedback ? 'Conferindo…' : record ? last ? 'Ver resultado' : 'Próxima' : 'Confirmar'}</Button>;

  return (
    <AppShell title={heading} flow actions={<Button variant="secondary" onClick={() => { exitRef.current = true; setExitOpen(true); }}>Sair do simulado</Button>}>
      <div className="giz-runner">
        <header className="giz-runner-head">
          <div className="giz-runner-head__row"><button className="giz-exit-button" onClick={() => { exitRef.current = true; setExitOpen(true); }} aria-label="Sair do simulado"><Icon name="x" /></button><div><strong>{heading}</strong><span>Uma descoberta por vez</span></div><div className="giz-mobile-timer">{snapshot.timerEnabled && <Timer seconds={seconds} />}</div></div>
          <div className="giz-mobile-progress"><Progress value={confirmedCount} max={snapshot.questions.length} /><span>{snapshot.currentIndex + 1} de {snapshot.questions.length}</span></div>
        </header>
        <div className="sr-only" aria-live="polite" aria-atomic="true">{timerAnnouncement}</div>
        <div className="giz-runner-grid">
          <section className="card giz-question-card">
            <span className="giz-question-label">Questão {snapshot.currentIndex + 1} de {snapshot.questions.length}</span>
            <h1 ref={questionHeading} tabIndex={-1}>{question.text}</h1>
            <QuestionAnswers question={question} value={value} onChange={choose} locked={Boolean(record)} isCorrect={feedback?.isCorrect} correctAnswer={feedback?.correctAnswer} />
            {(!snapshot.timerEnabled || offline || !storageOk || error) && <div className="giz-runner-notices">
              {!snapshot.timerEnabled && <p className="muted"><Icon name="clock" size={20} />Sem limite de tempo</p>}
              {offline && <p role="status"><Icon name="alert" size={20} />{storageOk ? 'Sem conexão. Seu progresso está salvo neste aparelho.' : 'Sem conexão. Mantenha esta página aberta para preservar as respostas.'}</p>}
              {!storageOk && <p role="alert">Este navegador não conseguiu guardar o progresso no aparelho. {pending ? 'Conecte-se para sincronizar antes de sair.' : 'As respostas enviadas continuam salvas na sua conta.'}</p>}
              {error && <p role="alert">{error}</p>}
              {(pending > 0 || error) && <Button variant="text" disabled={busy} onClick={retrySync}>Tentar sincronizar</Button>}
            </div>}
            {record && <section className="giz-question-feedback" aria-live="polite" aria-labelledby="question-feedback-title">
              <div className="giz-feedback-heading"><Icon name={blank ? 'clock' : feedback?.isCorrect === false ? 'bulb' : 'check'} /><h2 id="question-feedback-title" ref={feedbackHeading} tabIndex={-1}>{feedbackTitle}</h2></div>
              {feedback ? <>{feedback.isCorrect && feedbackFunFact && <FeedbackBlock correct>{feedbackFunFact}</FeedbackBlock>}{!feedback.isCorrect && feedbackTip && <FeedbackBlock correct={false}>{feedbackTip}</FeedbackBlock>}{feedback.explanation && <details className="giz-answer-explanation"><summary>Entenda a resposta</summary><p>{feedback.explanation}</p></details>}</> : <p>{blank ? 'Esta questão ficou em branco. ' : ''}{record.synced ? 'Você verá a correção e as dicas ao finalizar o simulado.' : 'Sua resposta está neste aparelho e será enviada quando a conexão voltar.'}</p>}
            </section>}
            <div className="giz-desktop-controls">{controls}</div>
          </section>
          <aside className="giz-runner-aside" aria-label="Progresso do simulado">
            <section className="giz-progress-card">{snapshot.timerEnabled && <Timer seconds={seconds} large />}<div><h2>Questão {snapshot.currentIndex + 1} de {snapshot.questions.length}</h2><Progress value={confirmedCount} max={snapshot.questions.length} /><p>{snapshot.timerEnabled ? record ? 'Resposta confirmada' : 'Tempo desta questão' : 'Sem limite de tempo'}</p></div></section>
            <section className="card"><h2>Mapa das questões</h2><div className="giz-question-map">{snapshot.questions.map((item, index) => { const answer = snapshot.answers[item.id]; const firstPending = snapshot.questions.findIndex((q) => !snapshot.answers[q.id]); const status = answer?.value === -1 ? 'em branco' : answer?.feedback?.isCorrect === true ? 'certa' : answer?.feedback?.isCorrect === false ? 'para revisar' : answer ? 'respondida' : 'a responder'; const icon = answer?.value === -1 ? 'clock' : answer?.feedback?.isCorrect === true ? 'check' : answer?.feedback?.isCorrect === false ? 'x' : 'book'; return <button key={item.id} className="giz-map-cell" disabled={!answer && firstPending !== index} data-state={index === snapshot.currentIndex ? 'current' : answer?.value === -1 ? 'blank' : answer?.feedback ? answer.feedback.isCorrect ? 'correct' : 'wrong' : answer ? 'answered' : 'pending'} aria-current={index === snapshot.currentIndex ? 'step' : undefined} aria-label={`Questão ${index + 1}, ${index === snapshot.currentIndex ? 'atual, ' : ''}${status}`} onClick={() => goTo(index)}><span>{index + 1}</span>{answer && <Icon name={icon} size={20} />}</button>; })}</div><div className="muted giz-map-legend"><span>Atual</span><span><Icon name="check" size={20} />Certa</span><span><Icon name="x" size={20} />Revisar</span><span><Icon name="clock" size={20} />Em branco</span><span><Icon name="book" size={20} />Respondida</span></div></section>
            <section className="card"><h2>Seu progresso</h2><p><strong className="giz-progress-number">{confirmedCount}</strong> de {snapshot.questions.length} confirmadas</p>{streak >= 2 && <Badge tone="ok"><Icon name="flame" size={20} />{streak} acertos seguidos</Badge>}<p className="muted">Cada resposta é uma nova descoberta.</p></section>
          </aside>
        </div>
        <div className="giz-mobile-controls" data-feedback={Boolean(record)}>{record && <p><Icon name={blank ? 'clock' : 'check'} size={20} />{feedbackTitle}</p>}{controls}</div>
      </div>
      {exitOpen && <Modal title="Sair do simulado?" onClose={closeExit}><p>{storageOk ? 'Seu progresso fica salvo. Você pode continuar de onde parou.' : 'O navegador não conseguiu guardar as respostas no aparelho. Vamos sincronizar antes de sair.'}</p><div className="stack">{error && <p role="alert">{error}</p>}<Button onClick={closeExit}>Continuar simulado</Button><Button variant="secondary" onClick={() => void leave()} disabled={busy}>{busy ? 'Guardando…' : 'Sair e continuar depois'}</Button></div></Modal>}
    </AppShell>
  );
}

function Timer({ seconds, large = false }: { seconds: number; large?: boolean }) {
  return <div className="giz-timer" data-large={large} data-urgent={seconds <= 10} role="img" aria-label="Tempo da questão"><svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="24" /><circle className="giz-timer__fill" cx="28" cy="28" r="24" pathLength="45" strokeDasharray={`${seconds} 45`} /></svg><span aria-hidden="true">{seconds}</span></div>;
}
