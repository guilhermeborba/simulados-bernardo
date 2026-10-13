/// <reference types="jest" />
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react-native";
import type { SessionSnapshot } from "../../src/core/session";
import type {
  ApiQuizAttempt,
  ApiQuizQuestion,
  ApiQuizResult,
} from "../../../packages/api-contracts/src";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams: { id: string; attempt?: string } = { id: "quiz-one" };
let mockSession: SessionSnapshot;
const mockRequest = jest.fn();
const mockPublicRequest = jest.fn();
const mockReload = jest.fn();
let mockPreferences = {
  schoolYear: 3,
  segment: "FUNDAMENTAL_I",
  audioEnabled: false,
  motionEnabled: false,
};
const mockClient = {
  request: mockRequest,
  publicRequest: mockPublicRequest,
  getSnapshot: () => mockSession,
  logout: jest.fn(),
};
const mockCleanupMedia = jest.fn(async () => true);
jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
  useLocalSearchParams: () => mockParams,
}));
jest.mock("../../src/session-context", () => ({
  useSession: () => ({
    client: mockClient,
    session: mockSession,
    foreground: 0,
    media: { loadSvg: jest.fn(), playAudio: jest.fn() },
    cleanupMedia: mockCleanupMedia,
    cleanupError: null,
  }),
}));
jest.mock("../../src/config", () => ({
  environment: {
    webOrigin: "https://web.example.test",
    apiOrigin: "https://api.example.test",
  },
}));
jest.mock("../../src/data", () => ({
  ...jest.requireActual("../../src/data"),
  useRemote: (path: string) => ({
    data:
      path === "/me/learning-preferences"
        ? mockPreferences
        : path === "/me/avatar"
          ? { selection: { itemId: "base" }, items: [], updatedAt: null }
          : null,
    error: null,
    loading: false,
    reload: mockReload,
  }),
}));
jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");
  return { SafeAreaView: View };
});
jest.mock("react-native-svg", () => ({ SvgXml: () => null }));

import Quiz from "../../app/quiz/[id]";
import Entry from "../../app/entry";
import Profile from "../../app/profile";
import {
  forgetEntryLink,
  peekEntryLink,
  receiveEntryLink,
} from "../../src/navigation/links";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function account(id: string, generation: number): SessionSnapshot {
  return {
    status: "authenticated",
    generation,
    user: {
      id,
      name: `Pessoa ${id}`,
      email: `${id}@example.test`,
      role: "STUDENT",
      status: "ACTIVE",
    },
  };
}
const attempt = {
  id: "attempt-one",
  simulationId: "quiz-one",
  status: "IN_PROGRESS",
  practiceMode: "NORMAL",
  simulation: { id: "quiz-one", title: "Descobertas" },
} as ApiQuizAttempt;
const question = {
  id: "question-one",
  originKey: "origin-one",
  practicedBefore: false,
  type: "MULTIPLE_CHOICE",
  statement: "Quanto é dois mais dois?",
  tip: null,
  points: "1",
  order: 1,
  options: [
    { id: "option-a", optionKey: "A", text: "Três", order: 1 },
    { id: "option-b", optionKey: "B", text: "Quatro", order: 2 },
  ],
  answer: null,
  confirmedAt: null,
  feedback: null,
} as ApiQuizQuestion;
const feedback = {
  isCorrect: true,
  pointsEarned: 1,
  explanation: "Dois pares formam quatro.",
  funFact: null,
};
const confirmed = {
  id: "receipt",
  attemptId: attempt.id,
  questionId: question.id,
  answer: { optionKey: "B" },
  confirmedAt: "2026-10-13T10:00:00Z",
  feedback,
};
function quizReads(path: string) {
  if (path === "/quizzes/quiz-one/attempts") return Promise.resolve(attempt);
  if (path.endsWith("/questions")) return Promise.resolve([question]);
  throw new Error(`Unexpected request: ${path}`);
}
async function openQuiz() {
  await render(<Quiz />);
  await screen.findByText(question.statement);
}
function answerCalls() {
  return mockRequest.mock.calls.filter(([path]) =>
    String(path).endsWith("/answer"),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession = account("A", 1);
  mockParams = { id: "quiz-one" };
  mockPreferences = {
    schoolYear: 3,
    segment: "FUNDAMENTAL_I",
    audioEnabled: false,
    motionEnabled: false,
  };
  forgetEntryLink();
});
afterEach(async () => {
  await cleanup();
  forgetEntryLink();
});

