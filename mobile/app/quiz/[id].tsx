import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SvgXml } from "react-native-svg";
import { useSession } from "../../src/session-context";
import {
  useRemote,
  failure,
  type ApiQuizAttempt,
  type ApiQuizQuestion,
  type ApiQuizConfirmation,
  type ApiQuizResult,
  type ApiLearningPreferences,
} from "../../src/data";
import {
  Button,
  Card,
  Copy,
  Loading,
  Notice,
  Screen,
  colors,
  styles,
} from "../../src/ui";
type Round = {
  generation: number;
  attempt: ApiQuizAttempt;
  questions: ApiQuizQuestion[];
  result: ApiQuizResult | null;
};
function QuestionMedia({ question }: { question: ApiQuizQuestion }) {
  const { media, session, cleanupMedia } = useSession();
  const preferences = useRemote<ApiLearningPreferences>(
    "/me/learning-preferences",
  );
  const [svg, setSvg] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    pending.current = abort;
    setSvg(null);
    setAudioError(false);
    if (question.media?.image)
      void media
        .loadSvg(question.media.image.url, abort.signal)
        .then((xml) => {
          if (!abort.signal.aborted) setSvg(xml);
        })
        .catch(() => undefined);
    return () => {
      abort.abort();
      void cleanupMedia();
    };
  }, [media, cleanupMedia, question.id, session.generation]);
  return (
    <>
      {question.media?.image && (
        <View style={{ gap: 8 }}>
          {svg && (
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={question.media.image.alt}
            >
              <SvgXml xml={svg} width="100%" height={200} />
            </View>
          )}
          <Copy muted>{question.media.image.alt}</Copy>
        </View>
      )}
      {question.media?.audio && (
        <View style={{ gap: 8 }}>
          <Button
            title="Ouvir a pergunta"
            secondary
            disabled={!preferences.data?.audioEnabled}
            onPress={() => {
              setAudioError(false);
              const signal = pending.current?.signal;
              void media
                .playAudio(question.media!.audio!.url, signal)
                .catch(() => {
                  if (signal && !signal.aborted) setAudioError(true);
                });
            }}
          />
          {!preferences.data?.audioEnabled && (
            <Copy muted>Você pode ativar a narração no seu perfil.</Copy>
          )}
          {audioError && (
            <Copy muted>
              A narração não está disponível agora. Você pode continuar pelo
              texto.
            </Copy>
          )}
          <Copy muted>{question.media.audio.transcript}</Copy>
        </View>
      )}
    </>
  );
}
export default function Quiz() {
  const params = useLocalSearchParams<{ id: string; attempt?: string }>();
  const id =
    typeof params.id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(params.id)
      ? params.id
      : null;
  const previous =
    typeof params.attempt === "string" &&
    /^[A-Za-z0-9_-]{1,128}$/.test(params.attempt)
      ? params.attempt
      : null;
  const { client, session, foreground } = useSession();
  const [round, setRound] = useState<Round | null>(null);
  const [revision, setRevision] = useState(0);
  const [position, setPosition] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const commandVersion = useRef(0);
  useEffect(() => {
    const abort = new AbortController();
    const generation = session.generation;
    commandVersion.current += 1;
    setRound(null);
    setMessage(null);
    setBusy(false);
    setChoice(null);
    if (!id || !session.user || session.user.role !== "STUDENT")
      return () => abort.abort();
    void (async () => {
      try {
        const attempt = previous
          ? await client.request<ApiQuizAttempt>(
              `/attempts/${encodeURIComponent(previous)}`,
              { signal: abort.signal },
            )
          : await client.request<ApiQuizAttempt>(
              `/quizzes/${encodeURIComponent(id)}/attempts`,
              { method: "POST", signal: abort.signal },
            );
        if (attempt.simulationId !== id)
          throw new Error("Atividade diferente.");
        const questions = await client.request<ApiQuizQuestion[]>(
          `/attempts/${encodeURIComponent(attempt.id)}/questions`,
          { signal: abort.signal },
        );
        const result =
          attempt.status === "FINISHED"
            ? await client.request<ApiQuizResult>(
                `/attempts/${encodeURIComponent(attempt.id)}/result`,
                { signal: abort.signal },
              )
            : null;
        if (
          !abort.signal.aborted &&
          generation === client.getSnapshot().generation
        ) {
          setRound({ generation, attempt, questions, result });
          const first = questions.findIndex(
            (question) => !question.confirmedAt,
          );
          setPosition(first < 0 ? Math.max(0, questions.length - 1) : first);
        }
      } catch (error) {
        if (
          !abort.signal.aborted &&
          generation === client.getSnapshot().generation
        )
          setMessage(failure(error));
      }
    })();
    return () => abort.abort();
  }, [
    client,
    id,
    previous,
    session.generation,
    session.user?.id,
    revision,
    foreground,
  ]);
  const data = round?.generation === session.generation ? round : null;
  const question = data?.questions[position];
  useEffect(() => {
    setChoice(question?.answer?.optionKey ?? null);
  }, [question?.id, question?.answer?.optionKey]);
  async function confirm() {
    if (!data || !question || !choice) return;
    const command = ++commandVersion.current;
    setBusy(true);
    setMessage(null);
    try {
      const response = await client.request<ApiQuizConfirmation>(
        `/attempts/${encodeURIComponent(data.attempt.id)}/questions/${encodeURIComponent(question.id)}/answer`,
        {
          method: "POST",
          body: JSON.stringify({ answer: { optionKey: choice } }),
        },
      );
      setRound((current) =>
        current?.generation === data.generation &&
        current.attempt.id === data.attempt.id &&
        command === commandVersion.current
          ? {
              ...current,
              questions: current.questions.map((item) =>
                item.id === question.id
                  ? {
                      ...item,
                      answer: response.answer,
                      confirmedAt: response.confirmedAt,
                      feedback: response.feedback,
                    }
                  : item,
              ),
            }
          : current,
      );
    } catch (error) {
      if (
        data.generation === client.getSnapshot().generation &&
        command === commandVersion.current
      )
        setMessage(failure(error));
    } finally {
      if (
        data.generation === client.getSnapshot().generation &&
        command === commandVersion.current
      )
        setBusy(false);
    }
  }
  async function finish() {
    if (!data) return;
    const command = ++commandVersion.current;
    setBusy(true);
    setMessage(null);
    try {
      const result = await client.request<ApiQuizResult>(
        `/attempts/${encodeURIComponent(data.attempt.id)}/finish`,
        { method: "POST" },
      );
      setRound((current) =>
        current?.generation === data.generation &&
        current.attempt.id === data.attempt.id &&
        command === commandVersion.current
          ? { ...current, result, attempt: result.attempt }
          : current,
      );
    } catch (error) {
      if (
        data.generation === client.getSnapshot().generation &&
        command === commandVersion.current
      )
        setMessage(failure(error));
    } finally {
      if (
        data.generation === client.getSnapshot().generation &&
        command === commandVersion.current
      )
        setBusy(false);
    }
  }
  return (
    <Screen
      title={
        data?.result
          ? "Mais um passo dado!"
          : data?.attempt.practiceMode === "REVIEW"
            ? "Vamos praticar de novo"
            : "Uma descoberta por vez"
      }
      subtitle={data?.attempt.simulation.title}
      student
    >
      {!id && <Notice>Este link não identifica uma atividade válida.</Notice>}
      {!data && !message && id && <Loading />}
      {message && (
        <Notice>
          {message}
          <Button
            title="Atualizar atividade"
            secondary
            onPress={() => setRevision((n) => n + 1)}
          />
        </Notice>
      )}
      {data?.result ? (
        <Card title="Prática concluída">
          <Copy>
            {data.result.attempt.correctCount} de {data.result.questions.length}{" "}
            respostas corretas.
          </Copy>
          <Copy>
            {data.result.reward.xpAwarded > 0
              ? `+${data.result.reward.xpAwarded} XP registrados na sua conta.`
              : data.result.reward.reason === "REVIEW"
                ? "Esta revisão reúne novos registros de prática, sem XP extra."
                : "Seu progresso foi salvo. Você pode continuar praticando no seu ritmo."}
          </Copy>
          {data.result.questions.map((item) => (
            <View key={item.id} style={{ gap: 6 }}>
              <Text style={styles.label}>{item.statement}</Text>
              <Copy>{item.feedback?.explanation}</Copy>
            </View>
          ))}
        </Card>
      ) : (
        question &&
        data && (
          <>
            <Copy muted>
              Pergunta {position + 1} de {data.questions.length}
              {question.practicedBefore
                ? " · Você já praticou esta pergunta"
                : ""}
            </Copy>
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: data.questions.length,
                now: data.questions.filter((item) => item.confirmedAt).length,
              }}
              style={{ backgroundColor: "#DFDAED", height: 8, borderRadius: 4 }}
            >
              <View
                style={{
                  width: `${(100 * data.questions.filter((item) => item.confirmedAt).length) / data.questions.length}%`,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.purple,
                }}
              />
            </View>
            <Card>
              <Text
                accessibilityRole="header"
                style={{
                  fontSize: 23,
                  lineHeight: 32,
                  fontWeight: "800",
                  color: colors.ink,
                }}
              >
                {question.statement}
              </Text>
              <QuestionMedia key={question.id} question={question} />
              {question.options.map((option) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked:
                      (question.answer?.optionKey ?? choice) ===
                      option.optionKey,
                    disabled: Boolean(question.confirmedAt) || busy,
                  }}
                  disabled={Boolean(question.confirmedAt) || busy}
                  key={option.id}
                  onPress={() => setChoice(option.optionKey)}
                  style={[
                    styles.input,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      backgroundColor:
                        (question.answer?.optionKey ?? choice) ===
                        option.optionKey
                          ? colors.pale
                          : "#FFF",
                      borderColor:
                        (question.answer?.optionKey ?? choice) ===
                        option.optionKey
                          ? colors.purple
                          : colors.line,
                    },
                  ]}
                >
                  <Text style={styles.label}>{option.optionKey}</Text>
                  <Text style={[styles.copy, { flex: 1 }]}>{option.text}</Text>
                </Pressable>
              ))}
              {!question.confirmedAt && (
                <Button
                  title="Confirmar resposta"
                  disabled={busy || !choice}
                  onPress={() => {
                    void confirm();
                  }}
                />
              )}
            </Card>
            {question.feedback && (
              <Card
                title={
                  question.feedback.isCorrect
                    ? "Boa descoberta!"
                    : "Vamos entender juntos"
                }
              >
                <Copy>{question.feedback.explanation}</Copy>
                {question.feedback.funFact && (
                  <Copy muted>{question.feedback.funFact}</Copy>
                )}
                {position < data.questions.length - 1 && (
                  <Button
                    title="Próxima pergunta"
                    onPress={() => {
                      setChoice(null);
                      setPosition((n) => n + 1);
                    }}
                  />
                )}
              </Card>
            )}
            {data.questions.every((item) => item.confirmedAt) && (
              <Button
                title="Concluir prática"
                disabled={busy}
                onPress={() => {
                  void finish();
                }}
              />
            )}
          </>
        )
      )}
    </Screen>
  );
}
