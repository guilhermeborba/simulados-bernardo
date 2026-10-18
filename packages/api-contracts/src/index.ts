/** Public API projections shared by web and the mobile proof. No runtime code, server DTOs or secrets. */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ApiTurma {
  id: string;
  name: string;
  slug: string;
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

export interface ApiAttempt {
  id: string;
  status: string;
  simulationId: string;
  /** Início da tentativa no servidor — base do cronômetro. */
  startedAt?: string;
  /** Opt-in Giz feedback; older attempts and servers may omit it. */
  immediateFeedback?: boolean;
  /**
   * Opcional de propósito: o front-end pode ir para produção antes do back-end
   * que passou a devolver esse campo. Sem ele, a faixa cai no padrão.
   */
  simulation?: ApiSimulation;
}

export interface ApiQuestionOption {
  id: string;
  optionKey: string;
  text: string;
  groupKey: string | null;
  order: number;
}

export interface ApiAnswerFeedback {
  isCorrect: boolean;
  correctAnswer: Record<string, unknown>;
  tip?: string | null;
  funFact?: string | null;
  explanation?: string | null;
}

export interface ApiQuestion {
  id: string;
  type:
    "MULTIPLE_CHOICE" | "TRUE_FALSE_MULTIPLE" | "MATCHING" | "CLASSIFICATION";
  statement: string;
  tip: string | null;
  /** "Você sabia?" — curiosidade mostrada na tela de resultado, sempre. */
  funFact: string | null;
  points: string;
  order: number;
  options: ApiQuestionOption[];
  /** Resposta que o próprio aluno já enviou nesta tentativa, se houver. */
  answer?: unknown;
  /** Present only after a confirmation authorized by the attempt. */
  confirmedAt?: string | null;
  feedback?: ApiAnswerFeedback | null;
  theme?: string | null;
}

export interface ApiAttemptResultQuestion {
  id: string;
  type: ApiQuestion["type"];
  statement: string;
  tip: string | null;
  funFact: string | null;
  points: string;
  order: number;
  answer: unknown;
  isCorrect: boolean;
  pointsEarned: string;
  options?: ApiQuestionOption[];
  correctAnswer?: Record<string, unknown> | null;
  theme?: string | null;
  explanation?: string | null;
  confirmedAt?: string | null;
  feedback?: ApiAnswerFeedback | null;
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
  topics?: { theme: string; correct: number; total: number }[];
  unclassifiedQuestions?: number;
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

export interface ApiMinhaPontuacao {
  media: number;
  simulados: number;
  diasSeguidos: number;
  melhorSimulado: {
    percentage: number;
    titulo: string;
    disciplina: string;
  } | null;
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

export type LearningSegment =
  "INFANTIL" | "FUNDAMENTAL_I" | "FUNDAMENTAL_II" | "MEDIO" | "ENFERMAGEM";

export interface ApiLearningPreferences {
  segment: LearningSegment | null;
  schoolYear: number | null;
  audioEnabled: boolean;
  motionEnabled: boolean;
}

export interface ApiQuiz {
  id: string;
  activityKind: "QUIZ";
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

export type ApiQuizSummary = Pick<
  ApiQuiz,
  | "id"
  | "activityKind"
  | "activityKey"
  | "contentVersion"
  | "title"
  | "subtitle"
  | "slug"
  | "schoolYear"
  | "topic"
  | "turmaId"
> & {
  discipline: Pick<ApiDiscipline, "id" | "name" | "slug"> &
    Partial<ApiDiscipline>;
} & Partial<
    Pick<ApiQuiz, "totalQuestions" | "maxScore" | "estimatedDurationMinutes">
  >;

export interface ApiQuizAttempt {
  id: string;
  practiceMode: "NORMAL" | "REVIEW";
  status: "IN_PROGRESS" | "FINISHED" | "ABANDONED" | "EXPIRED";
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
  practicedBefore: boolean;
  type: "MULTIPLE_CHOICE";
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
  reason: "AWARDED" | "ALREADY_REWARDED" | "DAILY_LIMIT" | "LEGACY" | "REVIEW";
  day: string | null;
}

export interface ApiQuizResult {
  attempt: ApiQuizAttempt;
  reward: ApiQuizReward;
  questions: Array<
    ApiQuizQuestion & { isCorrect: boolean; pointsEarned: number }
  >;
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
  status: "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";
  completedActivities: number;
  totalActivities: number;
  activities: ApiLearningMissionActivity[];
}

export interface ApiLearningHome {
  schoolYear: number | null;
  xp: {
    total: number;
    today: number;
    dailyLimit: number;
    perQuiz: number;
    day: string;
  };
  inProgress: ApiQuizAttempt | null;
  missions: ApiLearningMission[];
  suggestedQuiz: ApiQuizSummary | null;
}

export type AvatarStyle = "AUTO" | "MASCOT" | "SEAL";

export interface ApiAvatarSelection {
  itemId: string;
  style: AvatarStyle;
}

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
  stats: {
    completedQuizzes: number;
    topics: number;
    completedMissions: number;
    totalXp: number;
  };
}

export interface ApiSkillProgress {
  code: string;
  version: number;
  title: string;
  discipline: { slug: string; name: string };
  schoolYear: number;
  firstResponse: { questions: number; correct: number };
  repeat: { responses: number; correct: number };
  review: { responses: number; correct: number; differentQuestions: number };
  distinctQuestions: number;
  evidence: "INSUFFICIENT" | "OBSERVED";
  lastPracticedAt: string | null;
}

export interface ApiReviewSuggestion {
  quizId: string;
  activityKey: string;
  contentVersion: number;
  title: string;
  schoolYear: number;
  questionCount: number;
  skillTitles: string[];
  hasRepeatedQuestions: boolean;
}

export interface ApiLearningProgress {
  schoolYear: number | null;
  unclassifiedQuestions: number;
  skills: ApiSkillProgress[];
  reviewSuggestions: ApiReviewSuggestion[];
  inProgressReview: ApiQuizAttempt | null;
}

export interface ApiOversightStudent {
  id: string;
  name: string;
  schoolYear: number | null;
  turmas: ApiTurma[];
}

export interface ApiStudentLearningProgress {
  schoolYear: number | null;
  unclassifiedQuestions: number;
  skills: ApiSkillProgress[];
}

export interface ApiStudentSummary {
  studentId: string;
  totalFinishedAttempts: number;
  averagePercentage: number;
  bestPercentage: number;
  bestScore: number;
  lastAttempts: {
    id: string;
    percentage: string | null;
    finishedAt: string | null;
    simulation: { title: string; discipline: { name: string } };
  }[];
}

export interface ApiStudentDisciplineSummary {
  disciplineId: string;
  discipline: string;
  attempts: number;
  averagePercentage: number;
  bestPercentage: number;
}
