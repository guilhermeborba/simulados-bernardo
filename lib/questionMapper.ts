import type { ApiQuestion, ApiQuestionOption } from './apiClient';

export interface TemplateOption {
  id: string;
  text: string;
}

export interface TemplateItem {
  id: string;
  text: string;
}

export interface TemplatePair {
  left: TemplateItem;
  right: TemplateOption[];
}

export interface TemplateQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false_multiple' | 'matching' | 'classification';
  text: string;
  tip: string;
  points: number;
  order: number;
  options?: TemplateOption[];
  items?: TemplateItem[];
  pairs?: TemplatePair[];
}

const TYPE_MAP: Record<ApiQuestion['type'], TemplateQuestion['type']> = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE_MULTIPLE: 'true_false_multiple',
  MATCHING: 'matching',
  CLASSIFICATION: 'classification',
};

export function mapApiQuestion(question: ApiQuestion): TemplateQuestion {
  const base = {
    id: question.id,
    type: TYPE_MAP[question.type],
    text: question.statement,
    tip: question.tip ?? '',
    points: Number(question.points),
    order: question.order,
  };

  if (question.type === 'MULTIPLE_CHOICE') {
    return {
      ...base,
      options: question.options.map((option) => ({ id: option.optionKey, text: option.text })),
    };
  }

  if (question.type === 'TRUE_FALSE_MULTIPLE' || question.type === 'CLASSIFICATION') {
    return {
      ...base,
      items: question.options.map((option) => ({ id: option.optionKey, text: option.text })),
    };
  }

  return { ...base, pairs: buildMatchingPairs(question.options) };
}

function buildMatchingPairs(options: ApiQuestionOption[]): TemplatePair[] {
  const leftOptions = options.filter((option) => option.groupKey === 'left');
  const rightOptions = options
    .filter((option) => option.groupKey === 'right')
    .map((option) => ({ id: stripPrefix(option.optionKey, 'right:'), text: option.text }));

  return leftOptions.map((option) => ({
    left: { id: stripPrefix(option.optionKey, 'left:'), text: option.text },
    right: rightOptions,
  }));
}

function stripPrefix(value: string, prefix: string): string {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

/**
 * Caminho inverso de buildAnswerBody: converte o que está gravado no servidor
 * de volta para o formato que o runner usa em tela, para retomar uma tentativa.
 *
 * Devolve undefined quando não há resposta de verdade — ao finalizar, o servidor
 * grava um objeto vazio nas questões que ficaram em branco.
 */
export function parseStoredAnswer(
  type: TemplateQuestion['type'],
  stored: unknown,
): unknown {
  if (stored === null || typeof stored !== 'object') {
    return undefined;
  }

  if (type === 'multiple_choice') {
    const value = (stored as { answer?: unknown }).answer;
    return typeof value === 'string' && value !== '' ? value : undefined;
  }

  return Object.keys(stored as Record<string, unknown>).length > 0 ? stored : undefined;
}

export function buildAnswerBody(
  type: TemplateQuestion['type'],
  rawAnswer: unknown,
): Record<string, unknown> {
  if (type === 'multiple_choice') {
    return { answer: rawAnswer as string };
  }

  return rawAnswer as Record<string, unknown>;
}
