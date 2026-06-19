'use client';

import { useState, useRef, ReactNode } from 'react';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  type: 'multiple_choice' | 'true_false_multiple' | 'matching' | 'classification';
  text: string;
  options?: Option[];
  pairs?: { left: { id: string; text: string }; right?: { id: string; text: string }[] }[];
  items?: { id: string; text: string }[];
  correctAnswer?: string | string[] | { [key: string]: string };
  tip: string;
  points: number;
}

interface SimuladoTemplateProps {
  title: string;
  subtitle: string;
  emoji: string;
  questions: Question[];
}

export default function SimuladoTemplate({
  title,
  subtitle,
  emoji,
  questions,
}: SimuladoTemplateProps) {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: any }>({});
  const [isFinalized, setIsFinalized] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Mantido apenas para compatibilidade com tipos mas não usado no quiz
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const handleAnswerChange = (questionId: number, answer: any) => {
    if (!isFinalized) {
      setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
    }
  };

  const handleConfirm = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinalize();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalize = () => {
    setIsFinalized(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      if (question.type === 'multiple_choice') {
        if (userAnswer === question.correctAnswer) {
          score += question.points;
        }
      } else if (question.type === 'true_false_multiple') {
        const correct = question.correctAnswer as { [key: string]: string };
        let allCorrect = true;
        for (const itemId in correct) {
          if (userAnswer?.[itemId] !== correct[itemId]) {
            allCorrect = false;
            break;
          }
        }
        if (allCorrect) {
          score += question.points;
        }
      } else if (question.type === 'matching') {
        const correct = question.correctAnswer as { [key: string]: string };
        let allCorrect = true;
        for (const leftId in correct) {
          if (userAnswer?.[leftId] !== correct[leftId]) {
            allCorrect = false;
            break;
          }
        }
        if (allCorrect) {
          score += question.points;
        }
      } else if (question.type === 'classification') {
        const correct = question.correctAnswer as { [key: string]: string };
        let allCorrect = true;
        for (const itemId in correct) {
          if (userAnswer?.[itemId] !== correct[itemId]) {
            allCorrect = false;
            break;
          }
        }
        if (allCorrect) {
          score += question.points;
        }
      }
    });
    return score;
  };

  const isAnswerCorrect = (questionId: number): boolean => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return false;

    const userAnswer = userAnswers[questionId];

    if (question.type === 'multiple_choice') {
      return userAnswer === question.correctAnswer;
    } else if (question.type === 'true_false_multiple') {
      const correct = question.correctAnswer as { [key: string]: string };
      for (const itemId in correct) {
        if (userAnswer?.[itemId] !== correct[itemId]) {
          return false;
        }
      }
      return true;
    } else if (question.type === 'matching') {
      const correct = question.correctAnswer as { [key: string]: string };
      for (const leftId in correct) {
        if (userAnswer?.[leftId] !== correct[leftId]) {
          return false;
        }
      }
      return true;
    } else if (question.type === 'classification') {
      const correct = question.correctAnswer as { [key: string]: string };
      for (const itemId in correct) {
        if (userAnswer?.[itemId] !== correct[itemId]) {
          return false;
        }
      }
      return true;
    }
    return false;
  };

  const getMotivationalMessage = (score: number) => {
    const percentage = (score / (questions.length * 1.0)) * 100;
    if (percentage === 100) {
      return {
        emoji: '🏆',
        title: 'Perfeição Total!',
        message: 'Você é um verdadeiro campeão! Acertou TODAS as questões! 🌟',
        color: 'from-yellow-400 to-orange-400',
      };
    } else if (percentage >= 90) {
      return {
        emoji: '⭐',
        title: 'Excelente!',
        message: 'Você é incrível! Apenas um detalhe faltou para a perfeição! 🚀',
        color: 'from-blue-400 to-purple-400',
      };
    } else if (percentage >= 70) {
      return {
        emoji: '👏',
        title: 'Muito Bom!',
        message: 'Parabéns! Você está no caminho certo! Siga estudando! 📚',
        color: 'from-green-400 to-emerald-400',
      };
    } else if (percentage >= 50) {
      return {
        emoji: '💪',
        title: 'Bom Início!',
        message: 'Você está aprendendo! Continue praticando para melhorar! 🎯',
        color: 'from-orange-400 to-red-400',
      };
    } else {
      return {
        emoji: '🌱',
        title: 'Próxima Vez!',
        message: 'Você está no caminho! Revise os conteúdos e tente novamente! 💡',
        color: 'from-pink-400 to-rose-400',
      };
    }
  };

  const finalScore = calculateScore();
  const motivationalData = getMotivationalMessage(finalScore);

  if (!hasStarted) {
    return (
      <div className="page-shell flex items-center justify-center">
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

  if (isFinalized) {
    const pct = Math.round((finalScore / questions.length) * 100);
    const circumference = 2 * Math.PI * 44;
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
                          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)' }}>
                            Questão {question.id}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: correct ? 'var(--grass-deep)' : 'var(--bubble-deep)' }}>
                            {correct ? `+${question.points} pt` : '0 pt'}
                          </div>
                        </div>
                        {!correct && (
                          <div style={{ marginBottom: 8, padding: '10px 14px', background: '#FFF8D6', border: '1.5px solid var(--sun)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: '#6B4A00', lineHeight: 1.5 }}>
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

  const question = questions[currentQuestionIndex];
  const userAnswer = userAnswers[question.id];
  const hasAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== '';
  const isLast = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="page-shell flex flex-col px-4 py-6 md:py-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-5 w-full max-w-2xl mx-auto">
        <button className="btn btn--ghost text-sm" onClick={() => setHasStarted(false)}
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
            04 · QUESTÃO
          </span>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5 font-bold text-sm"
               style={{ background: '#FFF8D6', color: '#8B6000', boxShadow: 'var(--shadow-1)' }}>
            <span>7</span>
            <span className="hidden sm:inline">Dias seguidos</span>
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="w-full max-w-2xl mx-auto mb-5 flex items-center gap-3">
        <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: 999,
            background: 'linear-gradient(90deg, var(--bubble), var(--sky))',
            transition: 'width .4s ease',
          }} />
        </div>
        <span style={{ fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', flexShrink: 0 }}>
          {currentQuestionIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Card da questão */}
      <div className="w-full max-w-2xl mx-auto bg-white rounded-[1.75rem] p-6 md:p-8"
           style={{ boxShadow: 'var(--shadow-3)' }}>

        {/* Tag da questão */}
        <div className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold mb-5"
             style={{ background: '#FFE0EE', color: 'var(--bubble-deep)' }}>
          + Questão {currentQuestionIndex + 1}
        </div>

        {/* Texto da questão */}
        <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, color: 'var(--ink)', fontSize: 18, lineHeight: 1.55, marginBottom: 24 }}>
          {question.text}
        </p>

        {/* Multiple choice */}
        {question.type === 'multiple_choice' && question.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {question.options.map((option) => {
              const isSelected = userAnswer === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswerChange(question.id, option.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isSelected ? 'var(--bubble)' : 'var(--line)'}`,
                    background: isSelected ? '#FFF0F7' : 'white',
                    display: 'flex', alignItems: 'center', gap: 14,
                    fontFamily: 'var(--font-nunito)', fontWeight: 600,
                    color: 'var(--ink)', fontSize: 15,
                    cursor: 'pointer', transition: 'all .15s',
                    boxShadow: 'var(--shadow-1)',
                  }}
                >
                  <span style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800,
                    background: isSelected ? 'var(--bubble)' : '#FFE9A3',
                    color: isSelected ? 'white' : '#8B6000',
                  }}>
                    {option.id.toUpperCase()}
                  </span>
                  {option.text}
                </button>
              );
            })}
          </div>
        )}

        {/* True/False Multiple */}
        {question.type === 'true_false_multiple' && question.items && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {question.items.map((item) => {
              const selectedValue = userAnswer?.[item.id];
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--line)', background: 'white',
                  boxShadow: 'var(--shadow-1)',
                }}>
                  <span style={{ flex: 1, fontFamily: 'var(--font-nunito)', fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>
                    {item.text}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['V', 'F'].map((opt) => (
                      <button key={opt}
                        onClick={() => handleAnswerChange(question.id, { ...userAnswer, [item.id]: opt })}
                        style={{
                          width: 44, height: 44, borderRadius: 12, border: 'none',
                          fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 16,
                          background: selectedValue === opt ? (opt === 'V' ? 'var(--grass)' : 'var(--bubble)') : '#F0EDE8',
                          color: selectedValue === opt ? 'white' : 'var(--muted)',
                          cursor: 'pointer', transition: 'all .15s',
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Matching */}
        {question.type === 'matching' && question.pairs && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {question.pairs.map((pair) => {
              const selected = userAnswer?.[pair.left.id];
              return (
                <div key={pair.left.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--line)', background: 'white',
                  boxShadow: 'var(--shadow-1)',
                }}>
                  <span style={{ flex: 1, fontFamily: 'var(--font-nunito)', fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>
                    {pair.left.text}
                  </span>
                  <select
                    value={selected || ''}
                    onChange={(e) => handleAnswerChange(question.id, { ...userAnswer, [pair.left.id]: e.target.value })}
                    style={{
                      padding: '8px 12px', borderRadius: 10, border: `2px solid ${selected ? 'var(--sky)' : 'var(--line)'}`,
                      fontFamily: 'var(--font-nunito)', fontWeight: 600, fontSize: 13,
                      background: selected ? '#F0F7FF' : 'white', color: 'var(--ink)', cursor: 'pointer',
                    }}
                  >
                    <option value="">— Escolha —</option>
                    {pair.right?.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.text}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {/* Classification */}
        {question.type === 'classification' && question.items && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {question.items.map((item) => {
              const selectedValue = userAnswer?.[item.id];
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--line)', background: 'white',
                  boxShadow: 'var(--shadow-1)',
                }}>
                  <span style={{ flex: 1, fontFamily: 'var(--font-nunito)', fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>
                    {item.text}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['C', 'P'].map((opt) => (
                      <button key={opt}
                        onClick={() => handleAnswerChange(question.id, { ...userAnswer, [item.id]: opt })}
                        style={{
                          width: 44, height: 44, borderRadius: 12, border: 'none',
                          fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 14,
                          background: selectedValue === opt ? 'var(--sky)' : '#F0EDE8',
                          color: selectedValue === opt ? 'white' : 'var(--muted)',
                          cursor: 'pointer', transition: 'all .15s',
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer do card: barra segmentada + navegação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: '1.5px solid var(--line)' }}>
          {/* Barra segmentada — uma fatia por questão, sem quebra de linha */}
          <div style={{ display: 'flex', gap: 3 }}>
            {questions.map((q, i) => (
              <div key={q.id} style={{
                flex: 1, height: 6, borderRadius: 999,
                background: i === currentQuestionIndex
                  ? 'var(--bubble)'
                  : q.id in userAnswers
                    ? 'var(--grass)'
                    : 'var(--line)',
                transition: 'background .2s',
              }} />
            ))}
          </div>

          {/* Botões de navegação */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {currentQuestionIndex > 0 ? (
              <button
                onClick={handleBack}
                style={{
                  background: 'white',
                  border: '2px solid var(--line)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '10px 20px',
                  fontFamily: 'var(--font-fredoka)',
                  fontWeight: 700, fontSize: 15,
                  color: 'var(--ink-soft)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-1)',
                  transition: 'all .15s',
                }}
              >
                ← Anterior
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleConfirm}
              disabled={!hasAnswer}
              style={{
                background: hasAnswer ? 'white' : 'var(--line)',
                border: `2px solid ${hasAnswer ? 'var(--line)' : 'transparent'}`,
                borderRadius: 'var(--radius-pill)',
                padding: '10px 24px',
                fontFamily: 'var(--font-fredoka)',
                fontWeight: 700, fontSize: 16,
                color: hasAnswer ? 'var(--ink)' : 'var(--muted)',
                cursor: hasAnswer ? 'pointer' : 'not-allowed',
                boxShadow: hasAnswer ? 'var(--shadow-1)' : 'none',
                transition: 'all .15s',
              }}
            >
              {isLast ? 'Finalizar ✓' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>

      {/* Pular para revisão */}
      <div className="w-full max-w-2xl mx-auto mt-4 text-center">
        <button
          onClick={handleFinalize}
          style={{
            background: 'white', border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius-pill)', padding: '10px 24px',
            fontSize: 14, fontWeight: 600, color: 'var(--muted)',
            cursor: 'pointer', boxShadow: 'var(--shadow-1)',
          }}
        >
          Pular para revisão (demo)
        </button>
      </div>
    </div>
  );
}
