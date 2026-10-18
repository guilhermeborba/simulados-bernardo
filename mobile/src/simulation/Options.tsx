import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, tokens } from '../theme';
import { Copy, Icon } from '../ui';
import type { TemplateQuestion } from './questions';
import { parseStoredAnswer } from './questions';
import { authorizedCorrectAnswer } from './model';

export function Options({ question, value, onChange, locked = false, isCorrect, correctAnswer, review = false }: {
  question: TemplateQuestion;
  value: unknown;
  onChange?: (value: unknown) => void;
  locked?: boolean;
  isCorrect?: boolean;
  correctAnswer?: Record<string, unknown> | null;
  review?: boolean;
}) {
  const { colors: c } = useTheme();
  const answer = value && typeof value === 'object' ? value as Record<string, string> : {};
  const authorized = locked ? authorizedCorrectAnswer(correctAnswer) : undefined;
  const correct = authorized ? parseStoredAnswer(question.type, authorized) : undefined;
  const correctMap = correct && typeof correct === 'object' ? correct as Record<string, unknown> : {};

  function choice(id: string, label: string, selected: boolean, change: () => void, letter?: string, correctId?: unknown, legacyCorrect?: boolean) {
    const correctChoice = locked && (typeof correctId === 'string' ? id === correctId : selected && legacyCorrect === true);
    const wrongChoice = locked && selected && (typeof correctId === 'string' ? id !== correctId : legacyCorrect === false);
    const border = correctChoice ? c.ok : wrongChoice ? c.err : selected ? c.primary : c.line;
    const bg = correctChoice ? c['ok-bg'] : wrongChoice ? c['err-bg'] : selected ? c['sel-bg'] : locked ? c.soft : c.surface;
    const tags = [selected && locked ? 'Sua resposta' : '', correctChoice ? 'Certa' : wrongChoice ? 'Quase!' : selected && locked && !review ? 'Marcada' : ''].filter(Boolean);
    return <Pressable
      key={id}
      accessibilityRole="radio"
      accessibilityLabel={`${letter ? `${letter}. ` : ''}${label}${selected && locked ? ', Sua resposta' : ''}${correctChoice ? ', Certa' : wrongChoice ? ', Vamos revisar' : ''}`}
      accessibilityState={{ checked: selected, disabled: locked }}
      disabled={locked}
      onPress={change}
      style={({ pressed }) => [styles.option, { borderColor: border, backgroundColor: bg }, pressed && { opacity: .8 }]}
    >
      {letter && <View style={[styles.letter, { backgroundColor: selected && !locked ? c.primary : bg }]}><Text style={[styles.letterText, { color: selected && !locked ? c['on-primary'] : correctChoice ? c['ok-ink'] : c.ink }]}>{letter}</Text></View>}
      <Text style={[styles.optionText, { color: correctChoice ? c['ok-ink'] : locked && !selected ? c.muted : c.ink }]}>{label}</Text>
      {tags.length > 0 && <View style={styles.tag}><Icon name={correctChoice ? 'check' : wrongChoice ? 'bulb' : 'check'} size={20} /><Text style={[styles.tagText, { color: correctChoice ? c['ok-ink'] : c.ink }]}>{tags.join(' · ')}</Text></View>}
    </Pressable>;
  }

  if (question.type === 'multiple_choice') return <View accessibilityRole="radiogroup" accessibilityLabel={question.text} style={styles.group}>{question.options?.map((option, index) => choice(option.id, option.text, value === option.id, () => onChange?.(option.id), String.fromCharCode(65 + index), correct, isCorrect))}</View>;
  if (question.type === 'matching') return <View style={styles.group}>{question.pairs?.map(pair => <View key={pair.left.id} style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={pair.left.text}><Copy>{pair.left.text}</Copy>{pair.right.map(option => choice(option.id, option.text, answer[pair.left.id] === option.id, () => onChange?.({ ...answer, [pair.left.id]: option.id }), undefined, correctMap[pair.left.id]))}</View>)}</View>;
  const choices = question.type === 'classification' ? [{ id: 'C', text: 'C' }, { id: 'P', text: 'P' }] : [{ id: 'V', text: 'Verdadeiro' }, { id: 'F', text: 'Falso' }];
  return <View style={styles.group}>{question.items?.map(item => <View key={item.id} style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={item.text}><Copy>{item.text}</Copy>{choices.map(option => choice(option.id, option.text, answer[item.id] === option.id, () => onChange?.({ ...answer, [item.id]: option.id }), undefined, correctMap[item.id]))}</View>)}</View>;
}
const s = tokens.space;
const styles = StyleSheet.create({ group: { gap: s[3] }, option: { borderWidth: tokens.size['icon-stroke'], borderRadius: tokens.radius.md, minHeight: tokens.size['option-min-height'], padding: s[3], flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: s[3] }, letter: { width: tokens.size.avatar[0], height: tokens.size.avatar[0], borderRadius: tokens.radius.full, justifyContent: 'center', alignItems: 'center' }, letterText: { fontFamily: 'Fredoka', fontWeight: '600', fontSize: tokens.type.body.mobile[0] }, optionText: { fontFamily: 'Nunito', fontWeight: '600', fontSize: tokens.type.body.mobile[0], lineHeight: tokens.type.body.mobile[1], flex: 1, minWidth: tokens.size['touch-kids'] }, tag: { flexDirection: 'row', alignItems: 'center', gap: s[1], flexWrap: 'wrap' }, tagText: { fontFamily: 'Nunito', fontWeight: '800', fontSize: tokens.type['body-sm'].mobile[0], lineHeight: tokens.type['body-sm'].mobile[1] } });
