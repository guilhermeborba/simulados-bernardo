'use client';

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
    emoji: '⭐',
    titulo: 'Conquistas e moedas',
    texto: 'Junte moedinhas a cada acerto.',
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
          <div className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-sm"
               style={{ background: '#FFF8D6', color: '#8B6000', boxShadow: 'var(--shadow-1)' }}>
            <span className="text-base">7</span>
            <span>Dias seguidos</span>
          </div>
          {!isLoading && user && (
            <>
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
              + Plataforma educativa do 1º ao 9º ano
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
            <HeroMascot />
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

function HeroMascot() {
  return (
    <svg width="220" height="240" viewBox="0 0 160 175" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hm-book-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7EC8F8"/>
          <stop offset="1" stopColor="#3A8FD8"/>
        </linearGradient>
        <linearGradient id="hm-page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF8EE"/>
          <stop offset="1" stopColor="#F0E6D0"/>
        </linearGradient>
        <linearGradient id="hm-bookmark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE566"/>
          <stop offset="1" stopColor="#FFB800"/>
        </linearGradient>
      </defs>

      {/* Sombra */}
      <ellipse cx="80" cy="165" rx="46" ry="8" fill="#2B2240" opacity=".10"/>

      {/* Corpo do livro (retângulo arredondado) */}
      <rect x="22" y="28" width="116" height="128" rx="20" fill="url(#hm-book-body)"/>

      {/* Detalhe borda esquerda do livro */}
      <rect x="22" y="28" width="14" height="128" rx="10" fill="#3A8FD8" opacity=".5"/>

      {/* Páginas abertas (branco) */}
      <rect x="40" y="44" width="82" height="96" rx="10" fill="url(#hm-page)"/>

      {/* Linhas de texto decorativas */}
      <rect x="50" y="88" width="62" height="5" rx="3" fill="#DDD0BE" opacity=".8"/>
      <rect x="50" y="100" width="50" height="5" rx="3" fill="#DDD0BE" opacity=".8"/>
      <rect x="50" y="112" width="56" height="5" rx="3" fill="#DDD0BE" opacity=".8"/>
      <rect x="50" y="124" width="40" height="5" rx="3" fill="#DDD0BE" opacity=".6"/>

      {/* Olhos */}
      <circle cx="62" cy="66" r="11" fill="white"/>
      <circle cx="98" cy="66" r="11" fill="white"/>
      <circle cx="64" cy="67" r="6" fill="#2B2240"/>
      <circle cx="100" cy="67" r="6" fill="#2B2240"/>
      {/* Brilho olhos */}
      <circle cx="66" cy="64" r="2.5" fill="white"/>
      <circle cx="102" cy="64" r="2.5" fill="white"/>

      {/* Bochechas */}
      <circle cx="50" cy="78" r="7" fill="#FFB3CC" opacity=".5"/>
      <circle cx="110" cy="78" r="7" fill="#FFB3CC" opacity=".5"/>

      {/* Sorriso */}
      <path d="M66 78 Q80 90 94 78" stroke="#2B2240" strokeWidth="3.5" fill="none" strokeLinecap="round"/>

      {/* Capelo */}
      <rect x="50" y="14" width="60" height="10" rx="4" fill="#2B2240"/>
      <rect x="72" y="8" width="16" height="10" rx="3" fill="#2B2240"/>
      {/* Franja do capelo */}
      <line x1="110" y1="18" x2="120" y2="30" stroke="#FFB800" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="121" cy="32" r="4" fill="#FFD700"/>

      {/* Marcador de página */}
      <path d="M104 28 L104 50 L112 44 L120 50 L120 28 Z" fill="url(#hm-bookmark)"/>

      {/* Braços */}
      <rect x="0" y="80" width="26" height="14" rx="7" fill="#5AACE0"/>
      <rect x="134" y="80" width="26" height="14" rx="7" fill="#5AACE0"/>

      {/* Pernas */}
      <rect x="50" y="148" width="24" height="18" rx="9" fill="#3A8FD8"/>
      <rect x="86" y="148" width="24" height="18" rx="9" fill="#3A8FD8"/>
    </svg>
  );
}
