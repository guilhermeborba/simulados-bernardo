import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useSession } from "../src/session-context";
import { useRemote, failure, type ApiLearningHome } from "../src/data";
import {
  Button,
  Card,
  Copy,
  Field,
  Loading,
  Navigation,
  Notice,
  Screen,
  YearPicker,
  colors,
} from "../src/ui";
export default function Home() {
  const { client, session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const home = useRemote<ApiLearningHome>(
    session.user?.role === "STUDENT"
      ? `/me/learning-home${year === null ? "" : `?schoolYear=${year}`}`
      : null,
  );
  useEffect(() => {
    setEmail("");
    setPassword("");
    setMessage(null);
    setYear(null);
  }, [session.generation]);
  useEffect(() => {
    if (session.status === "authenticated" && session.user?.role !== "STUDENT")
      router.replace("/oversight");
  }, [session.status, session.user?.role]);
  async function login() {
    setMessage(null);
    const pending = client.login({ email: email.trim(), password });
    const generation = client.getSnapshot().generation;
    try {
      await pending;
      if (generation === client.getSnapshot().generation) setPassword("");
    } catch (error) {
      if (generation === client.getSnapshot().generation) {
        setMessage(failure(error));
        setPassword("");
      }
    }
  }
  if (session.status === "restoring" || session.status === "signing-in")
    return (
      <Screen title="Sua próxima descoberta" publicScreen>
        <Loading />
      </Screen>
    );
  if (session.status !== "authenticated")
    return (
      <Screen
        title="Aprender pode ser leve."
        subtitle="Quizzes, desafios e pequenas descobertas para o seu dia."
        publicScreen
      >
        <View
          style={{
            borderRadius: 28,
            backgroundColor: colors.pale,
            padding: 26,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 50 }}>✦</Text>
          <Copy>Um passo de cada vez. Seu progresso acompanha você.</Copy>
        </View>
        {session.status === "retry-required" && (
          <Card title="Vamos reconectar?">
            <Copy>
              Suas respostas já salvas continuam protegidas. Confira a conexão.
            </Copy>
            <Button
              title="Tentar novamente"
              onPress={() => {
                void client
                  .restore()
                  .catch(() => setMessage("Ainda não foi possível conectar."));
              }}
            />
          </Card>
        )}
        {session.status === "storage-error" && (
          <Notice>
            Não foi possível proteger ou limpar a sessão neste dispositivo.
            Tente sair novamente antes de trocar de conta.
            <Button
              title="Limpar sessão"
              onPress={() => {
                void client
                  .logout()
                  .catch(() =>
                    setMessage("A limpeza ainda precisa ser repetida."),
                  );
              }}
            />
          </Notice>
        )}
        <Card title="Bem-vindo de volta">
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />
          <Field
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            onSubmitEditing={() => {
              void login();
            }}
          />
          {message && <Notice>{message}</Notice>}
          <Button
            title="Entrar"
            disabled={
              !email.trim() || !password || session.status === "storage-error"
            }
            onPress={() => {
              void login();
            }}
          />
          <Button
            title="Esqueci minha senha"
            secondary
            onPress={() => router.push("/recovery")}
          />
        </Card>
      </Screen>
    );
  const data = home.data;
  return (
    <Screen
      title={`Olá, ${session.user?.name.split(" ")[0]}!`}
      subtitle="Que tal uma pequena descoberta hoje?"
      student
    >
      
      <YearPicker year={year ?? data?.schoolYear ?? null} onChange={setYear} />
      {home.loading && <Loading />}
      {home.error && (
        <Notice>
          {home.error}
          <Button title="Tentar novamente" onPress={home.reload} />
        </Notice>
      )}
      {data && (
        <>
          <View
            style={{
              borderRadius: 28,
              padding: 24,
              backgroundColor: colors.purple,
              gap: 12,
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 17, fontWeight: "600" }}>
              Seu caminho está crescendo ✦
            </Text>
            <Text style={{ color: "#FFF", fontSize: 38, fontWeight: "800" }}>
              {data.xp.total} XP
            </Text>
            <Text style={{ color: "#FFF", fontSize: 15 }}>
              {data.xp.today} de {data.xp.dailyLimit} XP hoje
            </Text>
          </View>
          {data.inProgress && (
            <Card title="Continue de onde parou">
              <Copy>{data.inProgress.simulation.title}</Copy>
              <Button
                title="Retomar quiz"
                onPress={() =>
                  router.push({
                    pathname: "/quiz/[id]",
                    params: {
                      id: data.inProgress!.simulationId,
                      attempt: data.inProgress!.id,
                    },
                  })
                }
              />
            </Card>
          )}
          <Card title="Uma prática curtinha">
            <Copy>
              {data.suggestedQuiz?.title ??
                "Explore os quizzes disponíveis para a sua faixa."}
            </Copy>
            <Button
              title="Explorar quizzes"
              onPress={() => router.push("/quizzes")}
            />
          </Card>
          {data.missions.map((mission) => (
            <Card key={mission.id} title={mission.title}>
              <Copy>{mission.description}</Copy>
              <Copy muted>
                {mission.completedActivities} de {mission.totalActivities}{" "}
                etapas
              </Copy>
              {mission.activities.map((activity) => (
                <Button
                  key={activity.activityKey}
                  secondary
                  title={`${activity.completed ? "✓ " : ""}${activity.title}`}
                  onPress={() =>
                    router.push({
                      pathname: "/quiz/[id]",
                      params: {
                        id: activity.quizId,
                        ...(activity.attemptId
                          ? { attempt: activity.attemptId }
                          : {}),
                      },
                    })
                  }
                />
              ))}
            </Card>
          ))}
        </>
      )}
      <Button
        title="Praticar com simulados"
        secondary
        onPress={() => router.push("/official-simulations")}
      />
      <Button
        title="Meu histórico de quizzes"
        secondary
        onPress={() => router.push("/practice-history")}
      />
    </Screen>
  );
}
