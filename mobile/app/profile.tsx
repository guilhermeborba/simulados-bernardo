import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { Switch, View } from "react-native";
import { useSession } from "../src/session-context";
import {
  useRemote,
  failure,
  years,
  type ApiLearningPreferences,
  type ApiMyAvatar,
} from "../src/data";
import { readEntryLink, receiveEntryLink } from "../src/navigation/links";
import { environment } from "../src/config";
import {
  Button,
  Card,
  Copy,
  Field,
  Navigation,
  Notice,
  Screen,
  YearPicker,
} from "../src/ui";
export default function Profile() {
  const { client, session, cleanupMedia } = useSession();
  const preferences = useRemote<ApiLearningPreferences>(
    "/me/learning-preferences",
  );
  const avatar = useRemote<ApiMyAvatar>(
    session.user?.role === "STUDENT" ? "/me/avatar" : null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const commandVersion = useRef(0);
  useEffect(() => {
    commandVersion.current += 1;
    setBusy(false);
    setMessage(null);
    setLink("");
  }, [session.generation]);
  async function mutate(path: string, patch: object, reload: () => void) {
    const generation = client.getSnapshot().generation;
    const command = ++commandVersion.current;
    const current = () =>
      generation === client.getSnapshot().generation &&
      command === commandVersion.current;
    setBusy(true);
    setMessage(null);
    try {
      await client.request(path, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (current()) reload();
    } catch (error) {
      if (current()) setMessage(failure(error));
    } finally {
      if (current()) setBusy(false);
    }
  }
  async function update(patch: Partial<ApiLearningPreferences>) {
    await mutate("/me/learning-preferences", patch, preferences.reload);
  }
  async function leave() {
    const initial = client.getSnapshot().generation;
    setBusy(true);
    setMessage(null);
    await cleanupMedia();
    if (initial !== client.getSnapshot().generation) return;
    const pending = client.logout();
    const generation = client.getSnapshot().generation;
    try {
      await pending;
      if (generation === client.getSnapshot().generation) router.replace("/");
    } catch {
      if (generation === client.getSnapshot().generation) router.replace("/");
    }
  }
  return (
    <Screen
      title="Seu jeito de aprender"
      subtitle="Preferências e escolhas que acompanham a sua conta."
    >
      <Navigation />
      <Card title={session.user?.name}>
        <Copy muted>{session.user?.email}</Copy>
      </Card>
      {message && <Notice>{message}</Notice>}
      {preferences.error && (
        <Notice>
          {preferences.error}
          <Button title="Atualizar preferências" onPress={preferences.reload} />
        </Notice>
      )}
      {preferences.data && (
        <Card title="Sua experiência">
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Copy>Narração opcional</Copy>
            <Switch
              accessibilityLabel="Narração opcional"
              disabled={busy}
              value={preferences.data.audioEnabled}
              onValueChange={(audioEnabled) => {
                void update({ audioEnabled });
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Copy>Permitir movimento</Copy>
            <Switch
              accessibilityLabel="Permitir movimento"
              disabled={busy}
              value={preferences.data.motionEnabled}
              onValueChange={(motionEnabled) => {
                void update({ motionEnabled });
              }}
            />
          </View>
          <Copy muted>
            A prova usa transições sem animação e nunca inicia o áudio sozinha.
          </Copy>
          <YearPicker
            year={preferences.data.schoolYear}
            onChange={(schoolYear) => {
              const segment = years.find((item) => item.value === schoolYear)!
                .segment as ApiLearningPreferences["segment"];
              if (!busy) void update({ schoolYear, segment });
            }}
          />
        </Card>
      )}
      {avatar.data && (
        <Card title="Sua coleção">
          <Copy muted>Escolha entre os itens que você já liberou.</Copy>
          {avatar.data.items.map((item) => (
            <Button
              key={item.id}
              secondary
              title={`${avatar.data!.selection.itemId === item.id ? "✓ " : ""}${item.title}${item.owned ? "" : " · Bloqueado"}`}
              disabled={!item.owned || busy}
              onPress={() => {
                void mutate("/me/avatar", { itemId: item.id }, avatar.reload);
              }}
            />
          ))}
        </Card>
      )}
      <Card title="Recebeu um convite ou link?">
        <Field
          label="Cole o link recebido"
          secureTextEntry
          value={link}
          onChangeText={setLink}
          autoCorrect={false}
        />
        <Button
          title="Continuar pelo link"
          secondary
          disabled={!link}
          onPress={() => {
            const entry = readEntryLink(link.trim(), environment.webOrigin);
            setLink("");
            if (!entry)
              return setMessage(
                "O link precisa ser da aplicação e estar completo.",
              );
            receiveEntryLink(entry);
            router.push("/entry");
          }}
        />
      </Card>
      <Button
        title="Sair da conta"
        disabled={busy}
        secondary
        onPress={() => {
          void leave();
        }}
      />
    </Screen>
  );
}
