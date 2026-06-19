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
  desc: string;
  illustration: string; // SVG inline or large emoji
  cardBg: string;
  btnColor: string;
  btnShadow: string;
  stars: number; // 1-3 decorativo
  routes: Partial<Record<string, string>>;
}

const DISCIPLINES: Discipline[] = [
  {
    id: 'portugues',
    label: 'Português',
    desc: 'Fonética, gramática, ortografia, substantivos e verbos em 30 questões.',
    illustration: '📖',
    cardBg: '#FFF3D6',
    btnColor: '#E54F94',
    btnShadow: '#C03070',
    stars: 3,
    routes: {
      '1-AV2': '/simulado-portugues',
      '2-AV2': '/simulado-portugues-av2',
    },
  },
  {
    id: 'matematica',
    label: 'Matemática',
    desc: 'Aritmética, geometria e lógica com problemas personalizados.',
    illustration: '🧮',
    cardBg: '#D6EEFF',
    btnColor: '#4A95E5',
    btnShadow: '#2B6FBF',
    stars: 2,
    routes: {
      '1-AV2': '/simulado-matematica',
      '2-AV1': '/simulado-matematica-av1',
      '2-AV2': '/simulado-matematica-av2',
    },
  },
  {
    id: 'ciencias',
    label: 'Ciências',
    desc: 'Seres vivos, corpo humano, meio ambiente e ecologia — 30 desafios.',
    illustration: '🔬',
    cardBg: '#D6F5E6',
    btnColor: '#2FB867',
    btnShadow: '#1A8A47',
    stars: 1,
    routes: {
      '1-AV2': '/simulado-ciencias',
      '2-AV1': '/simulado-ciencias-av1',
      '2-AV2': '/simulado-ciencias-av2',
    },
  },
  {
    id: 'historia',
    label: 'História',
    desc: 'Fatos históricos, cultura e sociedade em 30 questões.',
    illustration: '🏛️',
    cardBg: '#FFF8D6',
    btnColor: '#F5B91E',
    btnShadow: '#B88800',
    stars: 2,
    routes: {
      '1-AV2': '/simulado-historia',
      '2-AV1': '/simulado-historia-av1',
      '2-AV2': '/simulado-historia-av2',
    },
  },
  {
    id: 'geografia',
    label: 'Geografia',
    desc: 'Mapas, regiões, clima e espaço geográfico.',
    illustration: '🌎',
    cardBg: '#EDE8FF',
    btnColor: '#8B6DE0',
    btnShadow: '#5A3BAA',
    stars: 2,
    routes: {
      '1-AV2': '/simulado-geografia',
      '2-AV1': '/simulado-geografia-av1',
      '2-AV2': '/simulado-geografia-av2',
    },
  },
];

const YEAR_LABELS: Record<string, string> = {
  primeiro: '1º Ano', segundo: '2º Ano', terceiro: '3º Ano', quarto: '4º Ano',
  quinto: '5º Ano', sexto: '6º Ano', setimo: '7º Ano', oitavo: '8º Ano', nono: '9º Ano',
};
const BIM_LABELS: Record<string, string> = {
  '1': '1º Bim', '2': '2º Bim', '3': '3º Bim', '4': '4º Bim',
};

function Stars({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ fontSize: 20, opacity: i <= count ? 1 : 0.3 }}>⭐</span>
      ))}
    </div>
  );
}

export default function DisciplineStep({ year, bimestre, assessment, onBack }: DisciplineStepProps) {
  const router = useRouter();
  const key = `${bimestre}-${assessment}`;
  const available = DISCIPLINES.filter((d) => !!d.routes[key]);

  const handleStart = (disc: Discipline) => {
    const route = disc.routes[key];
    if (route) router.push(route);
  };

  return (
    <div className="page-shell flex flex-col px-4 py-6 md:py-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 w-full max-w-5xl mx-auto">
        <button className="btn btn--ghost text-sm flex items-center gap-1" onClick={onBack}
                style={{ padding: '8px 16px' }}>
          ‹ Voltar
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <span className="font-bold text-base" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
            Simulados Bernardo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest hidden sm:block" style={{ color: 'var(--muted)' }}>
            03 · DISCIPLINAS
          </span>
          <div className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-sm"
               style={{ background: '#FFF8D6', color: '#8B6000', boxShadow: 'var(--shadow-1)' }}>
            <span>7</span>
            <span>Dias seguidos</span>
          </div>
        </div>
      </div>

      {/* Título + contexto */}
      <div className="w-full max-w-5xl mx-auto mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 style={{ fontFamily: 'var(--font-fredoka)', fontSize: 38, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>
            Escolha uma disciplina
          </h2>
          <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: 15 }}>
            Cada simulado tem 30 questões e vale até 30 moedinhas. Vamos lá?
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold flex-shrink-0"
             style={{ background: 'white', border: '1.5px solid var(--line)', color: 'var(--ink)', boxShadow: 'var(--shadow-1)' }}>
          <span style={{ color: 'var(--grass-deep)' }}>✦</span>
          {YEAR_LABELS[year] ?? year} · {BIM_LABELS[bimestre] ?? bimestre} · {assessment}
        </div>
      </div>

      {/* Grid */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {available.map((disc) => (
          <div
            key={disc.id}
            style={{
              background: disc.cardBg,
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: '28px 24px 20px',
            }}
          >
            {/* Ilustração */}
            <div style={{
              fontSize: 72,
              lineHeight: 1,
              textAlign: 'center',
              marginBottom: 24,
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,.12))',
            }}>
              {disc.illustration}
            </div>

            {/* Stars */}
            <Stars count={disc.stars} />

            {/* Título */}
            <div style={{ fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 28, color: 'var(--ink)', marginBottom: 8 }}>
              {disc.label}
            </div>

            {/* Descrição */}
            <p style={{ fontSize: 14, color: 'var(--ink)', opacity: 0.7, lineHeight: 1.5, marginBottom: 20, flex: 1 }}>
              {disc.desc}
            </p>

            {/* Botão Começar */}
            <button
              onClick={() => handleStart(disc)}
              style={{
                background: disc.btnColor,
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '13px 24px',
                fontFamily: 'var(--font-fredoka)',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: `0 4px 0 ${disc.btnShadow}, 0 8px 20px -6px ${disc.btnColor}80`,
                transition: 'transform .1s, box-shadow .1s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20,
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              onMouseDown={e => (e.currentTarget.style.transform = 'translateY(1px)')}
            >
              ▶ Começar
            </button>

            {/* Footer stats */}
            <div style={{
              borderTop: '1.5px dashed rgba(43,34,64,.15)',
              paddingTop: 14,
              display: 'flex',
              gap: 12,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink)',
              opacity: 0.6,
            }}>
              <span>📋 30 questões</span>
              <span>⏰ ~45 min</span>
              <span>⚡ 30 moedinhas</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
