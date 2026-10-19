'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { GIZ_TRACKS, TRACK_INFO, saveTrack, useGizTrack } from '@/lib/gizTrack';
import { AppShell, Tuca } from './ui';
import './discovery.css';
export default function TrailScreen() {
  const router = useRouter();
  const current = useGizTrack();
  return <AppShell title="Qual é a sua trilha?" subtitle="Um caminho para cada fase de aprender" flow backHref="/"><div className="stack"><div className="trail-intro"><Tuca pose="feliz" size={120} priority /><p>Escolha sua trilha. Você pode trocar depois, em Eu.</p></div><div className="giz-grid trail-grid">{GIZ_TRACKS.map(track => <button key={track} type="button" aria-pressed={current === track} className={`card trail-card trail-card--${track}`} onClick={() => { saveTrack(track); router.push('/'); }}><Image unoptimized src={`/giz/brand/app-${track}.svg`} alt="" width="72" height="72" /><h2>{TRACK_INFO[track].name}</h2><p>{TRACK_INFO[track].audience}</p><span>{TRACK_INFO[track].pitch}</span><span className="btn">{current === track ? 'Continuar' : `Escolher ${TRACK_INFO[track].name}`}</span></button>)}</div></div></AppShell>;
}
