'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell, Badge, Button, Icon, ScreenState } from './ui';
import { useCatalog } from './useCatalog';
import { DataGate, FilterChips, OfflineNotice, SimulationCard } from './DiscoveryCards';
import './discovery.css';
export default function CatalogScreen() {
  const catalog = useCatalog();
  const [discipline, setDiscipline] = useState(''); const [bimester, setBimester] = useState(0); const [year, setYear] = useState(0); const [assessment, setAssessment] = useState(''); const [search, setSearch] = useState('');
  const clear = () => { setDiscipline(''); setBimester(0); setYear(0); setAssessment(''); setSearch(''); };
  const disciplines = Array.from(new Set(catalog.simulations.map(s => s.discipline.name))).sort();
  const years = Array.from(new Set(catalog.simulations.map(s => s.schoolYear))).sort();
  const filtered = useMemo(() => catalog.simulations.filter(s => (!discipline || s.discipline.name === discipline) && (!bimester || s.bimester === bimester) && (!year || s.schoolYear === year) && (!assessment || s.assessment === assessment) && (!search || `${s.title} ${s.discipline.name}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))), [catalog.simulations, discipline, bimester, year, assessment, search]);
  return <AppShell title="Simulados" subtitle="Encontre sua próxima descoberta">{(catalog.loading || !catalog.user || catalog.error) ? <DataGate catalog={catalog} /> : <div className="stack">{catalog.offline && <OfflineNotice />}<section className="card stack catalog-filters" aria-label="Filtros de simulados"><div className="catalog-search"><Icon name="search" /><label className="sr-only" htmlFor="catalog-search">Buscar simulado</label><input className="field" type="search" id="catalog-search" placeholder="Buscar simulado" value={search} onChange={e => setSearch(e.target.value)} /></div>
    <FilterChips label="Disciplina" values={disciplines} value={discipline} onChange={setDiscipline} all="Todas as disciplinas" />
    <FilterChips label="Ano escolar" values={years.map(String)} value={year ? String(year) : ''} onChange={v => setYear(Number(v))} all="Todos os anos" format={v => `${v}º ano`} />
    <FilterChips label="Bimestre" values={['1','2','3','4']} value={bimester ? String(bimester) : ''} onChange={v => setBimester(Number(v))} all="Todos os bimestres" format={v => `${v}º bimestre`} />
    <FilterChips label="Avaliação" values={['AV1','AV2']} value={assessment} onChange={setAssessment} all="Todas as avaliações" />
    </section><div className="cluster discovery-section-title"><p role="status">{filtered.length} {filtered.length === 1 ? 'simulado' : 'simulados'}</p><button className="btn btn--text" onClick={clear}>Limpar filtros</button></div>
    {filtered.length ? <div className="giz-grid">{filtered.map(s => <SimulationCard key={s.id} simulation={s} attempt={catalog.attempts.find(a => a.simulationId === s.id)} />)}</div> : <ScreenState kind="empty" title="Nada por aqui com esses filtros." message="Experimente outra disciplina, ano ou avaliação." action={<Button onClick={clear}>Limpar filtros</Button>} />}
    <Link className="card discovery-coming" href="/simulados/novo"><span><h3>Monte seu simulado</h3><p className="muted">Suas disciplinas, do seu jeito.</p></span><Badge tone="soon">Em breve</Badge></Link></div>}</AppShell>;
}
