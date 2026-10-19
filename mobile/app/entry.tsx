import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { useSession } from "../src/session-context";
import { failure } from "../src/data";
import {
  forgetEntryLink,
  peekEntryLink,
  subscribeEntryLink,
} from "../src/navigation/links";
import { Button, Card, Copy, Field, Notice, Screen } from "../src/ui";
export default function Entry() {
  const { client, session } = useSession();
  const [incoming, setIncoming] = useState(peekEntryLink);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cleanupPending, setCleanupPending] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => subscribeEntryLink(() => setIncoming(peekEntryLink())), []);
  useEffect(() => {
    pending.current?.abort();
    pending.current = new AbortController();
    setPassword("");
    setConfirmation("");
    setBusy(false);
    setMessage(null);
    if (incoming.entry) setDone(null);
    return () => pending.current?.abort();
  }, [incoming.revision]);
  useEffect(
    () => () => {
      pending.current?.abort();
      forgetEntryLink();
    },
    [],
  );
  async function cleanResetSession() {
    setBusy(true);
    try {
      await client.logout();
      setCleanupPending(false);
      setDone('Sua senha foi alterada. Entre com a nova senha para continuar.');
    } catch {
      setCleanupPending(true);
      setDone('Sua senha foi alterada. Ainda não foi possível limpar a sessão deste aparelho. Tente a limpeza novamente.');
    } finally { setBusy(false); }
  }
  async function submit() {
    const entry = incoming.entry;
    const signal = pending.current?.signal;
    if (!entry || !signal) return;
    const revision = incoming.revision;
    setBusy(true);
    setMessage(null);
    try {
      if (entry.kind === "invite") {
        await client.request("/me/turmas/join", {
          method: "POST",
          body: JSON.stringify({ token: entry.token }),
          signal,
        });
      } else {
        if (
          password !== confirmation ||
          [...password].length < 8 ||
          new TextEncoder().encode(password).length > 72
        ) {
          setMessage(
            "Use pelo menos 8 caracteres, até 72 bytes, e confirme a mesma senha.",
          );
          return;
        }
        await client.publicRequest("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ token: entry.token, password }),
          signal,
        });
      }
      if (signal.aborted || revision !== peekEntryLink().revision) return;
      pending.current?.abort();
      forgetEntryLink();
      setPassword("");
      setConfirmation("");
      if (entry.kind === 'password-reset') await cleanResetSession();
      else setDone('Você entrou na turma. Volte ao início para ver as atividades.');
    } catch (error) {
      if (!signal.aborted && revision === peekEntryLink().revision)
        setMessage(failure(error));
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }
  return (
    <Screen
      title={
        incoming.entry?.kind === "invite"
          ? "Uma nova turma espera por você"
          : "Um novo acesso começa aqui"
      }
      publicScreen
    >
      {message && <Notice>{message}</Notice>}
      {!incoming.entry ? (
        <Card>
          <Copy>
            {done ??
              "Abra novamente o link recebido para continuar. Links não ficam salvos no aparelho."}
          </Copy>
          {cleanupPending ? <Button title="Tentar limpar sessão" disabled={busy} onPress={() => { void cleanResetSession(); }} /> : <Button title="Voltar para entrar" onPress={() => router.replace('/')} />}
        </Card>
      ) : incoming.entry.kind === "invite" ? (
        <Card>
          <Copy>
            O convite libera as atividades da turma para a sua conta de aluno.
          </Copy>
          {session.user?.role === "STUDENT" ? (
            <Button
              title="Entrar na turma"
              disabled={busy}
              onPress={() => {
                void submit();
              }}
            />
          ) : (
            <>
              <Copy>
                Entre com uma conta de aluno e abra novamente o convite.
              </Copy>
              <Button
                title="Ir para o acesso"
                onPress={() => {
                  router.replace("/");
                }}
              />
            </>
          )}
        </Card>
      ) : (
        <Card>
          <Field
            label="Nova senha"
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
          />
          <Field
            label="Confirmar nova senha"
            secureTextEntry
            autoComplete="new-password"
            value={confirmation}
            onChangeText={setConfirmation}
          />
          <Button
            title="Redefinir senha"
            disabled={busy || !password || !confirmation}
            onPress={() => {
              void submit();
            }}
          />
        </Card>
      )}
    </Screen>
  );
}
