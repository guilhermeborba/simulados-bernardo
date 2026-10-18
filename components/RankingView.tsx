'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMinhaPontuacao, getMyTurmas, getRankingDaTurma, ApiLinhaDoRanking, ApiMinhaPontuacao, ApiRanking, ApiTurma } from '@/lib/apiClient';
import { AppShell, Badge, Button, Icon, ScreenState, Tuca } from '@/components/giz/ui';
import '@/components/giz/tracking.css';

/** Nomes de colegas nunca devem revelar sobrenomes completos ou e-mails. */
function publicName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length || name.includes('@')) return 'Estudante';
  return words.length > 1 ? `${words[0]} ${Array.from(words[words.length - 1])[0]}.` : words[0];
}

export default function RankingView() {
  const router = useRouter();
  const { user, isLoading: sessionLoading } = useAuth();
  const [score, setScore] = useState<ApiMinhaPontuacao | null>(null);
  const [classes, setClasses] = useState<ApiTurma[]>([]);
  const [classId, setClassId] = useState('');
  const [ranking, setRanking] = useState<ApiRanking | null>(null);
  const [scope, setScope] = useState<'class' | 'general'>('class');
  const [isLoading, setIsLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [failure, setFailure] = useState<'error' | 'offline' | null>(null);
  const [rankingFailure, setRankingFailure] = useState<'error' | 'offline' | null>(null);
  const [retry, setRetry] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    setFailure(null);
    try {
      const [myScore, myClasses] = await Promise.all([getMinhaPontuacao(), getMyTurmas()]);
      setScore(myScore);
      setClasses(myClasses);
      setClassId((current) => myClasses.some((item) => item.id === current) ? current : myClasses[0]?.id ?? '');
    } catch {
      setFailure(navigator.onLine ? 'error' : 'offline');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      router.replace(`/login?returnTo=${encodeURIComponent('/ranking')}`);
      return;
    }
    void load();
  }, [sessionLoading, user, router, load]);

  useEffect(() => {
    if (!classId || !user) return;
    let active = true;
    setRanking(null);
    setRankingLoading(true);
    setRankingFailure(null);
    getRankingDaTurma(classId)
      .then((value) => { if (active) setRanking(value); })
      .catch(() => { if (active) setRankingFailure(navigator.onLine ? 'error' : 'offline'); })
      .finally(() => { if (active) setRankingLoading(false); });
    return () => { active = false; };
  }, [classId, user, retry]);

  return <AppShell title="Ranking" subtitle="Cada simulado é uma chance de aprender um pouco mais.">
    {(sessionLoading || isLoading || !user) && !failure && <ScreenState kind="loading" title="Buscando sua pontuação…" />}
    {failure && <ScreenState kind={failure} message="Não foi possível carregar sua pontuação." action={<Button onClick={() => void load()}>Tentar de novo</Button>} />}
    {!sessionLoading && !isLoading && !failure && user && <div className="stack">
      <div className="tracking-ranking-tools">
        <div className="tracking-tabs" role="group" aria-label="Quem aparece no ranking">
          <button type="button" aria-pressed={scope === 'class'} onClick={() => setScope('class')}>Minha turma</button>
          <button type="button" aria-pressed={scope === 'general'} onClick={() => setScope('general')}>Geral <Badge tone="soon">Em breve</Badge></button>
        </div>
        {scope === 'class' && classes.length > 1 && <div className="tracking-order"><label htmlFor="ranking-class">Turma</label><select id="ranking-class" value={classId} onChange={(event) => setClassId(event.target.value)}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
      </div>
      {scope === 'general' ? <section className="card tracking-soon"><Image priority unoptimized style={{ width: 160, height: 'auto' }} src="/giz/ilustracoes/em-breve.svg" alt="" width={220} height={170} /><Badge tone="soon">Em breve</Badge><h2>O ranking geral vem depois</h2><p className="muted">Por enquanto, acompanhe sua evolução e o ranking da sua turma.</p><Button variant="secondary" onClick={() => setScope('class')}>Ver minha turma</Button></section> : <>
        {rankingLoading && <ScreenState kind="loading" title="Buscando o ranking da turma…" />}
        {rankingFailure && <ScreenState kind={rankingFailure} message="Não foi possível carregar o ranking desta turma." action={<Button onClick={() => setRetry((value) => value + 1)}>Tentar de novo</Button>} />}
        {!rankingLoading && !rankingFailure && classes.length === 0 && <ScreenState kind="empty" title="O ranking é entre colegas da mesma turma" message="Você ainda não está em uma turma. Se recebeu um link de convite, abra o link para entrar. Enquanto isso, continue suas descobertas." action={<Link href="/simulados" className="btn">Escolher um simulado</Link>} />}
        {!rankingLoading && !rankingFailure && classId && !ranking && <ScreenState kind="empty" title="Ainda não há dados desta turma" message="Conclua um simulado para começar a acompanhar sua evolução." action={<Link href="/simulados" className="btn">Escolher um simulado</Link>} />}
        {!rankingLoading && !rankingFailure && ranking && <RankingClass ranking={ranking} score={score} />}
      </>}
      {score && (!ranking || scope === 'general' || rankingLoading || rankingFailure) && <MyScore score={score} />}
    </div>}
  </AppShell>;
}

