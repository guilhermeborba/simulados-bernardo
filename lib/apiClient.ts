export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

let sessionRequests = new AbortController();

/** Called synchronously before login/register/logout changes the browser's cookies. */
export function cancelPendingSessionRequests() {
  sessionRequests.abort();
  sessionRequests = new AbortController();
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const authenticated = path === '/api/auth/me' || path.startsWith('/api/backend/');
  const signals = [authenticated ? sessionRequests.signal : null, init?.signal].filter((signal): signal is AbortSignal => Boolean(signal));
  const request = new AbortController();
  const cancel = () => request.abort();
  for (const signal of signals) {
    if (signal.aborted) cancel();
    else signal.addEventListener('abort', cancel, { once: true });
  }
  try {
    const response = await fetch(path, {
      ...init, signal: request.signal,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    const body = await response.json().catch(() => null);
    if (request.signal.aborted) throw new DOMException('Session request cancelled', 'AbortError');
    if (!response.ok) {
      const rawMessage = (body as { message?: string | string[] } | null)?.message;
      const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage ?? 'Erro inesperado';
      throw new ApiError(message, response.status);
    }
    return body as T;
  } finally {
    for (const signal of signals) signal.removeEventListener('abort', cancel);
  }
}

export function login(email: string, password: string) {
  return apiFetch<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  name: string,
  email: string,
  password: string,
  inviteToken?: string,
) {
  return apiFetch<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, inviteToken }),
  });
}

export interface ApiTurma {
  id: string;
  name: string;
  slug: string;
}

/** Entrada na turma para quem já tinha conta antes de receber o convite. */
export function joinTurma(token: string) {
  return apiFetch<{ turma: ApiTurma; alreadyMember: boolean }>(
    '/api/backend/me/turmas/join',
    { method: 'POST', body: JSON.stringify({ token }) },
  );
}

export function getMyTurmas() {
  return apiFetch<ApiTurma[]>('/api/backend/me/turmas');
}

export function logout() {
  return apiFetch<{ success: true }>('/api/auth/logout', { method: 'POST' });
}

export function getMe(signal?: AbortSignal) {
  return apiFetch<AuthUser>('/api/auth/me', { signal });
}

export interface ApiDiscipline {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  themeColor: string | null;
}

export interface ApiSimulation {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  schoolYear: number;
  bimester: number;
  assessment: string;
  /** Eixo temático. Preenchido só em curso técnico, que não tem bimestre. */
  topic: string | null;
  totalQuestions: number;
  maxScore: string;
  estimatedDurationMinutes: number | null;
  discipline: ApiDiscipline;
}

export function getAvailableSimulations(params: {
  schoolYear?: number;
  bimester?: number;
  assessment?: string;
}) {
  const query = new URLSearchParams();

  // Curso técnico é listado só por schoolYear 0, sem bimestre nem avaliação.
  if (params.schoolYear !== undefined) query.set('schoolYear', String(params.schoolYear));
  if (params.bimester !== undefined) query.set('bimester', String(params.bimester));
  if (params.assessment) query.set('assessment', params.assessment);

  return apiFetch<ApiSimulation[]>(`/api/backend/simulations/available?${query.toString()}`);
}

export interface ApiAttempt {
  id: string;
  status: string;
  simulationId: string;
  /** Início da tentativa no servidor — base do cronômetro. */
  startedAt?: string;
  /**
   * Opcional de propósito: o front-end pode ir para produção antes do back-end
   * que passou a devolver esse campo. Sem ele, a faixa cai no padrão.
   */
  simulation?: ApiSimulation;
}

export function startAttempt(simulationId: string) {
  return apiFetch<ApiAttempt>(`/api/backend/simulations/${simulationId}/attempts`, {
    method: 'POST',
  });
}

export interface ApiQuestionOption {
  id: string;
  optionKey: string;
  text: string;
  groupKey: string | null;
  order: number;
}

export interface ApiQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_MULTIPLE' | 'MATCHING' | 'CLASSIFICATION';
  statement: string;
  tip: string | null;
  /** "Você sabia?" — curiosidade mostrada na tela de resultado, sempre. */
  funFact: string | null;
  points: string;
  order: number;
  options: ApiQuestionOption[];
  /** Resposta que o próprio aluno já enviou nesta tentativa, se houver. */
  answer?: unknown;
}

export function getAttemptQuestions(attemptId: string) {
  return apiFetch<ApiQuestion[]>(`/api/backend/attempts/${attemptId}/questions`);
}

