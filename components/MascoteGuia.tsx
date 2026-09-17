/**
 * Capelo, o mascote-guia — o livrinho de capelo que já vivia só na tela
 * inicial (HeroStep) virou componente compartilhado para acompanhar também
 * as pausas de rodada e o resultado final da Educação Infantil.
 */
interface MascoteGuiaProps {
  size?: number;
  /** Comemorando: mostra estrelinhas ao redor, usado em fim de rodada/resultado. */
  celebrando?: boolean;
}

export default function MascoteGuia({ size = 220, celebrando = false }: MascoteGuiaProps) {
  const height = Math.round((size * 240) / 220);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={size} height={height} viewBox="0 0 160 175" xmlns="http://www.w3.org/2000/svg">
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

      {celebrando && (
        <>
          <span aria-hidden="true" style={{ position: 'absolute', top: '2%', left: '-6%', fontSize: Math.round(size * 0.16) }}>✨</span>
          <span aria-hidden="true" style={{ position: 'absolute', top: '8%', right: '-8%', fontSize: Math.round(size * 0.13) }}>⭐</span>
          <span aria-hidden="true" style={{ position: 'absolute', bottom: '10%', left: '-10%', fontSize: Math.round(size * 0.13) }}>🎉</span>
        </>
      )}
    </div>
  );
}
