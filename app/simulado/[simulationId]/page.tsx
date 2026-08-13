import { Suspense } from 'react';
import SimuladoRunner from '@/components/SimuladoRunner';

export default function SimuladoPage({ params }: { params: { simulationId: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6">Carregando...</div>}>
      <SimuladoRunner simulationId={params.simulationId} />
    </Suspense>
  );
}
