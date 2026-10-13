'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLearningPreferences } from '@/contexts/LearningPreferencesContext';
import { ApiError, getLearningHome, type ApiLearningHome, type ApiLearningMission } from '@/lib/apiClient';
import { QUIZ_SEGMENTS, quizSegmentForYear, quizTierForPreferences, quizYearLabel, quizYearPatch } from '@/lib/quiz-segments';
import MascoteGuia from './MascoteGuia';
import LearningCollectionSummary from './LearningCollectionSummary';
import styles from './LearningEntry.module.css';

export default function LearningEntry() {
  const { user, isLoading, getSessionGeneration } = useAuth();
  if (isLoading) return <section className={styles.entry} aria-label="Aprender hoje"><p role="status">Carregando sua conta…</p></section>;
  if (!user || user.role !== 'STUDENT') return <PublicLearningEntry />;
  // Replacing the child immediately prevents the previous account's progress from appearing.
  return <LearningHome key={`${user.id}:${getSessionGeneration()}`} />;
}

function PublicLearningEntry() {
  return <section className={styles.entry} aria-labelledby="learning-options-title">
    <div><p className={styles.eyebrow}>Um pouco de prática, todos os dias</p>
      <h2 id="learning-options-title">Como você quer aprender hoje?</h2>
      <p>Escolha uma atividade curta ou continue seus simulados.</p></div>
    <ExploreActivities />
    <Link href="/quizzes/historico" className={styles.history}>Continuar um quiz ou consultar meu histórico →</Link>
  </section>;
}

