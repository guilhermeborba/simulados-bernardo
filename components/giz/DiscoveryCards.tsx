'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCatalog } from './useCatalog';
import { Button, Icon, ScreenState, Tuca } from './ui';
export function DataGate({ catalog }: { catalog: ReturnType<typeof useCatalog> }) {
  const pathname = usePathname();
  const returnTo = encodeURIComponent(pathname);
  if (catalog.loading) return <ScreenState kind="loading" />;
  if (!catalog.user) return <section className="card giz-state"><Tuca pose="feliz" size={120} /><h2>Vamos aprender juntos?</h2><p>Entre na sua conta para encontrar seus simulados e acompanhar suas descobertas.</p><Link className="btn" href={`/login?returnTo=${returnTo}`}>Entrar no Giz</Link><Link href={`/registro?returnTo=${returnTo}`}>Criar uma conta</Link></section>;
  if (catalog.error) return <ScreenState kind={catalog.offline ? 'offline' : 'error'} title={catalog.offline ? 'Sem conexão' : 'Não foi possível carregar os simulados'} message={catalog.offline ? 'As respostas já confirmadas continuam salvas no seu dispositivo. Tente novamente quando a conexão voltar.' : 'Tente de novo em alguns instantes.'} action={<Button onClick={catalog.reload}>Tentar de novo</Button>} />;
  return null;
}
export function OfflineNotice() { return <p className="giz-offline" role="status"><Icon name="alert" /> Sem conexão. Mostrando os últimos dados salvos.</p>; }
