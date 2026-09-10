'use client';

import { useEffect, useState } from 'react';
import { getMinhaPontuacao } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Antes este selo era o número 7 escrito na mão em duas telas: todo aluno via
 * "7 dias seguidos", tivesse entrado ontem ou nunca. Agora ele conta dias
 * distintos com simulado terminado, e some quando não há sequência — um selo
 * que mente vale menos que selo nenhum.
 */
export default function SeloDiasSeguidos() {
  const { user, isLoading } = useAuth();
  const [dias, setDias] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    getMinhaPontuacao()
      .then((pontuacao) => setDias(pontuacao.diasSeguidos))
      .catch(() => setDias(null));
  }, [isLoading, user]);

  if (dias === null || dias === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-sm"
      style={{ background: '#FFF8D6', color: '#8B6000', boxShadow: 'var(--shadow-1)' }}
      title="Dias seguidos estudando"
    >
      <span className="text-base">{dias}</span>
      <span>{dias === 1 ? 'Dia seguido' : 'Dias seguidos'}</span>
    </div>
  );
}
