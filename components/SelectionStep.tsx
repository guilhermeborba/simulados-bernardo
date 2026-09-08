'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAvailableSimulations, ApiSimulation } from '@/lib/apiClient';
import { TECNICO_SCHOOL_YEAR } from '@/lib/trilha';

export type Year =
  | 'primeiro' | 'segundo' | 'terceiro' | 'quarto' | 'quinto'
  | 'sexto' | 'setimo' | 'oitavo' | 'nono'
  | 'em1' | 'em2' | 'em3'
  | '';
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

// `num` é o schoolYear que vai para a API; `badge` é o que aparece no cartão.
// Os dois divergem no Ensino Médio, que é numerado 10–12 internamente mas
// falado como 1ª, 2ª e 3ª série.
const YEARS: { value: Year; num: number; badge?: string; label: string; sub: string; color: string; bg: string }[] = [
  { value: 'primeiro', num: 1, label: '1º Ano', sub: 'Fundamental I', color: '#8B6DE0', bg: 'linear-gradient(135deg,#D4C0FF,#8B6DE0)' },
  { value: 'segundo',  num: 2, label: '2º Ano', sub: 'Fundamental I', color: '#4A95E5', bg: 'linear-gradient(135deg,#B4DAFF,#4A95E5)' },
  { value: 'terceiro', num: 3, label: '3º Ano', sub: 'Fundamental I',  color: '#E54F94', bg: 'linear-gradient(135deg,#FFB3D1,#E54F94)' },
  { value: 'quarto',   num: 4, label: '4º Ano', sub: 'Fundamental I', color: '#2FB867', bg: 'linear-gradient(135deg,#A0F0C0,#2FB867)' },
  { value: 'quinto',   num: 5, label: '5º Ano', sub: 'Fundamental I', color: '#FF7A3D', bg: 'linear-gradient(135deg,#FFD0B0,#FF7A3D)' },
  { value: 'sexto',    num: 6, label: '6º Ano', sub: 'Fundamental II', color: '#4A95E5', bg: 'linear-gradient(135deg,#B4DAFF,#4A95E5)' },
  { value: 'setimo',   num: 7, label: '7º Ano', sub: 'Fundamental II', color: '#2FB867', bg: 'linear-gradient(135deg,#A0F0C0,#2FB867)' },
  { value: 'oitavo',   num: 8, label: '8º Ano', sub: 'Fundamental II', color: '#8B6DE0', bg: 'linear-gradient(135deg,#D4C0FF,#8B6DE0)' },
  { value: 'nono',     num: 9, label: '9º Ano', sub: 'Fundamental II', color: '#2FB867', bg: 'linear-gradient(135deg,#A0F0C0,#2FB867)' },
  // Ensino Médio segue a numeração contínua (10–12) que tierForSchoolYear já
  // reconhece como faixa de exame; o rótulo é "série", como na escola.
  { value: 'em1',     num: 10, badge: '1ª', label: '1ª Série', sub: 'Ensino Médio', color: '#0E7490', bg: 'linear-gradient(135deg,#9FE0DA,#0E7490)' },
  { value: 'em2',     num: 11, badge: '2ª', label: '2ª Série', sub: 'Ensino Médio', color: '#4A95E5', bg: 'linear-gradient(135deg,#B4DAFF,#4A95E5)' },
  { value: 'em3',     num: 12, badge: '3ª', label: '3ª Série', sub: 'Ensino Médio', color: '#8B6DE0', bg: 'linear-gradient(135deg,#D4C0FF,#8B6DE0)' },
];

export const YEAR_TO_SCHOOL_YEAR: Record<string, number> = Object.fromEntries(
  YEARS.map((y) => [y.value, y.num]),
);

export const YEAR_LABELS: Record<string, string> = Object.fromEntries(
  YEARS.map((y) => [y.value, y.label]),
);

// Cada etapa em sua própria linha: com o Ensino Médio o antigo corte fixo em
// cinco/quatro colunas deixava de bater com a quantidade de anos.
const YEAR_GROUPS: { label: string; years: typeof YEARS }[] = [
  { label: 'Fundamental I', years: YEARS.filter((y) => y.sub === 'Fundamental I') },
  { label: 'Fundamental II', years: YEARS.filter((y) => y.sub === 'Fundamental II') },
  { label: 'Ensino Médio', years: YEARS.filter((y) => y.sub === 'Ensino Médio') },
];

// auto-fit quebra a linha no celular em vez de estourar a largura da tela, e
// no desktop as faixas vazias colapsam, deixando os anos do grupo lado a lado.
const YEAR_GRID = 'repeat(auto-fit, minmax(96px, 1fr))';

const BIMESTRES: { value: Bimestre; label: string; range: string }[] = [
  { value: '1', label: '1º Bimestre', range: 'Fev — Abr' },
  { value: '2', label: '2º Bimestre', range: 'Mai — Jul' },
  { value: '3', label: '3º Bimestre', range: 'Ago — Out' },
  { value: '4', label: '4º Bimestre', range: 'Nov — Dez' },
];

const BIMESTRE_COLORS: Record<string, string> = {
  '1': '#4A95E5',
  '2': '#2FB867',
  '3': '#FFB800',
  '4': '#E54F94',
};

