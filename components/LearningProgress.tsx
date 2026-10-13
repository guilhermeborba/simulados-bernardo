'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLearningPreferences } from '@/contexts/LearningPreferencesContext';
import { ApiError, getLearningProgress, startReviewAttempt, type ApiLearningProgress, type ApiSkillProgress } from '@/lib/apiClient';
import { QUIZ_SEGMENTS, quizSegmentForYear, quizTierForPreferences, quizYearLabel, quizYearPatch } from '@/lib/quiz-segments';
import MascoteGuia from './MascoteGuia';
import QuizNavigation from './QuizNavigation';
import styles from './LearningProgress.module.css';

export default function LearningProgress() {
  const { user, isLoading, getSessionGeneration } = useAuth();
  if (isLoading) return <div className={styles.shell}><p role="status">Carregando sua conta…</p></div>;
  if (!user || user.role !== 'STUDENT') return <div className={styles.shell}><QuizNavigation current="progress" /><main className={styles.main}><h1>Habilidades e revisão</h1><p>Os registros de prática estão disponíveis para contas de aluno.</p><Link className={styles.link} href={user ? '/' : '/login?returnTo=/progresso'}>{user ? 'Voltar para o início' : 'Entrar na minha conta'} →</Link></main></div>;
  return <StudentProgress key={`${user.id}:${getSessionGeneration()}`} />;
}

