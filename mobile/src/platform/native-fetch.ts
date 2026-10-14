/**
 * Expo 57.0.28 forwards redirect:error into its native clients before following:
 * Android NativeRequest.kt disables both redirect modes; iOS NativeResponse.swift
 * answers its URLSession redirection delegate with nil. RN's global fetch is not
 * an acceptable fallback for requests carrying a bearer or a refresh body.
 */
type FetchLoader = () => Promise<typeof globalThis.fetch>;

export function createNativeFetch(
  load: FetchLoader = async () => {
    const module = await import("expo/fetch");
    return module.fetch as unknown as typeof globalThis.fetch;
  },
): typeof globalThis.fetch {
  let transport: Promise<typeof globalThis.fetch> | undefined;
  return async (input, init = {}) => {
    // The session client owns URL resolution. Do not accept a Request whose body
    // or credentials could be hidden in an implementation-specific property.
    if (typeof input !== "string" && !(input instanceof URL)) {
      throw new TypeError("Use uma URL explícita da API.");
    }
    const url = new URL(String(input));
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.hash
    ) {
      throw new TypeError("URL de transporte inválida.");
    }
    const headers = new Headers(init.headers);
    headers.delete("cookie");
    headers.delete("cookie2");
    transport ??= load();
    const fetch = await transport;
    return fetch(url.href, {
      ...init,
      headers,
      credentials: "omit",
      redirect: "error",
    });
  };
}

export const nativeFetch = createNativeFetch();
