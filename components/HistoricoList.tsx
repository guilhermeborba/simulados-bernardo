'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getMyAttempts,
  getAttemptResult,
  ApiMyAttempt,
  ApiAttemptResult,
} from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export default function HistoricoList() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [attempts, setAttempts] = useState<ApiMyAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<{ [attemptId: string]: ApiAttemptResult }>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

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

  // O detalhamento só é buscado quando o item é aberto, e só uma vez por tentativa.
  async function toggleDetail(attempt: ApiMyAttempt) {
    if (openId === attempt.id) {
      setOpenId(null);
      return;
    }

    setOpenId(attempt.id);
    setDetailError(null);

    if (details[attempt.id]) return;

    setLoadingDetail(attempt.id);
    try {
      const result = await getAttemptResult(attempt.id);
      setDetails((prev) => ({ ...prev, [attempt.id]: result }));
    } catch {
      setDetailError(attempt.id);
    } finally {
      setLoadingDetail(null);
    }
  }

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
          {attempts.map((attempt) => {
            const isFinished = attempt.status === 'FINISHED';
            const isOpen = openId === attempt.id;
            const detail = details[attempt.id];

            return (
              <div key={attempt.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  className="flex justify-between items-center gap-3 flex-wrap"
                  style={{ padding: '20px 24px' }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                      {attempt.simulation.discipline.name} · {attempt.simulation.assessment}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {isFinished
                        ? `${attempt.score ?? 0} / ${attempt.maxScore} pontos (${attempt.percentage ?? 0}%)`
                        : 'Em andamento'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge">{new Date(attempt.createdAt).toLocaleDateString('pt-BR')}</span>

                    {isFinished ? (
                      <button
                        className="btn btn--ghost text-sm"
                        style={{ padding: '8px 16px' }}
                        aria-expanded={isOpen}
                        onClick={() => void toggleDetail(attempt)}
                      >
                        {isOpen ? 'Ocultar' : 'Ver detalhes'}
                      </button>
                    ) : (
                      <Link
                        href={`/simulado/${attempt.simulationId}`}
                        className="btn btn--grass text-sm"
                        style={{ padding: '8px 16px' }}
                      >
                        Continuar ▸
                      </Link>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1.5px solid var(--line)', padding: '18px 24px 22px' }}>
                    {loadingDetail === attempt.id && (
                      <p style={{ color: 'var(--muted)', fontSize: 14 }}>Carregando detalhes...</p>
                    )}

                    {detailError === attempt.id && (
                      <p style={{ color: 'var(--bubble-deep)', fontSize: 14 }}>
                        Não foi possível carregar o detalhamento deste simulado.
                      </p>
                    )}

                    {detail && (
                      <>
                        <div className="flex gap-4 flex-wrap mb-4" style={{ fontSize: 13, color: 'var(--muted)' }}>
                          <span>✅ {detail.attempt.correctCount} acertos</span>
                          <span>❌ {detail.attempt.wrongCount} erros</span>
                          {attempt.finishedAt && (
                            <span>
                              Concluído em {new Date(attempt.finishedAt).toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col">
                          {detail.questions.map((question, index) => (
                            <div
                              key={question.id}
                              style={{
                                display: 'flex',
                                gap: 12,
                                padding: '10px 0',
                                borderTop: index === 0 ? 'none' : '1px solid var(--line)',
                              }}
                            >
                              <span style={{ fontSize: 15 }}>{question.isCorrect ? '✅' : '❌'}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.45 }}>
                                  <strong>Questão {index + 1}.</strong> {question.statement}
                                </div>
                                {!question.isCorrect && question.tip && (
                                  <div
                                    style={{
                                      marginTop: 6,
                                      padding: '8px 12px',
                                      background: '#FFF8D6',
                                      border: '1px solid var(--sun)',
                                      borderRadius: 'var(--radius-sm)',
                                      fontSize: 13,
                                      color: '#6B4A00',
                                      lineHeight: 1.45,
                                    }}
                                  >
                                    💡 {question.tip}
                                  </div>
                                )}
                              </div>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: question.isCorrect ? 'var(--grass-deep)' : 'var(--muted)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {question.isCorrect ? `+${question.pointsEarned}` : '0'} pt
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
