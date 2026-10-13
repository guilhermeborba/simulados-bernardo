import { useState } from "react";
import { router } from "expo-router";
import { environment } from "../src/config";
import { readEntryLink, receiveEntryLink } from "../src/navigation/links";
import { useSession } from "../src/session-context";
import { failure } from "../src/data";
import { Button, Card, Copy, Field, Notice, Screen } from "../src/ui";
export default function Recovery() {
  const { client } = useSession();
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function send() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await client.publicRequest<{ message: string }>(
        "/auth/forgot-password",
        { method: "POST", body: JSON.stringify({ email: email.trim() }) },
      );
      setMessage(response.message);
    } catch (error) {
      setMessage(failure(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen
      title="Vamos recuperar seu acesso"
      subtitle="Você receberá as instruções no e-mail da conta."
      publicScreen
    >
      <Card>
        <Field
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
        {message && <Notice>{message}</Notice>}
        <Button
          title="Solicitar instruções"
          disabled={busy || !email.trim()}
          onPress={() => {
            void send();
          }}
        />
        <Copy muted>
          O link também pode ser concluído no navegador. Você escolhe quando
          voltar para entrar.
        </Copy>
      </Card>
      <Card title="Já recebeu o link?">
        <Field
          label="Cole o link recebido"
          secureTextEntry
          autoCorrect={false}
          value={link}
          onChangeText={setLink}
        />
        <Button
          title="Abrir link de recuperação"
          secondary
          disabled={!link}
          onPress={() => {
            const entry = readEntryLink(link.trim(), environment.webOrigin);
            setLink("");
            if (!entry || entry.kind !== "password-reset")
              return setMessage(
                "Use o link completo de recuperação enviado pela aplicação.",
              );
            receiveEntryLink(entry);
            router.push("/entry");
          }}
        />
      </Card>
    </Screen>
  );
}
