import Link from 'next/link';
import Image from 'next/image';
import { AppShell, Badge } from '@/components/giz/ui';
import '@/components/giz/account.css';
export const metadata = { title: 'Painel dos pais — Giz' };
export default function Page() {
  return <AppShell title="Painel dos pais" backHref="/eu" flow>
    <section className="card account-coming"><Image priority unoptimized style={{ height: 'auto' }} src="/giz/ilustracoes/em-breve.svg" alt="" width={220} height={170} /><Badge tone="soon">Em breve</Badge><h2>Um espaço para acompanhar de perto</h2><p>O painel dos pais ainda está em construção. Por enquanto, você pode acompanhar os simulados concluídos no histórico.</p><Link href="/historico" className="btn">Ver histórico</Link></section>
  </AppShell>;
}
