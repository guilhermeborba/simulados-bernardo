'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ApiMyAttempt, ApiMinhaPontuacao, ApiSimulation, ApiTurma, getAvailableSimulations, getMinhaPontuacao, getMyAttempts, getMyTurmas } from '@/lib/apiClient';
import { periodLabel, saveTrack, schoolYearLabel, trackOfSchoolYear, trackOfTurmas, useGizTrack } from '@/lib/gizTrack';
import { bloquearTrocaDeTrilha } from '@/lib/trilha';
type CatalogState = { simulations: ApiSimulation[]; attempts: ApiMyAttempt[]; score: ApiMinhaPontuacao | null; turmas: ApiTurma[] };
const emptyData: CatalogState = { simulations: [], attempts: [], score: null, turmas: [] };
export function isFinished(attempt: ApiMyAttempt) { return attempt.finishedAt !== null || ['COMPLETED', 'FINISHED'].includes(attempt.status); }
export function simulationSubtitle(simulation: ApiSimulation) { return [schoolYearLabel(simulation.schoolYear), periodLabel(simulation.bimester, simulation.assessment), `${simulation.totalQuestions} questões`].filter(Boolean).join(' · '); }
export function useCatalog() {
  const { user, isLoading: sessionLoading } = useAuth();
  const [data, setData] = useState<CatalogState>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [retry, setRetry] = useState(0);
  const reload = useCallback(() => setRetry(value => value + 1), []);
  useEffect(() => {
    if (sessionLoading) return;
    if (!user) { setData(emptyData); setLoading(false); return; }
    let active = true;
    setLoading(true); setError(false); setOffline(false); setData(emptyData);
    const cacheKey = `giz:catalog:${user.id}`;
    Promise.all([getAvailableSimulations({}), getMyAttempts(), getMinhaPontuacao().catch(() => null), getMyTurmas().catch(() => [])]).then(([simulations, attempts, score, turmas]) => {
      if (!active) return;
      const next = { simulations, attempts, score, turmas };
      setData(next);
      try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch { /* Storage can be unavailable. */ }
    }).catch(() => {
      if (!active) return;
      setError(true); setOffline(!navigator.onLine);
      if (!navigator.onLine) {
        try { const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null'); if (Array.isArray(cached?.simulations) && Array.isArray(cached.attempts)) { setData({ ...cached, turmas: Array.isArray(cached.turmas) ? cached.turmas : [] }); setError(false); } } catch { /* Show the recoverable error state. */ }
      }
    }).finally(() => { if (active) setLoading(false); });
    window.addEventListener('online', reload);
    return () => { active = false; window.removeEventListener('online', reload); };
  }, [user, sessionLoading, retry, reload]);
  const track = useGizTrack();
  const turmaIds = new Set(data.turmas.map(turma => turma.id));
  const fromTurma = (sim: ApiSimulation) => Boolean(sim.turmaId && turmaIds.has(sim.turmaId));
  const inTrack = track ? data.simulations.filter(sim => trackOfSchoolYear(sim.schoolYear) === track).sort((a, b) => Number(fromTurma(b)) - Number(fromTurma(a))) : [];
  return { ...data, allSimulations: data.simulations, simulations: inTrack, fromTurma, track, user, loading: loading || sessionLoading || track === undefined, error, offline, reload };
}
/** Home and catalog only make sense inside a track: turma members follow their class, others choose. */
export function useRequireTrack(catalog: ReturnType<typeof useCatalog>) {
  const router = useRouter();
  const { user, track, turmas, loading, error } = catalog;
  useEffect(() => {
    if (!user || track !== null || loading || error) return;
    const fromTurma = trackOfTurmas(turmas);
    if (fromTurma) { saveTrack(fromTurma); bloquearTrocaDeTrilha(); }
    else router.replace('/trilha');
  }, [user, track, turmas, loading, error, router]);
}
