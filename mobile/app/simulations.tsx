import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, findNodeHandle, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRemote, type ApiMyAttempt, type ApiSimulation, type ApiTurma } from '../src/data';
import { useTheme, tokens } from '../src/theme';
import { periodLabel, schoolYearLabel, subjectOf, trackOfSchoolYear } from '../src/core/track';
import { ASSESSMENTS, BIMESTERS, CATALOG_PAGE, STATE_BADGE, availableYearsText, catalogChips, catalogSubjects, catalogYears, defaultCatalogYear, hasChoices, isFinished, matchesChoice, sheetChoiceCount, simulationStatus, sortCatalog, statusText, yearShortLabel, yearWithArticle, type CatalogChoice, type CatalogParams, type CatalogSubject, type SimulationStatus } from '../src/core/catalog';
import { useAnsweredCounts } from '../src/answered';
import { ActionDot, Badge, Button, Empty, Icon, OutlineButton, Screen, SecondaryLink, SubjectTile, styles } from '../src/ui';
const s=tokens.space;const layout=tokens.layout;
const NO_STEPS:CatalogParams={discipline:null,year:null,bimester:null,assessment:null};
// The overlay token is CSS color syntax; React Native gets the same color as rgba().
const VEIL=tokens.overlay.value.replace(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/,'rgba($1,$2,$3,$4)');
/** The search filters 300 ms after the last key, so the live count is not announced on every letter; clearing applies at once. */
function useDebounced(value:string){
 const[debounced,setDebounced]=useState(value);
 useEffect(()=>{if(!value.trim()){setDebounced('');return;}const timeout=setTimeout(()=>setDebounced(value),300);return()=>clearTimeout(timeout);},[value]);
 return debounced;
}

