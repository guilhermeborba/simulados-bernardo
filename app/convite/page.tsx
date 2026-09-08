import { Suspense } from 'react';
import ConviteView from '@/components/ConviteView';

export const metadata = {
  title: 'Convite de turma — Simulados Bernardo',
};

export default function ConvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          Carregando...
        </div>
      }
    >
      <ConviteView />
    </Suspense>
  );
}
