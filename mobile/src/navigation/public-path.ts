const screens = new Set([
  "/quizzes",
  "/progress",
  "/profile",
  "/simulations",
  "/history",
]);

/** Only the installed variant's configured schemes can navigate without a secret. */
export function publicScreenPath(
  path: string,
  scheme: string | string[] | undefined,
): string {
  try {
    const url = new URL(path);
    const schemes = typeof scheme === "string" ? [scheme] : (scheme ?? []);
    if (
      !schemes.includes(url.protocol.slice(0, -1)) ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    )
      return "/";
    const screen = `/${url.hostname}${url.pathname}`.replace(/\/$/, "");
    return screens.has(screen) ? screen : "/";
  } catch {
    return "/";
  }
}