export default function Simulations() {
  const sims = useRemote<ApiSimulation[]>('/simulations/available');
  const turmas = useRemote<ApiTurma[]>('/me/turmas');
  const attempts = useRemote<ApiMyAttempt[]>('/me/attempts');
  const { colors: c, track: chosen } = useTheme();
  const track = chosen ?? 'kids';
  const { width } = useWindowDimensions();
  const [steps, setSteps] = useState<CatalogParams>(NO_STEPS);
  const [search, setSearch] = useState('');
  const query = useDebounced(search);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [page, setPage] = useState({ key: '', limit: CATALOG_PAGE });
  const opener = useRef<View>(null);
  const columns = width >= tokens.breakpoint['desktop-min'] ? 3 : width >= tokens.breakpoint['tablet-min'] ? 2 : 1;
  const turmaIds = new Set((turmas.data || []).map(turma => turma.id));
  const fromTurma = (sim: ApiSimulation) => Boolean(sim.turmaId && turmaIds.has(sim.turmaId));
  const inTrack = (sims.data || []).filter(sim => trackOfSchoolYear(sim.schoolYear) === track);
  const profileYear = (turmas.data || []).find(turma => typeof turma.schoolYear === 'number')?.schoolYear ?? null;
  const defaultYear = defaultCatalogYear(track, inTrack, profileYear);
  const year = steps.year ?? defaultYear;
  const hasContent = (value: number) => inTrack.some(sim => sim.schoolYear === value);
  const subjectsOf = (value: number) => catalogSubjects(inTrack.filter(sim => sim.schoolYear === value));
  const subjects = [year, defaultYear].map(subjectsOf).find(list => list.length) ?? catalogSubjects(inTrack);
  const years = catalogYears(track, inTrack);
  // Técnico and Educação Infantil have a single exam: no bimester nor assessment.
  const showPeriod = track !== 'tecnico' && year > 0;
  const showYear = years.length > 1;
  const choice: CatalogChoice = { discipline: steps.discipline, year, bimester: showPeriod ? steps.bimester : null, assessment: showPeriod ? steps.assessment : null, search: query };
  const unfinished = (attempts.data || []).filter(attempt => !isFinished(attempt) && inTrack.some(sim => sim.id === attempt.simulationId));
  const answered = useAnsweredCounts(unfinished.map(attempt => attempt.id));
  const statuses = useMemo(() => new Map((sims.data || []).map(sim => [sim.id, simulationStatus(sim.id, attempts.data || [], answered ?? {})])), [sims.data, attempts.data, answered]);
  const statusOf = (sim: ApiSimulation) => statuses.get(sim.id) ?? { state: 'new' as const };
  const results = sortCatalog(inTrack.filter(sim => matchesChoice(sim, choice)), sim => statusOf(sim).state, fromTurma);
  const filterKey = JSON.stringify(choice);
  const limit = page.key === filterKey ? page.limit : CATALOG_PAGE;
  const more = Math.min(CATALOG_PAGE, results.length - limit);
  const update = (patch: Partial<CatalogParams>) => setSteps(value => ({ ...value, ...patch }));
  const chooseYear = (value: number) => {
    const next = subjectsOf(value);
    update({ year: value === defaultYear ? null : value, ...(value > 0 ? {} : { bimester: null, assessment: null }), ...(steps.discipline && next.length && !next.some(item => item.slug === steps.discipline) ? { discipline: null } : {}) });
  };
  const clear = () => { setSteps(NO_STEPS); setSearch(''); };
  const closeSheet = () => setSheetOpen(false);
  // Closing the sheet sends focus back to the button that opened it; leaving the screen first cancels it.
  const sheetWasOpen = useRef(false);
  useEffect(() => {
    if (sheetOpen) { sheetWasOpen.current = true; return; }
    if (!sheetWasOpen.current) return;
    sheetWasOpen.current = false;
    const task = setTimeout(() => { const id = opener.current && findNodeHandle(opener.current); if (id) AccessibilityInfo.setAccessibilityFocus(id); }, 100);
    return () => clearTimeout(task);
  }, [sheetOpen]);
  const yearEmpty = !hasContent(year);
  const count = yearEmpty ? 0 : results.length;
  const countText = `${count} ${count === 1 ? 'simulado' : 'simulados'}`;
  const chips = catalogChips(choice, defaultYear, subjects, schoolYearLabel);
  const away = sheetChoiceCount(choice, defaultYear);
  const target = hasContent(defaultYear) ? defaultYear : years.find(hasContent);
  const period = <PeriodSteps years={years} year={year} bimester={choice.bimester} assessment={choice.assessment} showYear={showYear} showPeriod={showPeriod} chooseYear={chooseYear} toggleBimester={value => update({ bimester: steps.bimester === value ? null : value })} toggleAssessment={value => update({ assessment: steps.assessment === value ? null : value })} />;

  return <Screen topLevel title="Simulados" subtitle="Escolha sua próxima descoberta." student>
    {sims.loading || attempts.loading || answered === null ? <Skeleton /> : sims.error ? <Empty title="Vamos tentar de novo?" message={sims.error} onRetry={sims.reload} /> : <>
      <SearchField value={search} onChange={setSearch} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} role="group" accessibilityLabel="Disciplina" style={local.subjects} contentContainerStyle={local.subjectsRow}>
        <SubjectOption name="Todas" subject={null} icon="grid" all pressed={!choice.discipline} onPress={() => update({ discipline: null })} />
        {subjects.map(item => <SubjectOption key={item.slug} name={item.name} subject={item.subject} pressed={choice.discipline === item.slug} onPress={() => update({ discipline: choice.discipline === item.slug ? null : item.slug })} />)}
      </ScrollView>
      {(showYear || showPeriod) && <View ref={opener} collapsable={false} style={{ alignSelf: 'flex-start' }}><OutlineButton icon="sliders" title={showPeriod ? 'Ano, bimestre e avaliação' : 'Ano'} accessibilityLabel={`${showPeriod ? 'Ano, bimestre e avaliação' : 'Ano'}${away ? `, ${away} escolhidas` : ''}`} onPress={() => setSheetOpen(true)} trailing={away > 0 && <View style={[local.counter, { backgroundColor: c.primary }]}><Text style={[local.counterText, { color: c['on-primary'] }]}>{away}</Text></View>} /></View>}
      <View style={local.summary}>
        <Text accessibilityLiveRegion="polite" style={[local.count, { color: c.ink }]}>{countText}</Text>
        {hasChoices({ ...choice, search }, defaultYear) && <View style={{ marginLeft: 'auto' }}><OutlineButton icon="reset" title="Limpar" accessibilityLabel="Limpar escolhas" onPress={clear} /></View>}
        {chips.length > 0 && <View style={local.chips}>{chips.map(chip => <Chip key={chip.key} label={chip.label} onPress={() => update({ [chip.key]: null })} />)}</View>}
      </View>
      {yearEmpty ? <EmptyCard icon="book" title={`Os simulados ${yearWithArticle(year)} chegam em breve`} message={availableYearsText(years.filter(hasContent)) || undefined}>{target !== undefined && <OutlineButton title={`Voltar ${yearWithArticle(target, true)}`} onPress={() => chooseYear(target)} />}</EmptyCard>
        : results.length === 0 ? <EmptyCard icon="search" title="Nenhum simulado com essa escolha" message="Tire uma etapa para ver mais."><OutlineButton icon="reset" title="Limpar escolhas" onPress={clear} /></EmptyCard>
        : <View testID="simulation-grid" style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -s[2], minWidth: 0 }}>
          {results.slice(0, limit).map(sim => <View key={sim.id} testID="simulation-grid-cell" style={{ width: `${100 / columns}%`, minWidth: 0, padding: s[2] }}><SimulationRow simulation={sim} status={statusOf(sim)} fromTurma={fromTurma(sim)} /></View>)}
        </View>}
      {!yearEmpty && more > 0 && <View style={{ alignSelf: 'center' }}><OutlineButton title={`Mostrar mais ${more}`} onPress={() => setPage({ key: filterKey, limit: limit + CATALOG_PAGE })} /></View>}
      {turmaIds.size === 0 && <SecondaryLink title="Outras faixas e avaliações na web" onPress={() => router.push('/official-simulations')} />}
      <View style={[local.soon, { borderColor: c.line }]}><Icon name="clock" color={c.muted} /><View style={{ flex: 1 }}><Text style={[styles.subheading, { color: c.ink }]}>Monte seu simulado</Text><Text style={[styles.small, { color: c.muted }]}>Suas disciplinas, do seu jeito.</Text></View><Badge tone="soon">Em breve</Badge></View>
      <StepsSheet visible={sheetOpen} onClose={closeSheet} footer={<><Button title={`Ver ${countText}`} onPress={closeSheet} /><OutlineButton stretch icon="reset" title="Limpar escolhas" onPress={clear} /></>}>{period}</StepsSheet>
    </>}
  </Screen>;
}

