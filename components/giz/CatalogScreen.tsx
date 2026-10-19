'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell, Badge, Button, Icon, ScreenState } from './ui';
import { useCatalog, useRequireTrack } from './useCatalog';
import { compareSchoolYears, schoolYearLabel } from '@/lib/gizTrack';
import { DataGate, FilterChips, OfflineNotice, SimulationCard } from './DiscoveryCards';
import './discovery.css';
export default function CatalogScreen() {
  const catalog = useCatalog();
  useRequireTrack(catalog);
  const [discipline, setDiscipline] = useState(''); const [bimester, setBimester] = useState(0); const [year, setYear] = useState<number | null>(null); const [assessment, setAssessment] = useState(''); const [search, setSearch] = useState('');
  const clear = () => { setDiscipline(''); setBimester(0); setYear(null); setAssessment(''); setSearch(''); };
  const disciplines = Array.from(new Set(catalog.simulations.map(s => s.discipline.name))).sort();
  const years = Array.from(new Set(catalog.simulations.map(s => s.schoolYear))).sort(compareSchoolYears);
  const filtered = useMemo(() => catalog.simulations.filter(s => (!discipline || s.discipline.name === discipline) && (!bimester || s.bimester === bimester) && (year === null || s.schoolYear === year) && (!assessment || s.assessment === assessment) && (!search || `${s.title} ${s.discipline.name}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))), [catalog.simulations, discipline, bimester, year, assessment, search]);
  return <AppShell title="Simulados" subtitle="Encontre sua próxima descoberta">{(catalog.loading || !catalog.user || catalog.error) ? <DataGate catalog={catalog} /> : <div className="stack">{catalog.offline && <OfflineNotice />}<section className="card stack catalog-filters" aria-label="Filtros de simulados"><div className="catalog-search"><Icon name="search" /><label className="sr-only" htmlFor="catalog-search">Buscar simulado</label><input className="field" type="search" id="catalog-search" placeholder="Buscar simulado" value={search} onChange={e => setSearch(e.target.value)} /></div>
    <FilterChips label="Disciplina" values={disciplines} value={discipline} onChange={setDiscipline} all="Todas as disciplinas" />
    {years.length > 1 && <FilterChips label="Ano escolar" values={years.map(String)} value={year === null ? '' : String(year)} onChange={v => setYear(v ? Number(v) : null)} all="Todos os anos" format={v => schoolYearLabel(Number(v))} />}
    {catalog.track !== 'tecnico' && <FilterChips label="Bimestre" values={['1','2','3','4']} value={bimester ? String(bimester) : ''} onChange={v => setBimester(Number(v))} all="Todos os bimestres" format={v => `${v}º bimestre`} />}
    {catalog.track !== 'tecnico' && <FilterChips label="Avaliação" values={['AV1','AV2']} value={assessment} onChange={setAssessment} all="Todas as avaliações" />}
    </section><div className="cluster discovery-section-title"><p role="status">{filtered.length} {filtered.length === 1 ? 'simulado' : 'simulados'}</p><button className="btn btn--text" onClick={clear}>Limpar filtros</button></div>
    {filtered.length ? <div className="giz-grid">{filtered.map(s => <SimulationCard key={s.id} simulation={s} attempt={catalog.attempts.find(a => a.simulationId === s.id)} />)}</div> : <ScreenState kind="empty" title="Nada por aqui com esses filtros." message="Experimente outra disciplina, ano ou avaliação." action={<Button onClick={clear}>Limpar filtros</Button>} />}
    <Link className="card discovery-coming" href="/simulados/novo"><span><h3>Monte seu simulado</h3><p className="muted">Suas disciplinas, do seu jeito.</p></span><Badge tone="soon">Em breve</Badge></Link></div>}</AppShell>;
}
