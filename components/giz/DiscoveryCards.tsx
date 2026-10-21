'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ApiMyAttempt, ApiSimulation } from '@/lib/apiClient';
import { isFinished, simulationSubtitle, useCatalog } from './useCatalog';
import { Badge, Button, Icon, ScreenState, Tuca } from './ui';
export function DataGate({ catalog }: { catalog: ReturnType<typeof useCatalog> }) {
  const pathname = usePathname();
  const returnTo = encodeURIComponent(pathname);
  if (catalog.loading) return <ScreenState kind="loading" />;
  if (!catalog.user) return <section className="card giz-state"><Tuca pose="feliz" size={120} /><h2>Vamos aprender juntos?</h2><p>Entre na sua conta para encontrar seus simulados e acompanhar suas descobertas.</p><Link className="btn" href={`/login?returnTo=${returnTo}`}>Entrar no Giz</Link><Link href={`/registro?returnTo=${returnTo}`}>Criar uma conta</Link></section>;
  if (catalog.error) return <ScreenState kind={catalog.offline ? 'offline' : 'error'} title={catalog.offline ? 'Sem conexão' : 'Não foi possível carregar os simulados'} message={catalog.offline ? 'As respostas já confirmadas continuam salvas no seu dispositivo. Tente novamente quando a conexão voltar.' : 'Tente de novo em alguns instantes.'} action={<Button onClick={catalog.reload}>Tentar de novo</Button>} />;
  return null;
}
export function OfflineNotice() { return <p className="giz-offline" role="status"><Icon name="alert" /> Sem conexão. Mostrando os últimos dados salvos.</p>; }
export function SimulationCard({ simulation, attempt, fromTurma = false }: { simulation: ApiSimulation; attempt?: ApiMyAttempt; fromTurma?: boolean }) {
  return <Link className="card simulation-card" href={`/simulados/${encodeURIComponent(simulation.id)}`}><span className="simulation-icon"><Icon name="book" size={28} /></span><span className="simulation-eyebrow">{fromTurma ? `Da sua turma · ${simulation.assessment}` : simulation.assessment}</span><h3>{simulation.title}</h3><p>{simulationSubtitle(simulation)}</p><div className="simulation-card-footer"><Badge tone={attempt ? isFinished(attempt) ? 'ok' : 'soft' : 'new'}>{attempt ? isFinished(attempt) ? 'Concluído' : 'Em andamento' : 'Novo'}</Badge><span aria-hidden="true">→</span></div></Link>;
}
export function FilterChips({ label, values, value, onChange, all, format = v => v }: { label: string; values: string[]; value: string; onChange: (value:string) => void; all: string; format?: (value:string) => string }) {
  return <div><span className="filter-label">{label}</span><div className="giz-chips" role="group" aria-label={label}><button className="chip" aria-pressed={!value} onClick={() => onChange('')}>{all}</button>{values.map(v => <button className="chip" key={v} aria-pressed={value === v} onClick={() => onChange(v)}>{format(v)}</button>)}</div></div>;
}
