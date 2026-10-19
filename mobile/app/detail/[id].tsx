import { useEffect, useState } from 'react';
import { periodLabel, schoolYearLabel } from '../../src/core/track';
import { Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useRemote, type ApiAttempt, type ApiSimulation, type ApiMyAttempt } from '../../src/data';
import { useTheme } from '../../src/theme';
import { Button, Card, Copy, Empty, Loading, Screen } from '../../src/ui';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { timer: defaultTimer, colors } = useTheme();
  const [timer, setTimer] = useState(defaultTimer);
  const attempts = useRemote<ApiMyAttempt[]>('/me/attempts');
  const continuation = attempts.data?.find(item => item.simulationId === id && item.status === 'IN_PROGRESS');
  const currentAttempt = useRemote<ApiAttempt>(continuation ? `/attempts/${encodeURIComponent(continuation.id)}` : null);
  const sim = useRemote<ApiSimulation>(id ? `/simulations/${encodeURIComponent(id)}` : null);
  useEffect(() => setTimer(defaultTimer), [defaultTimer]);
  const duration = (sim.data?.totalQuestions || 0) * (timer ? 45 : 50);
  const immediateFeedback = !continuation || currentAttempt.data?.immediateFeedback === true;
  const explanation = immediateFeedback
    ? 'Confirme cada resposta para ver a correção. Aprenda com a Dica de Ouro ou uma curiosidade. Ao concluir, revise todas as respostas.'
    : currentAttempt.data
      ? 'Esta tentativa mantém a correção ao finalizar. Confirme cada resposta para seguir e, ao concluir, revise todas as respostas e dicas.'
      : 'Confirme cada resposta para continuar. A revisão completa fica disponível ao concluir o simulado.';

  return <Screen title={sim.data?.title || 'Seu próximo simulado'} flow student>
    {sim.loading ? <Loading /> : sim.error ? <Empty title="Vamos tentar de novo?" message={sim.error} onRetry={sim.reload} /> : sim.data && <Card>
      <Copy muted>{[schoolYearLabel(sim.data.schoolYear),periodLabel(sim.data.bimester,sim.data.assessment)].filter(Boolean).join(' · ')}</Copy>
      <Copy>{sim.data.totalQuestions} questões · cerca de {Math.floor(duration / 60)} min{duration % 60 ? ` ${duration % 60} s` : ''}</Copy>
      <Copy>{explanation}</Copy>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Copy>Cronômetro</Copy><Switch accessibilityLabel="Cronômetro" value={timer} onValueChange={setTimer} trackColor={{ false: colors.line, true: colors.primary }} thumbColor={colors['on-primary']} /></View>
      <Copy muted>{timer ? '45 segundos por questão.' : 'Sem limite de tempo.'}</Copy>
      <Button title={continuation ? 'Continuar' : 'Começar'} onPress={() => router.push({ pathname: '/simulation/[id]', params: { id, timer: timer ? '1' : '0', ...(continuation ? { attempt: continuation.id } : {}) } })} />
    </Card>}
  </Screen>;
}
