'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMyAttempts, ApiMyAttempt } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export default function HistoricoList() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [attempts, setAttempts] = useState<ApiMyAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyAttempts()
      .then(setAttempts)
      .catch(() => setError('Não foi possível carregar seu histórico.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="page-shell flex flex-col px-4 py-6 md:py-8">
      <div className="flex justify-between items-center mb-6 w-full max-w-3xl mx-auto">
        <Link href="/" className="btn btn--ghost text-sm" style={{ padding: '8px 16px' }}>‹ Início</Link>
        <span className="font-bold text-base" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
          📚 Meu histórico
        </span>
        <button className="btn btn--ghost text-sm" style={{ padding: '8px 16px' }} onClick={handleLogout}>
          Sair
        </button>
      </div>

      <div className="w-full max-w-3xl mx-auto">
        {user && (
          <p className="mb-4" style={{ color: 'var(--muted)' }}>Olá, {user.name}! Aqui estão seus simulados.</p>
        )}

        {isLoading && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}

        {error && (
          <p className="text-center" style={{ color: 'var(--bubble-deep)' }}>{error}</p>
        )}

        {!isLoading && !error && attempts.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>Você ainda não fez nenhum simulado.</p>
        )}

        <div className="flex flex-col gap-3">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                  {attempt.simulation.discipline.name} · {attempt.simulation.assessment}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {attempt.status === 'FINISHED'
                    ? `${attempt.score ?? 0} / ${attempt.maxScore} pontos (${attempt.percentage ?? 0}%)`
                    : 'Em andamento'}
                </div>
              </div>
              <span className="badge">{new Date(attempt.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
