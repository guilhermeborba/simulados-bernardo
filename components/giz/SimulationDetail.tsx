'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTimerDefault } from '@/lib/gizPreferences';
import { AppShell, Badge, FeedbackBlock, Icon, ScreenState } from './ui';
import { isFinished, simulationSubtitle, useCatalog } from './useCatalog';
import { DataGate } from './DiscoveryCards';
import './discovery.css';
export default function SimulationDetail({ id }: { id: string }) {
  const catalog = useCatalog(); const simulation = catalog.allSimulations.find(s => s.id === id); const [timer, setTimer] = useState(true);
  useEffect(() => { setTimer(getTimerDefault()); }, []);
  const attempts = catalog.attempts.filter(a => a.simulationId === id); const active = attempts.find(a => !isFinished(a));
  const seconds = (simulation?.totalQuestions ?? 30) * (timer ? 45 : 50); const duration = `${Math.floor(seconds / 60)} min${seconds % 60 ? ` ${seconds % 60} s` : ''}`;
  return <AppShell title={simulation?.title || 'Detalhe do simulado'} subtitle={simulation ? simulationSubtitle(simulation) : undefined} backHref="/simulados" flow>
    {(catalog.loading || !catalog.user || catalog.error) ? <DataGate catalog={catalog} /> : !simulation ? <ScreenState kind="empty" title="Este simulado não está disponível" message="Escolha outro simulado do catálogo." action={<Link className="btn" href="/simulados">Ver simulados</Link>} /> : <div className="giz-split"><div className="stack">
    <section className="card stack"><Badge tone="new">{simulation.discipline.name}</Badge><h2>{simulation.title}</h2>{simulation.subtitle && <p>{simulation.subtitle}</p>}<div className="detail-facts"><div><Icon name="book" /><strong>{simulation.totalQuestions}</strong><span>questões</span></div><div><Icon name="clock" /><strong>{duration}</strong><span>tempo estimado</span></div><div><Icon name="spark" /><strong>{simulation.assessment === 'UNICO' ? 'Única' : simulation.assessment}</strong><span>{simulation.bimester > 0 ? `${simulation.bimester}º bimestre` : 'avaliação'}</span></div></div></section>
    <section className="card stack"><h2>Como funciona</h2><p>Leia cada questão com calma e confirme sua resposta.</p><FeedbackBlock correct={false}>Uma pista para aprender com as questões que precisam de outra olhada.</FeedbackBlock><FeedbackBlock correct>Uma curiosidade para descobrir um pouco mais.</FeedbackBlock><p className="muted">Nos novos simulados, a correção aparece ao confirmar cada resposta. A revisão completa fica disponível ao terminar.</p><p><Icon name="check" /> Você pode sair e continuar depois. Seu progresso fica salvo.</p></section>
    <section className="card stack"><h2>Suas tentativas</h2>{attempts.length ? attempts.map(a => <Link key={a.id} className="detail-attempt" href={`/simulado/${encodeURIComponent(id)}?attemptId=${encodeURIComponent(a.id)}${isFinished(a) ? '&view=result' : ''}`}><span>{new Date(a.finishedAt || a.createdAt).toLocaleDateString('pt-BR')} · {isFinished(a) ? 'Concluído' : 'Em andamento'}</span><strong>{isFinished(a) ? `${Number(a.percentage ?? 0)}%` : 'Continuar'} →</strong></Link>) : <p className="muted">Você ainda não fez este simulado.</p>}</section></div>
    <aside className="card stack detail-start"><h2>{active ? 'Vamos continuar?' : 'Tudo pronto?'}</h2><label className="timer-toggle"><input type="checkbox" checked={timer} onChange={e => setTimer(e.target.checked)} /><span>Cronômetro ligado<span className="muted">{timer ? '45 segundos por questão' : 'Sem limite de tempo'}</span></span></label><p className="muted">{timer ? 'Você pode pausar e continuar depois.' : 'Responda no seu ritmo.'}</p><Link className="btn" href={`/simulado/${encodeURIComponent(id)}?timer=${timer ? '1' : '0'}${active ? `&attemptId=${encodeURIComponent(active.id)}` : ''}`}>{active ? 'Continuar simulado' : 'Começar simulado'}</Link></aside></div>}
  </AppShell>;
}
