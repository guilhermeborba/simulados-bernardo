'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { joinTurma, ApiTurma } from '@/lib/apiClient';
import { bloquearTrocaDeTrilha } from '@/lib/trilha';
import { saveTrack, trackOfTurmas } from '@/lib/gizTrack';
import RegisterForm from './RegisterForm';
import { AppShell } from './giz/ui';

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
        // Quem já tinha conta segue a série da turma, sem escolher trilha.
        saveTrack(trackOfTurmas([result.turma]) ?? 'kids');
        bloquearTrocaDeTrilha();
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
          <Link href="/simulados" className="btn btn--grass btn--lg">
            Ver os simulados
          </Link>
        </div>
      </Aviso>
    );
  }

  return <Aviso titulo="Um instante...">Entrando na turma.</Aviso>;
}

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <AppShell key={titulo} title={titulo} flow>
    <section className="card stack" role="status">{children}</section>
  </AppShell>;
}
