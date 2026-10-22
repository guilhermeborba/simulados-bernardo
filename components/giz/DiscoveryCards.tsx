'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCatalog } from './useCatalog';
import { Button, Icon, ScreenState } from './ui';
export function DataGate({ catalog }: { catalog: ReturnType<typeof useCatalog> }) {
  const pathname = usePathname();
  const router = useRouter();
  const signedOut = !catalog.loading && !catalog.user;
  // The middleware already sends visitors without a session cookie to Entrar; this covers a session that expired.
  useEffect(() => {
    if (signedOut) router.replace(`/login?returnTo=${encodeURIComponent(`${pathname}${window.location.search}`)}`);
  }, [signedOut, pathname, router]);
  if (catalog.loading || !catalog.user) return <ScreenState kind="loading" />;
  if (catalog.error) return <ScreenState kind={catalog.offline ? 'offline' : 'error'} title={catalog.offline ? 'Sem conexão' : 'Não foi possível carregar os simulados'} message={catalog.offline ? 'As respostas já confirmadas continuam salvas no seu dispositivo. Tente novamente quando a conexão voltar.' : 'Tente de novo em alguns instantes.'} action={<Button onClick={catalog.reload}>Tentar de novo</Button>} />;
  return null;
}
export function OfflineNotice() { return <p className="giz-offline" role="status"><Icon name="alert" /> Sem conexão. Mostrando os últimos dados salvos.</p>; }
