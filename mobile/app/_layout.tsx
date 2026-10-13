import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "../src/session-context";
export default function Layout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: "#5933B0",
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          headerBackTitle: "Voltar",
          contentStyle: { backgroundColor: "#F6F7FC" },
          animation: "none",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Simulados Bernardo" }} />
        <Stack.Screen name="quizzes" options={{ title: "Quiz rápido" }} />
        <Stack.Screen name="quiz/[id]" options={{ title: "Sua prática" }} />
        <Stack.Screen name="progress" options={{ title: "Seu progresso" }} />
        <Stack.Screen name="profile" options={{ title: "Sua conta" }} />
        <Stack.Screen name="simulations" options={{ title: "Simulados" }} />
        <Stack.Screen name="history" options={{ title: "Seu histórico" }} />
        <Stack.Screen name="oversight" options={{ title: "Acompanhamento" }} />
        <Stack.Screen name="entry" options={{ title: "Continuar pelo link" }} />
        <Stack.Screen name="recovery" options={{ title: "Recuperar acesso" }} />
      </Stack>
    </SessionProvider>
  );
}
