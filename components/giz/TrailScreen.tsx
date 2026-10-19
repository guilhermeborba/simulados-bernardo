'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { salvarTrilha } from '@/lib/trilha';
import { AppShell, Badge, Tuca } from './ui';
import './discovery.css';
export default function TrailScreen() {
  const router = useRouter();
  return <AppShell title="Qual é a sua trilha?" subtitle="Um caminho para cada fase de aprender" flow backHref="/"><div className="stack"><div className="trail-intro"><Tuca pose="feliz" size={120} priority /><p>Escolha sua trilha. Vamos descobrir coisas novas juntos!</p></div><div className="giz-grid trail-grid"><button className="card trail-card trail-card--kids" onClick={() => { salvarTrilha('basica'); try { localStorage.setItem('giz:track','kids'); } catch {} router.push('/'); }}><Image unoptimized src="/giz/brand/app-kids.svg" alt="" width="72" height="72" /><h2>Giz Kids</h2><p>Fundamental I</p><span>Simulados para aprender com dicas e curiosidades.</span><span className="btn">Escolher Giz Kids</span></button>{([['escola','Giz Escola','Fundamental II e Médio'],['tecnico','Giz Técnico','Cursos técnicos']] as const).map(([key,title,description]) => <div className="card trail-card" key={key} aria-disabled="true"><Image unoptimized src={`/giz/brand/app-${key}.svg`} alt="" width="72" height="72" /><h2>{title}</h2><p>{description}</p><Badge tone="soon">Em breve</Badge></div>)}</div></div></AppShell>;
}
