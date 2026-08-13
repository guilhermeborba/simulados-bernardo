import { Suspense } from 'react';
import HistoricoList from '@/components/HistoricoList';

export const metadata = {
  title: 'Histórico — Simulados Bernardo',
};

export default function HistoricoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6">Carregando...</div>}>
      <HistoricoList />
    </Suspense>
  );
}
