import { router } from "expo-router";
import { useRemote, type ApiQuizAttempt } from "../src/data";
import {
  Button,
  Card,
  Copy,
  Loading,
  Navigation,
  Notice,
  Screen,
} from "../src/ui";
export default function History() {
  const result = useRemote<ApiQuizAttempt[]>("/me/quiz-attempts");
  return (
    <Screen
      title="Seu caminho até aqui"
      subtitle="Quizzes e revisões, separados das avaliações."
      student
    >
      <Navigation />
      {result.loading && <Loading />}
      {result.error && (
        <Notice>
          {result.error}
          <Button title="Tentar novamente" onPress={result.reload} />
        </Notice>
      )}
      {result.data?.length === 0 && (
        <Copy>Seu primeiro quiz concluído aparecerá aqui.</Copy>
      )}
      {result.data?.map((attempt) => (
        <Card key={attempt.id} title={attempt.simulation.title}>
          <Copy muted>
            {attempt.practiceMode === "REVIEW" ? "Revisão" : "Quiz"} ·{" "}
            {attempt.status === "FINISHED" ? "Concluído" : "Em andamento"}
          </Copy>
          <Button
            title={
              attempt.status === "FINISHED" ? "Ver resultado" : "Continuar"
            }
            onPress={() =>
              router.push({
                pathname: "/quiz/[id]",
                params: { id: attempt.simulationId, attempt: attempt.id },
              })
            }
          />
        </Card>
      ))}
    </Screen>
  );
}