function MyScore({ score }: { score: ApiMinhaPontuacao }) {
  return <section className="card stack tracking-my-score">
    <h2>Seus números</h2>
    <p className="muted">Todos os seus simulados, de todas as trilhas.</p>
    <div className="tracking-summary"><ScoreStat value={`${score.media}%`} label="Média geral" /><ScoreStat value={String(score.simulados)} label="Simulados feitos" /><ScoreStat value={String(score.diasSeguidos)} label="Dias seguidos" /></div>
    {score.melhorSimulado && <div className="tracking-best"><Icon name="spark" /><div><strong>Seu melhor: {score.melhorSimulado.percentage}% em {score.melhorSimulado.disciplina}</strong><p className="muted">{score.melhorSimulado.titulo}</p></div></div>}
  </section>;
}

function ScoreStat({ value, label }: { value: string; label: string }) {
  return <div className="tracking-stat"><span>{label}</span><strong>{value}</strong></div>;
}

function RankingClass({ ranking, score }: { ranking: ApiRanking; score: ApiMinhaPontuacao | null }) {
  const podium = [...ranking.podio].sort((a, b) => a.posicao - b.posicao);
  const nearby = ranking.vizinhanca.filter((line) => !podium.some((item) => item.posicao === line.posicao && item.nome === line.nome));
  return <div className="tracking-ranking-layout">
    <div className="stack">
      <section className="card stack">
        <div className="cluster tracking-ranking-title"><div><h2>{ranking.turma.name}</h2><p className="muted">Sua melhor tentativa de cada simulado forma a média da turma.</p></div><Tuca pose="medalha" size={96} /></div>
        {podium.length ? <ol className="tracking-podium" aria-label="Primeiras posições da turma">{podium.map((line, index) => <li key={`${line.posicao}-${index}`} className={`tracking-podium-person tracking-podium-person--${line.posicao}${line.ehVoce ? ' tracking-podium-person--me' : ''}`}><span className="tracking-avatar" aria-hidden="true">{publicName(line.nome).charAt(0)}</span><strong>{publicName(line.nome)}{line.ehVoce ? ' (você)' : ''}</strong><span className="muted">{line.media}% · {line.simulados} simulados</span><span className="tracking-podium-block">{line.posicao}º<span className="sr-only"> lugar</span></span></li>)}</ol> : <div className="tracking-ranking-empty"><Image unoptimized style={{ width: 160, height: 'auto' }} src="/giz/ilustracoes/podio.svg" alt="" width={220} height={170} /><h3>A turma está começando</h3><p className="muted">Ninguém completou os simulados necessários para entrar no ranking ainda.</p></div>}
        <p className="muted tracking-ranking-rule">{ranking.totalClassificados} {ranking.totalClassificados === 1 ? 'estudante no ranking' : 'estudantes no ranking'} · participação a partir de {ranking.minimoDeSimulados} simulados desta turma.</p>
      </section>
      {nearby.length > 0 && <section className="card tracking-nearby"><h2>Perto de você</h2><ol aria-label="Posições próximas da sua">{nearby.map((line, index) => <RankingLine key={`${line.posicao}-${index}`} line={line} />)}</ol></section>}
      {ranking.minhaPosicao === null && <section className="tracking-ranking-invitation"><Icon name="bulb" /><div><h3>Seu lugar está esperando por você</h3><p>{ranking.faltamParaORanking === 1 ? 'Falta 1 simulado' : `Faltam ${ranking.faltamParaORanking} simulados`} desta turma para você entrar no ranking. Dá para refazer e melhorar: só a melhor tentativa de cada simulado conta.</p><Link className="btn" href="/simulados">Escolher um simulado</Link></div></section>}
    </div>
    <aside className="stack">
      {ranking.minhaPosicao && <section className="tracking-position"><span>Sua posição na turma</span><strong>{ranking.minhaPosicao.posicao}º</strong><span>{ranking.minhaPosicao.media}% de média</span><span>{ranking.minhaPosicao.simulados} simulados</span></section>}
      {score && <MyScore score={score} />}
    </aside>
  </div>;
}

function RankingLine({ line }: { line: ApiLinhaDoRanking }) {
  return <li className={`tracking-ranking-line${line.ehVoce ? ' tracking-ranking-line--me' : ''}`}>
    <strong className="tracking-ranking-number">{line.posicao}º</strong><span className="tracking-avatar" aria-hidden="true">{publicName(line.nome).charAt(0)}</span><span className="tracking-ranking-name">{publicName(line.nome)}{line.ehVoce ? ' (você)' : ''}</span><span className="tracking-ranking-score"><strong>{line.media}%</strong><span className="muted">{line.simulados} simulados</span></span>
  </li>;
}
