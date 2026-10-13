import type {
  AuthUser,
  ApiTurma,
  ApiDiscipline,
  ApiSimulation,
  ApiAttempt,
  ApiQuestionOption,
  ApiQuestion,
  ApiAttemptResultQuestion,
  ApiAttemptResult,
  ApiMyAttempt,
  ApiMinhaPontuacao,
  ApiLinhaDoRanking,
  ApiRanking,
  LearningSegment,
  ApiLearningPreferences,
  ApiQuiz,
  ApiQuizSummary,
  ApiQuizAttempt,
  ApiQuizFeedback,
  ApiQuizQuestion,
  ApiQuizConfirmation,
  ApiQuizReward,
  ApiQuizResult,
  ApiLearningMissionActivity,
  ApiLearningMission,
  ApiLearningHome,
  AvatarStyle,
  ApiAvatarSelection,
  ApiAvatarItem,
  ApiMyAvatar,
  ApiAchievement,
  ApiMyAchievements,
  ApiSkillProgress,
  ApiReviewSuggestion,
  ApiLearningProgress,
  ApiOversightStudent,
  ApiStudentLearningProgress,
  ApiStudentSummary,
  ApiStudentDisciplineSummary
} from '../packages/api-contracts/src';
export type {
  AuthUser,
  ApiTurma,
  ApiDiscipline,
  ApiSimulation,
  ApiAttempt,
  ApiQuestionOption,
  ApiQuestion,
  ApiAttemptResultQuestion,
  ApiAttemptResult,
  ApiMyAttempt,
  ApiMinhaPontuacao,
  ApiLinhaDoRanking,
  ApiRanking,
  LearningSegment,
  ApiLearningPreferences,
  ApiQuiz,
  ApiQuizSummary,
  ApiQuizAttempt,
  ApiQuizFeedback,
  ApiQuizQuestion,
  ApiQuizConfirmation,
  ApiQuizReward,
  ApiQuizResult,
  ApiLearningMissionActivity,
  ApiLearningMission,
  ApiLearningHome,
  AvatarStyle,
  ApiAvatarSelection,
  ApiAvatarItem,
  ApiMyAvatar,
  ApiAchievement,
  ApiMyAchievements,
  ApiSkillProgress,
  ApiReviewSuggestion,
  ApiLearningProgress,
  ApiOversightStudent,
  ApiStudentLearningProgress,
  ApiStudentSummary,
  ApiStudentDisciplineSummary
} from '../packages/api-contracts/src';

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

export function startAttempt(simulationId: string) {
  return apiFetch<ApiAttempt>(`/api/backend/simulations/${simulationId}/attempts`, {
    method: 'POST',
  });
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

export function finishAttempt(attemptId: string) {
  return apiFetch<ApiAttemptResult>(`/api/backend/attempts/${attemptId}/finish`, {
    method: 'POST',
  });
}

export function getAttemptResult(attemptId: string) {
  return apiFetch<ApiAttemptResult>(`/api/backend/attempts/${attemptId}/result`);
}

export function getMyAttempts() {
  return apiFetch<ApiMyAttempt[]>('/api/backend/me/attempts');
}

export function getMinhaPontuacao() {
  return apiFetch<ApiMinhaPontuacao>('/api/backend/me/pontuacao');
}

export function getRankingDaTurma(turmaId: string) {
  return apiFetch<ApiRanking | null>(`/api/backend/me/turmas/${turmaId}/ranking`);
}

export { quizMediaUrl } from './quizMedia';

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

export function getMyQuizAttempts(signal?: AbortSignal) {
  return apiFetch<ApiQuizAttempt[]>('/api/backend/me/quiz-attempts', { signal });
}

export function getLearningPreferences() {
  return apiFetch<ApiLearningPreferences>('/api/backend/me/learning-preferences');
}

export function updateLearningPreferences(preferences: Partial<ApiLearningPreferences>) {
  return apiFetch<ApiLearningPreferences>('/api/backend/me/learning-preferences', {
    method: 'PATCH', body: JSON.stringify(preferences),
  });
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

export function getMyAchievements(signal?: AbortSignal) {
  return apiFetch<ApiMyAchievements>('/api/backend/me/achievements', { signal });
}

export function getMyAvatar(signal?: AbortSignal) {
  return apiFetch<ApiMyAvatar>('/api/backend/me/avatar', { signal });
}

export function updateMyAvatar(patch: Partial<ApiAvatarSelection>, signal?: AbortSignal) {
  return apiFetch<ApiMyAvatar>('/api/backend/me/avatar', { method: 'PATCH', body: JSON.stringify(patch), signal });
}

export function getLearningProgress(schoolYear?: number, signal?: AbortSignal) {
  return apiFetch<ApiLearningProgress>(`/api/backend/me/learning-progress${learningYearQuery(schoolYear)}`, { signal });
}

export function startReviewAttempt(quizId: string, signal?: AbortSignal) {
  return apiFetch<ApiQuizAttempt>('/api/backend/me/review-attempts', {
    method: 'POST', body: JSON.stringify({ quizId }), signal,
  });
}

export function requestPasswordRecovery(email: string, signal?: AbortSignal) {
  return apiFetch<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }), signal });
}

export function resetPassword(token: string, password: string, signal?: AbortSignal) {
  return apiFetch<{ success: true }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }), signal });
}
export function getOversightStudents(signal?: AbortSignal) {
  return apiFetch<ApiOversightStudent[]>('/api/backend/me/oversight-students', { signal });
}
export function getStudentLearningProgress(studentId: string, schoolYear?: number, signal?: AbortSignal) {
  return apiFetch<ApiStudentLearningProgress>(`/api/backend/students/${encodeURIComponent(studentId)}/learning-progress${learningYearQuery(schoolYear)}`, { signal });
}
export function getStudentSummary(studentId: string, signal?: AbortSignal) {
  return apiFetch<ApiStudentSummary>(`/api/backend/reports/student/${encodeURIComponent(studentId)}/summary`, { signal });
}
export function getStudentDisciplineSummary(studentId: string, signal?: AbortSignal) {
  return apiFetch<ApiStudentDisciplineSummary[]>(`/api/backend/reports/student/${encodeURIComponent(studentId)}/by-discipline`, { signal });
}
