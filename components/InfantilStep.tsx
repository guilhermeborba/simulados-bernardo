'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAvailableSimulations, ApiSimulation } from '@/lib/apiClient';
import { INFANTIL_4_SCHOOL_YEAR, INFANTIL_5_SCHOOL_YEAR } from '@/lib/trilha';
import MascoteGuia from './MascoteGuia';

interface InfantilStepProps {
  onBack: () => void;
}

const IDADES = [
  { label: '4 anos', schoolYear: INFANTIL_4_SCHOOL_YEAR },
  { label: '5 anos', schoolYear: INFANTIL_5_SCHOOL_YEAR },
] as const;

/**
 * Listagem dos simulados de Educação Infantil, agrupados por campo de
 * experiência (a disciplina, no modelo atual) — não existe bimestre nem
 * avaliação aqui, então a navegação é toda por idade + campo.
 */
export default function InfantilStep({ onBack }: InfantilStepProps) {
  const router = useRouter();
  const [idade, setIdade] = useState<number>(INFANTIL_4_SCHOOL_YEAR);
  const [simulations, setSimulations] = useState<ApiSimulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    getAvailableSimulations({ schoolYear: idade })
      .then(setSimulations)
      .catch(() => setError('Não foi possível carregar os simulados.'))
      .finally(() => setIsLoading(false));
  }, [idade]);

  const campos = agruparPorCampo(simulations);

  return (
    <div className="page-shell flex flex-col px-4 py-6 md:py-8">
      <div className="w-full max-w-3xl mx-auto flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, padding: 0 }}
        >
          ‹ Trocar de trilha
        </button>
        <span
          className="rounded-full px-3 py-1 text-xs font-extrabold"
          style={{ background: 'rgba(183,157,255,.22)', color: 'var(--lilac-deep)' }}
        >
          Educação Infantil
        </span>
      </div>

      <div className="w-full max-w-3xl mx-auto mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
            Por qual campo vamos começar?
          </h2>
          <p className="mt-1" style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.55, maxWidth: 480 }}>
            Aqui não tem bimestre nem prova: você escolhe um campo de experiência e brinca de aprender, com calma e um adulto por perto.
          </p>
        </div>

        <div className="flex gap-2 self-start">
          {IDADES.map((opcao) => (
            <button
              key={opcao.schoolYear}
              onClick={() => setIdade(opcao.schoolYear)}
              className="rounded-full px-4 py-2 text-sm font-bold"
              style={
                idade === opcao.schoolYear
                  ? { background: 'var(--lilac-deep)', color: 'white', border: 'none', cursor: 'pointer' }
                  : { background: 'white', color: 'var(--muted)', border: '1.5px solid var(--line)', cursor: 'pointer' }
              }
            >
              {opcao.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="w-full max-w-3xl mx-auto" style={{ color: 'var(--muted)' }}>Carregando simulados...</p>}
      {error && <p className="w-full max-w-3xl mx-auto" style={{ color: 'var(--bubble-deep)' }}>{error}</p>}
      {!isLoading && !error && campos.length === 0 && (
        <div className="w-full max-w-3xl mx-auto flex items-center gap-4 rounded-2xl p-6" style={{ background: 'white', border: '1.5px dashed var(--line)' }}>
          <MascoteGuia size={72} />
          <p style={{ color: 'var(--muted)' }}>Nenhum simulado publicado ainda para essa idade.</p>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        {campos.map((campo) => (
          <section key={campo.slug}>
            <header className="flex items-baseline justify-between pb-2 mb-3" style={{ borderBottom: '1.5px solid var(--line)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                {campo.icon} {campo.name}
              </h3>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {campo.simulacoes.length} {campo.simulacoes.length === 1 ? 'tema' : 'temas'}
              </span>
            </header>

            <div className="flex flex-col gap-3">
              {campo.simulacoes.map((simulacao) => (
                <div
                  key={simulacao.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl"
                  style={{ background: 'white', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-1)' }}
                >
                  <div className="flex-1">
                    <div className="font-bold" style={{ fontSize: 17, color: 'var(--ink)' }}>
                      {simulacao.topic ?? simulacao.title}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                      <span>{simulacao.totalQuestions} perguntas</span>
                      {simulacao.estimatedDurationMinutes && <span>{simulacao.estimatedDurationMinutes} min</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/simulado/${simulacao.id}`)}
                    className="rounded-full px-5 py-2.5 text-sm self-start"
                    style={{
                      background: 'linear-gradient(180deg,#DCD0FF,#B79DFF 55%,#8B6DE0)',
                      color: 'white',
                      fontFamily: 'var(--font-fredoka)',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 3px 0 rgba(43,34,64,.14)',
                    }}
                  >
                    ✦ Vamos brincar!
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

interface Campo {
  slug: string;
  name: string;
  icon: string | null;
  simulacoes: ApiSimulation[];
}

/**
 * Educação Infantil não tem ano nem bimestre: a hierarquia que o adulto
 * enxerga é campo de experiência (a disciplina, no modelo atual) e, dentro
 * dele, o tema específico (o eixo temático, "topic").
 */
function agruparPorCampo(simulations: ApiSimulation[]): Campo[] {
  const porSlug = new Map<string, Campo>();

  simulations.forEach((simulacao) => {
    const { slug, name, icon } = simulacao.discipline;
    const campo = porSlug.get(slug) ?? { slug, name, icon, simulacoes: [] };
    campo.simulacoes.push(simulacao);
    porSlug.set(slug, campo);
  });

  return Array.from(porSlug.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