function StudentProgress() {
  const router = useRouter();
  const { getSessionGeneration } = useAuth();
  const { preferences, isLoading: preferencesLoading, isSaving, error: preferencesError, updatePreferences, reload: reloadPreferences } = useLearningPreferences();
  const [loaded, setLoaded] = useState<{ year: number | null; generation: number; data: ApiLearningProgress } | null>(null);
  const [error, setError] = useState<{ year: number | null; generation: number; message: string } | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const lifecycle = useRef<AbortController | null>(null);
  const startPending = useRef(false);
  const year = preferences.schoolYear;
  const generation = getSessionGeneration();

  useEffect(() => {
    if (preferencesLoading || preferencesError) return;
    const controller = new AbortController();
    lifecycle.current = controller;
    const currentGeneration = getSessionGeneration();
    setLoaded(null); setError(null); setReviewError(null); setStarting(null);
    void getLearningProgress(year ?? undefined, controller.signal).then(data => {
      if (controller.signal.aborted || currentGeneration !== getSessionGeneration()) return;
      setLoaded({ year, generation: currentGeneration, data });
    }).catch(cause => {
      if (controller.signal.aborted || currentGeneration !== getSessionGeneration()) return;
      setError({ year, generation: currentGeneration, message: cause instanceof ApiError && cause.status === 401 ? 'Sua sessão expirou. Entre novamente para consultar suas habilidades.' : 'Não foi possível carregar suas habilidades. Tente novamente.' });
    });
    return () => controller.abort();
  }, [year, preferencesLoading, preferencesError, retry, getSessionGeneration]);

  const data = loaded?.year === year && loaded.generation === generation ? loaded.data : null;
  const currentError = error?.year === year && error.generation === generation ? error.message : null;
  const effectiveYear = year ?? data?.schoolYear ?? null;
  const segment = effectiveYear === null ? preferences.segment : quizSegmentForYear(effectiveYear);
  const infant = segment === 'INFANTIL';
  const playful = infant || segment === 'FUNDAMENTAL_I';
  const tier = quizTierForPreferences({ ...preferences, schoolYear: effectiveYear, segment });

  async function beginReview(quizId: string) {
    const controller = lifecycle.current;
    if (!data || !controller || controller.signal.aborted || starting || startPending.current) return;
    const currentGeneration = getSessionGeneration();
    startPending.current = true; setStarting(quizId); setReviewError(null);
    try {
      const attempt = await startReviewAttempt(quizId, controller.signal);
      if (controller.signal.aborted || currentGeneration !== getSessionGeneration()) return;
      if (attempt.practiceMode !== 'REVIEW' || attempt.status !== 'IN_PROGRESS') throw new Error('Não foi possível preparar esta revisão.');
      router.push(`/quiz/${encodeURIComponent(attempt.simulationId)}?attempt=${encodeURIComponent(attempt.id)}`);
    } catch (cause) {
      if (controller.signal.aborted || currentGeneration !== getSessionGeneration()) return;
      setReviewError(cause instanceof ApiError && [403, 404, 409].includes(cause.status)
        ? 'Esta revisão não está disponível agora. Recarregue as sugestões para escolher uma atividade acessível.'
        : cause instanceof ApiError && cause.status === 401 ? 'Sua sessão expirou. Entre novamente para começar a revisão.'
        : 'Não foi possível preparar a revisão. Tente novamente; suas respostas anteriores estão salvas.');
    } finally {
      startPending.current = false;
      if (!controller.signal.aborted && currentGeneration === getSessionGeneration()) setStarting(null);
    }
  }

  return <div className={styles.shell} data-tier={tier} data-reduced-motion={!preferences.motionEnabled || undefined}>
    <QuizNavigation current="progress" />
    <main className={styles.main}>
      <header className={styles.hero}>
        <div className={styles.heroBody}><p className={styles.eyebrow}>{infant ? 'Descobrir, experimentar e tentar de novo' : 'Respostas que ajudam a escolher a próxima prática'}</p>
          <h1>{infant ? 'Minhas descobertas' : 'Habilidades e revisão'}</h1>
          <p>{infant ? 'O Bolinha acompanha suas descobertas. Veja o que você já experimentou e escolha uma brincadeira para revisitar.' : 'Acompanhe registros por habilidade e reveja dificuldades recentes. Primeiras respostas, repetições e revisões aparecem separadas.'}</p>
        </div>
        {playful && <div className={styles.heroMark} aria-hidden="true"><MascoteGuia variant={infant ? 'bolinha' : 'capelo'} size={126} /></div>}
      </header>
      <div className={styles.controls}>
        <label className={styles.yearField}>Ano ou idade para o progresso
          <select value={effectiveYear ?? ''} disabled={preferencesLoading || isSaving || Boolean(starting)} onChange={event => {
            const nextYear = event.target.value === '' ? null : Number(event.target.value);
            void updatePreferences(quizYearPatch(nextYear, preferences.segment)).catch(() => undefined);
          }}>
            <option value="">Escolha sua faixa</option>
            {QUIZ_SEGMENTS.map(item => <optgroup key={item.value} label={item.label}>{item.years.map(value => <option key={value} value={value}>{quizYearLabel(value)}</option>)}</optgroup>)}
          </select>
        </label>
        <p className={styles.hint}>A escolha acompanha suas preferências da conta. Se ainda não houver uma escolha salva, usamos o ano informado no seu cadastro.</p>
      </div>
      {preferencesError ? <div className={styles.error} role="alert"><p>{preferencesError}</p><button className={styles.secondary} type="button" disabled={preferencesLoading} onClick={() => void reloadPreferences()}>Recarregar preferências</button></div>
        : currentError ? <div className={styles.error} role="alert"><p>{currentError}</p><button className={styles.secondary} type="button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button><Link href="/login?returnTo=/progresso">Entrar novamente</Link></div>
        : !data || preferencesLoading ? <p className={styles.loading} role="status">Carregando habilidades e sugestões…</p>
        : <>
          <section className={styles.section} aria-labelledby="skills-title">
            <div className={styles.sectionHeading}><h2 id="skills-title">Registros por habilidade</h2><p>{effectiveYear === null ? 'Escolha seu ano ou idade para consultar as habilidades desta faixa.' : `Prática registrada para ${quizYearLabel(effectiveYear)}.`}</p></div>
            <p className={styles.limits}>Cada habilidade precisa de pelo menos cinco perguntas diferentes respondidas pela primeira vez para reunir registros iniciais. Mesmo com esses registros, esta tela não declara domínio. Repetir uma pergunta é prática e não aumenta a quantidade de primeiras respostas. XP e itens não são avaliação.</p>
            {data.unclassifiedQuestions > 0 && <p className={styles.hint}>{data.unclassifiedQuestions} {data.unclassifiedQuestions === 1 ? 'pergunta praticada ainda não tem' : 'perguntas praticadas ainda não têm'} classificação de habilidade. Esses registros não foram atribuídos a uma habilidade por suposição.</p>}
            {data.skills.length === 0 ? <div className={styles.empty}><h3>{effectiveYear === null ? 'Vamos escolher sua faixa?' : 'Ainda não há registros classificados nesta faixa.'}</h3>{effectiveYear !== null && <span className={styles.status}>Evidência insuficiente</span>}<p>As habilidades aparecem quando você confirma respostas em perguntas classificadas. Seu histórico de quizzes continua disponível.</p><Link href="/quizzes" className={styles.link}>Explorar quizzes →</Link></div>
              : <><dl className={styles.stats}><div><dt>Primeiras respostas</dt><dd>{data.skills.reduce((total, skill) => total + skill.firstResponse.questions, 0)}</dd></div><div><dt>Repetições</dt><dd>{data.skills.reduce((total, skill) => total + skill.repeat.responses, 0)}</dd></div><div><dt>Respostas em revisão</dt><dd>{data.skills.reduce((total, skill) => total + skill.review.responses, 0)}</dd></div></dl>
                <div className={styles.grid}>{data.skills.map(skill => <SkillCard key={`${skill.code}:${skill.version}`} skill={skill} />)}</div></>}
          </section>
          <section className={styles.section} aria-labelledby="review-title">
            <div className={styles.sectionHeading}><h2 id="review-title">{infant ? 'Vamos revisitar uma descoberta?' : 'Revisar dificuldades recentes'}</h2><p>Uma revisão tem até cinco perguntas de um único quiz disponível para sua conta. Perguntas diferentes da mesma habilidade têm prioridade; as já respondidas são identificadas como prática.</p><p>Esta revisão não registra XP, missões ou itens. Ela fica no histórico de prática.</p></div>
            {data.inProgressReview && <article className={styles.review}>
              <div className={styles.reviewBody}><p className={styles.eyebrow}>Revisão em andamento</p><h3>{data.inProgressReview.simulation.title}</h3><p>Suas respostas confirmadas estão salvas. Você pode continuar no seu ritmo.</p></div>
              <Link className={styles.primary} href={`/quiz/${encodeURIComponent(data.inProgressReview.simulationId)}?attempt=${encodeURIComponent(data.inProgressReview.id)}`} aria-label={`Continuar revisão: ${data.inProgressReview.simulation.title}`}>Continuar revisão →</Link>
            </article>}
            {data.reviewSuggestions.length === 0 ? <div className={styles.empty}><h3>{effectiveYear === null ? 'Escolha sua faixa para consultar sugestões.' : 'Não há uma revisão sugerida agora.'}</h3><p>As sugestões dependem de dificuldades recentes em quizzes publicados e acessíveis. Você pode explorar outras atividades ou fazer uma pausa.</p></div>
              : data.reviewSuggestions.map(suggestion => <article key={suggestion.quizId} className={styles.review}>
                <div className={styles.reviewBody}><p className={styles.eyebrow}>Revisão orientada</p><h3>{suggestion.title}</h3><p>{suggestion.skillTitles.join(' · ')}</p><div className={styles.reviewMeta}><span>{suggestion.questionCount} {suggestion.questionCount === 1 ? 'pergunta selecionada' : 'perguntas selecionadas'}</span><span>{suggestion.hasRepeatedQuestions ? 'Inclui perguntas já praticadas' : 'Perguntas diferentes para praticar'}</span></div></div>
                <button className={styles.primary} type="button" disabled={Boolean(starting) || isSaving} aria-label={`Começar revisão: ${suggestion.title}`} onClick={() => void beginReview(suggestion.quizId)}>{starting === suggestion.quizId ? 'Preparando revisão…' : 'Começar revisão'}</button>
              </article>)}
            {reviewError && <div className={styles.error} role="alert"><p>{reviewError}</p><button className={styles.secondary} type="button" disabled={Boolean(starting)} onClick={() => setRetry(value => value + 1)}>Recarregar sugestões</button></div>}
          </section>
          <footer className={styles.footer}><Link className={styles.link} href="/quizzes/historico">Ver histórico de prática →</Link><Link className={styles.link} href="/historico">Ver histórico de simulados →</Link><Link className={styles.link} href="/">Aprender hoje →</Link></footer>
        </>}
    </main>
  </div>;
}

