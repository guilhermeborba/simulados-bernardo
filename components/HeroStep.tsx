// components/HeroStep.tsx
'use client';

interface HeroStepProps {
  onStart: () => void;
}

export default function HeroStep({ onStart }: HeroStepProps) {
  return (
    <div className="page-shell flex items-center justify-center">
      {/* Mobile: coluna única | Desktop: duas colunas */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12 md:gap-20">

        {/* Texto — esquerda no desktop */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="badge mb-6">🎯 Plataforma de simulados</div>

          <h1 className="text-5xl md:text-6xl mb-4" style={{ lineHeight: 1.1 }}>
            Aprender é uma{' '}
            <span style={{ color: 'var(--sky-deep)' }}>aventura!</span>
          </h1>

          <p className="text-lg mb-8" style={{ color: 'var(--muted)', lineHeight: 1.6, maxWidth: 420 }}>
            Simulados interativos com correção automática, dicas pedagógicas e
            acompanhamento de desempenho. Feito pra você arrasar nas provas! 🚀
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <button className="btn btn--grass btn--lg w-full sm:w-auto text-lg" onClick={onStart}>
              ✨ Começar agora
            </button>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 mt-10 pt-8 w-full justify-center md:justify-start"
               style={{ borderTop: '1.5px solid var(--line)' }}>
            <div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>5</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>Disciplinas</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>12+</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>Simulados</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>100%</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>Gratuito</div>
            </div>
          </div>
        </div>

        {/* Mascote — direita no desktop */}
        <div className="flex-shrink-0 relative">
          <HeroMascot />
          {/* Badges flutuantes */}
          <div className="absolute -top-2 -right-6 hidden md:flex items-center gap-2 bg-white rounded-2xl px-3 py-2 text-sm font-bold shadow-[var(--shadow-2)]"
               style={{ color: 'var(--grass-deep)' }}>
            🏆 10/10 acertos!
          </div>
          <div className="absolute bottom-6 -left-8 hidden md:flex items-center gap-2 bg-white rounded-2xl px-3 py-2 text-sm font-bold shadow-[var(--shadow-2)]"
               style={{ color: 'var(--sky-deep)' }}>
            📖 3º Ano · AV2
          </div>
        </div>

      </div>
    </div>
  );
}

function HeroMascot() {
  return (
    <svg width="220" height="220" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hm-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B4DAFF"/>
          <stop offset="1" stopColor="#4A95E5"/>
        </linearGradient>
        <linearGradient id="hm-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9A3"/>
          <stop offset="1" stopColor="#FFD66B"/>
        </linearGradient>
        <linearGradient id="hm-book" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF9ED4"/>
          <stop offset="1" stopColor="#E54F94"/>
        </linearGradient>
      </defs>
      {/* Sombra */}
      <ellipse cx="80" cy="148" rx="44" ry="8" fill="#2B2240" opacity=".10"/>
      {/* Corpo */}
      <rect x="32" y="64" width="96" height="76" rx="28" fill="url(#hm-body)"/>
      {/* Cabeça */}
      <rect x="42" y="20" width="76" height="62" rx="26" fill="url(#hm-head)"/>
      {/* Olhos (brancos) */}
      <circle cx="64" cy="46" r="9" fill="white"/>
      <circle cx="96" cy="46" r="9" fill="white"/>
      {/* Pupilas */}
      <circle cx="66" cy="47" r="5" fill="#2B2240"/>
      <circle cx="98" cy="47" r="5" fill="#2B2240"/>
      {/* Brilho */}
      <circle cx="68" cy="44" r="2" fill="white"/>
      <circle cx="100" cy="44" r="2" fill="white"/>
      {/* Sorriso */}
      <path d="M66 62 Q80 72 94 62" stroke="#2B2240" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* Antenas/orelhas */}
      <circle cx="42" cy="34" r="8" fill="#FFD66B" opacity=".9"/>
      <circle cx="118" cy="34" r="8" fill="#FFD66B" opacity=".9"/>
      {/* Livro na barriga */}
      <rect x="52" y="84" width="56" height="38" rx="10" fill="url(#hm-book)"/>
      <line x1="80" y1="84" x2="80" y2="122" stroke="white" strokeWidth="2" opacity=".6"/>
      {/* Braços */}
      <rect x="10" y="78" width="26" height="14" rx="7" fill="#7AB8F5"/>
      <rect x="124" y="78" width="26" height="14" rx="7" fill="#7AB8F5"/>
      {/* Pernas */}
      <rect x="52" y="132" width="22" height="18" rx="9" fill="#4A95E5"/>
      <rect x="86" y="132" width="22" height="18" rx="9" fill="#4A95E5"/>
    </svg>
  );
}
