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
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const handleAnswerChange = (questionId: number, answer: any) => {
    if (!isFinalized) {
      setUserAnswers((prev) => ({
        ...prev,
        [questionId]: answer,
      }));

      // Rola para a próxima questão após um pequeno delay
      const currentIndex = questions.findIndex((q) => q.id === questionId);
      const next = questions[currentIndex + 1];
      if (next) {
        setTimeout(() => {
          questionRefs.current[next.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
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

  return (
    <div className="page-shell">
      <div className="max-w-4xl mx-auto">
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

        {/* Questões */}
        <div className="space-y-6">
          {questions.map((question) => {
            const isAnswered = question.id in userAnswers;
            const isCorrect = isAnswered ? isAnswerCorrect(question.id) : null;
            const userAnswer = userAnswers[question.id];

            return (
              <div
                key={question.id}
                ref={(el) => { questionRefs.current[question.id] = el; }}
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
                {/* Número e Pontos */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      display: 'inline-block',
                      background: '#FFE0EE',
                      color: 'var(--bubble-deep)',
                      fontSize: 14,
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

                {/* Opções por tipo */}
                {question.type === 'multiple_choice' && question.options && (
                  <div className="space-y-3 mb-4">
                    {question.options.map((option) => {
                      const isOptionCorrect = option.id === question.correctAnswer;
                      const isOptionSelected = userAnswer === option.id;
                      const showCorrectIndicator = isFinalized && isOptionCorrect;
                      const showIncorrectIndicator = isFinalized && isOptionSelected && !isOptionCorrect;

                      return (
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
                            gap: 14,
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
                            fontSize: 14, fontWeight: 800,
                            background: showCorrectIndicator ? 'var(--grass)' : showIncorrectIndicator ? 'var(--bubble)' : isOptionSelected && !isFinalized ? 'var(--sky-deep)' : 'var(--line)',
                            color: (showCorrectIndicator || showIncorrectIndicator || (isOptionSelected && !isFinalized)) ? 'white' : 'var(--muted)',
                          }}>
                            {option.id.toUpperCase()}
                          </span>
                          {option.text}
                          {showCorrectIndicator && ' ✅'}
                          {showIncorrectIndicator && ' ❌'}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True/False Multiple */}
                {question.type === 'true_false_multiple' && question.items && (
                  <div className="space-y-3 mb-4">
                    {question.items.map((item) => {
                      const correct = question.correctAnswer as { [key: string]: string };
                      const correctValue = correct[item.id];
                      const selectedValue = userAnswer?.[item.id];
                      const isItemCorrect = selectedValue === correctValue;

                      return (
                        <div key={item.id} className="flex items-center gap-4">
                          <span className="flex-1 text-slate-800 font-semibold">{item.text}</span>
                          <div className="flex gap-2">
                            {['V', 'F'].map((option) => (
                              <button
                                key={option}
                                onClick={() =>
                                  handleAnswerChange(question.id, {
                                    ...userAnswer,
                                    [item.id]: option,
                                  })
                                }
                                disabled={isFinalized}
                                className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                                  selectedValue === option
                                    ? isFinalized
                                      ? isItemCorrect
                                        ? 'bg-green-500 text-white'
                                        : 'bg-red-500 text-white'
                                      : 'bg-blue-500 text-white'
                                    : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Matching */}
                {question.type === 'matching' && question.pairs && (
                  <div className="space-y-4 mb-4">
                    {question.pairs.map((pair) => {
                      const selected = userAnswer?.[pair.left.id];
                      const correct = (question.correctAnswer as { [key: string]: string })[
                        pair.left.id
                      ];
                      const isCorrectMatch = selected === correct;

                      return (
                        <div key={pair.left.id} className="flex items-center gap-4">
                          <span className="flex-1 font-semibold text-slate-800">
                            {pair.left.text}
                          </span>
                          <select
                            value={selected || ''}
                            onChange={(e) =>
                              handleAnswerChange(question.id, {
                                ...userAnswer,
                                [pair.left.id]: e.target.value,
                              })
                            }
                            disabled={isFinalized}
                            className={`p-2 rounded-xl border-2 font-semibold transition-all ${
                              selected
                                ? isFinalized
                                  ? isCorrectMatch
                                    ? 'border-green-500 bg-green-100 text-green-800'
                                    : 'border-red-500 bg-red-100 text-red-800'
                                  : 'border-blue-500 bg-blue-50'
                                : 'border-slate-300'
                            }`}
                          >
                            <option value="">--- Escolha ---</option>
                            {pair.right?.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.text}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Classification */}
                {question.type === 'classification' && question.items && (
                  <div className="space-y-3 mb-4">
                    {question.items.map((item) => {
                      const correct = question.correctAnswer as { [key: string]: string };
                      const correctValue = correct[item.id];
                      const selectedValue = userAnswer?.[item.id];
                      const isItemCorrect = selectedValue === correctValue;

                      return (
                        <div key={item.id} className="flex items-center gap-4">
                          <span className="flex-1 text-slate-800 font-semibold">{item.text}</span>
                          <div className="flex gap-2">
                            {['C', 'P'].map((option) => (
                              <button
                                key={option}
                                onClick={() =>
                                  handleAnswerChange(question.id, {
                                    ...userAnswer,
                                    [item.id]: option,
                                  })
                                }
                                disabled={isFinalized}
                                className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                                  selectedValue === option
                                    ? isFinalized
                                      ? isItemCorrect
                                        ? 'bg-green-500 text-white'
                                        : 'bg-red-500 text-white'
                                      : 'bg-blue-500 text-white'
                                    : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Dica Pedagógica (mostrada após erro) */}
                {isFinalized && !isCorrect && (
                  <div style={{ marginTop: 16, padding: 16, background: '#FFF8D6', border: '1.5px solid var(--sun)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontWeight: 700, color: '#8B6000', fontFamily: 'var(--font-nunito)' }}>💡 Dica para aprender:</p>
                    <p style={{ fontSize: 13, color: '#6B4A00', marginTop: 6, lineHeight: 1.5 }}>{question.tip}</p>
                  </div>
                )}

                {/* Dica Pedagógica (mostrada após acerto também) */}
                {isFinalized && isCorrect && (
                  <div style={{ marginTop: 16, padding: 16, background: 'rgba(237,255,245,.8)', border: '1.5px solid var(--grass)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontWeight: 700, color: 'var(--grass-deep)', fontFamily: 'var(--font-nunito)' }}>🌟 Curiosidade:</p>
                    <p style={{ fontSize: 13, color: '#1A7A3F', marginTop: 6, lineHeight: 1.5 }}>{question.tip}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botão Finalizar */}
        <button
          onClick={handleFinalize}
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
      </div>
    </div>
  );
}
