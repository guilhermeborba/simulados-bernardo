import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { useSession } from "../src/session-context";
import {
  useRemote,
  failure,
  type ApiLearningProgress,
  type ApiQuizAttempt,
} from "../src/data";
import {
  Button,
  Card,
  Copy,
  Loading,
  Navigation,
  Notice,
  Screen,
  YearPicker,
} from "../src/ui";
export default function Progress() {
  const { client } = useSession();
  const [year, setYear] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const commandVersion = useRef(0);
  useEffect(() => {
    commandVersion.current += 1;
    setBusy(false);
    setMessage(null);
  }, [client, year, client.getSnapshot().generation]);
  const result = useRemote<ApiLearningProgress>(
    `/me/learning-progress${year === null ? "" : `?schoolYear=${year}`}`,
  );
  async function review(quizId: string) {
    const generation = client.getSnapshot().generation;
    const command = ++commandVersion.current;
    const current = () =>
      generation === client.getSnapshot().generation &&
      command === commandVersion.current;
    setBusy(true);
    setMessage(null);
    try {
      const attempt = await client.request<ApiQuizAttempt>(
        "/me/review-attempts",
        { method: "POST", body: JSON.stringify({ quizId }) },
      );
      if (current())
        router.push({
          pathname: "/quiz/[id]",
          params: { id: attempt.simulationId, attempt: attempt.id },
        });
    } catch (error) {
      if (current()) setMessage(failure(error));
    } finally {
      if (current()) setBusy(false);
    }
  }
  return (
    <Screen
      title="Cada prática conta"
      subtitle="Veja seus registros e encontre o próximo passo."
      student
    >
      <Navigation />
      <YearPicker
        year={year ?? result.data?.schoolYear ?? null}
        onChange={setYear}
      />
      {result.loading && <Loading />}
      {result.error && (
        <Notice>
          {result.error}
          <Button title="Tentar novamente" onPress={result.reload} />
        </Notice>
      )}
      {message && <Notice>{message}</Notice>}
      {result.data?.skills.length === 0 && (
        <Card title="Seu caminho começa aqui">
          <Copy>
            Ao concluir quizzes classificados, seus registros aparecem por
            habilidade.
          </Copy>
        </Card>
      )}
      {result.data?.skills.map((skill) => (
        <Card key={`${skill.code}:${skill.version}`} title={skill.title}>
          <Copy muted>{skill.discipline.name}</Copy>
          <Copy>
            {skill.firstResponse.questions} primeiras respostas ·{" "}
            {skill.repeat.responses} repetições · {skill.review.responses}{" "}
            revisões
          </Copy>
          <Copy muted>
            {skill.evidence === "INSUFFICIENT"
              ? "Ainda precisamos de mais perguntas diferentes para reunir registros iniciais."
              : "Há registros iniciais disponíveis. Eles não indicam domínio da habilidade."}
          </Copy>
        </Card>
      ))}
      {result.data?.inProgressReview && (
        <Button
          title="Continuar revisão"
          onPress={() =>
            router.push({
              pathname: "/quiz/[id]",
              params: {
                id: result.data!.inProgressReview!.simulationId,
                attempt: result.data!.inProgressReview!.id,
              },
            })
          }
        />
      )}
      {result.data?.reviewSuggestions.map((suggestion) => (
        <Card key={suggestion.quizId} title={suggestion.title}>
          <Copy>
            Uma revisão com até {suggestion.questionCount} perguntas para
            praticar novamente.
          </Copy>
          <Button
            title="Começar revisão"
            disabled={busy}
            onPress={() => {
              void review(suggestion.quizId);
            }}
          />
        </Card>
      ))}
    </Screen>
  );
}
