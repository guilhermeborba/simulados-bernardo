'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getMinhaPontuacao,
  getMyTurmas,
  getRankingDaTurma,
  ApiLinhaDoRanking,
  ApiMinhaPontuacao,
  ApiRanking,
  ApiTurma,
} from '@/lib/apiClient';

const MEDALHAS = ['🥇', '🥈', '🥉'];

export default function RankingView() {
  const [pontuacao, setPontuacao] = useState<ApiMinhaPontuacao | null>(null);
  const [turmas, setTurmas] = useState<ApiTurma[] | null>(null);
  const [ranking, setRanking] = useState<ApiRanking | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMinhaPontuacao(), getMyTurmas()])
      .then(([minha, minhasTurmas]) => {
        setPontuacao(minha);
        setTurmas(minhasTurmas);
        return minhasTurmas[0]
          ? getRankingDaTurma(minhasTurmas[0].id).then(setRanking)
          : null;
      })
      .catch(() => setErro('Não foi possível carregar sua pontuação.'));
  }, []);

  return (
    <div className="page-shell flex flex-col px-4 py-6 md:py-8">
      <div className="flex justify-between items-center mb-6 w-full max-w-2xl mx-auto">
        <Link href="/" className="btn btn--ghost text-sm" style={{ padding: '8px 16px' }}>
          ‹ Voltar
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <span className="font-bold text-base" style={{ fontFamily: 'var(--font-fredoka)', color: 'var(--ink)' }}>
            Pontuação
          </span>
        </div>
        <Link href="/historico" className="btn btn--ghost text-sm" style={{ padding: '8px 16px' }}>
          Histórico ›
        </Link>
      </div>

      <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
        {erro && <p style={{ color: 'var(--bubble-deep)' }}>{erro}</p>}

        {pontuacao && <MinhaPontuacao pontuacao={pontuacao} />}

        {turmas !== null && turmas.length === 0 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)' }}>
              O ranking é entre colegas da mesma turma. Você ainda não está em
              uma — se recebeu um link de convite, abra o link para entrar.
            </p>
          </div>
        )}

        {ranking && <RankingDaTurma ranking={ranking} />}
      </div>
    </div>
  );
}

function MinhaPontuacao({ pontuacao }: { pontuacao: ApiMinhaPontuacao }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
        Conta todos os simulados que você fez, de todas as trilhas.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Numero valor={`${pontuacao.media}%`} rotulo="Média geral" destaque />
        <Numero valor={String(pontuacao.simulados)} rotulo="Simulados feitos" />
        <Numero valor={String(pontuacao.diasSeguidos)} rotulo="Dias seguidos" />
      </div>

      {pontuacao.melhorSimulado && (
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'var(--cream)' }}
        >
          <span style={{ fontSize: 22 }}>⭐</span>
          <div style={{ fontSize: 14 }}>
            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
              Seu melhor: {pontuacao.melhorSimulado.percentage}% em{' '}
              {pontuacao.melhorSimulado.disciplina}
            </div>
            <div style={{ color: 'var(--muted)' }}>{pontuacao.melhorSimulado.titulo}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Numero({
  valor,
  rotulo,
  destaque,
}: {
  valor: string;
  rotulo: string;
  destaque?: boolean;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: 'var(--font-fredoka)',
          fontWeight: 700,
          fontSize: 30,
          lineHeight: 1.1,
          color: destaque ? 'var(--grass-deep)' : 'var(--ink)',
        }}
      >
        {valor}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{rotulo}</div>
    </div>
  );
}

function RankingDaTurma({ ranking }: { ranking: ApiRanking }) {
  const { minhaPosicao, podio, vizinhanca } = ranking;

  // Quem já está no pódio não precisa ver a própria linha duas vezes.
  const mostraVizinhanca =
    minhaPosicao !== null && minhaPosicao.posicao > 3 && vizinhanca.length > 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-fredoka)', fontSize: 22, color: 'var(--ink)' }}>
          {ranking.turma.name}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Só os simulados desta turma contam aqui.
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {ranking.totalClassificados === 0
            ? 'Ninguém da turma completou simulados suficientes ainda.'
            : `${ranking.totalClassificados} no ranking · entra quem fez ${ranking.minimoDeSimulados} simulados`}
        </p>
      </div>

      {podio.length > 0 && (
        <div className="flex flex-col gap-2">
          {podio.map((linha) => (
            <Linha key={linha.posicao} linha={linha} medalha={MEDALHAS[linha.posicao - 1]} />
          ))}
        </div>
      )}

      {mostraVizinhanca && (
        <div className="flex flex-col gap-2">
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Perto de você
          </div>
          {vizinhanca.map((linha) => (
            <Linha key={linha.posicao} linha={linha} />
          ))}
        </div>
      )}

      {minhaPosicao === null && (
        <div
          className="flex items-start gap-3 rounded-2xl px-4 py-3"
          style={{ background: '#FFF8D6', border: '1.5px solid #FFD66B' }}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: 13, color: '#6B4A00', fontWeight: 600, lineHeight: 1.5 }}>
            {ranking.faltamParaORanking === ranking.minimoDeSimulados
              ? `Faça ${ranking.minimoDeSimulados} simulados desta turma para entrar no ranking.`
              : `Falta${ranking.faltamParaORanking === 1 ? '' : 'm'} ${ranking.faltamParaORanking} simulado${ranking.faltamParaORanking === 1 ? '' : 's'} desta turma para você entrar no ranking.`}{' '}
            A média conta a sua melhor tentativa de cada um — dá para refazer e
            melhorar.
          </p>
        </div>
      )}
    </div>
  );
}

function Linha({ linha, medalha }: { linha: ApiLinhaDoRanking; medalha?: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{
        background: linha.ehVoce ? 'rgba(91,214,138,.14)' : 'var(--paper)',
        border: `1.5px solid ${linha.ehVoce ? 'var(--grass-deep)' : 'var(--line)'}`,
      }}
    >
      <span
        style={{
          width: 28,
          textAlign: 'center',
          fontFamily: 'var(--font-fredoka)',
          fontWeight: 700,
          color: 'var(--muted)',
          flexShrink: 0,
        }}
      >
        {medalha ?? linha.posicao}
      </span>
      <span style={{ flex: 1, fontWeight: 700, color: 'var(--ink)' }}>
        {linha.nome}
        {linha.ehVoce && (
          <span style={{ color: 'var(--grass-deep)', fontWeight: 800 }}> · você</span>
        )}
      </span>
      <span style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{linha.media}%</span>
        {/* A contagem fica ao lado da média de propósito: sem ela, quem fez
            três simulados fáceis parece melhor que quem fez quinze. */}
        <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
          {linha.simulados} simulados
        </span>
      </span>
    </div>
  );
}
