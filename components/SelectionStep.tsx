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

const PROGRESS_STEPS = 4;

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
