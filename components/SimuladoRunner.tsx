'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  startAttempt,
  getAttemptQuestions,
  submitAttemptAnswer,
  finishAttempt,
  ApiAttemptResult,
} from '@/lib/apiClient';
import { mapApiQuestion, buildAnswerBody, TemplateQuestion } from '@/lib/questionMapper';

interface SimuladoRunnerProps {
  simulationId: string;
}

type RunnerState = 'loading' | 'ready' | 'finished' | 'error';

export default function SimuladoRunner({ simulationId }: SimuladoRunnerProps) {
  const router = useRouter();
  const [state, setState] = useState<RunnerState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TemplateQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: unknown }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ApiAttemptResult | null>(null);

  useEffect(() => {
    void loadAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationId]);

  async function loadAttempt() {
    setState('loading');
    setCurrentIndex(0);
    setUserAnswers({});
    setResult(null);

    try {
      const attempt = await startAttempt(simulationId);
      const apiQuestions = await getAttemptQuestions(attempt.id);
      const mapped = apiQuestions.map(mapApiQuestion).sort((a, b) => a.order - b.order);

      setAttemptId(attempt.id);
      setQuestions(mapped);
      setState('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar o simulado');
      setState('error');
    }
  }

  function handleAnswerChange(questionId: string, answer: unknown) {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  async function handleConfirm() {
    if (!attemptId) return;

    const question = questions[currentIndex];
    const answer = userAnswers[question.id];

    setIsSubmitting(true);

    try {
      await submitAttemptAnswer(attemptId, question.id, buildAnswerBody(question.type, answer));

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const finalResult = await finishAttempt(attemptId);
        setResult(finalResult);
        setState('finished');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao enviar resposta');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (state === 'loading') {
    return (
      <div className="page-shell flex items-center justify-center">
        <p style={{ color: 'var(--muted)' }}>Preparando seu simulado...</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <p className="mb-4" style={{ color: 'var(--bubble-deep)' }}>{errorMessage}</p>
          <button className="btn btn--grass" onClick={() => router.push('/')}>Voltar ao início</button>
        </div>
      </div>
    );
  }

  if (state === 'finished' && result) {
    return <ResultScreen result={result} onRetry={loadAttempt} onExit={() => router.push('/')} />;
  }

  const question = questions[currentIndex];
  const userAnswer = userAnswers[question.id];
  const hasAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== '';
  const isLast = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="page-shell flex flex-col px-4 py-6 md:py-8">
      <div className="flex justify-between items-center mb-5 w-full max-w-2xl mx-auto">
        <button className="btn btn--ghost text-sm" onClick={() => router.push('/')} style={{ padding: '8px 16px' }}>
          ‹ Sair
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <span className="font-bold text-base" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
            Simulados Bernardo
          </span>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest hidden sm:block" style={{ color: 'var(--muted)' }}>
          QUESTÃO {currentIndex + 1}
        </span>
      </div>

      <div className="w-full max-w-2xl mx-auto mb-5 flex items-center gap-3">
        <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--line)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`, borderRadius: 999,
            background: 'linear-gradient(90deg, var(--bubble), var(--sky))', transition: 'width .4s ease',
          }} />
        </div>
        <span style={{ fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', flexShrink: 0 }}>
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      <div className="w-full max-w-2xl mx-auto bg-white rounded-[1.75rem] p-6 md:p-8" style={{ boxShadow: 'var(--shadow-3)' }}>
        <div className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold mb-5"
             style={{ background: '#FFE0EE', color: 'var(--bubble-deep)' }}>
          + Questão {currentIndex + 1}
        </div>

        <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, color: 'var(--ink)', fontSize: 18, lineHeight: 1.55, marginBottom: 24 }}>
          {question.text}
        </p>

        {question.type === 'multiple_choice' && question.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {question.options.map((option) => {
              const isSelected = userAnswer === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswerChange(question.id, option.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 18px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isSelected ? 'var(--bubble)' : 'var(--line)'}`,
                    background: isSelected ? '#FFF0F7' : 'white', display: 'flex', alignItems: 'center', gap: 14,
                    fontFamily: 'var(--font-nunito)', fontWeight: 600, color: 'var(--ink)', fontSize: 15,
                    cursor: 'pointer', boxShadow: 'var(--shadow-1)',
                  }}
                >
                  <span style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800,
                    background: isSelected ? 'var(--bubble)' : '#FFE9A3', color: isSelected ? 'white' : '#8B6000',
                  }}>
                    {option.id.toUpperCase()}
                  </span>
                  {option.text}
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'true_false_multiple' && question.items && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {question.items.map((item) => {
              const selectedValue = (userAnswer as Record<string, string> | undefined)?.[item.id];
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderRadius: 'var(--radius-md)', border: '2px solid var(--line)', background: 'white', boxShadow: 'var(--shadow-1)',
                }}>
                  <span style={{ flex: 1, fontFamily: 'var(--font-nunito)', fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>
                    {item.text}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['V', 'F'].map((opt) => (
                      <button key={opt}
                        onClick={() => handleAnswerChange(question.id, { ...(userAnswer as Record<string, string>), [item.id]: opt })}
                        style={{
                          width: 44, height: 44, borderRadius: 12, border: 'none',
                          fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 16,
                          background: selectedValue === opt ? (opt === 'V' ? 'var(--grass)' : 'var(--bubble)') : '#F0EDE8',
                          color: selectedValue === opt ? 'white' : 'var(--muted)', cursor: 'pointer',
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {question.type === 'matching' && question.pairs && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {question.pairs.map((pair) => {
              const selected = (userAnswer as Record<string, string> | undefined)?.[pair.left.id];
              return (
                <div key={pair.left.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderRadius: 'var(--radius-md)', border: '2px solid var(--line)', background: 'white', boxShadow: 'var(--shadow-1)',
                }}>
                  <span style={{ flex: 1, fontFamily: 'var(--font-nunito)', fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>
                    {pair.left.text}
                  </span>
                  <select
                    value={selected || ''}
                    onChange={(e) => handleAnswerChange(question.id, { ...(userAnswer as Record<string, string>), [pair.left.id]: e.target.value })}
                    style={{
                      padding: '8px 12px', borderRadius: 10, border: `2px solid ${selected ? 'var(--sky)' : 'var(--line)'}`,
                      fontFamily: 'var(--font-nunito)', fontWeight: 600, fontSize: 13,
                      background: selected ? '#F0F7FF' : 'white', color: 'var(--ink)', cursor: 'pointer',
                    }}
                  >
                    <option value="">— Escolha —</option>
                    {pair.right.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.text}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {question.type === 'classification' && question.items && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {question.items.map((item) => {
              const selectedValue = (userAnswer as Record<string, string> | undefined)?.[item.id];
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderRadius: 'var(--radius-md)', border: '2px solid var(--line)', background: 'white', boxShadow: 'var(--shadow-1)',
                }}>
                  <span style={{ flex: 1, fontFamily: 'var(--font-nunito)', fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>
                    {item.text}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['C', 'P'].map((opt) => (
                      <button key={opt}
                        onClick={() => handleAnswerChange(question.id, { ...(userAnswer as Record<string, string>), [item.id]: opt })}
                        style={{
                          width: 44, height: 44, borderRadius: 12, border: 'none',
                          fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 14,
                          background: selectedValue === opt ? 'var(--sky)' : '#F0EDE8',
                          color: selectedValue === opt ? 'white' : 'var(--muted)', cursor: 'pointer',
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: '1.5px solid var(--line)' }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {questions.map((q, i) => (
              <div key={q.id} style={{
                flex: 1, height: 6, borderRadius: 999,
                background: i === currentIndex ? 'var(--bubble)' : q.id in userAnswers ? 'var(--grass)' : 'var(--line)',
                transition: 'background .2s',
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {currentIndex > 0 ? (
              <button onClick={handleBack} style={{
                background: 'white', border: '2px solid var(--line)', borderRadius: 'var(--radius-pill)',
                padding: '10px 20px', fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 15,
                color: 'var(--ink-soft)', cursor: 'pointer', boxShadow: 'var(--shadow-1)',
              }}>
                ← Anterior
              </button>
            ) : <div />}

            <button
              onClick={handleConfirm}
              disabled={!hasAnswer || isSubmitting}
              style={{
                background: hasAnswer ? 'white' : 'var(--line)',
                border: `2px solid ${hasAnswer ? 'var(--line)' : 'transparent'}`,
                borderRadius: 'var(--radius-pill)', padding: '10px 24px',
                fontFamily: 'var(--font-fredoka)', fontWeight: 700, fontSize: 16,
                color: hasAnswer ? 'var(--ink)' : 'var(--muted)',
                cursor: hasAnswer ? 'pointer' : 'not-allowed',
                boxShadow: hasAnswer ? 'var(--shadow-1)' : 'none',
              }}
            >
              {isSubmitting ? 'Enviando...' : isLast ? 'Finalizar ✓' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultScreen({
  result,
  onRetry,
  onExit,
}: {
  result: ApiAttemptResult;
  onRetry: () => void;
  onExit: () => void;
}) {
  const score = Number(result.attempt.score ?? 0);
  const maxScore = Number(result.attempt.maxScore);
  const pct = Math.round((score / maxScore) * 100);
  const circumference = 2 * Math.PI * 44;
  const strokeDash = (score / maxScore) * circumference;
  const motivational = getMotivationalMessage(pct);

  return (
    <div className="page-shell">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
            📚 Resultado
          </span>
          <span className="badge">Concluído</span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 flex flex-col gap-5">
            <div className="card card--hero flex items-center gap-6">
              <svg width="110" height="110" viewBox="0 0 100 100" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" strokeWidth="10" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--grass)" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${strokeDash} ${circumference}`} />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
                      style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px', fontFamily: 'var(--font-fredoka)', fill: 'var(--ink)' }}>
                  <tspan fontSize="24" fontWeight="800">{score}</tspan>
                  <tspan fontSize="13" fill="var(--muted)"> /{maxScore}</tspan>
                </text>
              </svg>

              <div>
                <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
                  {motivational.emoji} {motivational.title}!
                </h2>
                <p className="text-sm mb-3" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
                  {motivational.message}
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(237,255,245,.9)',
                  borderRadius: 999, padding: '5px 14px', fontSize: 13, fontWeight: 700, color: 'var(--grass-deep)',
                }}>
                  ✅ {pct}% de aproveitamento
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg mb-4" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
                📊 Análise detalhada
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {result.questions.map((question, idx) => (
                  <div key={question.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 10, flexShrink: 0,
                        background: question.isCorrect ? 'rgba(237,255,245,.9)' : 'rgba(255,240,247,.9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                      }}>
                        {question.isCorrect ? '✅' : '❌'}
                      </div>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)' }}>
                        Questão {idx + 1}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: question.isCorrect ? 'var(--grass-deep)' : 'var(--bubble-deep)' }}>
                        {question.isCorrect ? `+${question.pointsEarned} pt` : '0 pt'}
                      </div>
                    </div>
                    {!question.isCorrect && question.tip && (
                      <div style={{ marginBottom: 8, padding: '10px 14px', background: '#FFF8D6', border: '1.5px solid var(--sun)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: '#6B4A00', lineHeight: 1.5 }}>
                        💡 {question.tip}
                      </div>
                    )}
                    {idx < result.questions.length - 1 && <div style={{ height: 1, background: 'var(--line)' }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="text-xs font-bold" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                O que fazer agora?
              </p>
              <button className="btn btn--sky w-full" onClick={onRetry}>🔄 Refazer simulado</button>
              <button className="btn btn--lilac w-full" onClick={onExit}>📚 Outra disciplina</button>
              <button className="btn btn--ghost w-full" onClick={onExit}>🏠 Voltar ao início</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getMotivationalMessage(percentage: number) {
  if (percentage === 100) {
    return { emoji: '🏆', title: 'Perfeição Total', message: 'Você é um verdadeiro campeão! Acertou TODAS as questões! 🌟' };
  }
  if (percentage >= 90) {
    return { emoji: '⭐', title: 'Excelente', message: 'Você é incrível! Apenas um detalhe faltou para a perfeição! 🚀' };
  }
  if (percentage >= 70) {
    return { emoji: '👏', title: 'Muito Bom', message: 'Parabéns! Você está no caminho certo! Siga estudando! 📚' };
  }
  if (percentage >= 50) {
    return { emoji: '💪', title: 'Bom Início', message: 'Você está aprendendo! Continue praticando para melhorar! 🎯' };
  }
  return { emoji: '🌱', title: 'Próxima Vez', message: 'Você está no caminho! Revise os conteúdos e tente novamente! 💡' };
}
