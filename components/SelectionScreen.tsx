// components/SelectionScreen.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeroStep from './HeroStep';
import SelectionStep from './SelectionStep';
import DisciplineStep from './DisciplineStep';
import TrilhaStep from './TrilhaStep';
import TecnicoStep from './TecnicoStep';
import InfantilStep from './InfantilStep';
import type { Year, Bimestre, Assessment } from './SelectionStep';
import { useAuth } from '@/contexts/AuthContext';
import {
  Trilha,
  TRILHA_LABELS,
  esquecerTrilha,
  isTrocaDeTrilhaBloqueada,
  lerTrilhaSalva,
  salvarTrilha,
} from '@/lib/trilha';

type Step = 'trilha' | 'hero' | 'selection' | 'discipline' | 'tecnico' | 'infantil';

export default function SelectionScreen() {
  // null enquanto o localStorage não foi lido: escolher um passo antes disso
  // faria a porta de entrada piscar para quem já tem trilha salva.
  const [step, setStep] = useState<Step | null>(null);
  const [trilha, setTrilha] = useState<Trilha | null>(null);
  const [selectedYear, setSelectedYear] = useState<Year>('');
  const [selectedBimestre, setSelectedBimestre] = useState<Bimestre>('');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment>('');

  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const salva = lerTrilhaSalva();
    setTrilha(salva);
    // Sem trilha salva, "hero" funciona como a porta de entrada geral do site
    // (explica o app e leva para a escolha de trilha) — não como o lar de
    // quem já escolheu o ensino fundamental. Ver o branch `step === 'hero'`
    // abaixo, que decide o destino do botão "Vamos começar!" a partir de
    // `trilha`.
    setStep(
      salva === 'tecnico' ? 'tecnico' :
      salva === 'infantil' ? 'infantil' : 'hero',
    );
  }, []);

  const requireAuth = (proceed: () => void) => {
    if (isLoading) {
      return;
    }
    if (!user) {
      router.push('/login?returnTo=/');
      return;
    }
    proceed();
  };

  const handleEscolherTrilha = (escolhida: Trilha) => {
    salvarTrilha(escolhida);
    setTrilha(escolhida);
    setStep(escolhida === 'tecnico' ? 'tecnico' : escolhida === 'infantil' ? 'infantil' : 'hero');
  };

  const handleTrocarTrilha = () => {
    esquecerTrilha();
    setTrilha(null);
    setSelectedYear('');
    setSelectedBimestre('');
    setSelectedAssessment('');
    setStep('trilha');
  };

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
  };

  const handleNext = () => {
    setStep('discipline');
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

  if (step === null) {
    return null;
  }

  if (step === 'trilha') {
    return <TrilhaStep onEscolher={handleEscolherTrilha} />;
  }

  if (step === 'tecnico') {
    return <TecnicoStep onBack={handleTrocarTrilha} />;
  }

  if (step === 'infantil') {
    return <InfantilStep onBack={handleTrocarTrilha} />;
  }

  if (step === 'hero') {
    // Sem trilha escolhida ainda (primeira visita), "Vamos começar!" leva para
    // a escolha de trilha, não direto para a grade de anos do fundamental.
    const onStart = trilha === 'basica'
      ? () => requireAuth(() => setStep('selection'))
      : () => setStep('trilha');
    return (
      <>
        {trilha && !isTrocaDeTrilhaBloqueada() && (
          <TrilhaBar trilha={trilha} onTrocar={handleTrocarTrilha} />
        )}
        <HeroStep onStart={onStart} />
      </>
    );
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
      onNext={handleNext}
      onBack={handleBackFromSelection}
    />
  );
}

/** Lembra em qual trilha o aluno está e dá a saída para trocar. */
function TrilhaBar({ trilha, onTrocar }: { trilha: Trilha; onTrocar: () => void }) {
  return (
    <div
      className="flex items-center justify-center gap-3 px-4 py-2 text-sm"
      style={{ background: 'rgba(255,255,255,.7)', borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}
    >
      <span>
        Continuando em <strong style={{ color: 'var(--ink)' }}>{TRILHA_LABELS[trilha]}</strong>
      </span>
      <button
        onClick={onTrocar}
        style={{
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
          color: 'var(--grass-deep)', fontWeight: 700, textDecoration: 'underline',
        }}
      >
        Trocar de trilha
      </button>
    </div>
  );
}
