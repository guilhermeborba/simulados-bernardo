'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyAttempts, ApiMyAttempt } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell, Badge, Button, Icon, ScreenState } from '@/components/giz/ui';
import '@/components/giz/tracking.css';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

function attemptPercentage(attempt: ApiMyAttempt) {
  const value = Number(attempt.percentage);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}

function attemptDate(attempt: ApiMyAttempt) {
  return new Date(attempt.finishedAt ?? attempt.createdAt);
}

export default function HistoricoList() {
  const router = useRouter();
  const { user, isLoading: sessionLoading } = useAuth();
  const [attempts, setAttempts] = useState<ApiMyAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failure, setFailure] = useState<'error' | 'offline' | null>(null);
  const [discipline, setDiscipline] = useState('Todas');
  const [order, setOrder] = useState<'recent' | 'oldest' | 'best'>('recent');

  const load = useCallback(async () => {
    setIsLoading(true);
    setFailure(null);
    try {
      setAttempts(await getMyAttempts());
    } catch {
      setFailure(navigator.onLine ? 'error' : 'offline');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      router.replace(`/login?returnTo=${encodeURIComponent('/historico')}`);
      return;
    }
    void load();
  }, [sessionLoading, user, router, load]);

  const disciplines = useMemo(() => ['Todas', ...Array.from(new Set(attempts.map((attempt) => attempt.simulation.discipline.name)))], [attempts]);
  const finished = attempts.filter((attempt) => attempt.status === 'FINISHED');
  const average = finished.length ? Math.round(finished.reduce((sum, attempt) => sum + attemptPercentage(attempt), 0) / finished.length) : 0;
  const best = finished.length ? Math.round(Math.max(...finished.map(attemptPercentage))) : 0;
  const filtered = attempts
    .filter((attempt) => discipline === 'Todas' || attempt.simulation.discipline.name === discipline)
    .sort((a, b) => order === 'best'
      ? (b.status === 'FINISHED' ? attemptPercentage(b) : -1) - (a.status === 'FINISHED' ? attemptPercentage(a) : -1)
      : (attemptDate(b).getTime() - attemptDate(a).getTime()) * (order === 'oldest' ? -1 : 1));

  return (
    <AppShell title="Histórico" subtitle="Todas as suas tentativas, da mais recente para a mais antiga." backHref="/eu">
      {(sessionLoading || isLoading || !user) && !failure && <ScreenState kind="loading" title="Buscando suas tentativas…" />}
      {failure && <ScreenState kind={failure} message={failure === 'offline' ? 'Conecte-se à internet para consultar seu histórico. Suas respostas já enviadas continuam salvas.' : 'Não foi possível carregar seu histórico.'} action={<Button onClick={() => void load()}>Tentar de novo</Button>} />}
      {!sessionLoading && !isLoading && !failure && user && (
        attempts.length === 0 ? <ScreenState kind="empty" title="Você ainda não fez nenhum simulado" message="Escolha uma disciplina e comece a sua primeira descoberta." action={<Link href="/simulados" className="btn">Escolher um simulado</Link>} /> : (
          <div className="stack">
            <section className="tracking-summary" aria-label="Resumo das tentativas concluídas">
              <Stat label="Concluídos" value={String(finished.length)} />
              <Stat label="Média" value={finished.length ? `${average}%` : '—'} />
              <Stat label="Melhor resultado" value={finished.length ? `${best}%` : '—'} />
            </section>
            <div className="tracking-tools">
              <div className="tracking-filters" role="group" aria-label="Filtrar por disciplina">
                {disciplines.map((name) => <button type="button" className="chip" key={name} aria-pressed={discipline === name} onClick={() => setDiscipline(name)}>{name}</button>)}
              </div>
              <div className="tracking-order"><label htmlFor="history-order">Ordenar por</label>
                <select id="history-order" value={order} onChange={(event) => setOrder(event.target.value as typeof order)}>
                  <option value="recent">Mais recentes</option>
                  <option value="oldest">Mais antigas</option>
                  <option value="best">Maior nota</option>
                </select>
              </div>
            </div>
            <p className="muted" role="status">{filtered.length} {filtered.length === 1 ? 'tentativa' : 'tentativas'}</p>
            {filtered.length === 0 ? <ScreenState kind="empty" title="Nenhuma tentativa nesta disciplina" action={<Button onClick={() => setDiscipline('Todas')}>Limpar filtros</Button>} /> : (
              <section className="tracking-history" aria-label="Tentativas de simulados">
                <div className="tracking-history-heading" aria-hidden="true"><span>Data</span><span>Simulado</span><span>Resultado</span><span>Ação</span></div>
                {filtered.map((attempt) => {
                  const isFinished = attempt.status === 'FINISHED';
                  const percentage = Math.round(attemptPercentage(attempt));
                  const tone = !isFinished ? 'pending' : percentage >= 80 ? 'ok' : percentage >= 60 ? 'middle' : 'low';
                  const date = attemptDate(attempt);
                  const href = `/simulado/${encodeURIComponent(attempt.simulationId)}?attemptId=${encodeURIComponent(attempt.id)}${isFinished ? '&view=result' : ''}`;
                  return <Link href={href} className="tracking-history-row" key={attempt.id}>
                    <span className="tracking-history-date"><time dateTime={date.toISOString()}>{dateFormatter.format(date)}</time>{!isFinished && <span className="tracking-history-status"> · Em andamento</span>}</span>
                    <span className={`tracking-score tracking-score--${tone}`} aria-label={isFinished ? `${percentage}% de aproveitamento` : 'Em andamento'}>{isFinished ? <><strong>{percentage}%</strong><small>nota</small></> : <Icon name="clock" />}</span>
                    <span className="tracking-history-title"><strong>{attempt.simulation.discipline.name} · {attempt.simulation.assessment}</strong><span className="muted">{attempt.simulation.title}</span></span>
                    <span className="tracking-history-result">{isFinished ? <><strong>{percentage}%</strong><span className="muted">{attempt.score ?? '0'} de {attempt.maxScore} pontos</span></> : <Badge tone="soft">Em andamento</Badge>}</span>
                    <span className="tracking-history-action">{isFinished ? 'Ver resultado' : 'Continuar'}<span aria-hidden="true">›</span></span>
                  </Link>;
                })}
              </section>
            )}
          </div>
        )
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="tracking-stat"><span>{label}</span><strong>{value}</strong></div>;
}
