import { useState } from "react";
import { router } from "expo-router";
import { useRemote, type ApiQuiz } from "../src/data";
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
export default function Quizzes() {
  const [year, setYear] = useState<number | null>(null);
  const result = useRemote<ApiQuiz[]>(
    `/quizzes/available${year === null ? "" : `?schoolYear=${year}`}`,
  );
  return (
    <Screen
      title="Descubra um quiz"
      subtitle="Escolha um tema e pratique no seu ritmo."
      student
    >
      <Navigation />
      <YearPicker year={year} onChange={setYear} />
      {result.loading && <Loading />}
      {result.error && (
        <Notice>
          {result.error}
          <Button title="Atualizar lista" onPress={result.reload} />
        </Notice>
      )}
      {result.data?.length === 0 && (
        <Card title="Novas descobertas estão a caminho">
          <Copy>
            Não há quizzes publicados para este filtro. Você pode escolher outra
            faixa ou voltar depois.
          </Copy>
        </Card>
      )}
      {result.data?.map((quiz) => (
        <Card key={quiz.id} title={quiz.title}>
          <Copy muted>
            {quiz.discipline.name} · {quiz.totalQuestions} perguntas
          </Copy>
          {quiz.topic && <Copy>{quiz.topic}</Copy>}
          <Button
            title="Vamos praticar"
            onPress={() =>
              router.push({ pathname: "/quiz/[id]", params: { id: quiz.id } })
            }
          />
        </Card>
      ))}
    </Screen>
  );
}
