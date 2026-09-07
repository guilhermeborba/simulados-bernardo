import { Suspense } from 'react';
import { IBM_Plex_Sans, Plus_Jakarta_Sans, Source_Serif_4 } from 'next/font/google';
import SimuladoRunner from '@/components/SimuladoRunner';

// Fontes das faixas jovem e exame. Ficam declaradas aqui, e não no layout raiz,
// para que só a rota do simulado pague o carregamento delas.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-serif',
  display: 'swap',
});

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
