'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getMinhaPontuacao, type ApiMinhaPontuacao } from '@/lib/apiClient';
import { AccountApiError, getAchievements, isOffline, type Achievement } from '@/lib/gizAccountApi';
import { getTheme, getTimerDefault, setTheme, setTimerDefault, type ThemePreference } from '@/lib/gizPreferences';
import { lerTrilhaSalva } from '@/lib/trilha';
import { AppShell, Badge, Button, Icon, Progress, ScreenState, Tuca } from './ui';
import './account.css';

export default function Profile() {
  const { user, isLoading, logout } = useAuth();
  const userId = user?.id;
  const [theme, updateTheme] = useState<ThemePreference>('auto');
  const [timer, updateTimer] = useState(true);
  const [track, setTrack] = useState('Giz Kids');
  const [notice, setNotice] = useState<string>();
  const [points, setPoints] = useState<ApiMinhaPontuacao | null>(null);
  const [pointsFailed, setPointsFailed] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementState, setAchievementState] = useState<'loading' | 'ready' | 'soon' | 'error' | 'offline'>('loading');
  const [reload, setReload] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    updateTheme(getTheme());
    updateTimer(getTimerDefault());
    const savedTrack = lerTrilhaSalva();
    if (savedTrack === 'tecnico') setTrack('Cursos Técnicos');
    else if (savedTrack === 'infantil') setTrack('Educação Infantil');
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setAchievementState('loading');
    setPoints(null);
    setPointsFailed(false);
    Promise.allSettled([getAchievements(), getMinhaPontuacao()]).then(([collection, score]) => {
      if (!active) return;
      if (collection.status === 'fulfilled') {
        setAchievements(collection.value.achievements);
        setAchievementState('ready');
      } else {
        const reason = collection.reason;
        setAchievementState(reason instanceof AccountApiError && [403, 404, 501].includes(reason.status) ? 'soon' : isOffline() || reason instanceof TypeError ? 'offline' : 'error');
      }
      if (score.status === 'fulfilled') setPoints(score.value);
      else setPointsFailed(true);
    });
    return () => { active = false; };
  }, [userId, reload]);

  async function signOut() {
    if (isOffline()) { setNotice('Conecte-se para sair da conta.'); return; }
    setSigningOut(true);
    try { await logout(); }
    catch { /* The BFF always clears local auth cookies; navigation refreshes the session. */ }
    finally {
      try { window.sessionStorage.removeItem('giz:session-user'); } catch { /* Storage is optional. */ }
      window.location.assign('/login');
    }
  }

  function changeTheme(value: ThemePreference) {
    updateTheme(value);
    const saved = setTheme(value);
    setNotice(saved ? 'Tema salvo neste aparelho.' : 'Tema aplicado nesta visita. Este navegador não permite salvar preferências.');
  }
  function changeTimer(value: boolean) {
    const saved = setTimerDefault(value);
    updateTimer(value);
    setNotice(saved ? 'Preferência de cronômetro salva neste aparelho.' : 'Preferência aplicada nesta visita. Este navegador não permite salvar preferências.');
  }

  return <AppShell title="Eu" subtitle="Seu caminho de aprendizagem.">
    {isLoading ? <ScreenState kind="loading" /> : !user ? <ScreenState kind="empty" title="Seu espaço no Giz" message="Entre para ver seu perfil, suas conquistas e suas preferências." action={<Link href="/login?returnTo=%2Feu" className="btn">Entrar</Link>} /> : <div className="account-profile-grid">
      <div className="stack">
        <section className="card" aria-label="Seu perfil">
          <div className="account-identity"><div className="account-avatar" aria-hidden="true">{Array.from(user.name.trim())[0]?.toLocaleUpperCase('pt-BR') || '?'}</div><div><h2>{user.name}</h2><p>{track}</p></div>{track === 'Giz Kids' && <Tuca pose="trofeu" size={96} priority />}</div>
          {points ? <dl className="account-stats"><div className="account-stat"><dt>Simulados</dt><dd><strong>{points.simulados}</strong></dd></div><div className="account-stat"><dt>Média</dt><dd><strong>{Math.round(points.media)}%</strong></dd></div><div className="account-stat"><dt>Sequência</dt><dd><strong>{points.diasSeguidos} {points.diasSeguidos === 1 ? 'dia' : 'dias'}</strong></dd></div></dl> : pointsFailed ? <p className="muted">Não foi possível carregar seu resumo. <button type="button" className="account-link" onClick={() => setReload(n => n + 1)}>Tentar de novo</button></p> : <p role="status" className="muted">Carregando seu resumo…</p>}
        </section>
        <section className="card account-settings" aria-labelledby="settings-heading">
          <h2 id="settings-heading">Do seu jeito</h2>
          <div className="account-setting"><label htmlFor="profile-theme">Tema</label><select id="profile-theme" value={theme} onChange={event => changeTheme(event.target.value as ThemePreference)}><option value="light">Claro</option><option value="dark">Escuro</option><option value="auto">Automático</option></select></div>
          <div className="account-setting"><label htmlFor="profile-timer">Cronômetro por padrão</label><input id="profile-timer" type="checkbox" role="switch" className="account-toggle" checked={timer} onChange={event => changeTimer(event.target.checked)} /></div>
          <div className="account-setting"><Link href="/historico"><Icon name="clock" />Histórico</Link><Icon name="back" /></div>
          <div className="account-setting"><Link href="/pais">Painel dos pais</Link><Badge tone="soon">Em breve</Badge></div>
          {notice && <p role="status" className="muted">{notice}</p>}
          <Button type="button" variant="secondary" onClick={signOut} disabled={signingOut}>{signingOut ? 'Saindo…' : 'Sair da conta'}</Button>
        </section>
      </div>
      <section className="card" aria-labelledby="achievements-heading">
        <h2 id="achievements-heading">Conquistas</h2>
        {achievementState === 'loading' ? <ScreenState kind="loading" /> : achievementState === 'soon' ? <div className="stack account-achievement-placeholder"><Badge tone="soon">Em breve</Badge><p>As conquistas ainda não estão disponíveis para esta conta.</p></div> : achievementState === 'error' || achievementState === 'offline' ? <ScreenState kind={achievementState} title="Suas conquistas estão guardadas" message={achievementState === 'offline' ? 'Conecte-se para ver seu progresso.' : 'Não foi possível carregar agora.'} action={<Button variant="secondary" onClick={() => setReload(n => n + 1)}>Tentar de novo</Button>} /> : achievements.length === 0 ? <ScreenState kind="empty" title="Seu caminho começa aqui" message="Quando suas conquistas estiverem disponíveis, elas aparecem aqui." action={<Link href="/simulados" className="btn">Escolher um simulado</Link>} /> : <>
          <p className="muted account-achievement-summary">{achievements.filter(item => item.earnedAt).length} de {achievements.length} conquistadas.</p>
          <div className="account-achievements">{achievements.map(item => <article key={item.id} className={`account-achievement ${item.earnedAt ? '' : 'account-achievement--locked'}`}>
            <div className="account-achievement-icon"><Icon name={item.earnedAt ? 'cup' : 'lock'} size={28} /></div><h3>{item.title}</h3><p>{item.description}</p>
            {item.earnedAt ? <Badge tone="ok">Conquistada</Badge> : <><p className="muted">Faltam {Math.max(0, item.target - item.progress)} para ganhar</p><Progress value={item.progress} max={item.target} /></>}
          </article>)}</div>
        </>}
      </section>
    </div>}
  </AppShell>;
}
