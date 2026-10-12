import { Suspense } from 'react';
import localFont from 'next/font/local';
import SimuladoRunner from '@/components/SimuladoRunner';

// Fontes das faixas jovem e exame. Ficam declaradas aqui, e não no layout raiz,
// para que só a rota do simulado pague o carregamento delas.
const jakarta = localFont({
  src: '../../fonts/plusjakartasans-latin.woff2',
  weight: '500 700',
  style: 'normal',
  variable: '--font-jakarta',
  display: 'swap',
});

const sourceSerif = localFont({
  src: '../../fonts/sourceserif4-latin.woff2',
  weight: '400 600',
  style: 'normal',
  variable: '--font-serif',
  display: 'swap',
});

const plex = localFont({
  src: '../../fonts/ibmplexsans-latin.woff2',
  weight: '400 600',
  style: 'normal',
  variable: '--font-plex',
  display: 'swap',
});

export default function SimuladoPage({ params }: { params: { simulationId: string } }) {
  return (
    <div className={`${jakarta.variable} ${sourceSerif.variable} ${plex.variable}`}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6">Carregando...</div>}>
        <SimuladoRunner simulationId={params.simulationId} />
      </Suspense>
    </div>
  );
}
