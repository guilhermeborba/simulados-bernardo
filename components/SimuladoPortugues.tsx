'use client';

import { useState } from 'react';

interface Option {
  id: string;
  text: string;
}

interface Question {
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

const questions: Question[] = [
  {
    id: 1,
    type: 'multiple_choice',
    text: 'Leia o texto abaixo e responda: Antes de começar o jogo, todos dizem "stop" e mostram uma quantidade de dedos. Essa orientação indica:',
    options: [
      { id: 'a', text: 'O final do jogo' },
      { id: 'b', text: 'A escolha da letra' },
      { id: 'c', text: 'A contagem de pontos' },
      { id: 'd', text: 'A troca de jogadores' },
    ],
    correctAnswer: 'b',
    tip: 'Sempre pense: o "stop" com dedos serve pra definir algo antes do jogo começar → isso é a letra.',
    points: 1.0,
  },
  {
    id: 2,
    type: 'multiple_choice',
    text: 'Observe as palavras: quarto – queijo. Em qual palavra o U é pronunciado?',
    options: [
      { id: 'a', text: 'quarto' },
      { id: 'b', text: 'queijo' },
    ],
    correctAnswer: 'a',
    tip: 'Em QU + A (qua) → o U aparece no som (quar-to). Em QUE / QUI → geralmente o U "some" (quei-jo)',
    points: 1.0,
  },
  {
    id: 3,
    type: 'true_false_multiple',
    text: 'Marque V para verdadeiro e F para falso:',
    items: [
      { id: '1', text: 'A letra C tem som de S antes de E e I' },
      { id: '2', text: 'A letra C tem som de K antes de A, O e U' },
      { id: '3', text: 'A letra G tem som de J antes de A, O e U' },
      { id: '4', text: 'A letra G tem som de J antes de E e I' },
    ],
    correctAnswer: { '1': 'V', '2': 'V', '3': 'F', '4': 'V' },
    tip: 'Guarda isso como regra rápida: CE, CI → S | CA, CO, CU → K | GE, GI → J',
    points: 1.0,
  },
  {
    id: 4,
    type: 'matching',
    text: 'Ligue corretamente as palavras com o mesmo som do C:',
    pairs: [
      {
        left: { id: 'casa', text: 'casa' },
        right: [
          { id: 'cidade', text: 'cidade' },
          { id: 'copo', text: 'copo' },
        ],
      },
      {
        left: { id: 'certo', text: 'certo' },
        right: [
          { id: 'cidade', text: 'cidade' },
          { id: 'copo', text: 'copo' },
        ],
      },
    ],
    correctAnswer: { casa: 'copo', certo: 'cidade' },
    tip: 'casa / copo → som de K | certo / cidade → som de S. Compare o som, não só a letra!',
    points: 1.0,
  },
  {
    id: 5,
    type: 'multiple_choice',
    text: 'Qual das palavras tem som de J?',
    options: [
      { id: 'a', text: 'gato' },
      { id: 'b', text: 'gelo' },
      { id: 'c', text: 'goma' },
      { id: 'd', text: 'galo' },
    ],
    correctAnswer: 'b',
    tip: 'Se tiver GE ou GI, o som é de J. ge-lo = "jelo"',
    points: 1.0,
  },
  {
    id: 6,
    type: 'classification',
    text: 'Classifique em (C) comum ou (P) próprio:',
    items: [
      { id: '1', text: 'cachorro' },
      { id: '2', text: 'Brasil' },
      { id: '3', text: 'escola' },
      { id: '4', text: 'Maria' },
    ],
    correctAnswer: { '1': 'C', '2': 'P', '3': 'C', '4': 'P' },
    tip: 'Nome de pessoa ou lugar específico → próprio (maiúscula). O resto → comum',
    points: 1.0,
  },
  {
    id: 7,
    type: 'multiple_choice',
    text: 'Qual palavra deve começar com letra maiúscula?',
    options: [
      { id: 'a', text: 'cadeira' },
      { id: 'b', text: 'cidade' },
      { id: 'c', text: 'joão' },
      { id: 'd', text: 'bola' },
    ],
    correctAnswer: 'c',
    tip: 'Nome de pessoa sempre começa com letra maiúscula. Se estiver minúsculo → já desconfia que está errado.',
    points: 1.0,
  },
  {
    id: 8,
    type: 'multiple_choice',
    text: '"O menino correu no parque." A palavra correu indica:',
    options: [
      { id: 'a', text: 'objeto' },
      { id: 'b', text: 'ação' },
      { id: 'c', text: 'lugar' },
      { id: 'd', text: 'pessoa' },
    ],
    correctAnswer: 'b',
    tip: 'Pergunta mágica: "O que está acontecendo?" → correu = ação',
    points: 1.0,
  },
  {
    id: 9,
    type: 'multiple_choice',
    text: 'Marque a alternativa que está no modo imperativo:',
    options: [
      { id: 'a', text: 'Eu estudo todos os dias' },
      { id: 'b', text: 'Ele brinca na rua' },
      { id: 'c', text: 'Faça a tarefa agora' },
      { id: 'd', text: 'Nós fomos ao parque' },
    ],
    correctAnswer: 'c',
    tip: 'Imperativo = ordem, pedido ou conselho. Palavras comuns: faça, coma, estude, vá',
    points: 1.0,
  },
  {
    id: 10,
    type: 'multiple_choice',
    text: 'Complete com C ou QU: (escolha a alternativa correta)',
    options: [
      { id: 'a', text: 'a) caderno, b) queijo, c) casa, d) quilo' },
      { id: 'b', text: 'a) quaderno, b) ceijo, c) quasa, d) quilo' },
      { id: 'c', text: 'a) caderno, b) quejo, c) casa, d) cilo' },
      { id: 'd', text: 'Todas estão corretas' },
    ],
    correctAnswer: 'a',
    tip: 'Antes de E e I → usa QU (que, qui). Antes de A, O, U → usa C (ca, co, cu)',
    points: 1.0,
  },
];

export default function SimuladoPortugues() {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: any }>({});
  const [isFinalized, setIsFinalized] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  const handleAnswerChange = (questionId: number, answer: any) => {
    if (!isFinalized) {
      setUserAnswers((prev) => ({
        ...prev,
        [questionId]: answer,
      }));
    }
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
    const percentage = (score / 10) * 100;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Simulado de Português</h1>
            <p className="text-xl text-slate-600 mb-2">3º Ano</p>
            <p className="text-gray-500 mb-8">10 questões · 10 pontos</p>

            <div className="mb-6">
              <label className="block text-lg font-semibold text-slate-700 mb-3">
                💬 Qual é o seu nome?
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-2xl focus:outline-none focus:border-blue-500 text-lg"
              />
            </div>

            <button
              onClick={() => setHasStarted(true)}
              disabled={!studentName.trim()}
              className={`w-full py-4 rounded-2xl text-white text-lg font-bold transition-all ${
                studentName.trim()
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              ✨ Começar o Simulado
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isFinalized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Resultado */}
          <div
            className={`bg-gradient-to-br ${motivationalData.color} rounded-3xl shadow-2xl p-8 mb-8 text-white text-center`}
          >
            <div className="text-7xl mb-4">{motivationalData.emoji}</div>
            <h2 className="text-4xl font-bold mb-2">{motivationalData.title}</h2>
            <p className="text-xl mb-6">{motivationalData.message}</p>
            <div className="text-5xl font-bold">{finalScore}/10</div>
            <p className="text-lg mt-2">{((finalScore / 10) * 100).toFixed(0)}% de acerto</p>
          </div>

          {/* Resumo por questão */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">📊 Análise Detalhada</h3>
            <div className="space-y-4">
              {questions.map((question) => {
                const isCorrect = isAnswerCorrect(question.id);
                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-2xl border-2 ${
                      isCorrect
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-800">
                          Questão {question.id}
                          {isCorrect ? ' ✅' : ' ❌'}
                        </p>
                      </div>
                      <div className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? '+1.0 pt' : '0.0 pt'}
                      </div>
                    </div>
                    
                    {/* Dica */}
                    <div className={`p-3 rounded-xl mt-3 ${
                      isCorrect
                        ? 'bg-green-100 border border-green-400'
                        : 'bg-yellow-100 border border-yellow-400'
                    }`}>
                      <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-yellow-800'}`}>
                        {isCorrect ? '🌟 Curiosidade:' : '💡 Dica para aprender:'}
                      </p>
                      <p className={`text-sm mt-1 ${isCorrect ? 'text-green-700' : 'text-yellow-700'}`}>
                        {question.tip}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setUserAnswers({});
                setIsFinalized(false);
              }}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg transition-all"
            >
              🔄 Refazer Simulado
            </button>
            <button
              onClick={() => {
                setUserAnswers({});
                setIsFinalized(false);
                setHasStarted(false);
                setStudentName('');
              }}
              className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-4 rounded-2xl font-bold text-lg transition-all"
            >
              🏠 Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">📚 Simulado de Português</h1>
              <p className="text-slate-600">Aluno(a): <span className="font-semibold">{studentName}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">3º Ano</p>
              <p className="text-lg font-bold text-blue-600">
                {Object.keys(userAnswers).length}/{questions.length} respondidas
              </p>
            </div>
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
                className={`bg-white rounded-3xl shadow-lg p-6 border-4 transition-all ${
                  isFinalized
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* Número e Pontos */}
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800">
                      Questão {question.id}
                      {isFinalized && (isCorrect ? ' ✅' : ' ❌')}
                    </h3>
                    <p className="text-sm text-slate-600 font-semibold">{question.text}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Valor</p>
                    <p className="text-xl font-bold text-blue-600">{question.points} pt</p>
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
                          className={`w-full text-left p-4 rounded-2xl font-semibold transition-all border-2 ${
                            showCorrectIndicator
                              ? 'border-green-500 bg-green-100 text-green-800'
                              : showIncorrectIndicator
                                ? 'border-red-500 bg-red-100 text-red-800'
                                : isOptionSelected && !isFinalized
                                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                                  : 'border-slate-300 bg-white text-slate-800 hover:border-blue-400'
                          }`}
                        >
                          <span className="inline-block w-8 h-8 rounded-full border-2 text-center leading-6 mr-3 font-bold">
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
                  <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-2xl">
                    <p className="text-yellow-800 font-semibold">💡 Dica para aprender:</p>
                    <p className="text-yellow-700 mt-2">{question.tip}</p>
                  </div>
                )}

                {/* Dica Pedagógica (mostrada após acerto também) */}
                {isFinalized && isCorrect && (
                  <div className="mt-4 p-4 bg-green-50 border-2 border-green-400 rounded-2xl">
                    <p className="text-green-800 font-semibold">🌟 Curiosidade:</p>
                    <p className="text-green-700 mt-2">{question.tip}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botão Finalizar */}
        <button
          onClick={() => setIsFinalized(true)}
          disabled={Object.keys(userAnswers).length < questions.length}
          className={`w-full mt-8 py-6 rounded-2xl text-white text-xl font-bold transition-all ${
            Object.keys(userAnswers).length === questions.length
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {Object.keys(userAnswers).length === questions.length
            ? '✅ Finalizar e Ver Resultado'
            : `⏳ Responda todas (${Object.keys(userAnswers).length}/${questions.length})`}
        </button>

        {/* Espaço em branco no fim */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
