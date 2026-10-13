import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Synthetic content only; the editorial seed is never imported. */
export async function createFixture(prisma, hashPassword, { apiRoot } = {}) {
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador de teste',
      email: 'admin@example.test',
      passwordHash: await hashPassword('Synthetic-password-42', 4),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  const discipline = await prisma.discipline.create({
    data: { name: 'Matemática de teste', slug: 'matematica', icon: '🔢', themeColor: '#3070ab' },
  });
  const turma = await prisma.turma.create({
    data: { name: 'Turma sintética', slug: 'turma-teste', schoolYear: 3 },
  });
  const inviteToken = 'synthetic-invite-token-for-web-regression-2026';
  await prisma.turmaInvite.create({
    data: {
      turmaId: turma.id,
      tokenHash: createHash('sha256').update(inviteToken).digest('hex'),
      createdById: admin.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      maxUses: 5,
    },
  });
  const questions = [
    {
      type: 'MULTIPLE_CHOICE', statement: 'Quanto é 2 + 2?',
      options: [{ optionKey: 'A', text: '4' }, { optionKey: 'B', text: '5' }],
      answers: [{ answerKey: 'correctAnswer', answerValue: 'A' }],
    },
    {
      type: 'TRUE_FALSE_MULTIPLE', statement: 'Marque verdadeiro ou falso.',
      options: [{ optionKey: 'a', text: '2 é par' }, { optionKey: 'b', text: '3 é par' }],
      answers: [{ answerKey: 'a', answerValue: 'true' }, { answerKey: 'b', answerValue: 'false' }],
    },
    {
      type: 'MATCHING', statement: 'Associe os números.',
      options: [
        { optionKey: 'left:a', text: 'Dois', groupKey: 'left' },
        { optionKey: 'left:b', text: 'Três', groupKey: 'left' },
        { optionKey: 'right:2', text: '2', groupKey: 'right' },
        { optionKey: 'right:3', text: '3', groupKey: 'right' },
      ],
      answers: [{ answerKey: 'a', answerValue: '2' }, { answerKey: 'b', answerValue: '3' }],
    },
    {
      type: 'CLASSIFICATION', statement: 'Classifique as frases em C ou P.',
      options: [{ optionKey: 'a', text: 'Frase C' }, { optionKey: 'b', text: 'Frase P' }],
      answers: [{ answerKey: 'a', answerValue: 'C' }, { answerKey: 'b', answerValue: 'P' }],
    },
  ];
  async function simulation(slug, overrides = {}, content = questions.slice(0, 1)) {
    return prisma.simulation.create({
      data: {
        title: `Simulado sintético ${slug}`, slug, schoolYear: 3, bimester: 1, assessment: 'AV1',
        disciplineId: discipline.id, createdById: admin.id, status: 'PUBLISHED',
        totalQuestions: content.length, maxScore: content.length, estimatedDurationMinutes: 10,
        ...overrides,
        questions: {
          create: content.map((question, index) => ({
            type: question.type, statement: question.statement, sortOrder: index + 1, points: 1,
            tip: 'Dica sintética.', funFact: 'Curiosidade sintética.',
            options: { create: question.options.map((option, order) => ({ ...option, sortOrder: order + 1 })) },
            answers: { create: question.answers },
          })),
        },
      },
    });
  }
  const publicSimulation = await simulation('quatro-tipos', {}, questions);
  const privateSimulation = await simulation('privado', { turmaId: turma.id });
  const draft = await simulation('rascunho', { status: 'DRAFT' });
  const archived = await simulation('arquivado', { status: 'ARCHIVED' });
  const deleted = await simulation('excluido', { deletedAt: new Date() });
  const segments = {};
  for (const schoolYear of [-2, -1, 0, 1, 5, 6, 9, 10, 11, 12]) {
    const row = await simulation(`faixa-${schoolYear}`, {
      schoolYear, ...(schoolYear <= 0 ? { bimester: 0, assessment: 'AV1' } : {}),
      ...(schoolYear === 0 ? { topic: 'Fundamentos de teste' } : {}),
    });
    segments[schoolYear] = row.id;
  }
  const registry = JSON.parse(readFileSync(resolve(apiRoot, 'src/modules/quizzes/media/assets/manifest.json'), 'utf8'));
  const registered = (id) => {
    const asset = registry.find((entry) => entry.id === id);
    if (!asset) throw new Error('Synthetic quiz asset fixture is missing.');
    return { assetId: id, sha256: asset.sha256 };
  };
  const media = {
    image: { ...registered('infantil-4-cores-e-formas.cor-vermelha.image.v3'), alt: 'Três balões: azul, vermelho e amarelo.' },
    audio: { ...registered('infantil-4-cores-e-formas.cor-vermelha.audio'), transcript: 'Qual balão é vermelho? A: O balão azul. B: O balão vermelho. C: O balão amarelo.' },
  };
  const quizQuestions = [
    {
      originKey: 'cores', statement: 'Qual balão é vermelho?', explanation: 'O balão do meio é vermelho.',
      points: 1, media,
      options: [{ optionKey: 'A', text: 'O balão azul' }, { optionKey: 'B', text: 'O balão vermelho' }, { optionKey: 'C', text: 'O balão amarelo' }],
      correctAnswer: 'B',
    },
    {
      originKey: 'soma', statement: 'Quanto é 2 + 3?', explanation: 'Dois mais três formam cinco.',
      points: 2,
      options: [{ optionKey: 'A', text: '4' }, { optionKey: 'B', text: '5' }, { optionKey: 'C', text: '6' }],
      correctAnswer: 'B',
    },
  ];
  async function quiz(key, schoolYear, overrides = {}, content = quizQuestions) {
    return prisma.simulation.create({
      data: {
        activityKind: 'QUIZ', activityKey: key, contentVersion: 1,
        title: `Quiz sintético ${key}`, slug: `quiz-${key}`, schoolYear,
        bimester: null, assessment: null, topic: 'Cores e números de teste',
        disciplineId: discipline.id, createdById: admin.id, status: 'PUBLISHED', publishedAt: new Date(),
        totalQuestions: content.length, maxScore: content.reduce((sum, row) => sum + row.points, 0), estimatedDurationMinutes: 3,
        ...overrides,
        questions: {
          create: content.map((question, index) => ({
            originKey: question.originKey, type: 'MULTIPLE_CHOICE', statement: question.statement,
            explanation: question.explanation, sortOrder: index + 1, points: question.points,
            tip: 'Observe as alternativas.', funFact: 'Curiosidade sintética depois de confirmar.',
            ...(question.media ? { media: question.media } : {}),
            options: { create: question.options.map((option, order) => ({ ...option, sortOrder: order + 1 })) },
            answers: { create: [{ answerKey: 'correctAnswer', answerValue: question.correctAnswer }] },
          })),
        },
      },
    });
  }
  const oldQuiz = await quiz('jornada-web', 3, { slug: 'quiz-jornada-web-v1' });
  const publicQuiz = await quiz('jornada-web', 3, { contentVersion: 2, slug: 'quiz-jornada-web-v2' });
  const privateQuiz = await quiz('privado-web', 3, { turmaId: turma.id });
  const draftQuiz = await quiz('rascunho-web', 3, { status: 'DRAFT', publishedAt: null });
  const archivedQuiz = await quiz('arquivado-web', 3, { status: 'ARCHIVED' });
  const deletedQuiz = await quiz('excluido-web', 3, { deletedAt: new Date() });
  const quizSegments = {};
  for (const schoolYear of [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    const row = await quiz(`faixa-web-${schoolYear < 0 ? `menos-${Math.abs(schoolYear)}` : schoolYear}`, schoolYear);
    quizSegments[schoolYear] = row.id;
  }
  return {
    publicSimulation: publicSimulation.id, privateSimulation: privateSimulation.id,
    draft: draft.id, archived: archived.id, deleted: deleted.id,
    turmaId: turma.id, inviteToken, segments,
    publicQuiz: publicQuiz.id, privateQuiz: privateQuiz.id, oldQuiz: oldQuiz.id,
    draftQuiz: draftQuiz.id, archivedQuiz: archivedQuiz.id, deletedQuiz: deletedQuiz.id,
    quizSegments, quizAnswers: quizQuestions.map((question) => question.correctAnswer),
  };
}