export function submitAttemptAnswer(
  attemptId: string,
  questionId: string,
  answer: Record<string, unknown>,
) {
  return apiFetch(`/api/backend/attempts/${attemptId}/questions/${questionId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer }),
  });
}

export interface ApiAttemptResultQuestion {
  id: string;
  type: ApiQuestion['type'];
  statement: string;
  tip: string | null;
  funFact: string | null;
  points: string;
  order: number;
  answer: unknown;
  isCorrect: boolean;
  pointsEarned: string;
}

export interface ApiAttemptResult {
  attempt: ApiAttempt & {
    score: string;
    maxScore: string;
    percentage: string;
    correctCount: number;
    wrongCount: number;
  };
  questions: ApiAttemptResultQuestion[];
}

export function finishAttempt(attemptId: string) {
  return apiFetch<ApiAttemptResult>(`/api/backend/attempts/${attemptId}/finish`, {
    method: 'POST',
  });
}

export function getAttemptResult(attemptId: string) {
  return apiFetch<ApiAttemptResult>(`/api/backend/attempts/${attemptId}/result`);
}

export interface ApiMyAttempt {
  id: string;
  status: string;
  simulationId: string;
  score: string | null;
  maxScore: string;
  percentage: string | null;
  createdAt: string;
  finishedAt: string | null;
  simulation: {
    title: string;
    assessment: string;
    discipline: { name: string };
  };
}

export function getMyAttempts() {
  return apiFetch<ApiMyAttempt[]>('/api/backend/me/attempts');
}

export interface ApiMinhaPontuacao {
  media: number;
  simulados: number;
  diasSeguidos: number;
  melhorSimulado: { percentage: number; titulo: string; disciplina: string } | null;
}

export function getMinhaPontuacao() {
  return apiFetch<ApiMinhaPontuacao>('/api/backend/me/pontuacao');
}

export interface ApiLinhaDoRanking {
  posicao: number;
  nome: string;
  media: number;
  simulados: number;
  ehVoce: boolean;
}

export interface ApiRanking {
  turma: { id: string; name: string };
  totalClassificados: number;
  minimoDeSimulados: number;
  meusSimuladosNaTurma: number;
  faltamParaORanking: number;
  minhaPosicao: ApiLinhaDoRanking | null;
  podio: ApiLinhaDoRanking[];
  vizinhanca: ApiLinhaDoRanking[];
  podioAte: number;
}

export function getRankingDaTurma(turmaId: string) {
  return apiFetch<ApiRanking | null>(`/api/backend/me/turmas/${turmaId}/ranking`);
}


export { quizMediaUrl } from './quizMedia';

export type LearningSegment = 'INFANTIL' | 'FUNDAMENTAL_I' | 'FUNDAMENTAL_II' | 'MEDIO' | 'ENFERMAGEM';

export interface ApiLearningPreferences {
  segment: LearningSegment | null;
  schoolYear: number | null;
  audioEnabled: boolean;
  motionEnabled: boolean;
}

export interface ApiQuiz {
  id: string;
  activityKind: 'QUIZ';
  activityKey: string;
  contentVersion: number;
  title: string;
  subtitle: string | null;
  slug: string;
  schoolYear: number;
  topic: string | null;
  totalQuestions: number;
  maxScore: string;
  estimatedDurationMinutes: number | null;
  turmaId: string | null;
  discipline: ApiDiscipline;
}

/** Result metadata has a narrower projection than catalog/start/history. */
export type ApiQuizSummary = Pick<ApiQuiz, 'id' | 'activityKind' | 'activityKey' | 'contentVersion' | 'title' | 'subtitle' | 'slug' | 'schoolYear' | 'topic' | 'turmaId'> & {
  discipline: Pick<ApiDiscipline, 'id' | 'name' | 'slug'> & Partial<ApiDiscipline>;
} & Partial<Pick<ApiQuiz, 'totalQuestions' | 'maxScore' | 'estimatedDurationMinutes'>>;

export interface ApiQuizAttempt {
  id: string;
  status: 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED' | 'EXPIRED';
  simulationId: string;
  activityKey: string;
  contentVersion: number;
  score: string | null;
  maxScore: string;
  percentage: string | null;
  correctCount: number | null;
  wrongCount: number | null;
  startedAt: string;
  createdAt: string;
  finishedAt: string | null;
  simulation: ApiQuizSummary;
}

export interface ApiQuizFeedback {
  isCorrect: boolean;
  pointsEarned: number;
  explanation: string;
  funFact: string | null;
}

export interface ApiQuizQuestion {
  id: string;
  originKey: string;
  type: 'MULTIPLE_CHOICE';
  statement: string;
  tip: string | null;
  points: string;
  order: number;
  options: ApiQuestionOption[];
  answer: { optionKey: string } | null;
  confirmedAt: string | null;
  feedback: ApiQuizFeedback | null;
  media?: {
    image?: { url: string; alt: string };
    audio?: { url: string; transcript: string };
  };
}

export interface ApiQuizConfirmation {
  id: string;
  attemptId: string;
  questionId: string;
  answer: { optionKey: string };
  confirmedAt: string;
  feedback: ApiQuizFeedback;
}

export interface ApiQuizReward {
  xpAwarded: number;
  reason: 'AWARDED' | 'ALREADY_REWARDED' | 'DAILY_LIMIT' | 'LEGACY';
  day: string | null;
}

export interface ApiQuizResult {
  attempt: ApiQuizAttempt;
  reward: ApiQuizReward;
  questions: Array<ApiQuizQuestion & { isCorrect: boolean; pointsEarned: number }>;
}

export function getAvailableQuizzes(params: { schoolYear?: number; discipline?: string; topic?: string } = {}) {
  const query = new URLSearchParams();
  if (params.schoolYear !== undefined) query.set('schoolYear', String(params.schoolYear));
  if (params.discipline) query.set('discipline', params.discipline);
  if (params.topic) query.set('topic', params.topic);
  return apiFetch<ApiQuiz[]>(`/api/backend/quizzes/available?${query.toString()}`);
}

export function startQuizAttempt(quizId: string) {
  return apiFetch<ApiQuizAttempt>(`/api/backend/quizzes/${encodeURIComponent(quizId)}/attempts`, { method: 'POST' });
}

export function getQuizAttempt(attemptId: string) {
  return apiFetch<ApiQuizAttempt>(`/api/backend/attempts/${encodeURIComponent(attemptId)}`);
}

export function getQuizAttemptQuestions(attemptId: string) {
  return apiFetch<ApiQuizQuestion[]>(`/api/backend/attempts/${encodeURIComponent(attemptId)}/questions`);
}

export function confirmQuizAnswer(attemptId: string, questionId: string, optionKey: string) {
  return apiFetch<ApiQuizConfirmation>(`/api/backend/attempts/${encodeURIComponent(attemptId)}/questions/${encodeURIComponent(questionId)}/answer`, {
    method: 'POST', body: JSON.stringify({ answer: { optionKey } }),
  });
}

export function finishQuizAttempt(attemptId: string) {
  return apiFetch<ApiQuizResult>(`/api/backend/attempts/${encodeURIComponent(attemptId)}/finish`, { method: 'POST' });
}

export function getQuizAttemptResult(attemptId: string) {
  return apiFetch<ApiQuizResult>(`/api/backend/attempts/${encodeURIComponent(attemptId)}/result`);
}

export function getMyQuizAttempts() {
  return apiFetch<ApiQuizAttempt[]>('/api/backend/me/quiz-attempts');
}

export function getLearningPreferences() {
  return apiFetch<ApiLearningPreferences>('/api/backend/me/learning-preferences');
}

export function updateLearningPreferences(preferences: Partial<ApiLearningPreferences>) {
  return apiFetch<ApiLearningPreferences>('/api/backend/me/learning-preferences', {
    method: 'PATCH', body: JSON.stringify(preferences),
  });
}

export interface ApiLearningMissionActivity {
  activityKey: string;
  title: string;
  quizId: string;
  completed: boolean;
  attemptId: string | null;
}

export interface ApiLearningMission {
  id: string;
  title: string;
  description: string;
  segment: LearningSegment;
  schoolYear: number;
  startsAt: string;
  endsAt: string;
  status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
  completedActivities: number;
  totalActivities: number;
  activities: ApiLearningMissionActivity[];
}

export interface ApiLearningHome {
  schoolYear: number | null;
  xp: { total: number; today: number; dailyLimit: number; perQuiz: number; day: string };
  inProgress: ApiQuizAttempt | null;
  missions: ApiLearningMission[];
  suggestedQuiz: ApiQuizSummary | null;
}

function learningYearQuery(schoolYear?: number) {
  const query = new URLSearchParams();
  if (schoolYear !== undefined) query.set('schoolYear', String(schoolYear));
  return query.size ? `?${query.toString()}` : '';
}

export function getLearningHome(schoolYear?: number, signal?: AbortSignal) {
  return apiFetch<ApiLearningHome>(`/api/backend/me/learning-home${learningYearQuery(schoolYear)}`, { signal });
}

export function getMyMissions(schoolYear?: number, signal?: AbortSignal) {
  return apiFetch<ApiLearningMission[]>(`/api/backend/me/missions${learningYearQuery(schoolYear)}`, { signal });
}


export type AvatarStyle = 'AUTO' | 'MASCOT' | 'SEAL';
export interface ApiAvatarSelection { itemId: string; style: AvatarStyle }
export interface ApiAvatarItem {
  id: string;
  title: string;
  description: string;
  achievementId: string | null;
  owned: boolean;
  unlockedAt: string | null;
}
export interface ApiMyAvatar {
  selection: ApiAvatarSelection;
  items: ApiAvatarItem[];
  updatedAt: string | null;
}
export interface ApiAchievement {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  earnedAt: string | null;
}
export interface ApiMyAchievements {
  achievements: ApiAchievement[];
  stats: { completedQuizzes: number; topics: number; completedMissions: number; totalXp: number };
}

export function getMyAchievements(signal?: AbortSignal) {
  return apiFetch<ApiMyAchievements>('/api/backend/me/achievements', { signal });
}

export function getMyAvatar(signal?: AbortSignal) {
  return apiFetch<ApiMyAvatar>('/api/backend/me/avatar', { signal });
}

export function updateMyAvatar(patch: Partial<ApiAvatarSelection>, signal?: AbortSignal) {
  return apiFetch<ApiMyAvatar>('/api/backend/me/avatar', { method: 'PATCH', body: JSON.stringify(patch), signal });
}
