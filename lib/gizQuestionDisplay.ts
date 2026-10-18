import type { TemplateQuestion } from './questionMapper';

/** Old attempts stored boolean or English true/false values. Normalize only
 * their display; the submitted body and the shared legacy mapper stay intact. */
export function displayAnswerValue(type: TemplateQuestion['type'], value: unknown): unknown {
  if (type !== 'true_false_multiple' || !value || typeof value !== 'object' || Array.isArray(value)) return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
    const text = String(entry).trim().toUpperCase();
    return [key, ['TRUE', 'V'].includes(text) ? 'V' : ['FALSE', 'F'].includes(text) ? 'F' : entry];
  }));
}
