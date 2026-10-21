'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ActionRow, AppShell, Badge, Button, Icon, Progress, ScreenState, SecondaryLink, SubjectTile, Tuca } from './ui';
import { isFinished, useCatalog, useRequireTrack } from './useCatalog';
import { ApiMyAttempt, ApiSimulation, getAttemptQuestions } from '@/lib/apiClient';
import { TRACK_INFO, periodLabel, schoolYearLabel, subjectOf } from '@/lib/gizTrack';
import { DataGate, OfflineNotice } from './DiscoveryCards';
import './discovery.css';
import './home.css';
type CardState = 'new' | 'progress' | 'done';
const STATE_BADGE = { new: ['new', 'Novo'], progress: ['soft', 'Em andamento'], done: ['ok', 'Concluído'] } as const;
const byRecent = (a: ApiMyAttempt, b: ApiMyAttempt) => new Date(b.finishedAt || b.createdAt).getTime() - new Date(a.finishedAt || a.createdAt).getTime();
/** Answers saved in each unfinished attempt (-1 when unreadable). An attempt without answers is still new. */
function useAnsweredCounts(ids: string[]) {
  const key = ids.join(',');
  const [counts, setCounts] = useState<{ key: string; value: Record<string, number> }>();
  useEffect(() => {
    if (!key) return;
    let active = true;
    Promise.all(key.split(',').map(id => getAttemptQuestions(id).then(qs => [id, qs.filter(q => q.answer !== null && q.answer !== undefined).length] as const, () => [id, -1] as const))).then(entries => { if (active) setCounts({ key, value: Object.fromEntries(entries) }); });
    return () => { active = false; };
  }, [key]);
  return !key ? {} : counts?.key === key ? counts.value : null;
}
export default function HomeScreen() {
  const catalog = useCatalog();
  useRequireTrack(catalog);
  const trackName = TRACK_INFO[catalog.track ?? 'kids'].name;
  const simulationOf = (attempt: ApiMyAttempt) => catalog.simulations.find(s => s.id === attempt.simulationId);
  const unfinished = catalog.attempts.filter(a => !isFinished(a) && simulationOf(a)).sort(byRecent).slice(0, 10);
  const answered = useAnsweredCounts(unfinished.map(a => a.id));
  const resume = answered && unfinished.find(a => answered[a.id] !== 0);
  const latest = catalog.attempts.filter(isFinished).sort(byRecent)[0];
  const firstName = catalog.user?.name.trim().split(/\s+/)[0];
  const stateOf = (simulation: ApiSimulation): CardState => {
    const attempt = catalog.attempts.find(a => a.simulationId === simulation.id);
    return !attempt || answered?.[attempt.id] === 0 ? 'new' : isFinished(attempt) ? 'done' : 'progress';
  };
  const shown = [...catalog.simulations].sort((a, b) => Number(stateOf(a) !== 'new') - Number(stateOf(b) !== 'new')).slice(0, 6);
  const years = new Set(shown.map(s => s.schoolYear));
  const sharedYear = years.size === 1 ? shown[0].schoolYear : null;
  const sectionNote = [sharedYear === null ? null : schoolYearLabel(sharedYear), shown.length && shown.every(catalog.fromTurma) ? 'Da sua turma' : null].filter(Boolean).join(' · ');
  const done = catalog.score?.simulados ?? catalog.attempts.filter(isFinished).length;
  const streak = catalog.score?.diasSeguidos ?? 0;
  return <AppShell root title={firstName ? `Oi, ${firstName}!` : 'Bem-vindo ao Giz!'} subtitle="Uma descoberta a cada questão.">
    {(catalog.loading || !catalog.user || catalog.error) ? <DataGate catalog={catalog} /> : !answered ? <ScreenState kind="loading" /> : <div className="stack">{catalog.offline && <OfflineNotice />}<div className="home-layout">
      <div className="home-resume-slot">{resume ? <ResumeCard attempt={resume} simulation={simulationOf(resume)!} answered={answered[resume.id]} /> : <section className="card welcome-card"><div className="stack"><Badge tone="new">{trackName}</Badge><h2>O que vamos descobrir hoje?</h2><p>Escolha uma disciplina e aprenda uma questão de cada vez.</p><Link href="/simulados" className="btn">Escolher um simulado <Icon name="arrow-right" /></Link></div><Tuca pose="feliz" size={96} priority /></section>}</div>
      <div className="home-summaries">
        <section className="card home-summary"><div className="home-summary-body"><div className="home-summary-head"><SubjectTile subject="mat" icon="flame" small /><h2>Seu caminho</h2></div><p className="home-stat"><strong>{done}</strong> <span className="home-long">simulados concluídos</span><span className="home-short">concluídos</span></p>{streak > 0 && <p className="home-meta">{streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'} de estudo</p>}</div><ActionRow href="/historico"><span className="home-long">Ver meu histórico</span><span className="home-short">Histórico</span></ActionRow></section>
        {latest && <section className="card home-summary"><div className="home-summary-body"><div className="home-summary-head"><SubjectTile subject="geo" icon="check" small /><h2>Último resultado</h2></div><p className="home-stat"><strong>{Math.round(Number(latest.percentage ?? 0))}%</strong></p><p className="home-meta">Simulado de {latest.simulation.discipline.name}</p></div><ActionRow href={`/simulado/${encodeURIComponent(latest.simulationId)}?attemptId=${encodeURIComponent(latest.id)}&view=result`}><span className="home-long">Rever minha tentativa</span><span className="home-short">Rever</span></ActionRow></section>}
        <section className="card home-summary home-summary--turma"><div className="home-summary-body"><div className="home-summary-head"><SubjectTile subject="his" icon="cup" small /><h2>Aprender em turma</h2></div><p className="home-meta">Acompanhe suas descobertas com os colegas.</p></div><ActionRow href="/ranking"><span className="home-long">Ver ranking da turma</span><span className="home-short">Ver ranking</span></ActionRow></section>
      </div>
      <div className="home-main">
        <section aria-labelledby="home-new-title"><div className="home-section-head"><div><h2 id="home-new-title">Novos para você</h2>{sectionNote && <p className="home-meta">{sectionNote}</p>}</div><SecondaryLink href="/simulados">Ver todos<span className="sr-only"> os simulados</span></SecondaryLink></div>
          {shown.length ? <div className="home-simulations">{shown.map(simulation => <SimulationLink key={simulation.id} simulation={simulation} state={stateOf(simulation)} showYear={sharedYear === null} />)}</div> : <ScreenState kind="empty" title="Nenhum simulado novo por enquanto" message="Volte depois para conferir suas próximas descobertas." action={<Button onClick={catalog.reload}>Atualizar simulados</Button>} />}
        </section>
        {catalog.turmas.length === 0 && <LinkCard href="/pratica" icon="spark" title="Ir para a prática" note="Quizzes rápidos, missões da semana e sua coleção." />}
        <LinkCard href="/ranking" icon="cup" subject="his" title="Ver ranking da turma" narrow />
      </div>
    </div></div>}
  </AppShell>;
}
function ResumeCard({ attempt, simulation, answered }: { attempt: ApiMyAttempt; simulation: ApiSimulation; answered: number }) {
  return <section className="card home-resume"><div className="home-resume-text"><span className="simulation-eyebrow">Continuar de onde parou</span><h2>{simulation.discipline.name}</h2><p className="home-meta">{[schoolYearLabel(simulation.schoolYear), periodLabel(simulation.bimester, simulation.assessment)].filter(Boolean).join(' · ')}</p>{answered > 0 && <Progress value={answered} max={simulation.totalQuestions} />}</div><Link className="btn" href={`/simulado/${encodeURIComponent(attempt.simulationId)}?attemptId=${encodeURIComponent(attempt.id)}`}>Continuar simulado <Icon name="arrow-right" /></Link></section>;
}
/** The whole card is one link, read as "Geografia, 1º bimestre, AV2, 30 questões, novo". */
function SimulationLink({ simulation, state, showYear }: { simulation: ApiSimulation; state: CardState; showYear: boolean }) {
  const [tone, label] = STATE_BADGE[state];
  const meta = [showYear ? schoolYearLabel(simulation.schoolYear) : null, periodLabel(simulation.bimester, simulation.assessment)].filter(Boolean).join(' · ');
  const name = [simulation.discipline.name, ...meta.split(' · ').filter(Boolean), `${simulation.totalQuestions} questões`, label.toLocaleLowerCase('pt-BR')].join(', ');
  return <Link className="home-sim" href={`/simulados/${encodeURIComponent(simulation.id)}`} aria-label={name}>
    <span className="home-sim-top"><SubjectTile subject={subjectOf(simulation.discipline)} /><span className="home-sim-text"><span className="home-sim-title">{simulation.discipline.name}</span>{meta && <span className="home-meta">{meta}</span>}</span><Badge tone={tone}>{label}</Badge></span>
    <span className="home-sim-foot"><span className="home-sim-count">{simulation.totalQuestions} questões</span><span className="giz-action-dot" aria-hidden="true"><Icon name="chevron-right" size={20} /></span></span>
  </Link>;
}
function LinkCard({ href, icon, subject = null, title, note, narrow = false }: { href: string; icon: string; subject?: 'his' | null; title: string; note?: string; narrow?: boolean }) {
  return <Link className={`card home-link-card ${narrow ? 'home-narrow' : ''}`} href={href}><SubjectTile subject={subject} icon={icon} small /><span className="home-link-text"><span className="home-link-title">{title}</span>{note && <span className="home-meta">{note}</span>}</span><span className="giz-action-dot" aria-hidden="true"><Icon name="chevron-right" size={20} /></span></Link>;
}
