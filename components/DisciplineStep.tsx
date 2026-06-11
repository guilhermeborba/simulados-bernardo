// components/DisciplineStep.tsx
'use client';

import { useRouter } from 'next/navigation';
import type { Year, Bimestre, Assessment } from './SelectionStep';

interface DisciplineStepProps {
  year: Year;
  bimestre: Bimestre;
  assessment: Assessment;
  onBack: () => void;
}

interface Discipline {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  barColor: string;
  iconBg: string;
  btnClass: string;
  routes: Partial<Record<string, string>>;
}

const DISCIPLINES: Discipline[] = [
  {
    id: 'portugues',
    label: 'Português',
    emoji: '📖',
    desc: 'Interpretação, gramática e produção de texto',
    barColor: 'linear-gradient(90deg,#FF7AB6,#E54F94)',
    iconBg: '#FFE0EE',
    btnClass: 'btn--bubble',
    routes: {
      '1-AV2': '/simulado-portugues',
      '2-AV2': '/simulado-portugues-av2',
    },
  },
  {
    id: 'matematica',
    label: 'Matemática',
    emoji: '🔢',
    desc: 'Operações, geometria e resolução de problemas',
    barColor: 'linear-gradient(90deg,#7AB8F5,#4A95E5)',
    iconBg: '#E0EEFF',
    btnClass: 'btn--sky',
    routes: {
      '1-AV2': '/simulado-matematica',
      '2-AV1': '/simulado-matematica-av1',
      '2-AV2': '/simulado-matematica-av2',
    },
  },
  {
    id: 'ciencias',
    label: 'Ciências',
    emoji: '🔬',
    desc: 'Natureza, corpo humano e meio ambiente',
    barColor: 'linear-gradient(90deg,#5BD68A,#2FB867)',
    iconBg: '#E0FFF0',
    btnClass: 'btn--grass',
    routes: {
      '1-AV2': '/simulado-ciencias',
      '2-AV1': '/simulado-ciencias-av1',
      '2-AV2': '/simulado-ciencias-av2',
    },
  },
  {
    id: 'historia',
    label: 'História',
    emoji: '🏛️',
    desc: 'Fatos históricos, cultura e sociedade',
    barColor: 'linear-gradient(90deg,#FFD66B,#F5B91E)',
    iconBg: '#FFF8D6',
    btnClass: 'btn--sun',
    routes: {
      '1-AV2': '/simulado-historia',
      '2-AV1': '/simulado-historia-av1',
      '2-AV2': '/simulado-historia-av2',
    },
  },
  {
    id: 'geografia',
    label: 'Geografia',
    emoji: '🌎',
    desc: 'Mapas, regiões, clima e espaço geográfico',
    barColor: 'linear-gradient(90deg,#B79DFF,#8B6DE0)',
    iconBg: '#EEE8FF',
    btnClass: 'btn--lilac',
    routes: {
      '1-AV2': '/simulado-geografia',
      '2-AV1': '/simulado-geografia-av1',
      '2-AV2': '/simulado-geografia-av2',
    },
  },
];

export default function DisciplineStep({ year, bimestre, assessment, onBack }: DisciplineStepProps) {
  const router = useRouter();
  const key = `${bimestre}-${assessment}`;

  const available = DISCIPLINES.filter((d) => !!d.routes[key]);

  const handleStart = (disc: Discipline) => {
    const route = disc.routes[key];
    if (route) router.push(route);
  };

  const yearLabel: Record<string, string> = {
    terceiro: '3º Ano',
  };

  const bimestreLabel: Record<string, string> = {
    '1': '1º Bimestre',
    '2': '2º Bimestre',
  };

  return (
    <div className="page-shell">
      <div className="max-w-4xl mx-auto">
        {/* Navbar */}
        <div className="flex justify-between items-center mb-8">
          <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
            📚 Simulados Bernardo
          </span>
          <button className="btn btn--ghost text-sm" onClick={onBack}>
            ← Mudar seleção
          </button>
        </div>

        {/* Progress dots — all done */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              width: 28, height: 8, borderRadius: 999,
              background: i < 3 ? 'var(--lilac)' : 'var(--grass)',
            }} />
          ))}
        </div>

        {/* Context pill */}
        <div className="badge mb-6">
          📅 {yearLabel[year] ?? year} &nbsp;·&nbsp; {bimestreLabel[bimestre] ?? `${bimestre}º Bim`} &nbsp;·&nbsp; ✅ {assessment}
        </div>

        <h2 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
          Escolha uma disciplina
        </h2>
        <p className="mb-8" style={{ color: 'var(--muted)' }}>
          {available.length} simulado{available.length !== 1 ? 's' : ''} disponível{available.length !== 1 ? 'is' : ''} para essa seleção
        </p>

        {/* Grid de disciplinas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {available.map((disc) => (
            <div
              key={disc.id}
              style={{
                background: 'var(--paper)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-2)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Barra colorida no topo */}
              <div style={{ height: 5, background: disc.barColor }} />

              <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {/* Ícone */}
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: disc.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  {disc.emoji}
                </div>

                {/* Texto */}
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-nunito)', color: 'var(--ink)' }}>
                    {disc.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>
                    {disc.desc}
                  </div>
                </div>

                {/* Botão */}
                <button
                  className={`btn ${disc.btnClass} mt-auto`}
                  style={{ fontSize: 13, padding: '8px 18px', alignSelf: 'flex-start' }}
                  onClick={() => handleStart(disc)}
                >
                  Começar →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
