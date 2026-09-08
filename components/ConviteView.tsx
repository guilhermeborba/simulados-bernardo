'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { joinTurma, ApiTurma } from '@/lib/apiClient';
import RegisterForm from './RegisterForm';

type State = 'checking' | 'joining' | 'joined' | 'error';

/**
 * Um único link serve para todo mundo: quem ainda não tem conta cria uma já
 * dentro da turma, e quem já tem entra nela na hora.
 */
export default function ConviteView() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  const { user, isLoading } = useAuth();

  const [state, setState] = useState<State>('checking');
  const [turma, setTurma] = useState<ApiTurma | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  // O convite é consumido uma vez só; o StrictMode do React monta o efeito
  // duas vezes em desenvolvimento e chamaria a rota duas vezes sem isto.
  const requested = useRef(false);

  useEffect(() => {
    if (isLoading || !token || !user || requested.current) return;

    requested.current = true;
    setState('joining');

    joinTurma(token)
      .then((result) => {
        setTurma(result.turma);
        setState('joined');
      })
      .catch((err: unknown) => {
        setErrorMessage(
          err instanceof Error ? err.message : 'Não foi possível usar o convite',
        );
        setState('error');
      });
  }, [isLoading, token, user]);

  if (!token) {
    return (
      <Aviso titulo="Convite inválido">
        Esse link não tem um convite. Peça um link novo para quem te chamou.
      </Aviso>
    );
  }

  if (isLoading || (user && state === 'checking')) {
    return <Aviso titulo="Um instante...">Conferindo seu convite.</Aviso>;
  }

  // Sem conta: cadastro já com o convite embutido.
  if (!user) {
    return <RegisterForm inviteToken={token} />;
  }

  if (state === 'error') {
    return <Aviso titulo="Convite não aceito">{errorMessage}</Aviso>;
  }

  if (state === 'joined' && turma) {
    return (
      <Aviso titulo={`Bem-vindo à ${turma.name}!`}>
        Os simulados da turma já aparecem para você.
        <div className="mt-6">
          <Link href="/" className="btn btn--grass btn--lg">
            Ver os simulados
          </Link>
        </div>
      </Aviso>
    );
  }

  return <Aviso titulo="Um instante...">Entrando na turma.</Aviso>;
}

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="page-shell flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="card card--hero text-center">
          <h1 className="text-3xl mb-4">{titulo}</h1>
          <div style={{ color: 'var(--muted)' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
