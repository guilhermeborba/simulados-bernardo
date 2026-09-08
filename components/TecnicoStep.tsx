'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAvailableSimulations, ApiSimulation } from '@/lib/apiClient';
import { TECNICO_SCHOOL_YEAR } from '@/lib/trilha';

interface TecnicoStepProps {
  onBack: () => void;
}

/**
 * Listagem dos simulados de curso técnico.
 *
 * Adota a linguagem sóbria da faixa "exame" — a mesma que o aluno encontra ao
 * abrir o simulado —, em vez do visual lúdico da Educação Básica.
 */
export default function TecnicoStep({ onBack }: TecnicoStepProps) {
  const router = useRouter();
  const [simulations, setSimulations] = useState<ApiSimulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    getAvailableSimulations({ schoolYear: TECNICO_SCHOOL_YEAR })
      .then(setSimulations)
      .catch(() => setError('Não foi possível carregar os simulados.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="page-shell flex flex-col px-4 py-6 md:py-8" style={{ background: '#FAFAF9' }}>
      <div className="w-full max-w-3xl mx-auto flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#57534E', fontSize: 14, padding: 0,
          }}
        >
          ‹ Trocar de trilha
        </button>
        <span
          className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: '#F0FDFA', color: '#0E7490', border: '1px solid #CCF0EA', borderRadius: 3 }}
        >
          Curso Técnico
        </span>
      </div>

      <div className="w-full max-w-3xl mx-auto mb-6">
        <h2 style={{ fontSize: 28, fontWeight: 600, color: '#1C1917', letterSpacing: '-0.02em' }}>
          Simulados disponíveis
        </h2>
        <p style={{ color: '#57534E', marginTop: 6, fontSize: 15, lineHeight: 1.55 }}>
          Formato de prova: cronômetro, navegação livre entre as questões e correção ao final.
        </p>
      </div>

      {isLoading && <p className="w-full max-w-3xl mx-auto" style={{ color: '#78716C' }}>Carregando simulados...</p>}
      {error && <p className="w-full max-w-3xl mx-auto" style={{ color: '#B91C1C' }}>{error}</p>}
      {!isLoading && !error && simulations.length === 0 && (
        <p className="w-full max-w-3xl mx-auto" style={{ color: '#78716C' }}>
          Nenhum simulado de curso técnico publicado ainda.
        </p>
      )}

      <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
        {simulations.map((simulation) => (
          <div
            key={simulation.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-5"
            style={{ background: '#FEFDFB', border: '1px solid #E7E5E4', borderRadius: 6 }}
          >
            <div className="flex-1">
              <div style={{ fontSize: 12, color: '#0E7490', fontWeight: 600, marginBottom: 4 }}>
                {simulation.discipline.name}
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1C1917', letterSpacing: '-0.01em' }}>
                {simulation.title}
              </div>
              {simulation.subtitle && (
                <p style={{ fontSize: 14, color: '#57534E', marginTop: 4, lineHeight: 1.5 }}>
                  {simulation.subtitle}
                </p>
              )}
              <div className="flex gap-4 mt-3" style={{ fontSize: 12, color: '#A8A29E' }}>
                <span>{simulation.totalQuestions} questões</span>
                {simulation.estimatedDurationMinutes && <span>{simulation.estimatedDurationMinutes} min</span>}
                <span>{simulation.maxScore} pontos</span>
              </div>
            </div>
            <button
              onClick={() => router.push(`/simulado/${simulation.id}`)}
              style={{
                background: '#0E7490', color: 'white', border: 'none', borderRadius: 3,
                padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                whiteSpace: 'nowrap', alignSelf: 'flex-start',
              }}
            >
              Iniciar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
