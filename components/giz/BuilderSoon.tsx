import Link from 'next/link';
import Image from 'next/image';
import { AppShell, Badge } from './ui';
export default function BuilderSoon() { return <AppShell title="Monte seu simulado" subtitle="Um novo jeito de organizar suas descobertas" flow backHref="/simulados"><section className="card giz-state"><Image priority unoptimized src="/giz/ilustracoes/em-breve.svg" alt="" width={220} height={170} style={{ width: 'var(--size-illustration)', height: 'auto' }} /><Badge tone="soon">Em breve</Badge><h2>Suas disciplinas, do seu jeito</h2><p>Estamos preparando essa possibilidade. Enquanto isso, escolha um dos simulados disponíveis.</p><Link href="/simulados" className="btn">Escolher um simulado</Link></section></AppShell>; }