const ASSESSMENTS: { value: Assessment; label: string; desc: string }[] = [
  { value: 'AV1', label: 'AV1 – Primeira Avaliação', desc: 'Cobre conteúdos da 1ª metade' },
  { value: 'AV2', label: 'AV2 – Segunda Avaliação',  desc: 'Conteúdo completo do bimestre' },
];

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
  const { catalogo, isLoading } = useCatalogoDoAluno();

  const anosLiberados = useMemo(
    () => new Set(catalogo.map((simulacao) => simulacao.schoolYear)),
    [catalogo],
  );

  const selectedSchoolYear = selectedYear ? YEAR_TO_SCHOOL_YEAR[selectedYear] : null;

  const bimestresLiberados = useMemo(
    () =>
      new Set(
        catalogo
          .filter((simulacao) => simulacao.schoolYear === selectedSchoolYear)
          .map((simulacao) => String(simulacao.bimester)),
      ),
    [catalogo, selectedSchoolYear],
  );

  const avsLiberadas = useMemo(
    () =>
      new Set(
        catalogo
          .filter(
            (simulacao) =>
              simulacao.schoolYear === selectedSchoolYear &&
              String(simulacao.bimester) === selectedBimestre,
          )
          .map((simulacao) => simulacao.assessment),
      ),
    [catalogo, selectedSchoolYear, selectedBimestre],
  );

  const canAdvance = !!selectedYear && !!selectedBimestre && !!selectedAssessment;
  const nadaLiberado = !isLoading && anosLiberados.size === 0;

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

        {isLoading && (
          <p className="text-center py-4" style={{ color: 'var(--muted)' }}>
            Carregando os simulados disponíveis para você...
          </p>
        )}

        {/* Sem esta faixa, quem não tem nenhum ano liberado vê só uma grade
            cinza e nenhuma explicação do porquê. */}
        {nadaLiberado && (
          <div
            className="flex items-start gap-3 rounded-2xl px-5 py-4 mb-6"
            style={{ background: '#FFF8D6', border: '1.5px solid #FFD66B' }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: 13, color: '#6B4A00', fontWeight: 600, lineHeight: 1.5 }}>
              Ainda não há simulados liberados para a sua conta. Se você recebeu
              um link de convite de turma, abra o link para liberar os simulados
              dela.
            </p>
          </div>
        )}

        {/* ── Seção 1: Ano ── */}
        <SectionHeader
          step={1}
          title="Qual ano você está cursando?"
          selected={selectedYear ? `Selecionado: ${YEAR_LABELS[selectedYear]}` : undefined}
        />
        {YEAR_GROUPS.map((group) => (
          <div key={group.label} className="mb-8">
            <div style={{
              fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em',
              color: 'var(--muted)', marginBottom: 8,
            }}>
              {group.label}
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: YEAR_GRID }}>
              {group.years.map((y) => {
                const available = anosLiberados.has(y.num);
                return (
                  <YearCard
                    key={y.value}
                    y={y}
                    available={available}
                    selected={selectedYear === y.value}
                    onClick={() => available && onYearChange(y.value)}
                  />
                );
              })}
            </div>
          </div>
        ))}

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
                const available = bimestresLiberados.has(b.value);
                return (
                  <button
                    key={b.value}
                    disabled={!available}
                    onClick={() => available && onBimestreChange(b.value)}
                    style={{
                      background: isSelected ? `${color}18` : 'var(--paper)',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${isSelected ? color : 'var(--line)'}`,
                      padding: '14px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      opacity: available ? 1 : 0.45,
                      cursor: available ? 'pointer' : 'not-allowed',
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
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
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
                const isAvailable = avsLiberadas.has(a.value);
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
  available,
  selected,
  onClick,
}: {
  y: typeof YEARS[number];
  available: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={!available}
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
        opacity: available ? 1 : 0.55,
        cursor: available ? 'pointer' : 'default',
        boxShadow: selected ? '0 0 0 3px #FFD70040' : 'var(--shadow-1)',
        transition: 'all .15s',
      }}
    >
      {/* Badge com número */}
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: available ? y.bg : '#DDD',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 20,
        boxShadow: available ? `0 4px 10px ${y.color}50` : 'none',
      }}>
        {y.badge ?? y.num}
      </div>
      <div style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>
        {y.label}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
        color: selected ? '#8B6000' : 'var(--muted)',
      }}>
        {y.sub.toUpperCase()}
      </div>
    </button>
  );
}


/**
 * O que este aluno pode de fato abrir.
 *
 * Antes a disponibilidade de ano, bimestre e avaliação era uma tabela fixa no
 * código. Com simulados de turma isso passou a mentir: a tela oferecia o 3º ano
 * para qualquer pessoa e só o fim do caminho revelava que não havia nada ali.
 * Agora ela pergunta ao catálogo, que já vem filtrado por quem está pedindo.
 */
function useCatalogoDoAluno() {
  const [catalogo, setCatalogo] = useState<ApiSimulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    getAvailableSimulations({})
      .then((todos) => {
        if (!ativo) return;
        // Curso técnico não tem ano escolar e é gravado com schoolYear 0; ele
        // tem tela própria e não entra na grade de anos.
        setCatalogo(
          todos.filter((simulacao) => simulacao.schoolYear !== TECNICO_SCHOOL_YEAR),
        );
      })
      .catch(() => {
        if (ativo) setCatalogo([]);
      })
      .finally(() => {
        if (ativo) setIsLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  return { catalogo, isLoading };
}