function SkillCard({ skill }: { skill: ApiSkillProgress }) {
  return <article className={styles.skill} aria-labelledby={`skill-${skill.code}-${skill.version}`}>
    <p className={styles.skillMeta}>{skill.discipline.name} · {quizYearLabel(skill.schoolYear)}</p><h3 id={`skill-${skill.code}-${skill.version}`}>{skill.title}</h3>
    <span className={styles.status}>{skill.evidence === 'INSUFFICIENT' ? 'Evidência insuficiente' : 'Registros iniciais'}</span>
    <dl className={styles.counts}><div><dt>Primeiras respostas</dt><dd>{skill.firstResponse.correct} / {skill.firstResponse.questions} corretas</dd></div><div><dt>Repetições</dt><dd>{skill.repeat.correct} / {skill.repeat.responses} corretas</dd></div><div><dt>Revisões</dt><dd>{skill.review.correct} / {skill.review.responses} corretas</dd></div></dl>
    <p className={styles.evidence}>{skill.firstResponse.questions} perguntas diferentes com primeira resposta · {skill.review.differentQuestions} perguntas diferentes praticadas em revisão. {skill.evidence === 'INSUFFICIENT' ? 'Ainda precisamos de mais primeiras respostas para reunir registros iniciais.' : 'Os registros mostram esta prática, sem comprovar domínio da habilidade.'}</p>
    {skill.lastPracticedAt && <p className={styles.hint}>Última prática: {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(skill.lastPracticedAt))}</p>}
  </article>;
}
