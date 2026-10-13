export type EntryLink =
  { kind: "invite"; token: string } | { kind: "password-reset"; token: string };
export function readEntryLink(
  input: string,
  webOrigin: string,
): EntryLink | null {
  try {
    if (input.length > 2048) return null;
    const url = new URL(input);
    const origin = new URL(webOrigin);
    if (
      !["https:", "http:"].includes(origin.protocol) ||
      url.origin !== origin.origin ||
      url.username ||
      url.password
    )
      return null;
    if (
      url.pathname === "/convite" &&
      !url.hash &&
      [...url.searchParams.keys()].length === 1
    ) {
      const token = url.searchParams.get("token");
      return token && /^[A-Za-z0-9_-]{20,200}$/.test(token)
        ? { kind: "invite", token }
        : null;
    }
    if (url.pathname === "/redefinir-senha" && !url.search) {
      const fragment = new URLSearchParams(url.hash.slice(1));
      const token = fragment.get("token");
      return [...fragment.keys()].length === 1 &&
        token &&
        /^[A-Za-z0-9_-]{43}$/.test(token)
        ? { kind: "password-reset", token }
        : null;
    }
    return null;
  } catch {
    return null;
  }
}
// Sensitive values never enter Router parameters or persistent navigation state.
let current: EntryLink | null = null;
let revision = 0;
const listeners = new Set<() => void>();
export function receiveEntryLink(entry: EntryLink) {
  current = entry;
  revision += 1;
  for (const listener of listeners) listener();
}
export function peekEntryLink() {
  return { entry: current, revision };
}
export function forgetEntryLink() {
  current = null;
  revision += 1;
  for (const listener of listeners) listener();
}
export function subscribeEntryLink(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
