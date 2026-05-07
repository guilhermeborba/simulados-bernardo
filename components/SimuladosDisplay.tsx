'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SimuladosDisplay() {
  const searchParams = useSearchParams();
  const year = searchParams.get('year');
  const assessment = searchParams.get('assessment');

  const yearLabels: Record<string, string> = {
    terceiro: '3º Ano',
  };

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 animate-in fade-in duration-500">
      <p className="text-lg text-blue-800 font-semibold">
        📋 <strong>Simulado {assessment}</strong> - {yearLabels[year || 'terceiro']}
      </p>
      <p className="text-sm text-blue-700 mt-2">
        Você pode <Link href="/" className="underline font-semibold hover:text-blue-900">voltar para mudar a seleção</Link>
      </p>
    </div>
  );
}