test("quiz choices remain editable and no answer is sent before explicit confirmation; server feedback locks them", async () => {
  mockRequest.mockImplementation((path: string) =>
    path.endsWith("/answer") ? Promise.resolve(confirmed) : quizReads(path),
  );
  await openQuiz();
  await fireEvent.press(screen.getByRole("radio", { name: "A Três" }));
  expect(screen.getByRole("radio", { name: "A Três" })).toBeChecked();
  await fireEvent.press(screen.getByRole("radio", { name: "B Quatro" }));
  expect(answerCalls()).toHaveLength(0);
  await fireEvent.press(
    screen.getByRole("button", { name: "Confirmar resposta" }),
  );
  await screen.findByText(feedback.explanation);
  expect(answerCalls()).toHaveLength(1);
  expect(JSON.parse(answerCalls()[0][1].body)).toEqual({
    answer: { optionKey: "B" },
  });
  expect(screen.getByRole("radio", { name: "B Quatro" })).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "Confirmar resposta" }),
  ).toBeNull();
});

test("a lost confirmation response allows an explicit retry of the same answer and uses XP returned by the server", async () => {
  let confirmations = 0;
  const result = {
    attempt: { ...attempt, status: "FINISHED", correctCount: 1 },
    reward: { xpAwarded: 7, reason: "AWARDED", day: "2026-10-13" },
    questions: [
      { ...question, ...confirmed, isCorrect: true, pointsEarned: 1 },
    ],
  } as unknown as ApiQuizResult;
  mockRequest.mockImplementation((path: string) => {
    if (path.endsWith("/answer")) {
      confirmations += 1;
      return confirmations === 1
        ? Promise.reject(new Error("response lost"))
        : Promise.resolve(confirmed);
    }
    if (path.endsWith("/finish")) return Promise.resolve(result);
    return quizReads(path);
  });
  await openQuiz();
  await fireEvent.press(screen.getByRole("radio", { name: "B Quatro" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Confirmar resposta" }),
  );
  await screen.findByText(/Confira a conexão/);
  expect(answerCalls()).toHaveLength(1);
  await fireEvent.press(
    screen.getByRole("button", { name: "Confirmar resposta" }),
  );
  await screen.findByText(feedback.explanation);
  expect(answerCalls()).toHaveLength(2);
  expect(answerCalls()[0][1].body).toEqual(answerCalls()[1][1].body);
  await fireEvent.press(
    screen.getByRole("button", { name: "Concluir prática" }),
  );
  await screen.findByText("+7 XP registrados na sua conta.");
});

test("a replaced quiz never accepts an old finishing response", async () => {
  const finishing = deferred<ApiQuizResult>();
  const nextAttempt = {
    ...attempt,
    id: "attempt-two",
    simulationId: "quiz-two",
    simulation: {
      ...attempt.simulation,
      id: "quiz-two",
      title: "Outra descoberta",
    },
  };
  const nextQuestion = {
    ...question,
    id: "question-two",
    statement: "Qual é a próxima descoberta?",
  };
  mockRequest.mockImplementation((path: string) => {
    if (path.endsWith("/finish")) return finishing.promise;
    if (path === "/quizzes/quiz-one/attempts") return Promise.resolve(attempt);
    if (path === "/quizzes/quiz-two/attempts")
      return Promise.resolve(nextAttempt);
    if (path === "/attempts/attempt-one/questions")
      return Promise.resolve([{ ...question, ...confirmed }]);
    if (path === "/attempts/attempt-two/questions")
      return Promise.resolve([nextQuestion]);
    throw new Error(path);
  });
  const view = await render(<Quiz />);
  await screen.findByText(question.statement);
  await fireEvent.press(
    screen.getByRole("button", { name: "Concluir prática" }),
  );
  mockParams = { id: "quiz-two" };
  await view.rerender(<Quiz />);
  await screen.findByText(nextQuestion.statement);
  await act(async () =>
    finishing.resolve({
      attempt: { ...attempt, status: "FINISHED", correctCount: 1 },
      reward: { xpAwarded: 50 },
      questions: [],
    } as unknown as ApiQuizResult),
  );
  expect(screen.getByText(nextQuestion.statement)).toBeOnTheScreen();
  expect(screen.queryByText("+50 XP registrados na sua conta.")).toBeNull();
});

test("successful password reset removes the in-memory link and preserves the success receipt", async () => {
  receiveEntryLink({ kind: "password-reset", token: "a".repeat(43) });
  mockPublicRequest.mockResolvedValue({ success: true });
  await render(<Entry />);
  await fireEvent.changeText(
    screen.getByLabelText("Nova senha"),
    "new-password",
  );
  await fireEvent.changeText(
    screen.getByLabelText("Confirmar nova senha"),
    "new-password",
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Redefinir senha" }),
  );
  await screen.findByText(
    "Sua senha foi atualizada. Entre com ela quando quiser continuar.",
  );
  expect(peekEntryLink().entry).toBeNull();
  expect(screen.queryByLabelText("Nova senha")).toBeNull();
  expect(mockPublicRequest).toHaveBeenCalledTimes(1);
  expect(mockRequest).not.toHaveBeenCalled();
});

test("a new reset link cancels an older pending reset and ignores its late success", async () => {
  const first = deferred<unknown>();
  mockPublicRequest
    .mockImplementationOnce(() => first.promise)
    .mockResolvedValue({ success: true });
  receiveEntryLink({ kind: "password-reset", token: "a".repeat(43) });
  await render(<Entry />);
  await fireEvent.changeText(
    screen.getByLabelText("Nova senha"),
    "first-password",
  );
  await fireEvent.changeText(
    screen.getByLabelText("Confirmar nova senha"),
    "first-password",
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Redefinir senha" }),
  );
  const oldSignal = mockPublicRequest.mock.calls[0][1].signal as AbortSignal;
  await act(async () =>
    receiveEntryLink({ kind: "password-reset", token: "b".repeat(43) }),
  );
  expect(oldSignal.aborted).toBe(true);
  expect(screen.getByLabelText("Nova senha")).toHaveDisplayValue("");
  await act(async () => first.resolve({ success: true }));
  expect(peekEntryLink().entry).toEqual({
    kind: "password-reset",
    token: "b".repeat(43),
  });
  expect(screen.queryByText(/Sua senha foi atualizada/)).toBeNull();
  await fireEvent.changeText(
    screen.getByLabelText("Nova senha"),
    "second-password",
  );
  await fireEvent.changeText(
    screen.getByLabelText("Confirmar nova senha"),
    "second-password",
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Redefinir senha" }),
  );
  await screen.findByText(/Sua senha foi atualizada/);
  expect(JSON.parse(mockPublicRequest.mock.calls[1][1].body).token).toBe(
    "b".repeat(43),
  );
});

test.each(["success", "failure"] as const)(
  "a late preference %s from account A does not mutate account B or release its pending command",
  async (outcome) => {
    const old = deferred<unknown>();
    const newer = deferred<unknown>();
    mockRequest
      .mockImplementationOnce(() => old.promise)
      .mockImplementationOnce(() => newer.promise);
    const view = await render(<Profile />);
    await fireEvent(screen.getByLabelText("Narração opcional"), "change", {
      nativeEvent: { value: true },
    });
    mockSession = account("B", 2);
    await view.rerender(<Profile />);
    await fireEvent(screen.getByLabelText("Permitir movimento"), "change", {
      nativeEvent: { value: true },
    });
    expect(mockRequest).toHaveBeenCalledTimes(2);
    await act(async () => {
      if (outcome === "failure") old.reject(new Error("old account failed"));
      else old.resolve({ ...mockPreferences, audioEnabled: true });
    });
    expect(screen.queryByText(/Confira a conexão/)).toBeNull();
    expect(mockReload).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Sair da conta" }),
    ).toBeDisabled();
    await act(async () =>
      newer.resolve({ ...mockPreferences, motionEnabled: true }),
    );
    await waitFor(() => expect(mockReload).toHaveBeenCalledTimes(1));
  },
);
