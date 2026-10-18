/** Only API-owned media belonging to an attempt may be rendered by the web. */
export function isQuizMediaPath(path: string): boolean {
  return /^\/attempts\/[A-Za-z0-9_-]+\/questions\/[A-Za-z0-9_-]+\/media\/(image|audio)$/.test(path);
}

export function quizMediaUrl(path: string): string | null {
  return isQuizMediaPath(path) ? `/api/backend${path}` : null;
}
