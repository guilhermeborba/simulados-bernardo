'use client';

export type Year = 'primeiro' | 'segundo' | 'terceiro' | 'quarto' | 'quinto' | 'sexto' | 'setimo' | 'oitavo' | 'nono' | '';
export type Bimestre = '1' | '2' | '3' | '4' | '';
export type Assessment = 'AV1' | 'AV2' | '';

interface SelectionStepProps {
  selectedYear: Year;
  selectedBimestre: Bimestre;
  selectedAssessment: Assessment;
  onYearChange: (year: Year) => void;
  onBimestreChange: (bimestre: Bimestre) => void;
  onAssessmentChange: (assessment: Assessment) => void;
  onNext: () => void;
  onBack: () => void;
}

const YEARS: { value: Year; num: number; label: string; sub: string; available: boolean; color: string; bg: string }[] = [
  { value: 'primeiro', num: 1, label: '1º Ano', sub: 'Fundamental I',  available: false, color: '#8B6DE0', bg: 'linear-gradient(135deg,#D4C0FF,#8B6DE0)' },
  { value: 'segundo',  num: 2, label: '2º Ano', sub: 'Fundamental I',  available: false, color: '#4A95E5', bg: 'linear-gradient(135deg,#B4DAFF,#4A95E5)' },
  { value: 'terceiro', num: 3, label: '3º Ano', sub: 'Fundamental I',  available: true,  color: '#E54F94', bg: 'linear-gradient(135deg,#FFB3D1,#E54F94)' },
  { value: 'quarto',   num: 4, label: '4º Ano', sub: 'Fundamental I',  available: false, color: '#2FB867', bg: 'linear-gradient(135deg,#A0F0C0,#2FB867)' },
  { value: 'quinto',   num: 5, label: '5º Ano', sub: 'Fundamental I',  available: false, color: '#FF7A3D', bg: 'linear-gradient(135deg,#FFD0B0,#FF7A3D)' },
  { value: 'sexto',    num: 6, label: '6º Ano', sub: 'Fundamental II', available: false, color: '#4A95E5', bg: 'linear-gradient(135deg,#B4DAFF,#4A95E5)' },
  { value: 'setimo',   num: 7, label: '7º Ano', sub: 'Fundamental II', available: false, color: '#2FB867', bg: 'linear-gradient(135deg,#A0F0C0,#2FB867)' },
  { value: 'oitavo',   num: 8, label: '8º Ano', sub: 'Fundamental II', available: false, color: '#8B6DE0', bg: 'linear-gradient(135deg,#D4C0FF,#8B6DE0)' },
  { value: 'nono',     num: 9, label: '9º Ano', sub: 'Fundamental II', available: false, color: '#2FB867', bg: 'linear-gradient(135deg,#A0F0C0,#2FB867)' },
];

export const YEAR_TO_SCHOOL_YEAR: Record<string, number> = Object.fromEntries(
  YEARS.map((y) => [y.value, y.num]),
);

const BIMESTRES: { value: Bimestre; label: string; range: string; available: boolean; sub: string }[] = [
  { value: '1', label: '1º Bimestre', range: 'Fev — Abr', available: true,  sub: 'Apenas AV2' },
  { value: '2', label: '2º Bimestre', range: 'Mai — Jul', available: true,  sub: 'AV1 + AV2' },
  { value: '3', label: '3º Bimestre', range: 'Ago — Out', available: true,  sub: 'Apenas AV1' },
  { value: '4', label: '4º Bimestre', range: 'Nov — Dez', available: false, sub: 'Em breve' },
];

const BIMESTRE_COLORS: Record<string, string> = {
  '1': '#4A95E5',
  '2': '#2FB867',
  '3': '#FFB800',
  '4': '#E54F94',
};

const AVAILABLE_ASSESSMENTS: Record<string, Assessment[]> = {
  '1': ['AV2'],
  '2': ['AV1', 'AV2'],
  '3': ['AV1'],
};

