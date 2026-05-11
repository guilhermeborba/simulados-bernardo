import { Suspense } from 'react';
import SimuladoPortuguesPageClient from '@/components/SimuladoPortuguesPageClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6">Carregando...</div>}>
      <SimuladoPortuguesPageClient />
    </Suspense>
  );
}
