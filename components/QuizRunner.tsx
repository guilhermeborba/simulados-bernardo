'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLearningPreferences } from '@/contexts/LearningPreferencesContext';
import {
  ApiError, ApiQuizAttempt, ApiQuizQuestion, ApiQuizResult,
  startQuizAttempt, getQuizAttempt, getQuizAttemptQuestions,
  confirmQuizAnswer, finishQuizAttempt, getQuizAttemptResult,
} from '@/lib/apiClient';
import { quizMediaUrl } from '@/lib/quizMedia';
import { tierForSchoolYear } from '@/lib/tier';
import { Tuca } from './giz/ui';
import QuizPreferencesControls from './QuizPreferencesControls';
import styles from './QuizRunner.module.css';

type State = 'loading' | 'ready' | 'finished' | 'error';

export default function QuizRunner({ quizId }: { quizId: string }) {
  const { user, isLoading, getSessionGeneration } = useAuth();
  const search = useSearchParams();
  const requestedAttempt = search.get('attempt');
  const router = useRouter();
  const returnTo = `/quiz/${encodeURIComponent(quizId)}${requestedAttempt ? `?attempt=${encodeURIComponent(requestedAttempt)}` : ''}`;

  useEffect(() => {
    if (!isLoading && !user) router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [isLoading, user, router, returnTo]);

  if (isLoading || !user) return <p className="page-shell" role="status">Carregando sua sessão...</p>;
  if (user.role !== 'STUDENT') return <div className={styles.shell}>
    <h1>Prática no perfil de aluno</h1>
    <p>Entre com uma conta de aluno para realizar quizzes.</p>
    <Link href="/quizzes">Voltar ao catálogo</Link>
  </div>;

  return <ActiveQuizRunner key={`${user.id}:${getSessionGeneration()}:${quizId}`} quizId={quizId} requestedAttempt={requestedAttempt} />;
}

function ActiveQuizRunner({ quizId, requestedAttempt }: { quizId: string; requestedAttempt: string | null }) {
  const router = useRouter();
  const { preferences } = useLearningPreferences();
  const [state, setState] = useState<State>('loading');
  const [attempt, setAttempt] = useState<ApiQuizAttempt | null>(null);
  const [questions, setQuestions] = useState<ApiQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ApiQuizResult | null>(null);
  const [reload, setReload] = useState(0);
  const busyRef = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLElement>(null);
  const epoch = useRef(0);
  const canonicalAttempt = useRef<string | null>(null);

  useEffect(() => {
    if (requestedAttempt && canonicalAttempt.current === requestedAttempt) {
      canonicalAttempt.current = null;
      return;
    }
    const current = ++epoch.current;
    let alive = true;
    setState('loading'); setError(''); setAttempt(null); setResult(null); setQuestions([]); setDrafts({});
    busyRef.current = false; setBusy(false);
    void (async () => {
      try {
        const loaded = requestedAttempt ? await getQuizAttempt(requestedAttempt) : await startQuizAttempt(quizId);
        if (loaded.simulation?.activityKind !== 'QUIZ' || (loaded.simulationId !== quizId && loaded.simulation.slug !== quizId)) {
          throw new Error('Esta tentativa não pertence ao quiz escolhido.');
        }
        if (loaded.status !== 'IN_PROGRESS' && loaded.status !== 'FINISHED') throw new Error('Esta tentativa não pode ser retomada.');
        const finished = loaded.status === 'FINISHED' ? await getQuizAttemptResult(loaded.id) : null;
        const content = finished ? finished.questions : await getQuizAttemptQuestions(loaded.id);
        if (!Array.isArray(content) || content.length === 0 || content.some(q => q.type !== 'MULTIPLE_CHOICE')) {
          throw new Error('Não foi possível carregar as perguntas deste quiz.');
        }
        if (!alive || current !== epoch.current) return;
        const ordered = [...content].sort((a, b) => a.order - b.order);
        setAttempt(loaded); setQuestions(ordered); setResult(finished);
        const firstOpen = ordered.findIndex(q => !q.confirmedAt);
        setIndex(firstOpen < 0 ? ordered.length - 1 : firstOpen);
        setState(finished ? 'finished' : 'ready');
        if (!requestedAttempt) {
          canonicalAttempt.current = loaded.id;
          router.replace(`/quiz/${encodeURIComponent(quizId)}?attempt=${encodeURIComponent(loaded.id)}`, { scroll: false });
        }
      } catch (cause) {
        if (!alive || current !== epoch.current) return;
        setError(loadError(cause)); setState('error');
      }
    })();
    return () => { alive = false; };
  }, [quizId, requestedAttempt, reload, router]);

  useEffect(() => () => { epoch.current++; }, []);

  const question = questions[index];
  useEffect(() => {
    if (state !== 'ready') return;
    const frame = requestAnimationFrame(() => {
      if (question?.confirmedAt) feedbackRef.current?.focus();
      else titleRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [state, question?.id, question?.confirmedAt]);

  async function confirm() {
    if (!attempt || !question || !drafts[question.id] || question.confirmedAt || busyRef.current) return;
    const current = epoch.current;
    busyRef.current = true; setBusy(true); setError('');
    try {
      const confirmation = await confirmQuizAnswer(attempt.id, question.id, drafts[question.id]);
      if (current !== epoch.current) return;
      setQuestions(previous => previous.map(q => q.id === confirmation.questionId ? {
        ...q, answer: confirmation.answer, confirmedAt: confirmation.confirmedAt, feedback: confirmation.feedback,
      } : q));
    } catch (cause) {
      if (current !== epoch.current) return;
      if (cause instanceof ApiError && cause.status === 409) {
        try {
          const saved = await getQuizAttemptQuestions(attempt.id);
          if (current !== epoch.current) return;
          setQuestions([...saved].sort((a, b) => a.order - b.order));
          setError('A resposta foi confirmada em outra aba. Recuperamos a escolha registrada.');
        } catch (recovery) { if (current === epoch.current) setError(loadError(recovery)); }
      } else if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) {
        setError(loadError(cause)); setState('error');
      } else {
        setError('Não foi possível confirmar. Tente novamente; sua escolha está preservada.');
      }
    } finally {
      if (current === epoch.current) { busyRef.current = false; setBusy(false); }
    }
  }

  async function finish() {
    if (!attempt || busyRef.current || questions.some(q => !q.confirmedAt)) return;
    const current = epoch.current;
    busyRef.current = true; setBusy(true); setError('');
    try {
      const saved = await finishQuizAttempt(attempt.id);
      if (current !== epoch.current) return;
      setResult(saved); setAttempt(saved.attempt); setState('finished');
    } catch (cause) {
      if (current !== epoch.current) return;
      if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) { setError(loadError(cause)); setState('error'); }
      else setError('Não foi possível concluir. Tente novamente; suas respostas já estão salvas.');
    } finally { if (current === epoch.current) { busyRef.current = false; setBusy(false); } }
  }

  const year = attempt?.simulation.schoolYear;
  const tier = tierForSchoolYear(year);
  const infant = typeof year === 'number' && year < 0;
  const confirmed = questions.filter(q => q.confirmedAt).length;
  const review = attempt?.practiceMode === 'REVIEW';
  return <div className={styles.shell} data-tier={tier} data-motion={preferences.motionEnabled ? 'on' : 'off'}>
    <nav className={styles.navigation} aria-label="Navegação do quiz">
      <Link href="/quizzes">← Catálogo de quizzes</Link>
      <Link href="/progresso">Habilidades e revisão</Link>
      <Link href="/quizzes/historico">Meu histórico de quizzes</Link>
    </nav>
    {state === 'loading' && <p role="status">Carregando quiz...</p>}
    {state === 'error' && <section className={styles.card}>
      <h1>Não foi possível abrir o quiz</h1><p role="alert">{error}</p>
      <button className={styles.primary} onClick={() => setReload(n => n + 1)}>Tentar novamente</button>
      <Link className={styles.historyLink} href={`/login?returnTo=${encodeURIComponent(`/quiz/${quizId}${requestedAttempt ? `?attempt=${requestedAttempt}` : ''}`)}`}>Entrar novamente</Link>
    </section>}
    {attempt && <header className={styles.header}>
      <div><p className={styles.eyebrow}>{attempt.simulation.discipline.name} · {review ? 'Revisão orientada' : 'Quiz rápido'}</p><h1>{attempt.simulation.title}</h1>
        <p>{attempt.simulation.topic}</p></div>
      <QuizPreferencesControls />
    </header>}
    {state === 'finished' && result && <QuizResult result={result} infant={infant} onRetry={() => router.push(`/quiz/${encodeURIComponent(quizId)}`)} />}
    {state === 'ready' && question && <>
      {review && <p className={styles.reviewNotice}>Esta revisão não registra XP, missões ou itens. Ela fica no histórico de prática. Você pode parar e continuar depois.</p>}
      <div className={styles.progress}><span>{confirmed} de {questions.length} respostas confirmadas</span>
        <progress value={confirmed} max={questions.length} aria-label="Respostas confirmadas" /></div>
      <section className={styles.card} aria-labelledby="quiz-question-title">
        {infant && <div className={styles.guide}>
          <p>Vamos descobrir juntos! Escolha uma opção e toque em confirmar.</p></div>}
        <p className={styles.eyebrow}>Pergunta {index + 1} de {questions.length}</p>
        {review && <p className={styles.practiceLabel}>{question.practicedBefore ? 'Pergunta já praticada · repetir ajuda a revisar e não conta como uma primeira resposta.' : 'Pergunta diferente nesta revisão · registrada como prática de revisão.'}</p>}
        <h2 id="quiz-question-title" ref={titleRef} tabIndex={-1} className={styles.statement}>{question.statement}</h2>
        <QuizMedia key={question.id} media={question.media} audioEnabled={preferences.audioEnabled} />
        {question.tip && <details className={styles.tip}><summary>Preciso de uma dica</summary><p>{question.tip}</p></details>}
        <fieldset className={styles.options} disabled={busy || Boolean(question.confirmedAt)}>
          <legend className={styles.srOnly}>Escolha uma alternativa</legend>
          {question.options.map(option => {
            const selected = (question.answer?.optionKey ?? drafts[question.id]) === option.optionKey;
            return <label key={option.id} className={styles.option} data-selected={selected}>
              <input type="radio" name={`question-${question.id}`} value={option.optionKey} checked={selected}
                onChange={() => setDrafts(previous => ({ ...previous, [question.id]: option.optionKey }))} />
              <span className={styles.optionKey} aria-hidden="true">{option.optionKey}</span><span>{option.text}</span>
            </label>;
          })}
        </fieldset>
        {question.feedback && <section ref={feedbackRef} className={styles.feedback} data-correct={question.feedback.isCorrect} tabIndex={-1} role="status" aria-live="polite">
          <h3>{question.feedback.isCorrect ? '✓ Resposta correta' : 'Vamos aprender com esta resposta'}</h3>
          <p>{question.feedback.explanation}</p>
          {question.feedback.funFact && <p className={styles.funFact}><strong>Você sabia?</strong> {question.feedback.funFact}</p>}
          <p className={styles.saved}>Resposta confirmada e salva. Ela fica registrada nesta tentativa.</p>
        </section>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          <button className={styles.secondary} disabled={index === 0 || busy} onClick={() => { setIndex(n => n - 1); setError(''); }}>Anterior</button>
          {!question.confirmedAt ? <button className={styles.primary} disabled={!drafts[question.id] || busy} onClick={() => void confirm()}>
            {busy ? 'Confirmando...' : 'Confirmar resposta'}</button> : index < questions.length - 1 ?
            <button className={styles.primary} disabled={busy} onClick={() => { setIndex(n => n + 1); setError(''); }}>Próxima pergunta</button> :
            <button className={styles.primary} disabled={busy || confirmed !== questions.length} onClick={() => void finish()}>{busy ? 'Concluindo...' : review ? 'Concluir revisão' : 'Concluir quiz'}</button>}
        </div>
      </section>
      <nav className={styles.questionNav} aria-label="Ir para uma pergunta">
        {questions.map((q, position) => <button key={q.id} aria-current={position === index ? 'step' : undefined}
          aria-label={`Pergunta ${position + 1}${q.confirmedAt ? ', confirmada' : ', pendente'}`} disabled={busy}
          data-confirmed={Boolean(q.confirmedAt)} onClick={() => { setIndex(position); setError(''); }}>{position + 1}{q.confirmedAt ? ' ✓' : ''}</button>)}
      </nav>
      <p className={styles.footer}>Você pode sair e continuar depois. As respostas confirmadas ficam salvas.</p>
    </>}
  </div>;
}

function QuizMedia({ media, audioEnabled }: { media: ApiQuizQuestion['media']; audioEnabled: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const picture = useRef<HTMLImageElement | null>(null);
  const bindImage = useCallback((element: HTMLImageElement | null) => {
    if (picture.current !== element) picture.current?.removeAttribute('src');
    picture.current = element;
  }, []);
  const audio = useRef<HTMLAudioElement | null>(null);
  const bindAudio = useCallback((element: HTMLAudioElement | null) => {
    if (audio.current && audio.current !== element) {
      audio.current.pause();
      audio.current.removeAttribute('src');
      audio.current.load();
    }
    audio.current = element;
  }, []);
  const imageUrl = media?.image ? quizMediaUrl(media.image.url) : null;
  const audioUrl = media?.audio ? quizMediaUrl(media.audio.url) : null;
  if (!media) return null;
  return <div className={styles.media}>
    {media.image && (imageFailed || !imageUrl ? <div className={styles.mediaFallback} role="note"><strong>Descrição da imagem</strong><p>{media.image.alt}</p></div> :
      // The protected BFF handles authentication; a public image optimizer cannot.
      // eslint-disable-next-line @next/next/no-img-element
      <img ref={bindImage} src={imageUrl} alt={media.image.alt} onError={() => setImageFailed(true)} className={styles.image} />)}
    {media.audio && <div className={styles.audio}>
      {audioEnabled && audioUrl && !audioFailed && <audio ref={bindAudio} controls preload="none" src={audioUrl} onError={() => setAudioFailed(true)} aria-label="Ouvir a pergunta e as alternativas" />}
      <button className={styles.secondary} onClick={() => setShowTranscript(value => !value)} aria-expanded={showTranscript || audioFailed || !audioUrl}>
        {showTranscript || audioFailed || !audioUrl ? 'Transcrição do áudio' : 'Ler transcrição do áudio'}</button>
      {!audioEnabled && <p>O áudio está desativado. Você pode ativá-lo nas preferências.</p>}
      {(audioFailed || !audioUrl) && <p role="status">O áudio não está disponível. Continue pela transcrição.</p>}
      {(showTranscript || audioFailed || !audioUrl) && <p className={styles.transcript}>{media.audio.transcript}</p>}
    </div>}
  </div>;
}

function QuizResult({ result, infant, onRetry }: { result: ApiQuizResult; infant: boolean; onRetry: () => void }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, []);
  const review = result.attempt.practiceMode === 'REVIEW';
  return <section className={styles.card}>
    <Tuca pose="trofeu" size={96} />
    <p className={styles.eyebrow}>Prática concluída</p>
    <h2 ref={title} tabIndex={-1}>{review ? 'Revisão concluída' : 'Quiz concluído'}</h2>
    <p className={styles.resultIntro}>{review ? 'Você concluiu esta prática de revisão. Veja as explicações; estes acertos ficam separados das primeiras respostas e não comprovam domínio.' : 'Você respondeu todas as perguntas. Veja as explicações e escolha como continuar.'}</p>
    <div className={styles.resultStats}>
      <div><strong>{result.attempt.correctCount ?? 0} / {result.questions.length}</strong><span>{review ? 'respostas corretas nesta revisão' : 'respostas corretas'}</span></div>
      <div><strong>{Number(result.attempt.percentage ?? 0).toLocaleString('pt-BR')}%</strong><span>{review ? 'acertos nesta prática' : 'de aproveitamento'}</span></div>
    </div>
    <section className={styles.reward} aria-labelledby="quiz-reward-title">
      <h3 id="quiz-reward-title">{result.reward.xpAwarded > 0 ? `+${result.reward.xpAwarded} XP pela prática` : 'Prática registrada'}</h3>
      <p>{result.reward.reason === 'REVIEW' ? 'Esta revisão não registra XP, missões ou itens. Ela fica no histórico de prática.'
        : result.reward.reason === 'AWARDED' ? 'Este XP já está salvo na sua conta. Cada quiz pode registrar XP uma vez por dia, até o limite diário.'
        : result.reward.reason === 'ALREADY_REWARDED' ? 'Este quiz já registrou XP no dia desta conclusão. Praticar novamente ajuda a revisar o que você aprendeu.'
        : result.reward.reason === 'DAILY_LIMIT' ? 'O limite diário de XP já tinha sido registrado no dia desta conclusão. Suas respostas e este resultado continuam salvos.'
        : 'Este resultado foi concluído antes do registro de XP. Você pode consultar sua prática no histórico.'}</p>
      <Link href="/pratica">Ver missões e progresso na Prática →</Link>
      <Link href="/colecao">Ver minha coleção e conquistas →</Link>
      <Link href="/progresso">Consultar habilidades e sugestões de revisão →</Link>
    </section>
    <div className={styles.resultQuestions}>{result.questions.map((question, index) => <details key={question.id}>
      <summary>Pergunta {index + 1} · {question.isCorrect ? 'Resposta correta' : 'Revisar explicação'}</summary>
      <p>{question.statement}</p>
      {review && <p className={styles.practiceLabel}>{question.practicedBefore ? 'Pergunta já praticada · resposta registrada em revisão' : 'Pergunta diferente · resposta registrada em revisão'}</p>}
      <p><strong>Sua escolha:</strong> {question.options.find(option => option.optionKey === question.answer?.optionKey)?.text}</p>
      <p>{question.feedback?.explanation}</p>
      {question.feedback?.funFact && <p><strong>Você sabia?</strong> {question.feedback.funFact}</p>}
    </details>)}</div>
    <div className={styles.actions}><Link className={styles.secondary} href="/quizzes">Escolher outro quiz</Link>
      <button className={styles.primary} onClick={onRetry}>{review ? 'Praticar quiz completo' : 'Praticar novamente'}</button></div>
    <p className={styles.footer}>Você também pode fazer uma pausa. Seu progresso fica salvo.</p>
    <Link className={styles.historyLink} href="/quizzes/historico">Ver meu histórico de quizzes</Link>
  </section>;
}

function loadError(cause: unknown) {
  if (cause instanceof ApiError && cause.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
  if (cause instanceof ApiError && cause.status === 403) return 'Sua conta não tem acesso a esta tentativa.';
  if (cause instanceof ApiError && cause.status === 404) return 'Este quiz não está disponível para sua conta. Volte ao catálogo para escolher outra atividade.';
  return cause instanceof Error && !(cause instanceof ApiError) ? cause.message : 'Não foi possível carregar o quiz. Tente novamente.';
}
