'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Year, Bimestre, Assessment } from './SelectionStep';
import { YEAR_TO_SCHOOL_YEAR, YEAR_LABELS } from './SelectionStep';
import { getAvailableSimulations, ApiSimulation } from '@/lib/apiClient';

interface DisciplineStepProps {
  year: Year;
  bimestre: Bimestre;
  assessment: Assessment;
  onBack: () => void;
}

const BIM_LABELS: Record<string, string> = {
  '1': '1º Bimestre', '2': '2º Bimestre', '3': '3º Bimestre', '4': '4º Bimestre',
};

export default function DisciplineStep({ year, bimestre, assessment, onBack }: DisciplineStepProps) {
  const router = useRouter();
  const [simulations, setSimulations] = useState<ApiSimulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const schoolYear = YEAR_TO_SCHOOL_YEAR[year];

    if (!schoolYear || !bimestre) {
      return;
    }

    setIsLoading(true);
    setError(null);

    getAvailableSimulations({ schoolYear, bimester: Number(bimestre), assessment })
      .then(setSimulations)
      .catch(() => setError('Não foi possível carregar as disciplinas.'))
      .finally(() => setIsLoading(false));
  }, [year, bimestre, assessment]);

  const handleStart = (simulation: ApiSimulation) => {
    router.push(`/simulado/${simulation.id}`);
  };

  return (
    <div className="page-shell flex flex-col px-4 py-6 md:py-8">
      <div className="flex justify-between items-center mb-6 w-full max-w-5xl mx-auto">
        <button className="btn btn--ghost text-sm flex items-center gap-1" onClick={onBack} style={{ padding: '8px 16px' }}>
          ‹ Voltar
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <span className="font-bold text-base" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
            Simulados Bernardo
          </span>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest hidden sm:block" style={{ color: 'var(--muted)' }}>
          03 · DISCIPLINAS
        </span>
      </div>

      <div className="w-full max-w-5xl mx-auto mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 style={{ fontFamily: 'var(--font-fredoka)', fontSize: 38, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>
            Escolha uma disciplina
          </h2>
          <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 15 }}>
            Selecione o simulado que você quer praticar.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold flex-shrink-0"
             style={{ background: 'white', border: '1.5px solid var(--line)', color: 'var(--ink)', boxShadow: 'var(--shadow-1)' }}>
          <span style={{ color: 'var(--grass-deep)' }}>✦</span>
          {YEAR_LABELS[year] ?? year} · {BIM_LABELS[bimestre] ?? bimestre} · {assessment}
        </div>
      </div>

      {isLoading && <p className="text-center" style={{ color: 'var(--muted)' }}>Carregando disciplinas...</p>}
      {error && <p className="text-center" style={{ color: 'var(--bubble-deep)' }}>{error}</p>}
      {!isLoading && !error && simulations.length === 0 && (
        <div className="text-center" style={{ color: 'var(--muted)' }}>
          <p>Nenhum simulado disponível para essa combinação ainda.</p>
          {/* Alguns simulados são de turma: sem essa dica, quem tem o link do
              convite no bolso não faz ideia de que precisa abri-lo. */}
          <p className="text-sm mt-2">
            Recebeu um link de convite de turma? Abra o link para liberar os
            simulados dela.
          </p>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {simulations.map((simulation) => {
          const accent = simulation.discipline.themeColor ?? '#4A95E5';
          return (
            <div key={simulation.id} style={{
              background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-2)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '28px 24px 20px',
            }}>
              <div style={{ fontSize: 56, lineHeight: 1, textAlign: 'center', marginBottom: 20 }}>
                {simulation.discipline.icon ?? '📘'}
              </div>
              <div style={{ fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 26, color: 'var(--ink)', marginBottom: 8 }}>
                {simulation.discipline.name}
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink)', opacity: 0.7, lineHeight: 1.5, marginBottom: 20, flex: 1 }}>
                {simulation.subtitle ?? simulation.title}
              </p>
              <button
                onClick={() => handleStart(simulation)}
                style={{
                  background: accent, color: 'white', border: 'none', borderRadius: 'var(--radius-pill)',
                  padding: '13px 24px', fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 16,
                  cursor: 'pointer', marginBottom: 20,
                }}
              >
                ▶ Começar
              </button>
              <div style={{
                borderTop: '1.5px dashed rgba(43,34,64,.15)', paddingTop: 14, display: 'flex', gap: 12,
                fontSize: 12, fontWeight: 600, color: 'var(--ink)', opacity: 0.6,
              }}>
                <span>📋 {simulation.totalQuestions} questões</span>
                {simulation.estimatedDurationMinutes && <span>⏰ ~{simulation.estimatedDurationMinutes} min</span>}
                <span>⚡ {simulation.maxScore} moedinhas</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
