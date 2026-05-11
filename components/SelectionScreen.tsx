'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Year = 'primeiro' | 'segundo' | 'terceiro' | 'quarto' | '';
type Bimestre = '1' | '2' | '3' | '4' | '';
type Assessment = 'AV1' | 'AV2' | '';

export default function SelectionScreen() {
  const [selectedYear, setSelectedYear] = useState<Year>('');
  const [selectedBimestre, setSelectedBimestre] = useState<Bimestre>('');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment>('');
  const [showBimestreSelect, setShowBimestreSelect] = useState(false);
  const [showAssessmentSelect, setShowAssessmentSelect] = useState(false);
  const [showUnavailableMessage, setShowUnavailableMessage] = useState(false);
  const [showUnavailableAssessmentMessage, setShowUnavailableAssessmentMessage] = useState(false);

  const handleYearChange = (year: Year) => {
    setSelectedYear(year);
    setSelectedBimestre('');
    setSelectedAssessment('');
    setShowUnavailableMessage(false);
    setShowBimestreSelect(false);
    setShowAssessmentSelect(false);

    // Se for terceiro ano, mostra o select de bimestre
    if (year === 'terceiro') {
      setTimeout(() => setShowBimestreSelect(true), 300);
    } else if (year) {
      // Mostra mensagem de indisponibilidade
      setShowUnavailableMessage(true);
    }
  };

  const handleBimestreChange = (bimestre: Bimestre) => {
    setSelectedBimestre(bimestre);
    setSelectedAssessment('');
    setShowUnavailableAssessmentMessage(false);
    setShowAssessmentSelect(false);

    // Para terceiro ano, mostra select de AV se bimestre for 1 ou 2
    if (selectedYear === 'terceiro' && (bimestre === '1' || bimestre === '2')) {
      setTimeout(() => setShowAssessmentSelect(true), 300);
    } else if (bimestre) {
      setShowUnavailableAssessmentMessage(true);
    }
  };

  const handleAssessmentChange = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowUnavailableAssessmentMessage(false);

    // Para bimestre 1, apenas AV2 disponível; para bimestre 2, AV1 disponível
    if ((selectedBimestre === '1' && assessment === 'AV2') || (selectedBimestre === '2' && assessment === 'AV1')) {
      // OK
    } else if (assessment) {
      setShowUnavailableAssessmentMessage(true);
    }
  };

  const getSimuladoPath = () => {
    if (selectedYear === 'terceiro' && selectedBimestre && selectedAssessment) {
      // Mapeia para a página de simulados com query params
      return `/simulados?year=${selectedYear}&bimestre=${selectedBimestre}&assessment=${selectedAssessment}`;
    }
    return '#';
  };

  const years = [
    { value: 'primeiro', label: '1º Ano' },
    { value: 'segundo', label: '2º Ano' },
    { value: 'terceiro', label: '3º Ano' },
    { value: 'quarto', label: '4º Ano' },
  ];

  const assessments = [
    { value: 'AV1', label: 'AV1 - Primeira Avaliação' },
    { value: 'AV2', label: 'AV2 - Segunda Avaliação' },
  ];

  const bimestres = [
    { value: '1', label: '1º Bimestre' },
    { value: '2', label: '2º Bimestre' },
    { value: '3', label: '3º Bimestre' },
    { value: '4', label: '4º Bimestre' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-800 mb-3">📚 Simulados Bernardo</h1>
          <p className="text-xl text-slate-600">Vamos começar! Selecione seu ano e avaliação</p>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Select de Ano */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-slate-700 mb-4">
              📅 Qual ano você está cursando?
            </label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value as Year)}
              className="w-full px-6 py-3 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white cursor-pointer hover:border-slate-400"
            >
              <option value="">-- Selecione um ano --</option>
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mensagem de Indisponibilidade */}
          {showUnavailableMessage && (
            <div className="mb-8 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl animate-in fade-in duration-300">
              <p className="text-lg text-amber-800 font-semibold">
                ⚠️ Conteúdo em Construção
              </p>
              <p className="text-amber-700 mt-2">
                Desculpe! O conteúdo do {selectedYear} ano ainda está sendo preparado. 
                No momento, temos simulados disponíveis apenas para o 3º ano. 
                Volte em breve! 🚀
              </p>
            </div>
          )}

          {/* Select de Bimestre (com fade-in) */}
          {showBimestreSelect && (
            <div className="animate-in fade-in duration-500 mb-8">
              <label className="block text-lg font-semibold text-slate-700 mb-4">
                📅 Qual bimestre você quer praticar?
              </label>
              <select
                value={selectedBimestre}
                onChange={(e) => handleBimestreChange(e.target.value as Bimestre)}
                className="w-full px-6 py-3 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white cursor-pointer hover:border-slate-400"
              >
                <option value="">-- Selecione um bimestre --</option>
                {bimestres.map((bimestre) => (
                  <option key={bimestre.value} value={bimestre.value}>
                    {bimestre.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Select de Avaliação (com fade-in) */}
          {showAssessmentSelect && (
            <div className="animate-in fade-in duration-500">
              <label className="block text-lg font-semibold text-slate-700 mb-4">
                📝 Qual avaliação você quer fazer?
              </label>
              <select
                value={selectedAssessment}
                onChange={(e) => handleAssessmentChange(e.target.value as Assessment)}
                className="w-full px-6 py-3 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:border-green-500 transition-colors bg-white cursor-pointer hover:border-slate-400 mb-6"
              >
                <option value="">-- Selecione uma avaliação --</option>
                {assessments.map((assessment) => (
                  <option key={assessment.value} value={assessment.value}>
                    {assessment.label}
                  </option>
                ))}
              </select>

              {/* Mensagem de Indisponibilidade para Avaliações */}
              {showUnavailableAssessmentMessage && (
                <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl animate-in fade-in duration-300">
                  <p className="text-lg text-amber-800 font-semibold">
                    ⚠️ Avaliação em Desenvolvimento
                  </p>
                  <p className="text-amber-700 mt-2">
                    Desculpe! O simulado da {selectedAssessment} do {selectedBimestre}º bimestre ainda está em desenvolvimento. 
                    No momento, temos apenas o simulado da AV2 do 1º bimestre e AV1 do 2º bimestre disponíveis. 
                    Volte em breve! 🚀
                  </p>
                </div>
              )}

              {/* Botão para continuar */}
              {((selectedBimestre === '1' && selectedAssessment === 'AV2') || (selectedBimestre === '2' && selectedAssessment === 'AV1')) && (
                <div className="animate-in fade-in duration-500">
                  <Link href={`/simulados?year=${selectedYear}&bimestre=${selectedBimestre}&assessment=${selectedAssessment}`}>
                    <button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg">
                      ✨ Começar Simulado {selectedAssessment}
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Informações auxiliares */}
          {selectedYear && !showUnavailableMessage && (
            <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-sm text-blue-700">
                💡 <strong>Dica:</strong> Cada bimestre possui duas avaliações (AV1 e AV2) com conteúdos específicos.
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-slate-600 text-sm">
          <p>Plataforma Interativa de Aprendizado para o Ensino Fundamental</p>
        </div>
      </div>
    </div>
  );
}
