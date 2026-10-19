import { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useRemote, type ApiSimulation } from '../src/data';
import { useTheme, tokens } from '../src/theme';
import { compareSchoolYears, schoolYearLabel, trackOfSchoolYear } from '../src/core/track';
import { Button, Card, Copy, Empty, Field, Heading, Loading, Screen, styles } from '../src/ui';

export function Chips({ label, values, value, onChange }: {
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors } = useTheme();
  return <View style={{ gap: tokens.space[2] }}>
    <Copy>{label}</Copy>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: tokens.space[2] }}>
      {['Todos', ...values].map(item => <Pressable
        key={item}
        accessibilityRole="button"
        accessibilityState={{ selected: value === item }}
        onPress={() => onChange(item)}
        style={{
          minHeight: tokens.size['touch-kids'],
          justifyContent: 'center',
          paddingHorizontal: tokens.space[4],
          borderRadius: tokens.radius.full,
          backgroundColor: value === item ? colors['sel-bg'] : colors.surface,
          borderWidth: tokens.border.default,
          borderColor: value === item ? colors.primary : colors.line,
        }}
      ><Text style={{ fontFamily: 'Nunito', fontSize: tokens.type.body.mobile[0], fontWeight: '800', color: colors.ink }}>{item}</Text></Pressable>)}
    </ScrollView>
  </View>;
}

export default function Simulations() {
  const sims = useRemote<ApiSimulation[]>('/simulations/available');
  const { colors, track } = useTheme();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [discipline, setDiscipline] = useState('Todos');
  const [bimester, setBimester] = useState('Todos');
  const [assessment, setAssessment] = useState('Todos');
  const [year, setYear] = useState('Todos');
  const columns = width >= tokens.breakpoint['desktop-min'] ? 3 : width >= tokens.breakpoint['tablet-min'] ? 2 : 1;
  const inTrack = sims.data?.filter(sim => trackOfSchoolYear(sim.schoolYear) === track) || [];
  const years = Array.from(new Set(inTrack.map(sim => sim.schoolYear))).sort(compareSchoolYears).map(schoolYearLabel);
  const search = query.trim().toLocaleLowerCase('pt-BR');
  const list = inTrack.filter(sim =>
    (year === 'Todos' || schoolYearLabel(sim.schoolYear) === year) &&
    (discipline === 'Todos' || sim.discipline.name === discipline) &&
    (bimester === 'Todos' || String(sim.bimester) === bimester) &&
    (assessment === 'Todos' || sim.assessment === assessment) &&
    (!search || `${sim.title} ${sim.subtitle || ''} ${sim.discipline.name}`.toLocaleLowerCase('pt-BR').includes(search)),
  );
  const hasFilters = Boolean(search) || year !== 'Todos' || discipline !== 'Todos' || bimester !== 'Todos' || assessment !== 'Todos';
  function reset() {
    setQuery('');
    setYear('Todos');
    setDiscipline('Todos');
    setBimester('Todos');
    setAssessment('Todos');
  }

  return <Screen title="Simulados" subtitle="Encontre sua próxima descoberta." student><Button title="Outras faixas e avaliações na web" secondary onPress={()=>router.push('/official-simulations')}/>
    {sims.loading ? <Loading /> : sims.error ? <Empty title="Vamos tentar de novo?" message={sims.error} onRetry={sims.reload} /> : <>
      <Field label="Buscar simulados" placeholder="Buscar por título ou disciplina" value={query} onChangeText={setQuery} returnKeyType="search" autoCorrect={false} clearButtonMode="while-editing" />
      {years.length > 1 && <Chips label="Ano" values={years} value={year} onChange={setYear} />}
      <Chips label="Disciplina" values={[...new Set(inTrack.map(sim => sim.discipline.name))]} value={discipline} onChange={setDiscipline} />
      <Chips label="Bimestre" values={[...new Set(inTrack.map(sim => String(sim.bimester)))].sort()} value={bimester} onChange={setBimester} />
      <Chips label="Avaliação" values={[...new Set(inTrack.map(sim => sim.assessment))].sort()} value={assessment} onChange={setAssessment} />
      {hasFilters && <Button title="Limpar filtros" secondary onPress={reset} />}
      {list.length === 0 ? <Card title={hasFilters ? 'Nada por aqui com esses filtros.' : 'Nenhum simulado disponível por enquanto'}>
        <Copy>{hasFilters ? 'Você pode limpar os filtros para ver os simulados disponíveis.' : 'Os simulados disponíveis para sua conta aparecem aqui.'}</Copy>
      </Card> : <View testID="simulation-grid" style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -tokens.space[2], minWidth: 0 }}>
        {list.map(sim => <View key={sim.id} testID="simulation-grid-cell" style={{ width: `${100 / columns}%`, minWidth: 0, padding: tokens.space[2] }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${sim.title}, ${schoolYearLabel(sim.schoolYear)}, ${sim.bimester}º bimestre, ${sim.assessment}, ${sim.totalQuestions} questões. Ver simulado.`}
            onPress={() => router.push({ pathname: '/detail/[id]', params: { id: sim.id } })}
            style={({ pressed }) => [styles.card, {
              minWidth: 0,
              minHeight: tokens.size['touch-kids'],
              width: '100%',
              flexGrow: 1,
              backgroundColor: pressed ? colors['sel-bg'] : colors.surface,
              borderColor: pressed ? colors.primary : colors.line,
            }]}
          >
            <Copy muted>{sim.discipline.name}</Copy>
            <Heading level={3}>{sim.title}</Heading>
            <Copy muted>{schoolYearLabel(sim.schoolYear)} · {sim.bimester}º bimestre · {sim.assessment}</Copy>
            <Copy>{sim.totalQuestions} questões</Copy>
          </Pressable>
        </View>)}
      </View>}
    </>}
    <Button title="Monte seu simulado · Em breve" secondary onPress={() => router.push('/create')} />
  </Screen>;
}
