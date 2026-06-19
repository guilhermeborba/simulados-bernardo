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

  if (step === 'hero') {
    return (
      <HeroStep
        onStart={() => setStep('selection')}
        onViewDisciplines={() => {
          setSelectedYear('terceiro');
          setSelectedBimestre('2');
          setSelectedAssessment('AV2');
          setStep('discipline');
        }}
      />
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
