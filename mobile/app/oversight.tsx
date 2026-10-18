import { useEffect, useState } from "react";
import { useSession } from "../src/session-context";
import {
  useRemote,
  type ApiOversightStudent,
  type ApiStudentSummary,
  type ApiStudentLearningProgress,
} from "../src/data";
import {
  Button,
  Card,
  Copy,
  Loading,
  Navigation,
  Notice,
  Screen,
} from "../src/ui";
export default function Oversight() {
  const { session } = useSession();
  const [student, setStudent] = useState<string | null>(null);
  const roster = useRemote<ApiOversightStudent[]>(
    session.user?.role !== "STUDENT" ? "/me/oversight-students" : null,
  );
  const active = roster.data?.find((item) => item.id === student);
  const summary = useRemote<ApiStudentSummary>(
    active ? `/reports/student/${encodeURIComponent(active.id)}/summary` : null,
  );
  const progress = useRemote<ApiStudentLearningProgress>(
    active
      ? `/students/${encodeURIComponent(active.id)}/learning-progress`
      : null,
  );
  useEffect(() => {
    setStudent(null);
  }, [session.generation]);
  return (
    <Screen
      title="Aprender com companhia"
      subtitle="Acompanhe os alunos vinculados à sua conta."
    >
      <Navigation />
      {roster.loading && session.user?.role !== "STUDENT" && <Loading />}
      {roster.error && (
        <Notice>
          {roster.error}
          <Button title="Atualizar alunos" onPress={roster.reload} />
        </Notice>
      )}
      {roster.data?.length === 0 && (
        <Card>
          <Copy>Você ainda não tem alunos disponíveis para acompanhar.</Copy>
        </Card>
      )}
      {roster.data?.map((item) => (
        <Button
          key={item.id}
          secondary
          title={`${student === item.id ? "✓ " : ""}${item.name}`}
          onPress={() => setStudent(item.id)}
        />
      ))}
      {active && (
        <>
          <Card title={`Avaliações · ${active.name}`}>
            {summary.loading && <Loading />}
            {summary.error && (
              <Notice>
                {summary.error}
                <Button title="Atualizar avaliações" onPress={summary.reload} />
              </Notice>
            )}
            {summary.data && (
              <Copy>
                {summary.data.totalFinishedAttempts} simulados concluídos ·
                média {summary.data.averagePercentage.toFixed(1)}%
              </Copy>
            )}
          </Card>
          <Card title="Prática por habilidade">
            {progress.loading && <Loading />}
            {progress.error && (
              <Notice>
                {progress.error}
                <Button title="Atualizar prática" onPress={progress.reload} />
              </Notice>
            )}
            {progress.data?.skills.map((skill) => (
              <ViewSkill
                key={`${skill.code}:${skill.version}`}
                title={skill.title}
                first={skill.firstResponse.questions}
                review={skill.review.responses}
              />
            ))}
            {progress.data?.skills.length === 0 && (
              <Copy>Ainda não há registros classificados para esta faixa.</Copy>
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
function ViewSkill({
  title,
  first,
  review,
}: {
  title: string;
  first: number;
  review: number;
}) {
  return (
    <>
      <Copy>{title}</Copy>
      <Copy muted>
        {first} primeiras respostas · {review} revisões. Prática e avaliação têm
        registros separados.
      </Copy>
    </>
  );
}