function LearningHome() {
  const { getSessionGeneration } = useAuth();
  const { preferences, isLoading: preferencesLoading, isSaving, error: preferencesError, updatePreferences, reload: reloadPreferences } = useLearningPreferences();
  const [home, setHome] = useState<{ schoolYear: number | null; generation: number; data: ApiLearningHome } | null>(null);
  const [error, setError] = useState<{ schoolYear: number | null; generation: number; message: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const schoolYear = preferences.schoolYear;
  const generation = getSessionGeneration();

  useEffect(() => {
    if (preferencesLoading || preferencesError) return;
    const controller = new AbortController();
    const currentGeneration = getSessionGeneration();
    setHome(null); setError(null);
    void getLearningHome(schoolYear ?? undefined, controller.signal).then(data => {
      if (!controller.signal.aborted && currentGeneration === getSessionGeneration()) setHome({ schoolYear, generation: currentGeneration, data });
    }).catch(cause => {
      if (controller.signal.aborted || currentGeneration !== getSessionGeneration()) return;
      const message = cause instanceof ApiError && cause.status === 401
        ? 'Sua sessão expirou. Entre novamente para consultar seu progresso.'
        : 'Não foi possível carregar seu progresso. Tente novamente.';
      setError({ schoolYear, generation: currentGeneration, message });
    });
    return () => controller.abort();
  }, [schoolYear, preferencesLoading, preferencesError, retry, getSessionGeneration]);

  const data = home?.schoolYear === schoolYear && home.generation === generation ? home.data : null;
  const effectiveYear = schoolYear ?? data?.schoolYear ?? null;
  const effectiveSegment = effectiveYear === null ? preferences.segment : quizSegmentForYear(effectiveYear);
  const infant = effectiveSegment === 'INFANTIL';
  const tier = quizTierForPreferences({ ...preferences, schoolYear: effectiveYear, segment: effectiveSegment });
  const usingProfileYear = schoolYear === null && effectiveYear !== null;
  const currentError = error?.schoolYear === schoolYear && error.generation === generation ? error.message : null;
  const loading = preferencesLoading || (!data && !currentError && !preferencesError);

  return <section className={styles.entry} data-tier={tier} data-motion={preferences.motionEnabled ? 'on' : 'off'} aria-labelledby="learning-home-title">
    <header className={styles.hero}>
      <div><p className={styles.eyebrow}>{infant ? 'Pequenas descobertas com o Bolinha' : tier === 'exame' ? 'Prática e progresso' : 'Uma descoberta de cada vez'}</p>
        <h2 id="learning-home-title">Aprender hoje</h2>
        <p>{infant ? 'O Bolinha acompanha você em novas descobertas. Escolha uma atividade e brinque de aprender.' : tier === 'exame' ? 'Continue de onde parou ou explore uma sequência de atividades para revisar conhecimentos.' : 'Continue sua prática ou descubra os temas escolhidos para esta semana.'}</p>
        <p className={styles.pace}>Você escolhe quando começar e quando fazer uma pausa.</p></div>
      {tier === 'ludico' ? <div className={styles.illustration} aria-hidden="true"><MascoteGuia variant={infant ? 'bolinha' : 'capelo'} size={118} /></div> : <div className={styles.illustration} aria-hidden="true"><LearningIllustration /></div>}
    </header>

    <div className={styles.audience}>
      <label className={styles.yearField}>Ano ou idade para as missões
        <select value={effectiveYear ?? ''} disabled={preferencesLoading || isSaving} onChange={event => {
          const year = event.target.value === '' ? null : Number(event.target.value);
          void updatePreferences(quizYearPatch(year, preferences.segment)).catch(() => undefined);
        }}>
          <option value="">{usingProfileYear ? 'Usar ano do cadastro' : 'Escolha um ano ou idade'}</option>
          {QUIZ_SEGMENTS.map(segment => <optgroup key={segment.value} label={segment.label}>
            {segment.years.map(year => <option key={year} value={year}>{quizYearLabel(year)}</option>)}
          </optgroup>)}
        </select>
      </label>
      <p className={styles.hint}>{usingProfileYear ? 'Estamos usando o ano do seu cadastro. Você pode escolher outra faixa e salvar na conta.' : 'Sua escolha fica salva na conta e pode ser alterada a qualquer momento.'}</p>
    </div>
    {isSaving && <p className={styles.notice} role="status">Salvando sua escolha…</p>}
    {preferencesError && <div className={styles.error} role="alert"><p>{preferencesError}</p>
      <button type="button" className={styles.secondary} disabled={preferencesLoading || isSaving} onClick={() => void reloadPreferences()}>Recarregar preferências</button></div>}

    {loading ? <p className={styles.loading} role="status">Carregando missões e progresso…</p> : currentError ? <div className={styles.error} role="alert"><p>{currentError}</p>
      <button type="button" className={styles.secondary} onClick={() => setRetry(value => value + 1)}>Tentar novamente</button>
      <Link href="/login?returnTo=/">Entrar novamente</Link></div> : data && <>
      <section className={styles.xp} aria-labelledby="learning-xp-heading">
        <div><h3 id="learning-xp-heading">Seu XP</h3><p>XP registra a prática em quizzes. Suas notas são calculadas pelas respostas.</p></div>
        <dl className={styles.xpStats}><div><dt>XP acumulado</dt><dd>{data.xp.total.toLocaleString('pt-BR')}</dd></div>
          <div><dt>XP hoje</dt><dd>{data.xp.today.toLocaleString('pt-BR')} <span>/ {data.xp.dailyLimit.toLocaleString('pt-BR')}</span></dd></div></dl>
        <p className={styles.xpRule}>{data.xp.perQuiz} XP na primeira conclusão de cada quiz no dia, até {data.xp.dailyLimit} XP por dia. O dia segue o horário de Brasília.</p>
        {data.xp.today >= data.xp.dailyLimit && <p className={styles.notice}>O XP de hoje já foi registrado até o limite. Você pode continuar praticando no seu ritmo.</p>}
      </section>

      <LearningCollectionSummary segment={effectiveSegment} />

      {data.inProgress && <section className={styles.resume} aria-labelledby="learning-resume-title">
        <div><p className={styles.eyebrow}>Continue de onde parou</p><h3 id="learning-resume-title">{data.inProgress.simulation.title}</h3>
          <p>{quizYearLabel(data.inProgress.simulation.schoolYear)} · Suas respostas confirmadas estão salvas.</p></div>
        <Link className={styles.primary} href={`/quiz/${encodeURIComponent(data.inProgress.simulationId)}?attempt=${encodeURIComponent(data.inProgress.id)}`} aria-label={`Continuar quiz: ${data.inProgress.simulation.title}`}>Continuar quiz →</Link>
      </section>}

      <section className={styles.missions} aria-labelledby="learning-missions-title">
        <div className={styles.sectionHeading}><h3 id="learning-missions-title">Missões da semana</h3>
          <p>{effectiveYear === null ? 'Escolha seu ano ou idade para ver as atividades selecionadas para você.' : `Atividades selecionadas para ${quizYearLabel(effectiveYear)}.`}</p></div>
        {data.missions.length === 0 ? <div className={styles.empty}><strong>{effectiveYear === null ? 'Vamos escolher sua faixa?' : 'As missões desta faixa ainda estão sendo preparadas.'}</strong>
          <p>{effectiveYear === null ? 'Use a escolha acima para descobrir as missões disponíveis.' : 'Você pode explorar os quizzes disponíveis e continuar seus simulados enquanto isso.'}</p>
          <Link href="/quizzes">Explorar quizzes →</Link></div> : <div className={styles.missionGrid}>{data.missions.map(mission => <MissionCard key={mission.id} mission={mission} />)}</div>}
      </section>

      {data.suggestedQuiz && <section className={styles.suggestion} aria-labelledby="learning-suggestion-title">
        <div><p className={styles.eyebrow}>{infant ? 'Mais uma descoberta' : 'Quiz sugerido'}</p><h3 id="learning-suggestion-title">{data.suggestedQuiz.title}</h3>
          <p>{data.suggestedQuiz.discipline.name}{data.suggestedQuiz.topic ? ` · ${data.suggestedQuiz.topic}` : ''}</p></div>
        <Link className={styles.secondary} href={`/quiz/${encodeURIComponent(data.suggestedQuiz.id)}`} aria-label={`Começar quiz sugerido: ${data.suggestedQuiz.title}`}>Conhecer este quiz →</Link>
      </section>}
    </>}

    <ExploreActivities />
    <div className={styles.footer}><Link href="/quizzes/historico" className={styles.history}>Meu histórico de quizzes →</Link><p>Uma pausa também faz parte de aprender. Seu progresso fica salvo na conta.</p></div>
  </section>;
}

function MissionCard({ mission }: { mission: ApiLearningMission }) {
  const firstOpen = mission.activities.find(activity => !activity.completed)?.activityKey;
  const dates = missionDates(mission.startsAt, mission.endsAt);
  return <article className={styles.missionCard} data-completed={mission.status === 'COMPLETED'} aria-labelledby={`mission-${mission.id}`}>
    <div className={styles.missionTop}><span className={styles.missionStatus}>{mission.status === 'COMPLETED' ? '✓ Missão concluída' : mission.status === 'IN_PROGRESS' ? 'Em andamento' : 'Pronta para começar'}</span>
      <span className={styles.missionDates}>{dates}</span></div>
    <h4 id={`mission-${mission.id}`}>{mission.title}</h4><p>{mission.description}</p>
    <div className={styles.missionProgress}><span>{mission.completedActivities} de {mission.totalActivities} atividades concluídas</span>
      <progress value={mission.completedActivities} max={mission.totalActivities} aria-label={`Progresso da missão: ${mission.title}`} /></div>
    <ol className={styles.missionActivities}>{mission.activities.map((activity, index) => <li key={activity.activityKey} data-completed={activity.completed}>
      <span className={styles.activityNumber} aria-hidden="true">{activity.completed ? '✓' : index + 1}</span>
      <div><span className={styles.activityStatus}>{activity.completed ? 'Concluída' : activity.activityKey === firstOpen ? 'Próxima atividade' : 'Disponível'}</span>
        <Link href={`/quiz/${encodeURIComponent(activity.quizId)}${activity.completed && activity.attemptId ? `?attempt=${encodeURIComponent(activity.attemptId)}` : ''}`} aria-label={`${activity.completed ? activity.attemptId ? 'Rever' : 'Praticar' : 'Começar'} atividade: ${activity.title}`}>{activity.title} <span aria-hidden="true">→</span></Link></div>
    </li>)}</ol>
    <p className={styles.missionNote}>{mission.status === 'COMPLETED' ? 'Esta sequência ficou registrada no seu progresso.' : 'A missão registra as conclusões desta semana. Pratique quando quiser.'}</p>
  </article>;
}

function ExploreActivities() {
  return <div className={styles.cards}>
    <Link href="/quizzes" className={styles.quiz}><span className={styles.label}>Quiz rápido</span>
      <strong>Uma pergunta de cada vez</strong><span>Confirme sua escolha e aprenda com a explicação.</span><span className={styles.action}>Explorar quizzes →</span></Link>
    <a href="#simulados" className={styles.simulation}><span className={styles.label}>Simulados</span>
      <strong>Pratique para a avaliação</strong><span>Escolha ano, disciplina e avaliação. Confira o resultado ao concluir.</span><span className={styles.action}>Escolher simulado ↓</span></a>
  </div>;
}

function missionDates(startsAt: string, endsAt: string) {
  const format = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
  // The closing midnight is exclusive, so show the last day in which progress counts.
  return `${format.format(new Date(startsAt))} a ${format.format(new Date(new Date(endsAt).getTime() - 1))} · Brasília`;
}

function LearningIllustration() {
  return <svg viewBox="0 0 170 160" width="136" height="128"><rect x="22" y="25" width="120" height="116" rx="18" fill="#e4def0" transform="rotate(-9 82 84)" /><rect x="33" y="15" width="116" height="124" rx="17" fill="#fff" stroke="#c6bbd7" strokeWidth="2" /><path d="M55 41h62M55 51h41" stroke="#c7b8db" strokeWidth="5" strokeLinecap="round" /><path d="M61 84h59M61 111h43" stroke="#d7dfec" strokeWidth="6" strokeLinecap="round" /><circle cx="54" cy="83" r="10" fill="#428169" /><path d="m49 83 3 3 6-6" stroke="#fff" strokeWidth="2.5" fill="none" /><circle cx="54" cy="111" r="10" fill="#ece4f5" /><circle cx="140" cy="129" r="23" fill="#e3b968" /><path d="m140 116 4 9 10 1-8 7 2 10-8-5-9 5 2-10-7-7 10-1Z" fill="#fff" /></svg>;
}
