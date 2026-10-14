import { readEntryLink, receiveEntryLink } from "../src/navigation/links";
import { environment } from "../src/config";
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  const entry = readEntryLink(path, environment.webOrigin);
  if (entry) {
    receiveEntryLink(entry);
    return "/entry";
  }
  // The custom scheme only carries ordinary screen navigation, never a secret.
  try {
    const url = new URL(path);
    if (
      url.protocol === "simuladosbernardoproof:" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    ) {
      const screen = `/${url.hostname}${url.pathname}`.replace(/\/$/, "");
      if (
        [
          "/quizzes",
          "/progress",
          "/profile",
          "/simulations",
          "/history",
        ].includes(screen)
      )
        return screen;
    }
  } catch {
    /* Unknown external links go to a neutral screen. */
  }
  return "/";
}
