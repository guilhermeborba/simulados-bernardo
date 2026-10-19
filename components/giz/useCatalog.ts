'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiMyAttempt, ApiMinhaPontuacao, ApiSimulation, getAvailableSimulations, getMinhaPontuacao, getMyAttempts } from '@/lib/apiClient';
type CatalogState = { simulations: ApiSimulation[]; attempts: ApiMyAttempt[]; score: ApiMinhaPontuacao | null };
const emptyData: CatalogState = { simulations: [], attempts: [], score: null };
export function isFinished(attempt: ApiMyAttempt) { return attempt.finishedAt !== null || ['COMPLETED', 'FINISHED'].includes(attempt.status); }
export function simulationSubtitle(simulation: ApiSimulation) { return `${simulation.schoolYear}º ano · ${simulation.bimester}º bimestre · ${simulation.assessment} · ${simulation.totalQuestions} questões`; }
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
    Promise.all([getAvailableSimulations({}), getMyAttempts(), getMinhaPontuacao().catch(() => null)]).then(([simulations, attempts, score]) => {
      if (!active) return;
      const next = { simulations: simulations.filter(sim => sim.schoolYear >= 1 && sim.schoolYear <= 5), attempts, score };
      setData(next);
      try { localStorage.setItem(cacheKey, JSON.stringify(next)); } catch { /* Storage can be unavailable. */ }
    }).catch(() => {
      if (!active) return;
      setError(true); setOffline(!navigator.onLine);
      if (!navigator.onLine) {
        try { const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null'); if (Array.isArray(cached?.simulations) && Array.isArray(cached.attempts)) { setData(cached); setError(false); } } catch { /* Show the recoverable error state. */ }
      }
    }).finally(() => { if (active) setLoading(false); });
    window.addEventListener('online', reload);
    return () => { active = false; window.removeEventListener('online', reload); };
  }, [user, sessionLoading, retry, reload]);
  return { ...data, user, loading: loading || sessionLoading, error, offline, reload };
}
