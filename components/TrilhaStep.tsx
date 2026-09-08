'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAvailableSimulations, ApiSimulation } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { TECNICO_SCHOOL_YEAR, Trilha } from '@/lib/trilha';

interface TrilhaStepProps {
  onEscolher: (trilha: Trilha) => void;
}

/**
 * Porta de entrada da plataforma.
 *
 * A moldura é neutra; cada porta carrega a linguagem visual da trilha que
 * existe atrás dela, para que a escolha já diga para quem aquilo é e a
 * transição seguinte não seja um susto.
 */
export default function TrilhaStep({ onEscolher }: TrilhaStepProps) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [tecnicos, setTecnicos] = useState<ApiSimulation[] | null>(null);

  useEffect(() => {
    // Só para mostrar o que existe de verdade atrás da porta de técnicos.
    getAvailableSimulations({ schoolYear: TECNICO_SCHOOL_YEAR })
      .then(setTecnicos)
      .catch(() => setTecnicos([]));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="page-shell flex flex-col px-4 py-6 md:py-8">
      <div className="flex justify-between items-center mb-8 w-full max-w-4xl mx-auto gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span className="font-bold text-base" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
            Simulados Bernardo
          </span>
        </div>
        {!isLoading && user && (
          <div className="flex items-center gap-2">
            <Link
              href="/historico"
              className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-sm"
              style={{ background: 'var(--cream)', color: 'var(--ink)', boxShadow: 'var(--shadow-1)' }}
            >
              <span>📊</span>
              <span className="hidden sm:inline">Histórico</span>
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full px-4 py-2 font-bold text-sm"
              style={{ background: 'var(--cream)', color: 'var(--ink)', boxShadow: 'var(--shadow-1)', border: 'none', cursor: 'pointer' }}
            >
              Sair
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center w-full max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl text-center mb-2">Por onde você quer estudar?</h1>
        <p className="text-center mb-8" style={{ color: 'var(--muted)' }}>
          Escolha uma trilha. Dá para trocar quando quiser.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Porta 1 — Educação Básica, com a linguagem lúdica */}
          <button
            onClick={() => onEscolher('basica')}
            className="relative overflow-hidden text-left rounded-[1.75rem] p-6 flex flex-col gap-3"
            style={{
              background: 'white',
              border: '2px solid #FFD9E9',
              boxShadow: 'var(--shadow-2)',
              cursor: 'pointer',
            }}
          >
            <span
              className="self-start rounded-full px-3 py-1 text-xs font-extrabold"
              style={{ background: 'rgba(91,214,138,.16)', color: 'var(--grass-deep)' }}
            >
              Infantil ao Ensino Médio
            </span>
            <span className="text-2xl" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
              Educação Básica
            </span>
            <span className="text-sm" style={{ color: 'var(--muted)', lineHeight: 1.5, maxWidth: 280 }}>
              Português, Matemática, Ciências, História e Geografia, organizados por bimestre e avaliação.
            </span>
            <span
              className="self-start mt-1 rounded-full px-5 py-2.5 text-sm"
              style={{
                background: 'linear-gradient(180deg,#A6F1B8,#5BD68A 55%,#2FB867)',
                color: 'white',
                fontFamily: 'var(--font-fredoka)',
                fontWeight: 700,
                boxShadow: '0 3px 0 rgba(43,34,64,.14)',
              }}
            >
              ✦ Vamos começar!
            </span>
            <MascoteMini />
          </button>

          {/* Porta 2 — Cursos Técnicos, com o registro de prova */}
          <button
            onClick={() => onEscolher('tecnico')}
            className="text-left rounded p-6 flex flex-col gap-3"
            style={{
              background: '#FEFDFB',
              border: '1px solid #E7E5E4',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <span
              className="self-start px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: '#F0FDFA', color: '#0E7490', border: '1px solid #CCF0EA', borderRadius: 3 }}
            >
              Curso Técnico
            </span>
            <span className="text-xl font-semibold" style={{ color: '#1C1917', letterSpacing: '-0.01em' }}>
              Cursos Técnicos
            </span>
            <span className="text-sm" style={{ color: '#57534E', lineHeight: 1.55, maxWidth: 300 }}>
              Simulados no formato de prova, com cronômetro e navegação livre entre as questões.
            </span>

            {tecnicos !== null && tecnicos.length === 0 && (
              <span className="text-sm mt-1" style={{ color: '#A8A29E' }}>
                Nenhum simulado publicado ainda.
              </span>
            )}

            {tecnicos !== null && tecnicos.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                {tecnicos.map((simulacao) => (
                  <div
                    key={simulacao.id}
                    className="flex justify-between items-center pt-1.5 text-sm"
                    style={{ borderTop: '1px solid #F0EEEB', color: '#292524' }}
                  >
                    <span>{simulacao.discipline.name}</span>
                    <span className="text-xs" style={{ color: '#A8A29E' }}>
                      {simulacao.totalQuestions} questões
                    </span>
                  </div>
                ))}
              </div>
            )}

            <span
              className="self-start mt-2 px-4 py-2 text-sm font-medium"
              style={{ background: '#0E7490', color: 'white', borderRadius: 3 }}
            >
              Ver simulados
            </span>
          </button>

          {/* Porta futura — sinaliza o rumo sem prometer data */}
          <div
            className="md:col-span-2 flex items-center justify-between gap-3 rounded-2xl px-5 py-4"
            style={{ border: '1.5px dashed var(--line)', background: 'rgba(255,255,255,.5)' }}
          >
            <div>
              <div className="font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--muted)' }}>
                Monte seu simulado
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                Escolher as matérias e quantas questões você quer treinar
              </div>
            </div>
            <span
              className="text-[10px] uppercase tracking-wider font-semibold rounded-full px-3 py-1 whitespace-nowrap"
              style={{ color: 'var(--muted)', border: '1px solid var(--line)' }}
            >
              Depois
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MascoteMini() {
  return (
    <svg
      width="78"
      height="86"
      viewBox="0 0 160 175"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ position: 'absolute', right: -6, bottom: -12, opacity: 0.95 }}
    >
      <ellipse cx="80" cy="165" rx="46" ry="8" fill="#2B2240" opacity=".10" />
      <rect x="22" y="28" width="116" height="128" rx="20" fill="#5FB2EC" />
      <rect x="22" y="28" width="14" height="128" rx="10" fill="#3A8FD8" opacity=".5" />
      <rect x="40" y="44" width="82" height="96" rx="10" fill="#FFF8EE" />
      <rect x="50" y="88" width="62" height="5" rx="3" fill="#DDD0BE" />
      <rect x="50" y="100" width="50" height="5" rx="3" fill="#DDD0BE" />
      <circle cx="62" cy="66" r="11" fill="white" />
      <circle cx="98" cy="66" r="11" fill="white" />
      <circle cx="64" cy="67" r="6" fill="#2B2240" />
      <circle cx="100" cy="67" r="6" fill="#2B2240" />
      <circle cx="50" cy="78" r="7" fill="#FFB3CC" opacity=".5" />
      <circle cx="110" cy="78" r="7" fill="#FFB3CC" opacity=".5" />
      <path d="M66 78 Q80 90 94 78" stroke="#2B2240" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <rect x="50" y="14" width="60" height="10" rx="4" fill="#2B2240" />
      <rect x="72" y="8" width="16" height="10" rx="3" fill="#2B2240" />
      <rect x="50" y="148" width="24" height="18" rx="9" fill="#3A8FD8" />
      <rect x="86" y="148" width="24" height="18" rx="9" fill="#3A8FD8" />
    </svg>
  );
}
