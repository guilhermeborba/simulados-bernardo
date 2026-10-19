import { Suspense } from 'react';
import SimuladoRunner from '@/components/SimuladoRunner';

export default function SimuladoPage({ params }: { params: { simulationId: string } }) {
  return <Suspense fallback={<main className="page-shell" aria-busy="true"><p>Preparando seu simulado…</p></main>}><SimuladoRunner simulationId={params.simulationId} /></Suspense>;
}
