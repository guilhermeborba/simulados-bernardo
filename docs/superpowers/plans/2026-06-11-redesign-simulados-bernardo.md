# Redesign Simulados Bernardo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o visual genérico pelo design system lúdico-profissional e introduzir as telas Hero e Seleção de Disciplina, mantendo toda a lógica de negócio existente.

**Architecture:** `SelectionScreen.tsx` vira um wizard de 5 steps (hero → ano → bimestre → av → disciplina). Cada step é um componente próprio. `SimuladoTemplate.tsx` recebe apenas atualização visual. Nenhuma rota nova é criada; `/simulados` é redirecionado para `/`.

**Tech Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · CSS custom properties (design system já em `globals.css`) · Google Fonts Fredoka + Nunito (já carregados em `layout.tsx`)

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `components/HeroStep.tsx` | **Criar** | Tela de boas-vindas com mascote SVG e botão Começar |
| `components/SelectionStep.tsx` | **Criar** | Botões de seleção de Ano / Bimestre / AV |
| `components/DisciplineStep.tsx` | **Criar** | Cards de disciplina com roteamento para simulado |
| `components/SelectionScreen.tsx` | **Modificar** | Wizard orchestrador — gerencia step atual e estado |
| `components/SimuladoTemplate.tsx` | **Modificar** | Visual do quiz e da tela de resultado |
| `components/SimuladosPageClient.tsx` | **Deletar** | Lógica migrada para DisciplineStep |
| `components/SimuladosDisplay.tsx` | **Deletar** | Não usado no novo fluxo |
| `app/simulados/page.tsx` | **Modificar** | Redirecionar para `/` |

---

## Task 1: HeroStep — tela de boas-vindas

**Files:**
- Create: `components/HeroStep.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
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
```

- [ ] **Step 2: Verificar no navegador**

Inicie o servidor: `npm run dev`  
Abra `http://localhost:3000` (HeroStep ainda não está conectado, mas o componente não deve ter erros de TypeScript).  
Execute: `npx tsc --noEmit`  
Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add components/HeroStep.tsx
git commit -m "feat: adicionar HeroStep com mascote SVG inline"
```

---

## Task 2: SelectionStep — botões de seleção

**Files:**
- Create: `components/SelectionStep.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// components/SelectionStep.tsx
'use client';

export type Year = 'primeiro' | 'segundo' | 'terceiro' | 'quarto' | '';
export type Bimestre = '1' | '2' | '3' | '4' | '';
export type Assessment = 'AV1' | 'AV2' | '';

interface SelectionStepProps {
  selectedYear: Year;
  selectedBimestre: Bimestre;
  selectedAssessment: Assessment;
  onYearChange: (year: Year) => void;
  onBimestreChange: (bimestre: Bimestre) => void;
  onAssessmentChange: (assessment: Assessment) => void;
  onBack: () => void;
}

const YEARS: { value: Year; label: string; emoji: string; available: boolean; sub: string }[] = [
  { value: 'primeiro', label: '1º Ano', emoji: '🌱', available: false, sub: 'Em breve' },
  { value: 'segundo',  label: '2º Ano', emoji: '🌿', available: false, sub: 'Em breve' },
  { value: 'terceiro', label: '3º Ano', emoji: '⭐', available: true,  sub: 'Disponível' },
  { value: 'quarto',   label: '4º Ano', emoji: '🚀', available: false, sub: 'Em breve' },
];

const BIMESTRES: { value: Bimestre; label: string; emoji: string; available: boolean; sub: string }[] = [
  { value: '1', label: '1º Bim', emoji: '❄️', available: true,  sub: 'Apenas AV2' },
  { value: '2', label: '2º Bim', emoji: '🌸', available: true,  sub: 'AV1 + AV2' },
  { value: '3', label: '3º Bim', emoji: '☀️', available: false, sub: 'Em breve' },
  { value: '4', label: '4º Bim', emoji: '🍂', available: false, sub: 'Em breve' },
];

// Quais AVs estão disponíveis por bimestre
const AVAILABLE_ASSESSMENTS: Record<string, Assessment[]> = {
  '1': ['AV2'],
  '2': ['AV1', 'AV2'],
};

