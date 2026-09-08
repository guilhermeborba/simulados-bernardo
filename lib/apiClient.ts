export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const rawMessage = (body as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : rawMessage ?? 'Erro inesperado';
    throw new Error(message);
  }

  return body as T;
}

export function login(email: string, password: string) {
  return apiFetch<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(name: string, email: string, password: string) {
  return apiFetch<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function logout() {
  return apiFetch<{ success: true }>('/api/auth/logout', { method: 'POST' });
}

export function getMe() {
  return apiFetch<AuthUser>('/api/auth/me');
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
