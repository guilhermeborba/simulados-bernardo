import { useEffect, useState } from "react";
import { ApiError, SessionChangedError } from "./core/session";
import { useSession } from "./session-context";
export type * from "../../packages/api-contracts/src";
export const years = [
  { value: -1, label: "Infantil 4", segment: "INFANTIL" },
  { value: -2, label: "Infantil 5", segment: "INFANTIL" },
  ...Array.from({ length: 9 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}º ano`,
    segment: i < 5 ? "FUNDAMENTAL_I" : "FUNDAMENTAL_II",
  })),
  ...Array.from({ length: 3 }, (_, i) => ({
    value: i + 10,
    label: `${i + 1}ª série EM`,
    segment: "MEDIO",
  })),
  { value: 0, label: "Enfermagem", segment: "ENFERMAGEM" },
];
export function failure(error: unknown) {
  if (error instanceof ApiError && error.status === 403)
    return "Seu acesso a esta atividade mudou. Atualize a lista.";
  if (error instanceof ApiError && error.status === 409)
    return "Esta resposta já foi confirmada. Atualize a atividade para continuar.";
  return "Não foi possível concluir agora. Confira a conexão e tente novamente.";
}
export function useRemote<T>(path: string | null) {
  const { client, session, foreground } = useSession();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    generation: number;
    path: string | null;
    value: T | null;
    error: string | null;
    loading: boolean;
  }>({ generation: -1, path: null, value: null, error: null, loading: true });
  useEffect(() => {
    const abort = new AbortController();
    const generation = session.generation;
    if (!path || !session.user) return () => abort.abort();
    setState({ generation, path, value: null, error: null, loading: true });
    void client
      .request<T>(path, { signal: abort.signal })
      .then((value) => {
        if (
          !abort.signal.aborted &&
          generation === client.getSnapshot().generation
        )
          setState({ generation, path, value, error: null, loading: false });
      })
      .catch((error) => {
        if (
          !abort.signal.aborted &&
          !(error instanceof SessionChangedError) &&
          generation === client.getSnapshot().generation
        )
          setState({
            generation,
            path,
            value: null,
            error: failure(error),
            loading: false,
          });
      });
    return () => abort.abort();
  }, [
    client,
    session.generation,
    session.user?.id,
    path,
    revision,
    foreground,
  ]);
  const valid = state.generation === session.generation && state.path === path;
  return {
    data: valid ? state.value : null,
    error: valid ? state.error : null,
    loading: !valid || state.loading,
    reload: () => setRevision((n) => n + 1),
  };
}
