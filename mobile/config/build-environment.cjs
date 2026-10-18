function buildEnvironment(env) {
  const name = env.MOBILE_APP_ENV ?? "development";
  if (name !== "development" && name !== "internal") {
    throw new Error("MOBILE_APP_ENV deve ser development ou internal.");
  }
  const internal = name === "internal";
  for (const key of ["EXPO_PUBLIC_API_URL", "EXPO_PUBLIC_WEB_ORIGIN"]) {
    const raw = env[key];
    if (!raw && !internal) continue;
    try {
      const url = new URL(raw ?? "");
      if (!(["https:", "http:"].includes(url.protocol)) || url.username ||
          url.password || url.pathname !== "/" || url.search || url.hash ||
          (internal && (url.protocol !== "https:" ||
            url.hostname === "localhost" || url.hostname.endsWith(".localhost") ||
            url.hostname === "127.0.0.1" || url.hostname === "[::1]" ||
            url.hostname.endsWith(".invalid")))) throw new Error();
    } catch {
      throw new Error(`${key}: configure uma origem pública válida${internal ? " HTTPS para o ambiente interno" : ""}.`);
    }
  }
  return {
    name: internal ? "Giz Kids · Interno" : "Giz Kids · Desenvolvimento",
    identifier: internal ? "com.simuladosbernardo.gizdev.internal" : "com.simuladosbernardo.gizdev",
    scheme: internal ? "gizdevinternal" : "gizdev",
  };
}

module.exports = { buildEnvironment };