function Skeleton() {
  const { colors: c } = useTheme();
  return <View accessible accessibilityRole="progressbar" accessibilityLabel="Carregando simulados" style={{ gap: s[3] }}>{Array.from({ length: CATALOG_PAGE }, (_, index) => <View key={index} style={{ height: layout['simulation-row'], borderRadius: tokens.radius.lg, backgroundColor: c.soft }} />)}</View>;
}
function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { colors: c } = useTheme();
  const [focused, setFocused] = useState(false);
  return <View style={[local.search, { backgroundColor: c.surface, borderColor: focused ? c.info : c.line, boxShadow: tokens.shadow.e2 }]}><Icon name="search" color={c.muted} /><TextInput accessibilityLabel="Buscar simulado" placeholder="Buscar simulado" placeholderTextColor={c.muted} value={value} onChangeText={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} returnKeyType="search" autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" style={[local.searchInput, { color: c.ink }]} /></View>;
}
/** The green check marks a choice; the state itself is in accessibilityState. */
function Check({ small = false }: { small?: boolean }) {
  const { colors: c } = useTheme();
  const size = small ? layout['check-badge-sm'] : layout['check-badge'];
  return <View importantForAccessibility="no-hide-descendants" style={[local.check, { width: size, height: size, top: -(small ? s[1] : s[2]), right: -(small ? s[1] : s[2]), backgroundColor: c.ok, borderColor: small ? c.bg : c.surface }]}><Icon name="check" size={small ? 14 : 16} color={c['on-ok']} /></View>;
}
function SubjectOption({ name, subject, icon, pressed, onPress, all = false }: { name: string; subject: CatalogSubject['subject']; icon?: string; pressed: boolean; onPress: () => void; all?: boolean }) {
  const { colors: c } = useTheme();
  const selected = subject ? c[`${subject}-bg` as const] : c.soft;
  return <Pressable accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ selected: pressed }} onPress={onPress} style={[local.subject, { borderColor: pressed ? c.ink : c.line, backgroundColor: pressed ? (all ? c.soft : selected) : c.surface }, pressed && { boxShadow: tokens.shadow.e2 }]}>
    <SubjectTile subject={subject} icon={icon} size={layout['tile-phone']} /><Text numberOfLines={2} style={[local.subjectName, { color: c.ink }]}>{name}</Text>{pressed && <Check small />}
  </Pressable>;
}
function StepHead({ number, title, done }: { number: number; title: string; done: boolean }) {
  const { colors: c } = useTheme();
  return <View style={local.stepHead}><View importantForAccessibility="no-hide-descendants" style={[local.stepNumber, { backgroundColor: done ? c.ok : c.ink }]}>{done ? <Icon name="check" size={18} color={c['on-ok']} /> : <Text style={[local.stepNumberText, { color: c.surface }]}>{number}</Text>}</View><Text accessibilityRole="header" style={[styles.subheading, { color: c.ink }]}>{title}</Text></View>;
}
type PeriodProps = { years: number[]; year: number; bimester: number | null; assessment: string | null; showYear: boolean; showPeriod: boolean; chooseYear: (year: number) => void; toggleBimester: (bimester: number) => void; toggleAssessment: (assessment: string) => void };
/** Steps 2 to 4, inside the sheet. The year always has a value, so its step is always checked. */
function PeriodSteps({ years, year, bimester, assessment, showYear, showPeriod, chooseYear, toggleBimester, toggleAssessment }: PeriodProps) {
  const { colors: c } = useTheme();
  const dot = tokens.border.default + tokens.border.thin;
  return <View style={{ gap: s[5] }}>
    {showYear && <View><StepHead number={2} title="Qual ano?" done />
      <View role="group" accessibilityLabel="Ano escolar" style={local.years}>{years.map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={schoolYearLabel(value)} accessibilityState={{ selected: value === year }} onPress={() => chooseYear(value)} style={[local.year, { borderColor: value === year ? c.ink : c.line, backgroundColor: value === year ? c.ink : c.surface }]}><Text style={[local.yearText, { color: value === year ? c.surface : c.ink }]}>{yearShortLabel(value)}</Text></Pressable>)}</View>
    </View>}
    {showPeriod && <View><StepHead number={3} title="Qual bimestre?" done={bimester !== null} />
      <View role="group" accessibilityLabel="Bimestre" style={local.trail}>{BIMESTERS.map((value, index) => <Fragment key={value}>
        {index > 0 && <View importantForAccessibility="no-hide-descendants" style={[local.path, { marginTop: s[1] + tokens.size['touch-kids'] / 2 - dot / 2 }]}>{Array.from({ length: 4 }, (_, i) => <View key={i} style={{ width: dot, height: dot, borderRadius: dot, backgroundColor: c.line }} />)}</View>}
        <View style={local.stoneWrap}><Pressable accessibilityRole="button" accessibilityLabel={`${value}º bimestre`} accessibilityState={{ selected: bimester === value }} onPress={() => toggleBimester(value)} style={[local.stone, { borderColor: bimester === value ? c.ink : c.line, backgroundColor: bimester === value ? c.primary : c.surface }]}><Text style={[local.stoneText, { color: bimester === value ? c['on-primary'] : c.ink }]}>{value}</Text>{bimester === value && <Check />}</Pressable><Text importantForAccessibility="no" style={[local.stoneLabel, { color: c.muted }]}>bimestre</Text></View>
      </Fragment>)}</View>
    </View>}
    {showPeriod && <View><StepHead number={4} title="Qual avaliação?" done={assessment !== null} />
      <View role="group" accessibilityLabel="Avaliação" style={local.assessments}>{ASSESSMENTS.map(item => <Pressable key={item.value} accessibilityRole="button" accessibilityLabel={`${item.value}, ${item.note}`} accessibilityState={{ selected: assessment === item.value }} onPress={() => toggleAssessment(item.value)} style={[local.assessment, { borderColor: assessment === item.value ? c.ink : c.line, backgroundColor: assessment === item.value ? c['sel-bg'] : c.surface }]}><Icon name="pencil" size={20} color={assessment === item.value ? c['mat-ink'] : c.muted} /><View><Text style={[styles.subheading, { color: c.ink }]}>{item.value}</Text><Text style={[local.note, { color: c.muted }]}>{item.note}</Text></View>{assessment === item.value && <Check />}</Pressable>)}</View>
    </View>}
  </View>;
}
/** Bottom sheet: the veil and the system back close it; focus starts on its title and goes back to the button that opened it. */
function StepsSheet({ visible, onClose, footer, children }: { visible: boolean; onClose: () => void; footer: ReactNode; children: ReactNode }) {
  const { colors: c } = useTheme();
  const title = useRef<Text>(null);
  useEffect(() => { if (!visible) return; const task = setTimeout(() => { const id = findNodeHandle(title.current); if (id) AccessibilityInfo.setAccessibilityFocus(id); }, 100); return () => clearTimeout(task); }, [visible]);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={local.sheetHost}>
      <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: VEIL }]} />
      <View accessibilityViewIsModal role="dialog" aria-modal accessibilityLabel="Escolha as etapas" style={[local.sheet, { backgroundColor: c.surface, boxShadow: tokens.shadow.sheet }]}>
        <View style={[local.handle, { backgroundColor: c.line }]} />
        <Text ref={title} accessibilityRole="header" style={[styles.cardTitle, { color: c.ink }]}>Escolha as etapas</Text>
        <ScrollView contentContainerStyle={{ gap: s[5], paddingBottom: s[2] }}>{children}<View style={{ gap: s[2] }}>{footer}</View></ScrollView>
        <SafeAreaView edges={['bottom']} />
      </View>
    </View>
  </Modal>;
}
function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors: c } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Tirar ${label}`} onPress={onPress} style={[local.chip, { borderColor: c.ink, backgroundColor: c['sel-bg'] }]}>{({ pressed }) => <><Text style={[local.chipText, { color: c.ink }]}>{label}</Text><View style={[local.chipX, { backgroundColor: pressed ? c.ink : 'transparent' }]}><Icon name="x" size={16} color={pressed ? c.surface : c.ink} /></View></>}</Pressable>;
}
function EmptyCard({ icon, title, message, children }: { icon: string; title: string; message?: string; children?: ReactNode }) {
  const { colors: c } = useTheme();
  return <View accessibilityLiveRegion="polite" style={[styles.card, local.empty, { backgroundColor: c.surface, borderColor: c.line }]}><SubjectTile subject={null} icon={icon} size={layout['tile-lg']} /><Text accessibilityRole="header" style={[styles.cardTitle, { color: c.ink, textAlign: 'center' }]}>{title}</Text>{message && <Text style={[styles.small, { color: c.muted, textAlign: 'center' }]}>{message}</Text>}{children}</View>;
}
/** The whole row is one target, read as "Geografia, 2º bimestre, AV1, 25 de 30 certas, concluído". */
function SimulationRow({ simulation, status, fromTurma }: { simulation: ApiSimulation; status: SimulationStatus; fromTurma: boolean }) {
  const { colors: c } = useTheme();
  const [tone, label] = STATE_BADGE[status.state];
  const period = periodLabel(simulation.bimester, simulation.assessment) || simulation.topic || '';
  const meta = [period, fromTurma ? 'Da sua turma' : null].filter(Boolean).join(' · ');
  const name = [simulation.discipline.name, ...period.split(' · '), fromTurma ? 'da sua turma' : null, statusText(status, simulation.totalQuestions), label.toLocaleLowerCase('pt-BR')].filter(Boolean).join(', ');
  return <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={() => router.push({ pathname: '/detail/[id]', params: { id: simulation.id } })} style={({ pressed }) => [local.row, { backgroundColor: c.surface, borderColor: pressed ? c.ink : c.line, boxShadow: tokens.shadow.e1 }]}>{({ pressed }) => <>
    <SubjectTile subject={subjectOf(simulation.discipline)} />
    <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }}><Text numberOfLines={1} style={[styles.subheading, { color: c.ink }]}>{simulation.discipline.name}</Text>{meta ? <Text style={[styles.small, { color: c.muted }]}>{meta}</Text> : null}<View style={{ marginTop: s[1] }}><Badge tone={tone}>{label}</Badge></View></View>
    <ActionDot active={pressed} />
  </>}</Pressable>;
}
const local = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: s[3], height: tokens.size['field-height'], paddingHorizontal: s[5], borderWidth: tokens.border.default, borderRadius: tokens.radius.full },
  searchInput: { flex: 1, minWidth: 0, height: '100%', fontFamily: 'Nunito', fontSize: tokens.type.body.mobile[0], fontWeight: '600' },
  subjects: { marginHorizontal: -s[4], flexGrow: 0 },
  subjectsRow: { gap: s[3], paddingHorizontal: s[4], paddingVertical: s[2] },
  subject: { width: layout['subject-card-phone'], alignItems: 'center', gap: s[1], paddingVertical: s[2], paddingHorizontal: s[1], borderWidth: tokens.border.default, borderRadius: tokens.radius.lg },
  subjectName: { fontFamily: 'Fredoka', fontSize: tokens.type.caption.mobile[0], lineHeight: tokens.type.caption.mobile[1], fontWeight: '600', textAlign: 'center' },
  check: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full, borderWidth: tokens.border.default },
  counter: { minWidth: s[6], height: s[6], paddingHorizontal: s[1], borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center' },
  counterText: { fontFamily: 'Nunito', fontSize: tokens.type.caption.mobile[0], fontWeight: '800' },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: s[2] },
  count: { fontFamily: 'Fredoka', fontSize: tokens.type.h3.mobile[0], lineHeight: tokens.type.h2.mobile[1], fontWeight: '600' },
  chips: { flexBasis: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: s[2] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: s[1], minHeight: tokens.size['chip-min-height'], paddingLeft: s[4], paddingRight: s[2], borderWidth: tokens.border.default, borderRadius: tokens.radius.full },
  chipText: { fontFamily: 'Nunito', fontSize: tokens.type['body-sm'].mobile[0], fontWeight: '700' },
  chipX: { width: layout['chip-remove'], height: layout['chip-remove'], borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: s[3], minHeight: layout['simulation-row'], paddingVertical: s[3], paddingLeft: s[4], paddingRight: s[3], borderWidth: tokens.border.thin, borderRadius: tokens.radius.lg },
  empty: { alignItems: 'center', paddingVertical: s[10] },
  soon: { flexDirection: 'row', alignItems: 'center', gap: s[3], padding: s[4], borderWidth: tokens.border.default, borderStyle: 'dashed', borderRadius: tokens.radius.lg },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: s[3], marginBottom: s[3] },
  stepNumber: { width: layout['step-number'], height: layout['step-number'], borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontFamily: 'Fredoka', fontSize: tokens.type.body.mobile[0], fontWeight: '600' },
  years: { flexDirection: 'row', flexWrap: 'wrap', gap: layout['year-gap'] },
  year: { minWidth: tokens.size['chip-min-height'], height: tokens.size['chip-min-height'], paddingHorizontal: s[3], borderWidth: tokens.border.default, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center' },
  yearText: { fontFamily: 'Fredoka', fontSize: tokens.type.body.mobile[0], fontWeight: '600' },
  trail: { flexDirection: 'row', alignItems: 'flex-start' },
  path: { flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', height: tokens.border.default + tokens.border.thin },
  stoneWrap: { alignItems: 'center', gap: s[1], paddingTop: s[1] },
  stone: { width: tokens.size['touch-kids'], height: tokens.size['touch-kids'], borderRadius: tokens.radius.full, borderWidth: tokens.border.default, alignItems: 'center', justifyContent: 'center' },
  stoneText: { fontFamily: 'Fredoka', fontSize: tokens.type.h2.mobile[0], fontWeight: '700' },
  stoneLabel: { fontFamily: 'Nunito', fontSize: tokens.type.caption.mobile[0], lineHeight: tokens.type.caption.mobile[1], fontWeight: '700' },
  assessments: { flexDirection: 'row', gap: s[3] },
  assessment: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: s[2], minHeight: tokens.size['option-min-height'], paddingVertical: s[2], paddingHorizontal: s[3], borderWidth: tokens.border.default, borderRadius: tokens.radius.md },
  note: { fontFamily: 'Nunito', fontSize: tokens.type.caption.mobile[0], lineHeight: tokens.type.caption.mobile[1], fontWeight: '600' },
  sheetHost: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', gap: s[5], paddingTop: s[2], paddingHorizontal: s[4], paddingBottom: s[5], borderTopLeftRadius: tokens.radius.xl, borderTopRightRadius: tokens.radius.xl },
  handle: { alignSelf: 'center', width: layout['sheet-handle'], height: s[1], borderRadius: tokens.radius.full },
});