const ASSESSMENTS: { value: Assessment; label: string; desc: string }[] = [
  { value: 'AV1', label: 'AV1 – Primeira Avaliação', desc: 'Cobre conteúdos da 1ª metade' },
  { value: 'AV2', label: 'AV2 – Segunda Avaliação',  desc: 'Conteúdo completo do bimestre' },
];

const YEAR_LABELS: Record<string, string> = {
  primeiro: '1º Ano', segundo: '2º Ano', terceiro: '3º Ano', quarto: '4º Ano',
  quinto: '5º Ano', sexto: '6º Ano', setimo: '7º Ano', oitavo: '8º Ano', nono: '9º Ano',
};
const BIM_LABELS: Record<string, string> = { '1': '1º Bimestre', '2': '2º Bimestre', '3': '3º Bimestre', '4': '4º Bimestre' };

function SectionHeader({ step, title, selected }: { step: number; title: string; selected?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#2B2240', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 16,
          flexShrink: 0,
        }}>{step}</div>
        <span style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>
          {title}
        </span>
      </div>
      {selected && (
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>
          {selected}
        </span>
      )}
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
  onNext,
  onBack,
}: SelectionStepProps) {
  const availableAvs = selectedBimestre ? (AVAILABLE_ASSESSMENTS[selectedBimestre] ?? []) : [];
  const canAdvance = !!selectedYear && !!selectedBimestre && !!selectedAssessment;

  const selectedYearData = YEARS.find(y => y.value === selectedYear);

  return (
    <div className="page-shell flex flex-col px-4 py-6 md:py-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 w-full max-w-3xl mx-auto">
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
            02 · CONFIGURAÇÃO
          </span>
          <div className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-sm"
               style={{ background: '#FFF8D6', color: '#8B6000', boxShadow: 'var(--shadow-1)' }}>
            <span>7</span>
            <span>Dias seguidos</span>
          </div>
        </div>
      </div>

      {/* Título acima do card */}
      <div className="w-full max-w-3xl mx-auto mb-4">
        <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
          Vamos personalizar seu simulado
        </h2>
        <p style={{ color: 'var(--muted)', marginTop: 4 }}>
          Escolha seu ano, bimestre e qual avaliação você quer praticar.
        </p>
      </div>

      {/* Card branco */}
      <div className="w-full max-w-3xl mx-auto bg-white rounded-[2rem] p-6 md:p-8"
           style={{ boxShadow: 'var(--shadow-3)' }}>

        {/* ── Seção 1: Ano ── */}
        <SectionHeader
          step={1}
          title="Qual ano você está cursando?"
          selected={selectedYear ? `Selecionado: ${YEAR_LABELS[selectedYear]}` : undefined}
        />
        <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {YEARS.slice(0, 5).map((y) => (
            <YearCard key={y.value} y={y} selected={selectedYear === y.value} onClick={() => y.available && onYearChange(y.value)} />
          ))}
        </div>
        <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {YEARS.slice(5).map((y) => (
            <YearCard key={y.value} y={y} selected={selectedYear === y.value} onClick={() => y.available && onYearChange(y.value)} />
          ))}
        </div>

        {/* ── Seção 2: Bimestre ── */}
        {selectedYear && (
          <>
            <div style={{ height: 1.5, background: 'var(--line)', marginBottom: 24 }} />
            <SectionHeader
              step={2}
              title="Qual bimestre você quer praticar?"
              selected={selectedBimestre ? BIM_LABELS[selectedBimestre] : undefined}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {BIMESTRES.map((b) => {
                const color = BIMESTRE_COLORS[b.value];
                const isSelected = selectedBimestre === b.value;
                return (
                  <button
                    key={b.value}
                    disabled={!b.available}
                    onClick={() => b.available && onBimestreChange(b.value)}
                    style={{
                      background: isSelected ? `${color}18` : 'var(--paper)',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${isSelected ? color : 'var(--line)'}`,
                      padding: '14px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      opacity: b.available ? 1 : 0.45,
                      cursor: b.available ? 'pointer' : 'not-allowed',
                      boxShadow: 'var(--shadow-1)',
                      transition: 'all .15s',
                      textAlign: 'left',
                    }}
                  >
                    {/* Ícone calendário com número */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: isSelected ? color : '#EEE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSelected ? 'white' : '#999',
                      fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 16,
                    }}>
                      {b.value}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, color: 'var(--ink)', fontSize: 14, lineHeight: 1.2 }}>
                        {b.label}
                      </div>
                      <div style={{ fontSize: 12, color: b.available ? 'var(--muted)' : 'var(--muted)', marginTop: 1 }}>
                        {b.range}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Seção 3: AV ── */}
        {selectedBimestre && (
          <>
            <div style={{ height: 1.5, background: 'var(--line)', marginBottom: 24 }} />
            <SectionHeader
              step={3}
              title="Qual avaliação você quer fazer?"
              selected={selectedAssessment || undefined}
            />
            <div className="grid grid-cols-2 gap-3 mb-6">
              {ASSESSMENTS.map((a) => {
                const isAvailable = availableAvs.includes(a.value);
                const isSelected = selectedAssessment === a.value;
                const avColor = a.value === 'AV1' ? '#E54F94' : '#8B6DE0';
                return (
                  <button
                    key={a.value}
                    disabled={!isAvailable}
                    onClick={() => isAvailable && onAssessmentChange(a.value)}
                    style={{
                      background: isSelected ? `${avColor}12` : 'var(--paper)',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${isSelected ? avColor : 'var(--line)'}`,
                      padding: '18px 16px',
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
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: isSelected ? `${avColor}20` : '#F5F3EF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-fredoka)', fontWeight: 700,
                      fontSize: 13, color: isSelected ? avColor : '#AAA',
                    }}>
                      {a.value}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>
                        {a.label}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{a.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Caixa de dica */}
        {selectedBimestre && (
          <div className="flex items-start gap-3 rounded-2xl px-5 py-4 mt-2 mb-4"
               style={{ background: '#FFF8D6', border: '1.5px solid #FFD66B' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: 13, color: '#6B4A00', fontWeight: 600, lineHeight: 1.5 }}>
              <strong>Dica:</strong> Cada bimestre tem duas avaliações (AV1 e AV2). Você pode treinar ambas quantas vezes quiser — sua melhor pontuação é a que conta!
            </p>
          </div>
        )}

        {/* Footer com resumo + botão */}
        {canAdvance && (
          <div className="flex items-center justify-between mt-4 pt-4"
               style={{ borderTop: '1.5px solid var(--line)' }}>
            <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>
              Tudo certo, <strong style={{ color: 'var(--ink)' }}>
                {YEAR_LABELS[selectedYear]} · {BIM_LABELS[selectedBimestre]} · {selectedAssessment}
              </strong>. Hora de escolher a disciplina!
            </p>
            <button className="btn btn--grass btn--lg" style={{ whiteSpace: 'nowrap', marginLeft: 16 }} onClick={onNext}>
              + Próximo passo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function YearCard({
  y,
  selected,
  onClick,
}: {
  y: typeof YEARS[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={!y.available}
      onClick={onClick}
      style={{
        background: selected ? '#FFFBE8' : 'var(--paper)',
        borderRadius: 'var(--radius-md)',
        border: `2px solid ${selected ? '#FFB800' : 'var(--line)'}`,
        padding: '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        opacity: y.available ? 1 : 1,
        cursor: y.available ? 'pointer' : 'default',
        boxShadow: selected ? '0 0 0 3px #FFD70040' : 'var(--shadow-1)',
        transition: 'all .15s',
      }}
    >
      {/* Badge com número */}
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: y.available ? y.bg : '#DDD',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 20,
        boxShadow: y.available ? `0 4px 10px ${y.color}50` : 'none',
      }}>
        {y.num}
      </div>
      <div style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>
        {y.label}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
        color: selected ? '#8B6000' : 'var(--muted)',
      }}>
        {selected ? 'FUNDAMENTAL I' : y.sub.toUpperCase()}
      </div>
    </button>
  );
}
