'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell, Badge, Button, Icon, Modal, SubjectTile } from './ui';
import { isFinished, rememberCatalogQuery, useAnsweredCounts, useCatalog, useRequireTrack } from './useCatalog';
import { DataGate, OfflineNotice } from './DiscoveryCards';
import { ApiSimulation } from '@/lib/apiClient';
import { periodLabel, schoolYearLabel, subjectOf, trackOfSchoolYear } from '@/lib/gizTrack';
import { useLearningPreferences } from '@/contexts/LearningPreferencesContext';
import { gizTokens } from '@/lib/gizTokens.generated';
import { ASSESSMENTS, BIMESTERS, CATALOG_PAGE, STATE_BADGE, availableYearsText, catalogChips, catalogQuery, catalogSubjects, catalogYears, defaultCatalogYear, hasChoices, matchesChoice, parseCatalogParams, sheetChoiceCount, simulationStatus, sortCatalog, statusText, yearShortLabel, yearWithArticle, type CatalogChoice, type CatalogParams, type CatalogSubject, type SimulationStatus } from '@/lib/gizCatalog';
import './discovery.css';
import './catalog.css';
const NO_STEPS: CatalogParams = { discipline: null, year: null, bimester: null, assessment: null };
/** The search filters 300 ms after the last key, so the live count is not announced on every letter; clearing applies at once. */
function useDebounced(value: string) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    if (!value.trim()) { setDebounced(''); return; }
    const timeout = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(timeout);
  }, [value]);
  return debounced;
}
export default function CatalogScreen() {
  const catalog = useCatalog();
  useRequireTrack(catalog);
  // Choices start from the address (?d=geografia&ano=4&b=2&a=1), read once on the client; `year: null` is the default year.
  const [steps, setSteps] = useState<CatalogParams | null>(null);
  useEffect(() => { setSteps(parseCatalogParams(new URLSearchParams(window.location.search))); }, []);
  const [search, setSearch] = useState('');
  const query = useDebounced(search);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [page, setPage] = useState({ key: '', limit: CATALOG_PAGE });
  const track = catalog.track ?? 'kids';
  const sims = catalog.simulations;
  // The faixa saved in the account comes first, then the turma's year; a year from another track does not count.
  const { preferences, isLoading: preferencesLoading } = useLearningPreferences();
  const turmaYear = catalog.turmas.find(turma => typeof turma.schoolYear === 'number')?.schoolYear ?? null;
  const profileYear = [preferences.schoolYear, turmaYear].find((value): value is number => value !== null && trackOfSchoolYear(value) === track) ?? null;
  const defaultYear = defaultCatalogYear(track, sims, profileYear);
  const current = steps ?? NO_STEPS;
  const year = current.year ?? defaultYear;
  const hasContent = (value: number) => sims.some(s => s.schoolYear === value);
  const subjectsOf = (value: number) => catalogSubjects(sims.filter(s => s.schoolYear === value));
  const subjects = [year, defaultYear].map(subjectsOf).find(list => list.length) ?? catalogSubjects(sims);
  const years = catalogYears(track, sims);
  // Técnico and Educação Infantil have a single exam: no bimester nor assessment.
  const showPeriod = track !== 'tecnico' && year > 0;
  const choice: CatalogChoice = { discipline: current.discipline, year, bimester: showPeriod ? current.bimester : null, assessment: showPeriod ? current.assessment : null, search: query };
  const unfinished = catalog.attempts.filter(a => !isFinished(a) && sims.some(s => s.id === a.simulationId));
  const answered = useAnsweredCounts(unfinished.map(a => a.id));
  const statuses = useMemo(() => new Map(sims.map(s => [s.id, simulationStatus(s.id, catalog.attempts, answered ?? {})])), [sims, catalog.attempts, answered]);
  const statusOf = (simulation: ApiSimulation) => statuses.get(simulation.id) ?? { state: 'new' as const };
  const results = sortCatalog(sims.filter(s => matchesChoice(s, choice)), s => statusOf(s).state, catalog.fromTurma);
  const filterKey = JSON.stringify(choice);
  const limit = page.key === filterKey ? page.limit : CATALOG_PAGE;
  const more = Math.min(CATALOG_PAGE, results.length - limit);
  // Without a track the page is about to move to /trilha (useRequireTrack): keep the skeleton.
  const ready = steps !== null && !catalog.loading && !preferencesLoading && catalog.track !== null && answered !== null;
  const address = catalogQuery(choice, defaultYear);
  useEffect(() => {
    if (!ready) return;
    const url = `${window.location.pathname}${address ? `?${address}` : ''}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, '', url);
    rememberCatalogQuery(address);
  }, [ready, address]);
  // The sheet only exists on the phone: growing past it closes the dialog and the steps show in the page.
  useEffect(() => {
    if (!sheetOpen) return;
    const wide = window.matchMedia(`(min-width: ${gizTokens.breakpoint['tablet-min']}px)`);
    const close = () => { if (wide.matches) setSheetOpen(false); };
    close();
    wide.addEventListener('change', close);
    return () => wide.removeEventListener('change', close);
  }, [sheetOpen]);
  const update = (patch: Partial<CatalogParams>) => setSteps(value => ({ ...(value ?? NO_STEPS), ...patch }));
  const chooseYear = (value: number) => {
    const next = subjectsOf(value);
    update({ year: value === defaultYear ? null : value, ...(value > 0 ? {} : { bimester: null, assessment: null }), ...(current.discipline && next.length && !next.some(s => s.slug === current.discipline) ? { discipline: null } : {}) });
  };
  const clear = () => { setSteps(NO_STEPS); setSearch(''); };
  const remove = (key: 'discipline' | 'year' | 'bimester' | 'assessment') => update({ [key]: null });
  const dirty = hasChoices({ ...choice, search }, defaultYear);
  const yearEmpty = !hasContent(year);
  const count = yearEmpty ? 0 : results.length;
  const countText = `${count} ${count === 1 ? 'simulado' : 'simulados'}`;
  const chips = catalogChips(choice, defaultYear, subjects, schoolYearLabel);
  const stepProps = { years, year, bimester: choice.bimester, assessment: choice.assessment, showYear: years.length > 1, showPeriod, chooseYear, toggleBimester: (value: number) => update({ bimester: current.bimester === value ? null : value }), toggleAssessment: (value: string) => update({ assessment: current.assessment === value ? null : value }) };
  return <AppShell topLevel title="Simulados" subtitle="Escolha sua próxima descoberta.">
    {(!catalog.user || catalog.error) && !catalog.loading ? <DataGate catalog={catalog} /> : !ready ? <CatalogSkeleton /> : <div className="catalog">
      {catalog.offline && <OfflineNotice />}
      <label className="catalog-search"><Icon name="search" /><span className="sr-only">Buscar simulado</span><input type="search" placeholder="Buscar simulado" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <section className="catalog-steps" aria-label="Escolha as etapas">
        <div><StepHead number={1} title="Qual disciplina?" done={Boolean(choice.discipline)} hint="Toque de novo para tirar" />
          <div className="catalog-subjects" role="group" aria-label="Disciplina">
            <SubjectOption name="Todas" subject={null} icon="grid" pressed={!choice.discipline} onPress={() => update({ discipline: null })} all />
            {subjects.map(item => <SubjectOption key={item.slug} name={item.name} subject={item.subject} pressed={choice.discipline === item.slug} onPress={() => update({ discipline: choice.discipline === item.slug ? null : item.slug })} />)}
          </div>
        </div>
        {(stepProps.showYear || showPeriod) && <div className="catalog-steps-row"><PeriodSteps {...stepProps} /></div>}
        {(stepProps.showYear || showPeriod) && <button type="button" className="btn btn--secondary btn--more catalog-sheet-button" aria-haspopup="dialog" onClick={() => setSheetOpen(true)}><Icon name="sliders" size={20} />{showPeriod ? 'Ano, bimestre e avaliação' : 'Ano'}{sheetChoiceCount(choice, defaultYear) > 0 && <span className="catalog-sheet-count">{sheetChoiceCount(choice, defaultYear)}<span className="sr-only"> escolhidas</span></span>}</button>}
      </section>
      <div className="catalog-summary">
        <p className="catalog-count" aria-live="polite">{countText}</p>
        {chips.length > 0 && <div className="catalog-chips">{chips.map(chip => <button type="button" key={chip.key} className="catalog-chip" aria-label={`Tirar ${chip.label}`} onClick={() => remove(chip.key)}>{chip.label}<span className="catalog-chip-x" aria-hidden="true"><Icon name="x" size={16} /></span></button>)}</div>}
        {dirty && <ClearButton onClick={clear} compact />}
      </div>
      {yearEmpty ? <YearSoon year={year} years={years.filter(hasContent)} target={hasContent(defaultYear) ? defaultYear : years.find(hasContent)} onBack={chooseYear} />
        : results.length === 0 ? <section className="catalog-empty" role="status"><span className="giz-tile catalog-empty-tile" aria-hidden="true"><Icon name="search" size={36} /></span><h2>Nenhum simulado com essa escolha</h2><p>Tire uma etapa para ver mais.</p><ClearButton onClick={clear} /></section>
        : <div className="catalog-results">{results.slice(0, limit).map(simulation => <CatalogCard key={simulation.id} simulation={simulation} status={statusOf(simulation)} fromTurma={catalog.fromTurma(simulation)} />)}</div>}
      {!yearEmpty && more > 0 && <div className="catalog-more"><button type="button" className="btn btn--secondary btn--more" onClick={() => setPage({ key: filterKey, limit: limit + CATALOG_PAGE })}>Mostrar mais {more}</button></div>}
      <div className="catalog-soon"><Icon name="clock" /><div><h2>Monte seu simulado</h2><p>Suas disciplinas, do seu jeito.</p></div><Badge tone="soon">Em breve</Badge></div>
      {sheetOpen && <Modal sheet title="Escolha as etapas" onClose={() => setSheetOpen(false)}>
        <PeriodSteps {...stepProps} />
        <div className="catalog-sheet-foot"><Button onClick={() => setSheetOpen(false)}>Ver {countText}</Button><ClearButton onClick={clear} /></div>
      </Modal>}
    </div>}
  </AppShell>;
}
function CatalogSkeleton() {
  return <div className="catalog-results" aria-busy="true"><span className="sr-only" role="status">Carregando simulados…</span>{Array.from({ length: CATALOG_PAGE }, (_, index) => <div key={index} className="catalog-skeleton" />)}</div>;
}
function StepHead({ number, title, done, hint }: { number: number; title: string; done: boolean; hint?: string }) {
  return <div className="catalog-step-head"><span className={`catalog-step-num ${done ? 'catalog-step-num--done' : ''}`} aria-hidden="true">{done ? <Icon name="check" size={18} /> : number}</span><h2>{title}</h2>{hint && <p>{hint}</p>}</div>;
}
/** The green check marks a choice; the state itself is in aria-pressed. */
function Check() {
  return <span className="catalog-check" aria-hidden="true"><Icon name="check" size={16} /></span>;
}
function SubjectOption({ name, subject, icon, pressed, onPress, all = false }: { name: string; subject: CatalogSubject['subject']; icon?: string; pressed: boolean; onPress: () => void; all?: boolean }) {
  return <button type="button" className={`catalog-subject catalog-subject--${all ? 'all' : subject ?? 'other'}`} aria-pressed={pressed} onClick={onPress}><SubjectTile subject={subject} icon={icon} />{name}{pressed && <Check />}</button>;
}
type PeriodProps = { years: number[]; year: number; bimester: number | null; assessment: string | null; showYear: boolean; showPeriod: boolean; chooseYear: (year: number) => void; toggleBimester: (bimester: number) => void; toggleAssessment: (assessment: string) => void };
/** Steps 2 to 4, in the page from 600 px and in the phone's sheet. The year always has a value, so its step is always checked. */
function PeriodSteps({ years, year, bimester, assessment, showYear, showPeriod, chooseYear, toggleBimester, toggleAssessment }: PeriodProps) {
  return <>
    {showYear && <div><StepHead number={2} title="Qual ano?" done />
      <div className="catalog-years" role="group" aria-label="Ano escolar">{years.map(value => <button type="button" key={value} className="catalog-year" aria-pressed={value === year} aria-label={schoolYearLabel(value)} onClick={() => chooseYear(value)}>{yearShortLabel(value)}</button>)}</div>
    </div>}
    {showPeriod && <div><StepHead number={3} title="Qual bimestre?" done={bimester !== null} />
      <div className="catalog-trail" role="group" aria-label="Bimestre">{BIMESTERS.map(value => <div key={value} className="catalog-stone-wrap"><button type="button" className="catalog-stone" aria-pressed={bimester === value} aria-label={`${value}º bimestre`} onClick={() => toggleBimester(value)}>{value}{bimester === value && <Check />}</button><small aria-hidden="true">bimestre</small></div>)}</div>
    </div>}
    {showPeriod && <div><StepHead number={4} title="Qual avaliação?" done={assessment !== null} />
      <div className="catalog-assessments" role="group" aria-label="Avaliação">{ASSESSMENTS.map(item => <button type="button" key={item.value} className="catalog-assessment" aria-pressed={assessment === item.value} aria-label={`${item.value}, ${item.note}`} onClick={() => toggleAssessment(item.value)}><Icon name="pencil" size={20} /><span><strong>{item.value}</strong><small>{item.note}</small></span>{assessment === item.value && <Check />}</button>)}</div>
    </div>}
  </>;
}
function ClearButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return <button type="button" className={`btn btn--secondary btn--more catalog-clear ${compact ? 'catalog-clear--compact' : ''}`} onClick={onClick}><Icon name="reset" size={20} /><span className="catalog-clear-long">Limpar escolhas</span>{compact && <span className="catalog-clear-short">Limpar</span>}</button>;
}
function YearSoon({ year, years, target, onBack }: { year: number; years: number[]; target?: number; onBack: (year: number) => void }) {
  return <section className="catalog-empty" role="status"><span className="giz-tile catalog-empty-tile" aria-hidden="true"><Icon name="book" size={36} /></span><h2>Os simulados {yearWithArticle(year)} chegam em breve</h2>{years.length > 0 && <p>{availableYearsText(years)}</p>}{target !== undefined && <button type="button" className="btn btn--secondary btn--more catalog-clear" onClick={() => onBack(target)}>Voltar {yearWithArticle(target, true)}</button>}</section>;
}
/** The whole card is one link, read as "Geografia, 2º bimestre, AV1, 25 de 30 certas, concluído". */
function CatalogCard({ simulation, status, fromTurma }: { simulation: ApiSimulation; status: SimulationStatus; fromTurma: boolean }) {
  const [tone, label] = STATE_BADGE[status.state];
  const period = periodLabel(simulation.bimester, simulation.assessment) || simulation.topic || '';
  const meta = [period, fromTurma ? 'Da sua turma' : null].filter(Boolean).join(' · ');
  const progress = statusText(status, simulation.totalQuestions);
  const name = [simulation.discipline.name, ...period.split(' · '), fromTurma ? 'da sua turma' : null, progress, label.toLocaleLowerCase('pt-BR')].filter(Boolean).join(', ');
  return <Link className="catalog-card" href={`/simulados/${encodeURIComponent(simulation.id)}`} aria-label={name}>
    <span className="catalog-card-main"><SubjectTile subject={subjectOf(simulation.discipline)} /><span className="catalog-card-text"><span className="catalog-card-title">{simulation.discipline.name}</span>{meta && <span className="catalog-card-meta">{meta}</span>}<span className="catalog-card-meta catalog-card-status">{progress}</span><Badge tone={tone}>{label}</Badge></span></span>
    {status.state === 'progress' && status.answered !== undefined && <span className="catalog-card-progress" role="progressbar" aria-label="Progresso" aria-valuemin={0} aria-valuemax={simulation.totalQuestions} aria-valuenow={status.answered}><span style={{ width: `${Math.min(100, status.answered / Math.max(simulation.totalQuestions, 1) * 100)}%` }} /></span>}
    <span className="catalog-card-foot"><Badge tone={tone}>{label}</Badge><span className="giz-action-dot" aria-hidden="true"><Icon name="chevron-right" size={20} /></span></span>
  </Link>;
}
