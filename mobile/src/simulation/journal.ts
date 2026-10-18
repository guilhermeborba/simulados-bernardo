/** Two alternating checkpoints keep the previous valid record intact if a
 * synchronous file write is interrupted, partial, or rejected by the device. */
export interface JournalFiles {
  read(slot: 0 | 1): string | null;
  write(slot: 0 | 1, text: string): void;
}
interface Checkpoint<T> { slot: 0 | 1; revision: number; payload: T }

function latest<T>(files: JournalFiles, validate: (value: unknown) => value is T): Checkpoint<T> | null {
  let current: Checkpoint<T> | null = null;
  for (const slot of [0, 1] as const) {
    try {
      const raw = files.read(slot);
      if (!raw) continue;
      const value = JSON.parse(raw);
      if (value.version !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 1 || !validate(value.payload)) continue;
      if (!current || value.revision > current.revision) current = { slot, revision: value.revision, payload: value.payload };
    } catch { /* A damaged newer slot must never hide the previous valid one. */ }
  }
  return current;
}

export function readJournal<T>(files: JournalFiles, validate: (value: unknown) => value is T): T | null {
  return latest(files, validate)?.payload ?? null;
}

export function writeJournal<T>(files: JournalFiles, payload: T, validate: (value: unknown) => value is T): boolean {
  const current = latest(files, validate);
  const slot = current?.slot === 0 ? 1 : 0;
  const text = JSON.stringify({ version: 1, revision: (current?.revision ?? 0) + 1, payload });
  try {
    files.write(slot, text);
    return files.read(slot) === text;
  } catch { return false; }
}
