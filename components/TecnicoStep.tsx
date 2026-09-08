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

  const cursos = agruparPorCurso(simulations);

  return (
    // data-tier reaproveita a camada de tokens da faixa de exame, para que a
    // listagem fale a mesma língua visual do simulado que ela abre.
    <div
      data-tier="exame"
      className="page-shell flex flex-col px-4 py-6 md:py-8"
      // --font-plex só é declarado na rota do simulado; aqui a fonte precisa de
      // um fallback próprio, senão a regra é inválida e herda a fonte do app.
      style={{
        background: 'var(--t-ground)',
        fontFamily: 'var(--font-plex, ui-sans-serif), system-ui, sans-serif',
      }}
    >
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
        <h2 style={{ fontFamily: 'inherit', fontSize: 28, fontWeight: 600, color: 'var(--t-ink)', letterSpacing: '-0.02em' }}>
          Simulados disponíveis
        </h2>
        <p style={{ color: '#57534E', marginTop: 6, fontSize: 15, lineHeight: 1.55 }}>
          Curso técnico não tem bimestre: os simulados são organizados por curso
          e eixo temático. Formato de prova, com cronômetro, navegação livre
          entre as questões e correção ao final.
        </p>
      </div>

      {isLoading && <p className="w-full max-w-3xl mx-auto" style={{ color: '#78716C' }}>Carregando simulados...</p>}
      {error && <p className="w-full max-w-3xl mx-auto" style={{ color: '#B91C1C' }}>{error}</p>}
      {!isLoading && !error && simulations.length === 0 && (
        <p className="w-full max-w-3xl mx-auto" style={{ color: '#78716C' }}>
          Nenhum simulado de curso técnico publicado ainda.
        </p>
      )}

      <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
        {cursos.map((curso) => (
          <section key={curso.slug}>
            <header
              className="flex items-baseline justify-between pb-2 mb-3"
              style={{ borderBottom: '1px solid #E7E5E4' }}
            >
              <h3 style={{ fontFamily: 'inherit', fontSize: 18, fontWeight: 600, color: 'var(--t-ink)', letterSpacing: '-0.01em' }}>
                {curso.name}
              </h3>
              <span style={{ fontSize: 12, color: '#A8A29E' }}>
                {curso.simulacoes.length}{' '}
                {curso.simulacoes.length === 1 ? 'eixo temático' : 'eixos temáticos'}
              </span>
            </header>

            <div className="flex flex-col gap-3">
              {curso.simulacoes.map((simulacao) => (
                <div
                  key={simulacao.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-5"
                  style={{ background: '#FEFDFB', border: '1px solid #E7E5E4', borderRadius: 6 }}
                >
                  <div className="flex-1">
                    <div style={{ fontSize: 17, fontWeight: 600, color: '#1C1917', letterSpacing: '-0.01em' }}>
                      {simulacao.topic ?? simulacao.title}
                    </div>
                    {/* O subtítulo repetiria curso e número de questões, que já
                        aparecem no cabeçalho do curso e na linha de baixo. */}
                    <div className="flex gap-4 mt-3" style={{ fontSize: 12, color: '#A8A29E' }}>
                      <span>{simulacao.totalQuestions} questões</span>
                      {simulacao.estimatedDurationMinutes && (
                        <span>{simulacao.estimatedDurationMinutes} min</span>
                      )}
                      <span>{simulacao.maxScore} pontos</span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/simulado/${simulacao.id}`)}
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
          </section>
        ))}
      </div>

    </div>
  );
}

interface Curso {
  slug: string;
  name: string;
  simulacoes: ApiSimulation[];
}

/**
 * Curso técnico não tem ano nem bimestre: a hierarquia que o aluno enxerga é
 * curso (a disciplina, no modelo atual) e, dentro dele, o eixo temático.
 */
function agruparPorCurso(simulations: ApiSimulation[]): Curso[] {
  const porSlug = new Map<string, Curso>();

  simulations.forEach((simulacao) => {
    const { slug, name } = simulacao.discipline;
    const curso = porSlug.get(slug) ?? { slug, name, simulacoes: [] };
    curso.simulacoes.push(simulacao);
    porSlug.set(slug, curso);
  });

  return Array.from(porSlug.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