const ASSESSMENTS: { value: Assessment; label: string; desc: string; emoji: string }[] = [
  { value: 'AV1', label: 'AV1 — 1ª Avaliação', desc: 'Primeira prova do bimestre', emoji: '📋' },
  { value: 'AV2', label: 'AV2 — 2ª Avaliação', desc: 'Segunda prova do bimestre',  emoji: '✅' },
];

const PROGRESS_STEPS = 4; // hero, ano, bimestre+av, disciplina

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex gap-2 mb-8">
      {Array.from({ length: PROGRESS_STEPS }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 28,
            height: 8,
            borderRadius: 999,
            background: i < current
              ? 'var(--lilac)'
              : i === current
                ? 'var(--grass)'
                : 'var(--line)',
          }}
        />
      ))}
    </div>
  );
}

export default function SelectionStep({
  selectedYear,
  selectedBimestre,
  selectedAssessment,
  onYearChange,
  onBimestreChange,
  onAssessmentChange,
  onBack,
}: SelectionStepProps) {
  // Determine current progress step index
  const currentStep = !selectedYear ? 1 : !selectedBimestre ? 2 : 2;

  const availableAvs = selectedBimestre ? (AVAILABLE_ASSESSMENTS[selectedBimestre] ?? []) : [];

  return (
    <div className="page-shell flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Navbar */}
        <div className="flex justify-between items-center mb-8">
          <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
            📚 Simulados Bernardo
          </span>
          <button className="btn btn--ghost text-sm" onClick={onBack}>
            ← Voltar
          </button>
        </div>

        <ProgressDots current={currentStep} />

        <div className="card card--hero">
          <h2 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-fredoka)' }}>
            Vamos personalizar seu simulado
          </h2>
          <p className="mb-8" style={{ color: 'var(--muted)' }}>
            Escolha o ano, bimestre e avaliação
          </p>

          {/* Ano */}
          <p className="text-sm font-bold mb-3" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            📅 Qual ano você está?
          </p>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {YEARS.map((y) => (
              <button
                key={y.value}
                disabled={!y.available}
                onClick={() => y.available && onYearChange(y.value)}
                style={{
                  background: selectedYear === y.value ? 'linear-gradient(135deg,#f0fff6,#e0fced)' : 'var(--paper)',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${selectedYear === y.value ? 'var(--grass)' : 'var(--line)'}`,
                  padding: '16px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  opacity: y.available ? 1 : 0.45,
                  cursor: y.available ? 'pointer' : 'not-allowed',
                  boxShadow: 'var(--shadow-1)',
                  transition: 'all .15s',
                  fontFamily: 'var(--font-nunito)',
                  fontWeight: 700,
                  color: 'var(--ink)',
                }}
              >
                <span style={{ fontSize: 26 }}>{y.emoji}</span>
                <span style={{ fontSize: 14 }}>{y.label}</span>
                <span style={{ fontSize: 11, color: y.available ? 'var(--grass-deep)' : 'var(--lilac)', fontWeight: 600 }}>
                  {y.sub}
                </span>
              </button>
            ))}
          </div>

          {/* Bimestre — aparece após ano selecionado */}
          {selectedYear === 'terceiro' && (
            <div className="animate-in fade-in duration-500">
              <div style={{ height: 1.5, background: 'var(--line)', marginBottom: 24 }} />
              <p className="text-sm font-bold mb-3" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                📆 Qual bimestre?
              </p>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {BIMESTRES.map((b) => (
                  <button
                    key={b.value}
                    disabled={!b.available}
                    onClick={() => b.available && onBimestreChange(b.value)}
                    style={{
                      background: selectedBimestre === b.value ? 'linear-gradient(135deg,#f0fff6,#e0fced)' : 'var(--paper)',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${selectedBimestre === b.value ? 'var(--grass)' : 'var(--line)'}`,
                      padding: '16px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      opacity: b.available ? 1 : 0.45,
                      cursor: b.available ? 'pointer' : 'not-allowed',
                      boxShadow: 'var(--shadow-1)',
                      transition: 'all .15s',
                      fontFamily: 'var(--font-nunito)',
                      fontWeight: 700,
                      color: 'var(--ink)',
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{b.emoji}</span>
                    <span style={{ fontSize: 14 }}>{b.label}</span>
                    <span style={{ fontSize: 11, color: b.available ? 'var(--grass-deep)' : 'var(--lilac)', fontWeight: 600 }}>
                      {b.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AV — aparece após bimestre selecionado */}
          {selectedBimestre && (
            <div className="animate-in fade-in duration-500">
              <div style={{ height: 1.5, background: 'var(--line)', marginBottom: 24 }} />
              <p className="text-sm font-bold mb-3" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                📝 Qual avaliação?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ASSESSMENTS.map((a) => {
                  const isAvailable = availableAvs.includes(a.value);
                  return (
                    <button
                      key={a.value}
                      disabled={!isAvailable}
                      onClick={() => isAvailable && onAssessmentChange(a.value)}
                      style={{
                        background: selectedAssessment === a.value ? 'linear-gradient(135deg,#f0f7ff,#e0eeff)' : 'var(--paper)',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${selectedAssessment === a.value ? 'var(--sky-deep)' : 'var(--line)'}`,
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        opacity: isAvailable ? 1 : 0.45,
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        boxShadow: 'var(--shadow-1)',
                        transition: 'all .15s',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: selectedAssessment === a.value ? '#E0EEFF' : '#F5F3EF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0,
                      }}>{a.emoji}</div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>
                          {a.label}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{a.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add components/SelectionStep.tsx
git commit -m "feat: adicionar SelectionStep com botões de seleção de ano/bimestre/AV"
```

---

## Task 3: DisciplineStep — seleção de disciplina

**Files:**
- Create: `components/DisciplineStep.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
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
  routes: Partial<Record<string, string>>; // key: `${bimestre}-${assessment}`
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
      '1-AV2': '/simulado-portugues-av2',
      '2-AV1': '/simulado-portugues',
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

        {/* Progress dots */}
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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: zero erros.

- [ ] **Step 3: Commit**

```bash
git add components/DisciplineStep.tsx
git commit -m "feat: adicionar DisciplineStep com cards de disciplina"
```

---

## Task 4: Refatorar SelectionScreen como wizard

**Files:**
- Modify: `components/SelectionScreen.tsx`

- [ ] **Step 1: Substituir o conteúdo completo do arquivo**

```tsx
// components/SelectionScreen.tsx
'use client';

import { useState } from 'react';
import HeroStep from './HeroStep';
import SelectionStep from './SelectionStep';
import DisciplineStep from './DisciplineStep';
import type { Year, Bimestre, Assessment } from './SelectionStep';

type Step = 'hero' | 'selection' | 'discipline';

export default function SelectionScreen() {
  const [step, setStep] = useState<Step>('hero');
  const [selectedYear, setSelectedYear] = useState<Year>('');
  const [selectedBimestre, setSelectedBimestre] = useState<Bimestre>('');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment>('');

  const handleYearChange = (year: Year) => {
    setSelectedYear(year);
    setSelectedBimestre('');
    setSelectedAssessment('');
  };

  const handleBimestreChange = (bimestre: Bimestre) => {
    setSelectedBimestre(bimestre);
    setSelectedAssessment('');
  };

  const handleAssessmentChange = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    // Avança para disciplina após 300ms (feedback visual da seleção)
    setTimeout(() => setStep('discipline'), 300);
  };

  const handleBackFromSelection = () => {
    setStep('hero');
    setSelectedYear('');
    setSelectedBimestre('');
    setSelectedAssessment('');
  };

  const handleBackFromDiscipline = () => {
    setStep('selection');
    setSelectedAssessment('');
  };

  if (step === 'hero') {
    return <HeroStep onStart={() => setStep('selection')} />;
  }

  if (step === 'discipline' && selectedYear && selectedBimestre && selectedAssessment) {
    return (
      <DisciplineStep
        year={selectedYear}
        bimestre={selectedBimestre}
        assessment={selectedAssessment}
        onBack={handleBackFromDiscipline}
      />
    );
  }

  return (
    <SelectionStep
      selectedYear={selectedYear}
      selectedBimestre={selectedBimestre}
      selectedAssessment={selectedAssessment}
      onYearChange={handleYearChange}
      onBimestreChange={handleBimestreChange}
      onAssessmentChange={handleAssessmentChange}
      onBack={handleBackFromSelection}
    />
  );
}
```

- [ ] **Step 2: Testar o fluxo completo no navegador**

`npm run dev` → `http://localhost:3000`  

Verificar:
1. Hero aparece na carga inicial ✓
2. Clicar "Começar agora" vai para SelectionStep ✓
3. Clicar 3º Ano revela bimestres ✓
4. Clicar 2º Bim revela AV ✓
5. Clicar AV2 vai para DisciplineStep após 300ms ✓
6. Cards de disciplina aparecem com 5 opções ✓
7. Clicar "← Mudar seleção" volta para SelectionStep ✓
8. Clicar "← Voltar" na SelectionStep volta para Hero ✓

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/SelectionScreen.tsx
git commit -m "refactor: SelectionScreen vira wizard de 5 steps com HeroStep/SelectionStep/DisciplineStep"
```

---

## Task 5: Remover rotas obsoletas

**Files:**
- Modify: `app/simulados/page.tsx`
- Delete: `components/SimuladosPageClient.tsx`
- Delete: `components/SimuladosDisplay.tsx`

- [ ] **Step 1: Redirecionar `/simulados` para `/`**

Substituir o conteúdo de `app/simulados/page.tsx` por:

```tsx
// app/simulados/page.tsx
import { redirect } from 'next/navigation';

export default function SimuladosPage() {
  redirect('/');
}
```

- [ ] **Step 2: Deletar componentes obsoletos**

```bash
rm components/SimuladosPageClient.tsx
rm components/SimuladosDisplay.tsx
```

- [ ] **Step 3: Verificar que nenhum arquivo importa os deletados**

```bash
grep -r "SimuladosPageClient\|SimuladosDisplay" /Users/guilhermeborba/Documents/htdocs/simulados-bernardo/app /Users/guilhermeborba/Documents/htdocs/simulados-bernardo/components
```
Expected: nenhum resultado.

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remover /simulados e componentes obsoletos SimuladosPageClient e SimuladosDisplay"
```

---

## Task 6: Atualizar visual do SimuladoTemplate — tela de nome e navbar

**Files:**
- Modify: `components/SimuladoTemplate.tsx`

Esta task atualiza apenas o bloco `!hasStarted` (tela de nome) e o navbar do quiz. A lógica de negócio é intocada.

- [ ] **Step 1: Substituir o bloco `!hasStarted`**

Localizar (linhas 177–215) e substituir:

```tsx
if (!hasStarted) {
  return (
    <div className="page-shell flex items-center justify-content-center">
      <div className="max-w-xl w-full">
        <div className="text-center mb-6">
          <span className="text-6xl">{emoji}</span>
        </div>
        <div className="card card--hero text-center">
          <h1 className="text-4xl mb-2">{title}</h1>
          <p className="mb-1" style={{ color: 'var(--muted)' }}>{subtitle}</p>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
            {questions.length} questões · {questions.length} pontos
          </p>

          <label className="block text-left text-sm font-bold mb-2" style={{ color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            💬 Qual é o seu nome?
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Digite seu nome"
            className="input-field mb-6"
          />

          <button
            onClick={() => setHasStarted(true)}
            disabled={!studentName.trim()}
            className={`btn btn--lg w-full text-lg ${studentName.trim() ? 'btn--grass' : 'btn--ghost'}`}
            style={!studentName.trim() ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
          >
            ✨ Começar o Simulado
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Substituir o header do quiz em andamento**

Localizar o bloco `<div className="bg-white rounded-3xl shadow-lg p-6 mb-8">` (em torno da linha 311) e substituir:

```tsx
{/* Header */}
<div className="card mb-6 flex justify-between items-center">
  <div className="flex items-center gap-3">
    <span className="text-3xl">{emoji}</span>
    <div>
      <h1 className="text-xl" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
        {title}
      </h1>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        Aluno(a): <strong style={{ color: 'var(--ink)' }}>{studentName}</strong>
      </p>
    </div>
  </div>
  <div className="text-right">
    <p className="text-sm" style={{ color: 'var(--muted)' }}>{subtitle}</p>
    <p className="text-lg font-bold" style={{ color: 'var(--sky-deep)', fontFamily: 'var(--font-fredoka)' }}>
      {Object.keys(userAnswers).length}/{questions.length} respondidas
    </p>
  </div>
</div>
```

- [ ] **Step 3: Verificar no navegador**

Navegar até qualquer simulado (ex: `http://localhost:3000/simulado-portugues-av2`).  
Verificar: tela de nome com card branco arredondado e botão verde. ✓

- [ ] **Step 4: Commit**

```bash
git add components/SimuladoTemplate.tsx
git commit -m "feat: atualizar visual da tela de nome e navbar do SimuladoTemplate"
```

---

## Task 7: Atualizar visual do SimuladoTemplate — cards de questão

**Files:**
- Modify: `components/SimuladoTemplate.tsx`

- [ ] **Step 1: Substituir o card de questão externo**

Localizar o `<div key={question.id} className="bg-white rounded-3xl shadow-lg p-6 border-4 transition-all...">` e substituir:

```tsx
<div
  key={question.id}
  style={{
    background: isFinalized
      ? isCorrect ? 'rgba(237,255,245,.7)' : 'rgba(255,240,247,.7)'
      : 'var(--paper)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
    boxShadow: 'var(--shadow-2)',
    border: `2px solid ${
      isFinalized
        ? isCorrect ? 'var(--grass)' : 'var(--bubble)'
        : 'var(--line)'
    }`,
    transition: 'all .2s',
  }}
>
```

- [ ] **Step 2: Substituir o header interno da questão**

Localizar o bloco `<div className="flex justify-between items-start mb-4 gap-4">` e substituir:

```tsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
  <div style={{ flex: 1 }}>
    <span style={{
      display: 'inline-block',
      background: '#FFE0EE',
      color: 'var(--bubble-deep)',
      fontSize: 12,
      fontWeight: 700,
      borderRadius: 999,
      padding: '3px 12px',
      marginBottom: 8,
      fontFamily: 'var(--font-nunito)',
    }}>
      Questão {question.id}{isFinalized && (isCorrect ? ' ✅' : ' ❌')}
    </span>
    <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, color: 'var(--ink)', fontSize: 15, lineHeight: 1.5 }}>
      {question.text}
    </p>
  </div>
  <div style={{ textAlign: 'right', flexShrink: 0 }}>
    <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Valor</p>
    <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--sky-deep)', fontFamily: 'var(--font-fredoka)' }}>
      {question.points} pt
    </p>
  </div>
</div>
```

- [ ] **Step 3: Atualizar alternativas de múltipla escolha**

Localizar o botão de opção `<button key={option.id} onClick=... className="w-full text-left p-4 rounded-2xl...">` e substituir:

```tsx
<button
  key={option.id}
  onClick={() => handleAnswerChange(question.id, option.id)}
  disabled={isFinalized}
  style={{
    width: '100%',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: `2px solid ${
      showCorrectIndicator ? 'var(--grass-deep)'
      : showIncorrectIndicator ? 'var(--bubble-deep)'
      : isOptionSelected && !isFinalized ? 'var(--sky-deep)'
      : 'var(--line)'
    }`,
    background: showCorrectIndicator ? 'rgba(237,255,245,.8)'
      : showIncorrectIndicator ? 'rgba(255,240,247,.8)'
      : isOptionSelected && !isFinalized ? 'rgba(240,247,255,.8)'
      : 'var(--paper)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontFamily: 'var(--font-nunito)',
    fontWeight: 600,
    color: 'var(--ink)',
    fontSize: 14,
    cursor: isFinalized ? 'default' : 'pointer',
    transition: 'all .15s',
    boxShadow: 'var(--shadow-1)',
  }}
>
  <span style={{
    width: 28, height: 28, borderRadius: 999, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 800,
    background: showCorrectIndicator ? 'var(--grass)' : showIncorrectIndicator ? 'var(--bubble)' : isOptionSelected && !isFinalized ? 'var(--sky-deep)' : 'var(--line)',
    color: (showCorrectIndicator || showIncorrectIndicator || (isOptionSelected && !isFinalized)) ? 'white' : 'var(--muted)',
  }}>
    {option.id.toUpperCase()}
  </span>
  {option.text}
  {showCorrectIndicator && ' ✅'}
  {showIncorrectIndicator && ' ❌'}
</button>
```

- [ ] **Step 4: Atualizar dicas pedagógicas (acerto e erro)**

Localizar `<div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-2xl">` e substituir:

```tsx
<div style={{ marginTop: 16, padding: 16, background: '#FFF8D6', border: '1.5px solid var(--sun)', borderRadius: 'var(--radius-md)' }}>
  <p style={{ fontWeight: 700, color: '#8B6000', fontFamily: 'var(--font-nunito)' }}>💡 Dica para aprender:</p>
  <p style={{ fontSize: 13, color: '#6B4A00', marginTop: 6, lineHeight: 1.5 }}>{question.tip}</p>
</div>
```

Localizar `<div className="mt-4 p-4 bg-green-50 border-2 border-green-400 rounded-2xl">` e substituir:

```tsx
<div style={{ marginTop: 16, padding: 16, background: 'rgba(237,255,245,.8)', border: '1.5px solid var(--grass)', borderRadius: 'var(--radius-md)' }}>
  <p style={{ fontWeight: 700, color: 'var(--grass-deep)', fontFamily: 'var(--font-nunito)' }}>🌟 Curiosidade:</p>
  <p style={{ fontSize: 13, color: '#1A7A3F', marginTop: 6, lineHeight: 1.5 }}>{question.tip}</p>
</div>
```

- [ ] **Step 5: Atualizar botão Finalizar**

Localizar o `<button onClick={() => setIsFinalized(true)} disabled=...>` e substituir:

```tsx
<button
  onClick={() => setIsFinalized(true)}
  disabled={Object.keys(userAnswers).length < questions.length}
  className={`btn btn--lg w-full mt-8 text-lg ${
    Object.keys(userAnswers).length === questions.length ? 'btn--grass' : 'btn--ghost'
  }`}
  style={Object.keys(userAnswers).length < questions.length ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
>
  {Object.keys(userAnswers).length === questions.length
    ? '✅ Finalizar e Ver Resultado'
    : `⏳ Responda todas (${Object.keys(userAnswers).length}/${questions.length})`}
</button>
```

- [ ] **Step 6: Verificar no navegador**

Navegar até um simulado, inserir nome, responder questões.  
Verificar: cards com bordas arredondadas, alternativas com estilo novo, dicas com fundo amarelo, botão finalizar verde. ✓

- [ ] **Step 7: Commit**

```bash
git add components/SimuladoTemplate.tsx
git commit -m "feat: atualizar visual dos cards de questão e alternativas do SimuladoTemplate"
```

---

## Task 8: Atualizar visual do SimuladoTemplate — tela de resultado

**Files:**
- Modify: `components/SimuladoTemplate.tsx`

- [ ] **Step 1: Substituir o bloco `isFinalized` completo**

Localizar o `return (` do bloco `if (isFinalized)` (em torno da linha 217) e substituir todo o bloco:

```tsx
if (isFinalized) {
  const pct = Math.round((finalScore / questions.length) * 100);
  const circumference = 2 * Math.PI * 44; // raio 44 do SVG
  const strokeDash = (finalScore / questions.length) * circumference;

  return (
    <div className="page-shell">
      <div className="max-w-4xl mx-auto">
        {/* Navbar */}
        <div className="flex justify-between items-center mb-8">
          <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
            📚 {title}
          </span>
          <span className="badge">{subtitle} · Concluído</span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Coluna principal */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Hero resultado */}
            <div className="card card--hero flex items-center gap-6">
              {/* Anel de progresso SVG */}
              <svg width="110" height="110" viewBox="0 0 100 100" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" strokeWidth="10"/>
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke="var(--grass)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                />
                <text
                  x="50" y="50"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px', fontFamily: 'var(--font-fredoka)', fill: 'var(--ink)' }}
                >
                  <tspan fontSize="24" fontWeight="800">{finalScore}</tspan>
                  <tspan fontSize="13" fill="var(--muted)" dy="0"> /{questions.length}</tspan>
                </text>
              </svg>

              <div>
                <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
                  {motivationalData.emoji} {motivationalData.title}, {studentName}!
                </h2>
                <p className="text-sm mb-3" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
                  {motivationalData.message}
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(237,255,245,.9)', borderRadius: 999,
                  padding: '5px 14px', fontSize: 13, fontWeight: 700, color: 'var(--grass-deep)',
                }}>
                  ✅ {pct}% de aproveitamento
                </div>
              </div>
            </div>

            {/* Análise por questão */}
            <div className="card">
              <h3 className="text-lg mb-4" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
                📊 Análise detalhada
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {questions.map((question, idx) => {
                  const correct = isAnswerCorrect(question.id);
                  return (
                    <div key={question.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 10, flexShrink: 0,
                          background: correct ? 'rgba(237,255,245,.9)' : 'rgba(255,240,247,.9)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                        }}>
                          {correct ? '✅' : '❌'}
                        </div>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>
                          Questão {question.id}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: correct ? 'var(--grass-deep)' : 'var(--bubble-deep)' }}>
                          {correct ? `+${question.points} pt` : '0 pt'}
                        </div>
                      </div>
                      {!correct && (
                        <div style={{ marginBottom: 8, padding: '10px 14px', background: '#FFF8D6', border: '1.5px solid var(--sun)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: '#6B4A00', lineHeight: 1.5 }}>
                          💡 {question.tip}
                        </div>
                      )}
                      {idx < questions.length - 1 && <div style={{ height: 1, background: 'var(--line)' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar ações */}
          <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="text-xs font-bold" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                O que fazer agora?
              </p>
              <button
                className="btn btn--sky w-full"
                onClick={() => { setUserAnswers({}); setIsFinalized(false); }}
              >
                🔄 Refazer simulado
              </button>
              <button
                className="btn btn--lilac w-full"
                onClick={() => { setUserAnswers({}); setIsFinalized(false); setHasStarted(false); setStudentName(''); window.location.href = '/'; }}
              >
                📚 Outra disciplina
              </button>
              <button
                className="btn btn--ghost w-full"
                onClick={() => { setUserAnswers({}); setIsFinalized(false); setHasStarted(false); setStudentName(''); window.location.href = '/'; }}
              >
                🏠 Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar no navegador**

Completar um simulado e clicar "Finalizar".  
Verificar: anel de progresso SVG, score, mensagem com nome, análise por questão, 3 botões de ação. ✓

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/SimuladoTemplate.tsx
git commit -m "feat: atualizar tela de resultado do SimuladoTemplate com anel de progresso e sidebar de ações"
```

---

## Task 9: Adicionar `.superpowers/` ao .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Adicionar entrada**

```bash
echo '.superpowers/' >> .gitignore
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignorar diretório .superpowers do brainstorming"
```

---

## Checklist de Verificação Final

Após todas as tasks, verificar o fluxo completo:

- [ ] `http://localhost:3000` → Hero com mascote SVG e botão "Começar agora"
- [ ] Clicar "Começar" → SelectionStep com 4 cards de ano (3º disponível)
- [ ] Selecionar 3º Ano → bimestres aparecem com fade-in
- [ ] Selecionar 2º Bim → AVs aparecem
- [ ] Selecionar AV2 → DisciplineStep com 5 cards coloridos
- [ ] Clicar "Começar →" em Português → `/simulado-portugues-av2` com tela de nome estilizada
- [ ] Inserir nome → botão verde ativo
- [ ] Clicar "Começar" → quiz com cards novos e alternativas estilizadas
- [ ] Responder tudo → botão "Finalizar" verde ativo
- [ ] Clicar "Finalizar" → resultado com anel SVG, análise, 3 botões
- [ ] `http://localhost:3000/simulados` → redireciona para `/`
- [ ] `npx tsc --noEmit` → zero erros
