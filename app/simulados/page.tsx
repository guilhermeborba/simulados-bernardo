import { Suspense } from 'react';
import SimuladosPageClient from '@/components/SimuladosPageClient';

export default function SimuladosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6">Carregando...</div>}>
      <SimuladosPageClient />
    </Suspense>
  );
}
