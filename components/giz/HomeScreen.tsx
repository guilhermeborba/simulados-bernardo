'use client';
import Link from 'next/link';
import { AppShell, Badge, Icon, ScreenState, Tuca, Button } from './ui';
import { isFinished, useCatalog, useRequireTrack } from './useCatalog';
import { TRACK_INFO } from '@/lib/gizTrack';
import { DataGate, OfflineNotice, ResumeCard, SimulationCard } from './DiscoveryCards';
import './discovery.css';
export default function HomeScreen() {
  const catalog = useCatalog();
  useRequireTrack(catalog);
  const trackName = TRACK_INFO[catalog.track ?? 'kids'].name;
  const active = catalog.attempts.find(a => !isFinished(a) && catalog.simulations.some(s => s.id === a.simulationId));
  const latest = catalog.attempts.filter(isFinished).sort((a,b) => new Date(b.finishedAt || b.createdAt).getTime() - new Date(a.finishedAt || a.createdAt).getTime())[0];
  const firstName = catalog.user?.name.trim().split(/\s+/)[0];
  return <AppShell title={firstName ? `Oi, ${firstName}!` : 'Bem-vindo ao Giz!'} subtitle={`${trackName} · Uma descoberta a cada questão`}>
    {(catalog.loading || !catalog.user || catalog.error) ? <DataGate catalog={catalog} /> : <div className="stack">{catalog.offline && <OfflineNotice />}<div className="giz-split"><div className="stack">
      {active ? <ResumeCard attempt={active} simulation={catalog.simulations.find(s => s.id === active.simulationId)} /> : <section className="card welcome-card"><div className="stack"><Badge tone="new">{trackName}</Badge><h2>O que vamos descobrir hoje?</h2><p>Escolha uma disciplina e aprenda uma questão de cada vez.</p><Link href="/simulados" className="btn">Escolher um simulado <Icon name="book" /></Link></div><Tuca pose="feliz" size={96} priority /></section>}
      <div className="cluster discovery-section-title"><h2>Novos para você</h2><Link href="/simulados">Ver todos</Link></div>
      {catalog.simulations.length ? <div className="giz-grid home-simulations">{[...catalog.simulations].sort((a,b) => Number(catalog.attempts.some(t => t.simulationId === a.id)) - Number(catalog.attempts.some(t => t.simulationId === b.id))).slice(0,6).map(simulation => <SimulationCard key={simulation.id} simulation={simulation} attempt={catalog.attempts.find(a => a.simulationId === simulation.id)} />)}</div> : <ScreenState kind="empty" title="Nenhum simulado novo por enquanto" message="Volte depois para conferir suas próximas descobertas." action={<Button onClick={catalog.reload}>Atualizar simulados</Button>} />}
    </div><aside className="stack"><section className="card stack"><div className="cluster"><Icon name="flame" /><h2>Seu caminho</h2></div><div className="discovery-stat"><strong>{catalog.score?.simulados ?? catalog.attempts.filter(isFinished).length}</strong><span>simulados concluídos</span></div>{(catalog.score?.diasSeguidos ?? 0) > 0 && <p>{catalog.score?.diasSeguidos} {catalog.score?.diasSeguidos === 1 ? 'dia seguido' : 'dias seguidos'} de estudo</p>}<Link href="/historico">Ver meu histórico →</Link></section>
    {latest && <section className="card stack"><h2>Último resultado</h2><strong className="discovery-number">{Number(latest.percentage ?? 0)}%</strong><p>{latest.simulation.title}</p><Link href={`/simulado/${encodeURIComponent(latest.simulationId)}?attemptId=${encodeURIComponent(latest.id)}&view=result`}>Rever minha tentativa →</Link></section>}
    <section className="card stack"><Icon name="cup" size={28} /><h2>Aprender em turma</h2><p className="muted">Acompanhe suas descobertas com os colegas.</p><Link href="/ranking">Ver ranking da turma →</Link></section></aside></div></div>}
  </AppShell>;
}
