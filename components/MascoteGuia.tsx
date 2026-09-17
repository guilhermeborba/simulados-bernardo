/**
 * Mascotes-guia do app.
 *
 * Capelo, o livrinho de capelo, vive na tela inicial e na escolha de trilha —
 * representa a plataforma como um todo. Bolinha, o cachorrinho, guia só a
 * experiência de Educação Infantil (catálogo, pausas de rodada, resultado),
 * porque um bichinho de estimação conversa melhor com quem tem 4-5 anos do
 * que um livro com capelo de formatura.
 */
type MascoteVariant = 'capelo' | 'bolinha';

interface MascoteGuiaProps {
  variant?: MascoteVariant;
  size?: number;
  /** Comemorando: mostra estrelinhas ao redor, usado em fim de rodada/resultado. */
  celebrando?: boolean;
}

export default function MascoteGuia({ variant = 'capelo', size = 220, celebrando = false }: MascoteGuiaProps) {
  const height = Math.round((size * 240) / 220);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg width={size} height={height} viewBox="0 0 160 175" xmlns="http://www.w3.org/2000/svg">
        {variant === 'bolinha' ? <BolinhaBody /> : <CapeloBody />}
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

function CapeloBody() {
  return (
    <>
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
    </>
  );
}

function BolinhaBody() {
  return (
    <>
      <defs>
        <linearGradient id="hm-dog-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFCB8E"/>
          <stop offset="1" stopColor="#F2A65A"/>
        </linearGradient>
        <linearGradient id="hm-dog-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8935A"/>
          <stop offset="1" stopColor="#D67E3F"/>
        </linearGradient>
      </defs>

      {/* Sombra */}
      <ellipse cx="80" cy="165" rx="46" ry="8" fill="#2B2240" opacity=".10"/>

      {/* Rabo, abanando */}
      <path d="M130 110 Q158 96 150 72" stroke="#F2A65A" strokeWidth="16" fill="none" strokeLinecap="round"/>

      {/* Pernas */}
      <rect x="46" y="148" width="22" height="20" rx="10" fill="#E8935A"/>
      <rect x="92" y="148" width="22" height="20" rx="10" fill="#E8935A"/>

      {/* Corpo */}
      <ellipse cx="80" cy="112" rx="52" ry="46" fill="url(#hm-dog-body)"/>

      {/* Barriguinha clara */}
      <ellipse cx="80" cy="126" rx="26" ry="22" fill="#FFF3E0"/>

      {/* Orelhas caídas */}
      <path d="M34 78 Q10 100 26 132 Q42 122 46 92 Z" fill="url(#hm-dog-ear)"/>
      <path d="M126 78 Q150 100 134 132 Q118 122 114 92 Z" fill="url(#hm-dog-ear)"/>

      {/* Cabeça */}
      <circle cx="80" cy="80" r="44" fill="url(#hm-dog-body)"/>

      {/* Manchinha */}
      <ellipse cx="104" cy="64" rx="14" ry="16" fill="#E8935A" opacity=".55"/>

      {/* Olhos */}
      <circle cx="65" cy="78" r="10" fill="white"/>
      <circle cx="97" cy="78" r="10" fill="white"/>
      <circle cx="67" cy="79" r="5.5" fill="#2B2240"/>
      <circle cx="99" cy="79" r="5.5" fill="#2B2240"/>
      <circle cx="69" cy="76" r="2" fill="white"/>
      <circle cx="101" cy="76" r="2" fill="white"/>

      {/* Focinho */}
      <ellipse cx="80" cy="98" rx="16" ry="12" fill="#FFF3E0"/>
      <ellipse cx="80" cy="93" rx="7" ry="5.5" fill="#2B2240"/>

      {/* Sorriso + língua */}
      <path d="M70 100 Q80 110 90 100" stroke="#2B2240" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M78 104 Q80 114 84 105 Q81 118 77 106 Z" fill="#FF9EB8"/>

      {/* Bochechas */}
      <circle cx="50" cy="92" r="6" fill="#FFB3CC" opacity=".5"/>
      <circle cx="110" cy="92" r="6" fill="#FFB3CC" opacity=".5"/>

      {/* Coleira */}
      <rect x="48" y="118" width="64" height="10" rx="5" fill="#8B6DE0"/>
      <circle cx="80" cy="130" r="6" fill="#FFD700"/>
    </>
  );
}
