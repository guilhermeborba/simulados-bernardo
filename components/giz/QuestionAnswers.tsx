'use client';

import { parseStoredAnswer, type TemplateQuestion } from '@/lib/questionMapper';
import { Icon } from './ui';
import { displayAnswerValue } from '@/lib/gizQuestionDisplay';

interface Props {
  question: TemplateQuestion;
  value: unknown;
  onChange?: (value: unknown) => void;
  locked?: boolean;
  isCorrect?: boolean;
  correctAnswer?: Record<string, unknown> | null;
  review?: boolean;
}

export default function QuestionAnswers({ question, value, onChange, locked = false, isCorrect, correctAnswer, review = false }: Props) {
  // Even if a caller has a completed snapshot, an interactive question must not
  // render its answer key until confirmation has locked it.
  const correctValue = locked ? displayAnswerValue(question.type, parseStoredAnswer(question.type, correctAnswer)) : undefined;
  if (question.type === 'multiple_choice') {
    const correctId = typeof correctValue === 'string' ? correctValue : locked && isCorrect === true && typeof value === 'string' ? value : undefined;
    return (
      <fieldset className="giz-answer-group" disabled={locked}>
        <legend className="sr-only">{question.text}</legend>
        {question.options?.map((option, index) => {
          const selected = value === option.id;
          const right = option.id === correctId;
          const wrong = selected && locked && (isCorrect === false || (correctId !== undefined && !right));
          const state = right ? 'correct' : wrong ? 'wrong' : selected ? 'selected' : locked ? 'locked' : 'default';
          const label = right ? selected && review ? 'Sua resposta · Certa' : 'Certa' : review || wrong ? 'Sua resposta' : 'Marcada';
          return (
            <label key={option.id} className="giz-answer" data-state={state}>
              <input type="radio" name={`question-${question.id}`} value={option.id} checked={selected} onChange={() => onChange?.(option.id)} />
              <span className="giz-answer__letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              <span className="giz-answer__text">{option.text}</span>
              {locked && (selected || right) && <span className="giz-answer__tag"><Icon name={wrong ? 'x' : 'check'} size={20} />{label}</span>}
            </label>
          );
        })}
      </fieldset>
    );
  }

  const shownValue = displayAnswerValue(question.type, value);
  const selected = shownValue && typeof shownValue === 'object' ? shownValue as Record<string, string> : {};
  const correctMap = correctValue && typeof correctValue === 'object' ? correctValue as Record<string, unknown> : {};
  if (question.type === 'matching') {
    return <div className="giz-answer-group">{question.pairs?.map((pair) => {
      const right = pair.right.find((option) => option.id === correctMap[pair.left.id]);
      return <label className="giz-answer-row" key={pair.left.id}><span>{pair.left.text}</span><select aria-label={`${pair.left.text}${locked ? ', sua resposta' : ''}`} value={selected[pair.left.id] ?? ''} disabled={locked} onChange={(event) => onChange?.({ ...selected, [pair.left.id]: event.target.value })}><option value="">Escolha uma opção</option>{pair.right.map((option) => <option key={option.id} value={option.id}>{option.text}</option>)}</select>{right && <span className="giz-correct-map"><Icon name="check" size={20} /><span><strong>Resposta certa: </strong>{right.text}</span></span>}</label>;
    })}</div>;
  }

  if (question.type === 'classification' && question.classificationMode === 'TEXT') {
    return <div className="giz-answer-group">{question.items?.map((item) => <div className="giz-answer-row" key={item.id}>
      <label htmlFor={`question-${question.id}-${item.id}`}>{item.text}{locked && <span className="sr-only">, sua resposta</span>}</label>
      <input id={`question-${question.id}-${item.id}`} type="text" value={typeof selected[item.id] === 'string' ? selected[item.id] : ''} maxLength={2000} disabled={locked} onChange={(event) => onChange?.({ ...selected, [item.id]: event.target.value })} />
      {typeof correctMap[item.id] === 'string' && <span className="giz-correct-map"><Icon name="check" size={20} /><span><strong>Resposta certa: </strong>{correctMap[item.id] as string}</span></span>}
    </div>)}</div>;
  }

  const choices = question.type === 'true_false_multiple' ? [{ value: 'V', label: 'Verdadeiro' }, { value: 'F', label: 'Falso' }] : [{ value: 'C', label: 'C' }, { value: 'P', label: 'P' }];
  return <div className="giz-answer-group">{question.items?.map((item) => {
    const right = choices.find((choice) => choice.value === correctMap[item.id]);
    return <fieldset className="giz-answer-row" key={item.id} disabled={locked}><legend>{item.text}</legend><div className="giz-answer-choices">{choices.map((choice) => <label className="giz-answer-choice" key={choice.value} data-selected={selected[item.id] === choice.value}><input type="radio" name={`question-${question.id}-${item.id}`} value={choice.value} checked={selected[item.id] === choice.value} onChange={() => onChange?.({ ...selected, [item.id]: choice.value })} />{choice.label}{locked && selected[item.id] === choice.value && <span className="giz-answer__tag">Sua resposta</span>}</label>)}</div>{right && <span className="giz-correct-map"><Icon name="check" size={20} /><span><strong>Resposta certa: </strong>{right.label}</span></span>}</fieldset>;
  })}</div>;
}
