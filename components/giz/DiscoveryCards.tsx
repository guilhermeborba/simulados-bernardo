'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ApiMyAttempt, ApiSimulation, getAttemptQuestions } from '@/lib/apiClient';
import { isFinished, simulationSubtitle, useCatalog } from './useCatalog';
import { Badge, Button, Icon, Progress, ScreenState, Tuca } from './ui';
export function DataGate({ catalog }: { catalog: ReturnType<typeof useCatalog> }) {
  const pathname = usePathname();
  const returnTo = encodeURIComponent(pathname);
  if (catalog.loading) return <ScreenState kind="loading" />;
  if (!catalog.user) return <section className="card giz-state"><Tuca pose="feliz" size={120} /><h2>Vamos aprender juntos?</h2><p>Entre na sua conta para encontrar seus simulados e acompanhar suas descobertas.</p><Link className="btn" href={`/login?returnTo=${returnTo}`}>Entrar no Giz</Link><Link href={`/registro?returnTo=${returnTo}`}>Criar uma conta</Link></section>;
  if (catalog.error) return <ScreenState kind={catalog.offline ? 'offline' : 'error'} title={catalog.offline ? 'Sem conexão' : 'Não foi possível carregar os simulados'} message={catalog.offline ? 'As respostas já confirmadas continuam salvas no seu dispositivo. Tente novamente quando a conexão voltar.' : 'Tente de novo em alguns instantes.'} action={<Button onClick={catalog.reload}>Tentar de novo</Button>} />;
  return null;
}
export function OfflineNotice() { return <p className="giz-offline" role="status"><Icon name="alert" /> Sem conexão. Mostrando os últimos dados salvos.</p>; }
export function SimulationCard({ simulation, attempt }: { simulation: ApiSimulation; attempt?: ApiMyAttempt }) {
  return <Link className="card simulation-card" href={`/simulados/${encodeURIComponent(simulation.id)}`}><span className="simulation-icon"><Icon name="book" size={28} /></span><span className="simulation-eyebrow">{simulation.assessment}</span><h3>{simulation.title}</h3><p>{simulationSubtitle(simulation)}</p><div className="simulation-card-footer"><Badge tone={attempt ? isFinished(attempt) ? 'ok' : 'soft' : 'new'}>{attempt ? isFinished(attempt) ? 'Concluído' : 'Em andamento' : 'Novo'}</Badge><span aria-hidden="true">→</span></div></Link>;
}
export function ResumeCard({ attempt, simulation }: { attempt: ApiMyAttempt; simulation?: ApiSimulation }) {
  const [answered, setAnswered] = useState<number | null>(null);
  useEffect(() => { let active = true; getAttemptQuestions(attempt.id).then(qs => { if (active) setAnswered(qs.filter(q => q.answer !== null && q.answer !== undefined).length); }).catch(() => {}); return () => { active = false; }; }, [attempt.id]);
  return <section className="card resume-card stack"><span className="simulation-eyebrow">Continuar de onde parou</span><h2>{attempt.simulation.title}</h2>{simulation && <p className="muted">{simulationSubtitle(simulation)}</p>}{answered !== null && simulation && <Progress value={answered} max={simulation.totalQuestions} />}<Link className="btn" href={`/simulado/${encodeURIComponent(attempt.simulationId)}?attemptId=${encodeURIComponent(attempt.id)}`}>Continuar simulado <Icon name="book" /></Link></section>;
}
export function FilterChips({ label, values, value, onChange, all, format = v => v }: { label: string; values: string[]; value: string; onChange: (value:string) => void; all: string; format?: (value:string) => string }) {
  return <div><span className="filter-label">{label}</span><div className="giz-chips" role="group" aria-label={label}><button className="chip" aria-pressed={!value} onClick={() => onChange('')}>{all}</button>{values.map(v => <button className="chip" key={v} aria-pressed={value === v} onClick={() => onChange(v)}>{format(v)}</button>)}</div></div>;
}
