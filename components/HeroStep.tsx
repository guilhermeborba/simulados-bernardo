'use client';

import SeloDiasSeguidos from './SeloDiasSeguidos';
import MascoteGuia from './MascoteGuia';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface HeroStepProps {
  onStart: () => void;
}

const DESTAQUES = [
  {
    emoji: '✅',
    titulo: 'Feedback na hora',
    texto: 'Você vê o resultado assim que responde.',
    cor: 'var(--grass-deep)',
    fundo: 'rgba(91,214,138,.16)',
  },
  {
    emoji: '💡',
    titulo: 'Dicas em cada questão',
    texto: 'Uma pista pra te ajudar quando travar.',
    cor: '#8B6000',
    fundo: 'rgba(255,214,107,.28)',
  },
  {
    emoji: '🏆',
    titulo: 'Ranking da turma',
    texto: 'Veja como você está em relação aos colegas.',
    cor: 'var(--lilac-deep)',
    fundo: 'rgba(183,157,255,.22)',
  },
];

export default function HeroStep({ onStart }: HeroStepProps) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="page-shell flex flex-col px-4 py-6 md:py-8">

      {/* Header decorativo */}
      <div className="flex justify-between items-center mb-6 w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span className="font-bold text-base" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
            Simulados Bernardo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            01 · SPLASH
          </span>
          <SeloDiasSeguidos />
          {!isLoading && user && (
            <>
              <Link
                href="/ranking"
                className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-sm"
                style={{ background: 'var(--cream)', color: 'var(--ink)', boxShadow: 'var(--shadow-1)' }}
              >
                <span>🏆</span>
                <span className="hidden sm:inline">Pontuação</span>
              </Link>
              <Link
                href="/historico"
                className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-sm"
                style={{ background: 'var(--cream)', color: 'var(--ink)', boxShadow: 'var(--shadow-1)' }}
              >
                <span>📊</span>
                <span>Histórico</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-sm"
                style={{ background: 'var(--cream)', color: 'var(--ink)', boxShadow: 'var(--shadow-1)', border: 'none', cursor: 'pointer' }}
              >
                Sair
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
      {/* Card branco principal */}
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] p-8 md:p-12"
           style={{ boxShadow: 'var(--shadow-3)' }}>

        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

          {/* Texto — esquerda no desktop */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold mb-6"
                 style={{ background: 'rgba(91,214,138,.15)', color: 'var(--grass-deep)' }}>
              + Plataforma educativa do 1º ano ao Ensino Médio
            </div>

            <h1 className="text-5xl md:text-6xl mb-4" style={{ lineHeight: 1.1 }}>
              Aprender é uma{' '}
              <span style={{ color: 'var(--bubble-deep, #E54F94)' }}>aventura.</span>
            </h1>

            <p className="text-base mb-8" style={{ color: 'var(--muted)', lineHeight: 1.6, maxWidth: 400 }}>
              Simulados divertidos com feedback instantâneo, conquistas e dicas que ajudam você a brilhar a cada questão.
            </p>

            {/* Botão */}
            <button className="btn btn--grass btn--lg w-full sm:w-auto" onClick={onStart}>
              ✦ Vamos começar!
            </button>

            {/* Destaques */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 pt-8 w-full"
                 style={{ borderTop: '1.5px solid var(--line)' }}>
              {DESTAQUES.map((destaque) => (
                <div
                  key={destaque.titulo}
                  className="flex flex-col items-center md:items-start gap-2 rounded-2xl p-4 text-center md:text-left"
                  style={{ background: 'white', border: '1.5px solid var(--line)', boxShadow: 'var(--shadow-1)' }}
                >
                  <span
                    className="flex items-center justify-center rounded-full text-lg"
                    style={{ width: 40, height: 40, background: destaque.fundo }}
                  >
                    {destaque.emoji}
                  </span>
                  <span className="text-sm font-extrabold leading-snug" style={{ color: destaque.cor }}>
                    {destaque.titulo}
                  </span>
                  <span className="text-xs leading-snug" style={{ color: 'var(--muted)' }}>
                    {destaque.texto}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mascote — direita no desktop */}
          <div className="flex-shrink-0 relative">
            <MascoteGuia />
            {/* Badge topo direito */}
            <div className="absolute -top-3 -right-4 hidden md:flex items-center gap-2 bg-white rounded-2xl px-3 py-2 text-sm font-bold"
                 style={{ color: 'var(--sun-deep, #8B6000)', boxShadow: 'var(--shadow-2)', background: '#FFF8D6' }}>
              Vamos começar!
            </div>
          </div>

        </div>
      </div>
      </div>
    </div>
  );
}
