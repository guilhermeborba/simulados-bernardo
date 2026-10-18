import { Directory, File, Paths } from 'expo-file-system';
import type { RunnerSnapshot } from './model';
import { readJournal, writeJournal, type JournalFiles } from './journal';

function directory(userId: string) {
  return new Directory(Paths.document, 'giz-progress', `user-${encodeURIComponent(userId)}`);
}
function files(userId: string, name: string): JournalFiles {
  return {
    read(slot) {
      const file = new File(directory(userId), `${name}.${slot}.json`);
      return file.exists ? file.textSync() : null;
    },
    write(slot, text) {
      directory(userId).create({ intermediates: true, idempotent: true });
      const file = new File(directory(userId), `${name}.${slot}.json`);
      file.create({ overwrite: true });
      file.write(text);
    },
  };
}
const attemptName = (id: string) => `attempt-${encodeURIComponent(id)}`;
const resumeName = (id: string) => `resume-${encodeURIComponent(id)}`;
interface Resume { attemptId: string | null }
function isResume(value: unknown): value is Resume {
  return Boolean(value && typeof value === 'object' && ('attemptId' in value) && ((value as Resume).attemptId === null || typeof (value as Resume).attemptId === 'string'));
}
function validateSnapshot(userId: string, attemptId: string, simulationId?: string) {
  return (raw: unknown): raw is RunnerSnapshot => {
    if (!raw || typeof raw !== 'object') return false;
    const value = raw as RunnerSnapshot;
    return value.version === 1 && value.userId === userId && value.attempt?.id === attemptId && (!simulationId || value.attempt.simulationId === simulationId) && Array.isArray(value.questions) && Boolean(value.answers && value.drafts && value.spentMs);
  };
}

export function readProgress(userId: string, simulationId?: string, attemptId?: string): RunnerSnapshot | null {
  try {
    const id = attemptId || (simulationId ? readJournal(files(userId, resumeName(simulationId)), isResume)?.attemptId : null);
    if (!id) return null;
    return readJournal(files(userId, attemptName(id)), validateSnapshot(userId, id, simulationId));
  } catch { return null; }
}

/** Progress stays in the app's private directory, scoped to its owner. The
 * alternate slot is written before it can replace the last valid checkpoint. */
export function saveProgress(value: RunnerSnapshot): boolean {
  const stored = writeJournal(files(value.userId, attemptName(value.attempt.id)), value, validateSnapshot(value.userId, value.attempt.id, value.attempt.simulationId));
  if (!stored) return false;
  const pointer = files(value.userId, resumeName(value.attempt.simulationId));
  if (!value.result) return writeJournal(pointer, { attemptId: value.attempt.id }, isResume);
  const current = readJournal(pointer, isResume);
  return current?.attemptId === value.attempt.id ? writeJournal(pointer, { attemptId: null }, isResume) : true;
}
