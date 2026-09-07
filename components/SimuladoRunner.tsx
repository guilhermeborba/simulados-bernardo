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
import {
  mapApiQuestion,
  buildAnswerBody,
  parseStoredAnswer,
  TemplateQuestion,
} from '@/lib/questionMapper';
import { DEFAULT_TIER, Tier, tierForSchoolYear } from '@/lib/tier';

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
  const [tier, setTier] = useState<Tier>(DEFAULT_TIER);
  const [heading, setHeading] = useState('Simulados Bernardo');
  // Respostas já gravadas no servidor, para não reenviar o que não mudou.
  const [savedAnswers, setSavedAnswers] = useState<{ [questionId: string]: unknown }>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    void loadAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationId]);

  useEffect(() => {
    if (state !== 'ready' || startedAt === null) return;

    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [state, startedAt]);

  async function loadAttempt() {
    setState('loading');
    setCurrentIndex(0);
    setUserAnswers({});
    setSavedAnswers({});
    setElapsed(0);
    setResult(null);

    try {
      const attempt = await startAttempt(simulationId);
      const apiQuestions = await getAttemptQuestions(attempt.id);
      const mapped = apiQuestions.map(mapApiQuestion).sort((a, b) => a.order - b.order);

      const attemptTier = tierForSchoolYear(attempt.simulation?.schoolYear);
      setTier(attemptTier);
      setHeading(
        attemptTier === 'ludico' || !attempt.simulation
          ? 'Simulados Bernardo'
          : [attempt.simulation.discipline.name, attempt.simulation.subtitle]
              .filter(Boolean)
              .join(' · '),
      );

      const startedAtMs = attempt.startedAt ? Date.parse(attempt.startedAt) : Date.now();
      setStartedAt(Number.isNaN(startedAtMs) ? Date.now() : startedAtMs);

      // Retomada: recupera o que já foi respondido e abre na primeira questão
      // em aberto, em vez de jogar o aluno de volta na questão 1.
      const restored: { [questionId: string]: unknown } = {};
      apiQuestions.forEach((apiQuestion) => {
        const question = mapped.find((item) => item.id === apiQuestion.id);
        if (!question) return;

        const answer = parseStoredAnswer(question.type, apiQuestion.answer);
        if (answer !== undefined) {
          restored[question.id] = answer;
        }
      });

      const firstUnanswered = mapped.findIndex((question) => !(question.id in restored));

      setUserAnswers(restored);
      setSavedAnswers(restored);
      setCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
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

  /**
   * Grava a resposta da questão informada, se houver e se tiver mudado desde
   * o último envio. Como agora dá para pular de questão sem passar pelo botão
   * de confirmar, toda saída de questão precisa persistir — senão a resposta
   * ficaria só no estado local e a correção do servidor a trataria como vazia.
   */
  async function persistAnswer(index: number) {
    if (!attemptId) return;

    const question = questions[index];
    if (!question) return;

    const answer = userAnswers[question.id];
    if (answer === undefined || answer === null || answer === '') return;
    if (JSON.stringify(savedAnswers[question.id]) === JSON.stringify(answer)) return;

    await submitAttemptAnswer(attemptId, question.id, buildAnswerBody(question.type, answer));
    setSavedAnswers((prev) => ({ ...prev, [question.id]: answer }));
  }

  function goToIndex(index: number) {
    setCurrentIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function finishNow() {
    if (!attemptId) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await persistAnswer(currentIndex);
      const finalResult = await finishAttempt(attemptId);
      setResult(finalResult);
      setState('finished');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao enviar resposta');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirm() {
    if (!attemptId) return;

    if (currentIndex === questions.length - 1) {
      await finishNow();
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await persistAnswer(currentIndex);
      goToIndex(currentIndex + 1);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao enviar resposta');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNavigate(index: number) {
    if (index === currentIndex || isSubmitting) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await persistAnswer(currentIndex);
      goToIndex(index);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao enviar resposta');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      void handleNavigate(currentIndex - 1);
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
    return (
      <ResultScreen
        result={result}
        tier={tier}
        heading={heading}
        onRetry={loadAttempt}
        onExit={() => router.push('/')}
      />
    );
  }

  const question = questions[currentIndex];
  const userAnswer = userAnswers[question.id];
  const hasAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== '';
  const isLast = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = questions.filter((q) => q.id in userAnswers).length;
  // Com o navegador dá para responder tudo e parar no meio da prova, então a
  // saída não pode existir só na última questão.
  const canFinishFromHere = tier !== 'ludico' && !isLast && answeredCount === questions.length;

  return (
    <div data-tier={tier} className="sim-shell page-shell flex flex-col px-4 py-6 md:py-8">
      <div className="flex justify-between items-center mb-5 w-full max-w-2xl mx-auto gap-3">
        <button className="sim-btn sim-btn--ghost text-sm" onClick={() => router.push('/')}>
          ‹ Sair
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {tier === 'ludico' && <span className="text-xl">📚</span>}
          <span className="sim-brand font-bold text-base truncate">{heading}</span>
        </div>
        {tier === 'ludico' ? (
          <span className="sim-step hidden sm:block flex-shrink-0">
            Questão {currentIndex + 1}
          </span>
        ) : (
          <span
            className="sim-timer flex-shrink-0"
            title="Tempo desde o início da tentativa"
            aria-label={`Tempo decorrido: ${formatDuration(elapsed)}`}
          >
            {formatDuration(elapsed)}
          </span>
        )}
      </div>

      <div className="w-full max-w-2xl mx-auto mb-5 flex items-center gap-3">
        <div className="sim-track">
          <div className="sim-track-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="sim-count">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      <div className="sim-card w-full max-w-2xl mx-auto">
        <div className="sim-chip">
          {tier === 'ludico' ? `+ Questão ${currentIndex + 1}` : `Questão ${currentIndex + 1}`}
        </div>

        <p className="sim-statement">{question.text}</p>

        {question.type === 'multiple_choice' && question.options && (
          <div className="flex flex-col gap-2.5 mb-6">
            {question.options.map((option) => {
              const isSelected = userAnswer === option.id;
              return (
                <button
                  key={option.id}
                  className="sim-opt"
                  aria-pressed={isSelected}
                  onClick={() => handleAnswerChange(question.id, option.id)}
                >
                  <span className="sim-bullet">{option.id.toUpperCase()}</span>
                  {option.text}
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'true_false_multiple' && question.items && (
          <div className="flex flex-col gap-2.5 mb-6">
            {question.items.map((item) => {
              const selectedValue = (userAnswer as Record<string, string> | undefined)?.[item.id];
              return (
                <div key={item.id} className="sim-row">
                  <span className="sim-row-text">{item.text}</span>
                  <div className="flex gap-2">
                    {['V', 'F'].map((opt) => (
                      <button
                        key={opt}
                        className="sim-vf"
                        data-value={opt}
                        aria-pressed={selectedValue === opt}
                        onClick={() =>
                          handleAnswerChange(question.id, {
                            ...(userAnswer as Record<string, string>),
                            [item.id]: opt,
                          })
                        }
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {question.type === 'matching' && question.pairs && (
          <div className="flex flex-col gap-2.5 mb-6">
            {question.pairs.map((pair) => {
              const selected = (userAnswer as Record<string, string> | undefined)?.[pair.left.id];
              return (
                <div key={pair.left.id} className="sim-row">
                  <span className="sim-row-text">{pair.left.text}</span>
                  <select
                    className="sim-select"
                    data-filled={Boolean(selected)}
                    value={selected || ''}
                    onChange={(e) =>
                      handleAnswerChange(question.id, {
                        ...(userAnswer as Record<string, string>),
                        [pair.left.id]: e.target.value,
                      })
                    }
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
          <div className="flex flex-col gap-2.5 mb-6">
            {question.items.map((item) => {
              const selectedValue = (userAnswer as Record<string, string> | undefined)?.[item.id];
              return (
                <div key={item.id} className="sim-row">
                  <span className="sim-row-text">{item.text}</span>
                  <div className="flex gap-2">
                    {['C', 'P'].map((opt) => (
                      <button
                        key={opt}
                        className="sim-vf"
                        aria-pressed={selectedValue === opt}
                        onClick={() =>
                          handleAnswerChange(question.id, {
                            ...(userAnswer as Record<string, string>),
                            [item.id]: opt,
                          })
                        }
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4 sim-divider">
          {errorMessage && <p className="sim-error">{errorMessage}</p>}

          {tier === 'ludico' ? (
            <div className="flex gap-[3px]">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className="sim-seg"
                  data-state={i === currentIndex ? 'current' : q.id in userAnswers ? 'answered' : 'pending'}
                />
              ))}
            </div>
          ) : (
            <div className="sim-nav" role="group" aria-label="Ir para uma questão">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  className="sim-nav-item"
                  data-state={i === currentIndex ? 'current' : q.id in userAnswers ? 'answered' : 'pending'}
                  aria-current={i === currentIndex ? 'true' : undefined}
                  aria-label={`Questão ${i + 1}${q.id in userAnswers ? ', respondida' : ''}`}
                  onClick={() => void handleNavigate(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            {currentIndex > 0 ? (
              <button className="sim-btn sim-btn--ghost" onClick={handleBack} disabled={isSubmitting}>
                ← Anterior
              </button>
            ) : <div />}

            <div className="flex items-center gap-3 ml-auto">
              {tier !== 'ludico' && (
                <span className="sim-answered-count">
                  {answeredCount} de {questions.length} respondidas
                </span>
              )}

              {canFinishFromHere && (
                <button
                  className="sim-btn sim-btn--ghost"
                  onClick={() => void finishNow()}
                  disabled={isSubmitting}
                >
                  {finishLabel(tier)}
                </button>
              )}

              <button
                className="sim-btn sim-btn--primary"
                onClick={handleConfirm}
                disabled={!hasAnswer || isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : isLast ? finishLabel(tier) : confirmLabel(tier)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Sem horas até 59:59; com horas a partir daí — prova longa passa de uma hora. */
function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

function confirmLabel(tier: Tier) {
  return tier === 'exame' ? 'Responder' : 'Confirmar';
}

function finishLabel(tier: Tier) {
  return tier === 'ludico' ? 'Finalizar ✓' : 'Finalizar';
}

function ResultScreen({
  result,
  tier,
  heading,
  onRetry,
  onExit,
}: {
  result: ApiAttemptResult;
  tier: Tier;
  heading: string;
  onRetry: () => void;
  onExit: () => void;
}) {
  const score = Number(result.attempt.score ?? 0);
  const maxScore = Number(result.attempt.maxScore);
  const pct = Math.round((score / maxScore) * 100);
  const circumference = 2 * Math.PI * 44;
  const strokeDash = (score / maxScore) * circumference;
  const feedback = getFeedback(pct, tier);

  return (
    <div data-tier={tier} className="sim-shell page-shell">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-3">
          <span className="sim-brand text-xl font-bold truncate">
            {tier === 'ludico' ? '📚 Resultado' : heading}
          </span>
          <span className="sim-chip flex-shrink-0" style={{ marginBottom: 0 }}>Concluído</span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 flex flex-col gap-5 w-full">
            <div className="sim-card flex items-center gap-6">
              <svg width="110" height="110" viewBox="0 0 100 100" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--t-line)" strokeWidth="10" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--t-accent)" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${strokeDash} ${circumference}`} />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
                      style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px', fontFamily: 'var(--t-font-ui)', fill: 'var(--t-ink)' }}>
                  <tspan fontSize="24" fontWeight="800">{score}</tspan>
                  <tspan fontSize="13" fill="var(--t-muted)"> /{maxScore}</tspan>
                </text>
              </svg>

              <div>
                <h2 className="sim-brand text-2xl mb-1">{feedback.title}</h2>
                <p className="text-sm mb-3" style={{ color: 'var(--t-muted)', lineHeight: 1.5 }}>
                  {feedback.message}
                </p>
                <div className="sim-chip" style={{ marginBottom: 0 }}>
                  {pct}% de aproveitamento
                </div>
              </div>
            </div>

            <div className="sim-card">
              <h3 className="sim-brand text-lg mb-4">
                {tier === 'ludico' ? '📊 Análise detalhada' : 'Análise detalhada'}
              </h3>
              <div className="flex flex-col">
                {result.questions.map((question, idx) => (
                  <div key={question.id}>
                    <div className="flex items-center gap-3 py-2.5">
                      <div className="sim-mark" data-correct={question.isCorrect}>
                        {tier === 'ludico'
                          ? (question.isCorrect ? '✅' : '❌')
                          : (question.isCorrect ? '✓' : '✕')}
                      </div>
                      <div className="flex-1 text-sm font-semibold" style={{ color: 'var(--t-ink-soft)' }}>
                        Questão {idx + 1}
                      </div>
                      <div className="text-sm font-bold" style={{ color: question.isCorrect ? 'var(--t-correct)' : 'var(--t-muted)' }}>
                        {question.isCorrect ? `+${question.pointsEarned} pt` : '0 pt'}
                      </div>
                    </div>
                    {!question.isCorrect && question.tip && (
                      <div className="sim-tip">
                        {tier === 'ludico' ? '💡 ' : ''}{question.tip}
                      </div>
                    )}
                    {idx < result.questions.length - 1 && <div style={{ height: 1, background: 'var(--t-line)' }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full md:w-60 flex-shrink-0 flex flex-col gap-3">
            <div className="sim-card flex flex-col gap-2.5">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--t-muted)' }}>
                O que fazer agora?
              </p>
              <button className="sim-btn sim-btn--primary w-full" onClick={onRetry}>
                {tier === 'ludico' ? '🔄 Refazer simulado' : 'Refazer simulado'}
              </button>
              <button className="sim-btn sim-btn--ghost w-full" onClick={onExit}>
                {tier === 'ludico' ? '🏠 Voltar ao início' : 'Voltar ao início'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getFeedback(percentage: number, tier: Tier) {
  // Na faixa de prova o retorno é factual: quem estuda para uma avaliação real
  // quer saber onde está, não ser parabenizado.
  if (tier === 'exame') {
    if (percentage >= 90) return { title: 'Desempenho alto', message: 'Conteúdo dominado. Revise apenas os itens marcados como incorretos.' };
    if (percentage >= 70) return { title: 'Desempenho satisfatório', message: 'Base sólida, com lacunas pontuais. Priorize os assuntos das questões erradas.' };
    if (percentage >= 50) return { title: 'Desempenho parcial', message: 'Metade do conteúdo ainda não está consolidada. Recomendado revisar antes de repetir.' };
    return { title: 'Desempenho abaixo do esperado', message: 'Retome o material do módulo antes de uma nova tentativa.' };
  }

  if (tier === 'jovem') {
    if (percentage === 100) return { title: 'Gabaritou', message: 'Acertou todas. Esse conteúdo está dominado.' };
    if (percentage >= 90) return { title: 'Muito bom', message: 'Faltou pouco para o total. Dá uma olhada no que escapou.' };
    if (percentage >= 70) return { title: 'Bom resultado', message: 'Você está no caminho. Foca nos assuntos das questões que errou.' };
    if (percentage >= 50) return { title: 'Dá pra melhorar', message: 'Metade do conteúdo ainda precisa de revisão.' };
    return { title: 'Vale revisar', message: 'Retoma a matéria e tenta de novo — a segunda vez costuma render bem mais.' };
  }

  if (percentage === 100) return { title: '🏆 Perfeição Total', message: 'Você é um verdadeiro campeão! Acertou TODAS as questões! 🌟' };
  if (percentage >= 90) return { title: '⭐ Excelente', message: 'Você é incrível! Apenas um detalhe faltou para a perfeição! 🚀' };
  if (percentage >= 70) return { title: '👏 Muito Bom', message: 'Parabéns! Você está no caminho certo! Siga estudando! 📚' };
  if (percentage >= 50) return { title: '💪 Bom Início', message: 'Você está aprendendo! Continue praticando para melhorar! 🎯' };
  return { title: '🌱 Próxima Vez', message: 'Você está no caminho! Revise os conteúdos e tente novamente! 💡' };
}
