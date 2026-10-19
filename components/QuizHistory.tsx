'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLearningPreferences } from '@/contexts/LearningPreferencesContext';
import { getMyQuizAttempts, type ApiQuizAttempt } from '@/lib/apiClient';
import { quizTierForPreferences, quizYearLabel } from '@/lib/quiz-segments';
import styles from './QuizCatalog.module.css';

const PAGE_SIZE = 8;
type HistoryFilter = 'ALL' | 'IN_PROGRESS' | 'FINISHED';
type PracticeFilter = 'ALL' | 'NORMAL' | 'REVIEW';

export default function QuizHistory() {
  const { user, isLoading: authLoading, getSessionGeneration } = useAuth();
  const { preferences } = useLearningPreferences();
  const [history, setHistory] = useState<{ ownerId: string | null; generation: number; attempts: ApiQuizAttempt[]; loading: boolean; error: boolean }>({ ownerId: null, generation: -1, attempts: [], loading: true, error: false });
  const [filter, setFilter] = useState<HistoryFilter>('ALL');
  const [practiceFilter, setPracticeFilter] = useState<PracticeFilter>('ALL');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const userId = user?.id ?? null;
  const generation = getSessionGeneration();

  useEffect(() => {
    if (!userId || user?.role !== 'STUDENT') return;
    const controller = new AbortController();
    const currentGeneration = getSessionGeneration();
    setHistory({ ownerId: userId, generation: currentGeneration, attempts: [], loading: true, error: false });
    getMyQuizAttempts(controller.signal)
      .then((attempts) => { if (!controller.signal.aborted && currentGeneration === getSessionGeneration()) setHistory({ ownerId: userId, generation: currentGeneration, attempts, loading: false, error: false }); })
      .catch(() => { if (!controller.signal.aborted && currentGeneration === getSessionGeneration()) setHistory({ ownerId: userId, generation: currentGeneration, attempts: [], loading: false, error: true }); });
    return () => controller.abort();
  }, [userId, user?.role, generation, retry, getSessionGeneration]);

  useEffect(() => { setFilter('ALL'); setPracticeFilter('ALL'); setPage(1); }, [userId, generation]);

  if (authLoading) return <div className={styles.shell} role="status">Carregando sua conta…</div>;
  if (!user) return <div className={styles.shell}><h2>Seu histórico de quizzes</h2><p>Entre para continuar uma rodada ou rever suas descobertas.</p><Link href="/login?returnTo=/quizzes/historico" className={styles.primaryButton}>Entrar</Link></div>;

  const currentHistory = history.ownerId === userId && history.generation === generation;
  const attempts = currentHistory ? history.attempts : [];
  const filtered = attempts.filter((attempt) => (filter === 'ALL' || attempt.status === filter) && (practiceFilter === 'ALL' || attempt.practiceMode === practiceFilter));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const loading = !currentHistory || history.loading;
  const finishedCount = attempts.filter((attempt) => attempt.status === 'FINISHED' && attempt.practiceMode !== 'REVIEW').length;
  const reviewCount = attempts.filter((attempt) => attempt.status === 'FINISHED' && attempt.practiceMode === 'REVIEW').length;
  const ongoingCount = attempts.filter((attempt) => attempt.status === 'IN_PROGRESS').length;

  return (
    <div className={styles.shell} data-tier={quizTierForPreferences(preferences)} data-reduced-motion={!preferences.motionEnabled || undefined}>
      <div className={styles.main}>
        <header className={styles.historyHero}><p className={styles.eyebrow}>CADA RODADA CONTA UMA HISTÓRIA</p><h2>Seu histórico de quizzes</h2><p>Continue de onde parou ou reveja as explicações de uma rodada concluída. Quizzes e revisões são práticas; os simulados têm um histórico separado.</p><Link href="/historico" className={styles.textButton}>Ver histórico de simulados →</Link></header>
        {user.role !== 'STUDENT' ? <div className={styles.empty}><h2>Histórico disponível para alunos</h2><p>A sua conta pode explorar os quizzes publicados no catálogo.</p><Link href="/quizzes" className={styles.primaryButton}>Explorar quizzes</Link></div> : <>
          {!loading && !history.error && <div className={styles.historyStats}><span><strong>{finishedCount}</strong> {finishedCount === 1 ? 'rodada concluída' : 'rodadas concluídas'}</span><span><strong>{reviewCount}</strong> {reviewCount === 1 ? 'revisão concluída' : 'revisões concluídas'}</span><span><strong>{ongoingCount}</strong> em andamento</span></div>}
          <div className={styles.historyFilters} role="group" aria-label="Tipo de prática">
            {([['ALL', 'Todas as práticas'], ['NORMAL', 'Quizzes'], ['REVIEW', 'Revisões']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={practiceFilter === value} className={styles.filterButton} onClick={() => { setPracticeFilter(value); setPage(1); }}>{label}</button>)}
          </div>
          <div className={styles.historyFilters} role="group" aria-label="Filtrar histórico">
            {([['ALL', 'Todos'], ['IN_PROGRESS', 'Em andamento'], ['FINISHED', 'Concluídos']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} className={styles.filterButton} onClick={() => { setFilter(value); setPage(1); }}>{label}</button>)}
          </div>
          {loading ? <div className={styles.empty} role="status">Carregando seu histórico…</div> : history.error ? <div className={styles.empty} role="alert"><h2>Não foi possível carregar seu histórico.</h2><button type="button" className={styles.primaryButton} onClick={() => setRetry((value) => value + 1)}>Tentar novamente</button></div> : filtered.length === 0 ? <div className={styles.empty}><h2>{attempts.length === 0 ? 'Sua próxima descoberta começa aqui.' : 'Nenhum quiz neste filtro.'}</h2><p>{attempts.length === 0 ? 'Escolha um quiz para fazer sua primeira rodada.' : 'Escolha outro filtro para consultar suas rodadas.'}</p><Link href="/quizzes" className={styles.primaryButton}>Encontrar um quiz</Link></div> : <>
            <div className={styles.historyList}>
              {visible.map((attempt) => {
                const finished = attempt.status === 'FINISHED';
                const ongoing = attempt.status === 'IN_PROGRESS';
                const review = attempt.practiceMode === 'REVIEW';
                return <article key={attempt.id} className={styles.historyCard}>
                  <div className={styles.historyCardBody}>
                    <p className={styles.yearTag}>{attempt.simulation.discipline.name} · {quizYearLabel(attempt.simulation.schoolYear)}</p>
                    <h2>{attempt.simulation.title}</h2>
                    <p className={styles.historyScore}>{review ? 'Revisão orientada · sem XP, missões ou itens' : 'Quiz · prática livre'}</p>
                    <div className={styles.historyMeta}><span className={styles.statusBadge} data-status={ongoing ? 'ongoing' : finished ? 'finished' : 'closed'}>{ongoing ? 'Em andamento' : finished ? 'Concluído' : 'Encerrado'}</span><span>{formatDate(attempt.finishedAt ?? attempt.startedAt ?? attempt.createdAt)}</span></div>
                    {finished && <p className={styles.historyScore}>{formatNumber(attempt.score)} de {formatNumber(attempt.maxScore)} pontos · {formatNumber(attempt.percentage)}%{attempt.correctCount !== null ? ` · ${attempt.correctCount} ${attempt.correctCount === 1 ? 'acerto' : 'acertos'}` : ''}</p>}
                  </div>
                  {(ongoing || finished) && <Link href={`/quiz/${encodeURIComponent(attempt.simulationId)}?attempt=${encodeURIComponent(attempt.id)}`} className={ongoing ? styles.primaryButton : styles.secondaryButton} aria-label={`${ongoing ? 'Continuar' : 'Ver resultado de'} ${attempt.simulation.title}`}>{ongoing ? review ? 'Continuar revisão' : 'Continuar quiz' : 'Ver resultado'}<span aria-hidden="true"> →</span></Link>}
                </article>;
              })}
            </div>
            {totalPages > 1 && <nav className={styles.pagination} aria-label="Páginas do histórico"><button type="button" className={styles.secondaryButton} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><span role="status">Página {currentPage} de {totalPages}</span><button type="button" className={styles.secondaryButton} disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Próxima</button></nav>}
          </>}
        </>}
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatNumber(value: string | null): string {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '—';
}
