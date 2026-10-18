'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLearningPreferences } from '@/contexts/LearningPreferencesContext';
import { ApiError, getLearningHome, getMyAchievements, getMyAvatar, updateMyAvatar, type ApiAvatarSelection, type ApiMyAchievements, type ApiMyAvatar, type AvatarStyle } from '@/lib/apiClient';
import { quizSegmentForYear, quizTierForPreferences, type QuizSegment } from '@/lib/quiz-segments';
import AvatarPreview, { CollectionMark } from './AvatarPreview';
import QuizNavigation from './QuizNavigation';
import styles from './LearningCollection.module.css';

export default function LearningCollection() {
  const { user, isLoading, getSessionGeneration } = useAuth();
  if (isLoading) return <div className={styles.shell}><p role="status">Carregando sua conta…</p></div>;
  if (!user || user.role !== 'STUDENT') return <div className={styles.shell}><QuizNavigation current="collection" /><main className={styles.main}><h1>Minha coleção</h1><p>Itens e conquistas estão disponíveis para contas de aluno.</p><Link className={styles.link} href={user ? '/' : '/login?returnTo=/colecao'}>{user ? 'Voltar para o início' : 'Entrar na minha conta'} →</Link></main></div>;
  // A session change discards saved values, drafts, pending writes and messages together.
  return <StudentCollection key={`${user.id}:${getSessionGeneration()}`} />;
}

interface CollectionData { avatar: ApiMyAvatar; achievements: ApiMyAchievements; profileYear: number | null }

function StudentCollection() {
  const { getSessionGeneration } = useAuth();
  const { preferences, isLoading: preferencesLoading, error: preferencesError, reload: reloadPreferences } = useLearningPreferences();
  const [data, setData] = useState<CollectionData | null>(null);
  const [draft, setDraft] = useState<ApiAvatarSelection>({ itemId: 'inicio', style: 'AUTO' });
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const lifecycle = useRef<AbortController | null>(null);
  const savePending = useRef(false);

  useEffect(() => {
    if (preferencesLoading || preferencesError) return;
    const controller = new AbortController();
    lifecycle.current = controller;
    const generation = getSessionGeneration();
    setData(null); setError(null); setSaveError(null); setSaved(false);
    void Promise.all([
      getMyAvatar(controller.signal),
      getMyAchievements(controller.signal),
      preferences.schoolYear === null ? getLearningHome(undefined, controller.signal) : Promise.resolve(null),
    ]).then(([avatar, achievements, home]) => {
      if (controller.signal.aborted || generation !== getSessionGeneration()) return;
      setData({ avatar, achievements, profileYear: home?.schoolYear ?? null });
      setDraft(avatar.selection);
    }).catch(cause => {
      if (controller.signal.aborted || generation !== getSessionGeneration()) return;
      setError(cause instanceof ApiError && cause.status === 401 ? 'Sua sessão expirou. Entre novamente para ver sua coleção.' : 'Não foi possível carregar sua coleção. Tente novamente.');
    });
    return () => controller.abort();
  }, [preferencesLoading, preferencesError, preferences.schoolYear, retry, getSessionGeneration]);

  const effectiveYear = preferences.schoolYear ?? data?.profileYear ?? null;
  const segment: QuizSegment | null = effectiveYear === null ? preferences.segment : quizSegmentForYear(effectiveYear);
  const tier = quizTierForPreferences({ ...preferences, schoolYear: effectiveYear, segment });
  const playful = segment === 'INFANTIL' || segment === 'FUNDAMENTAL_I';
  const infant = segment === 'INFANTIL';
  const changed = data && (draft.itemId !== data.avatar.selection.itemId || draft.style !== data.avatar.selection.style);
  const selectedItem = data?.avatar.items.find(item => item.id === draft.itemId);
  const updateDraft = (patch: Partial<ApiAvatarSelection>) => { setDraft(value => ({ ...value, ...patch })); setSaved(false); setSaveError(null); };

  async function save(event: FormEvent) {
    event.preventDefault();
    const controller = lifecycle.current;
    if (!data || !changed || saving || savePending.current || !selectedItem?.owned || !controller || controller.signal.aborted) return;
    const generation = getSessionGeneration();
    savePending.current = true; setSaving(true); setSaved(false); setSaveError(null);
    try {
      const avatar = await updateMyAvatar(draft, controller.signal);
      if (controller.signal.aborted || generation !== getSessionGeneration()) return;
      setData(current => current ? { ...current, avatar } : null);
      setDraft(avatar.selection); setSaved(true);
    } catch (cause) {
      if (controller.signal.aborted || generation !== getSessionGeneration()) return;
      setSaveError(cause instanceof ApiError && cause.status === 401 ? 'Sua sessão expirou. Entre novamente para salvar sua personalização.' : cause instanceof ApiError && cause.status === 403 ? 'Este item ainda não está disponível na sua conta. Recarregue a coleção.' : 'Não foi possível salvar sua personalização. Sua escolha foi mantida para tentar novamente.');
    } finally {
      savePending.current = false;
      if (!controller.signal.aborted && generation === getSessionGeneration()) setSaving(false);
    }
  }

  return <div className={styles.shell} data-tier={tier} data-reduced-motion={!preferences.motionEnabled || undefined}>
    <QuizNavigation current="collection" />
    <main className={styles.main}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{infant ? 'Pequenas descobertas, lembranças para guardar' : 'Sua prática, do seu jeito'}</p>
        <h1>{playful ? 'Minha coleção' : 'Coleções e progresso'}</h1>
        <p>{infant ? 'O Bolinha guarda com você as descobertas de cada quiz. Escolha um item para acompanhar suas brincadeiras.' : 'Veja os marcos da sua prática e escolha como apresentar sua coleção.'}</p>
        <p className={styles.pace}>Os itens ficam na sua conta. Você pode fazer uma pausa e voltar quando quiser.</p>
      </header>
      {preferencesError ? <div className={styles.error} role="alert"><p>{preferencesError}</p><button className={styles.secondary} type="button" disabled={preferencesLoading} onClick={() => void reloadPreferences()}>Recarregar preferências</button></div>
        : error ? <div className={styles.error} role="alert"><p>{error}</p><button className={styles.secondary} type="button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button><Link href="/login?returnTo=/colecao">Entrar novamente</Link></div>
        : !data || preferencesLoading ? <p className={styles.loading} role="status">Carregando itens e conquistas…</p>
        : <>
          <section className={styles.personalization} aria-labelledby="collection-personalization-title">
            <div className={styles.sectionHeading}><h2 id="collection-personalization-title">Sua personalização</h2><p>Escolha um item disponível e salve para usar em outros dispositivos.</p></div>
            <form onSubmit={event => void save(event)}>
              <div className={styles.presentation}>
                <figure className={styles.preview}>
                  <AvatarPreview selection={draft} segment={segment} itemTitle={selectedItem?.title ?? 'Início'} />
                  <figcaption>{changed ? 'Prévia da sua escolha · ainda não salva' : 'Personalização salva'}<strong>{selectedItem?.title}</strong></figcaption>
                </figure>
                <div className={styles.presentationControls}>
                  <label className={styles.styleField}>Estilo de apresentação
                    <select value={draft.style} disabled={saving} onChange={event => updateDraft({ style: event.target.value as AvatarStyle })}>
                      <option value="AUTO">Automática para minha faixa</option>
                      <option value="MASCOT">Mascote</option>
                      <option value="SEAL">Selo de progresso</option>
                    </select>
                  </label>
                  <p className={styles.hint}>A apresentação automática usa Bolinha na Educação Infantil, Capelo no Fundamental I e selos nas outras faixas. Você pode escolher qualquer estilo.</p>
                  <p className={styles.hint}>Sua faixa acompanha a escolha em Aprender hoje ou o ano do seu cadastro. <Link href="/aprender">Alterar minha faixa →</Link></p>
                </div>
              </div>
              <fieldset className={styles.itemFieldset} disabled={saving}>
                <legend><h3>Itens da coleção</h3></legend>
                <div className={styles.items}>{data.avatar.items.map(item => {
                  const achievement = data.achievements.achievements.find(value => value.id === item.achievementId);
                  return <label className={styles.itemCard} key={item.id} data-owned={item.owned} data-selected={draft.itemId === item.id}>
                    <input type="radio" name="collection-item" value={item.id} checked={draft.itemId === item.id} disabled={!item.owned || saving} onChange={() => updateDraft({ itemId: item.id })} aria-label={item.title} />
                    <div className={styles.itemMark}><CollectionMark itemId={item.id} /></div>
                    <strong>{item.title}</strong><span className={styles.itemDescription}>{item.description}</span>
                    <span className={styles.itemStatus}>{item.owned ? draft.itemId === item.id ? '✓ Selecionado' : 'Disponível' : 'A desbloquear'}</span>
                    {!item.owned && achievement && <span className={styles.itemCriterion}>{achievement.description}</span>}
                  </label>;
                })}</div>
              </fieldset>
              <div className={styles.saveRow}><button className={styles.primary} type="submit" disabled={!changed || saving || !selectedItem?.owned}>{saving ? 'Salvando personalização…' : 'Salvar personalização'}</button><p className={styles.hint}>Itens são visuais e são liberados pela prática. Não há compras.</p></div>
              {saved && <p className={styles.saved} role="status">Personalização salva na sua conta.</p>}
              {saveError && <div className={styles.error} role="alert"><p>{saveError}</p></div>}
            </form>
          </section>
          <section className={styles.achievements} aria-labelledby="collection-achievements-title">
            <div className={styles.sectionHeading}><h2 id="collection-achievements-title">Suas conquistas</h2><p>Conclusões e variedade de temas registram sua prática, independentemente dos acertos.</p></div>
            <dl className={styles.stats}><div><dt>Quizzes diferentes concluídos</dt><dd>{data.achievements.stats.completedQuizzes}</dd></div><div><dt>Temas explorados</dt><dd>{data.achievements.stats.topics}</dd></div><div><dt>Missões concluídas</dt><dd>{data.achievements.stats.completedMissions}</dd></div><div><dt>XP acumulado</dt><dd>{data.achievements.stats.totalXp.toLocaleString('pt-BR')}</dd></div></dl>
            <div className={styles.achievementGrid}>{data.achievements.achievements.map(achievement => {
              const itemId = data.avatar.items.find(item => item.achievementId === achievement.id)?.id ?? 'inicio';
              return <article className={styles.achievementCard} key={achievement.id} data-earned={Boolean(achievement.earnedAt)} aria-labelledby={`achievement-${achievement.id}`}>
                <div className={styles.achievementMark}><CollectionMark itemId={itemId} /></div>
                <div><span className={styles.achievementStatus}>{achievement.earnedAt ? '✓ Conquistada' : 'No seu ritmo'}</span><h3 id={`achievement-${achievement.id}`}>{achievement.title}</h3><p>{achievement.description}</p>
                  {achievement.earnedAt ? <p className={styles.earnedDate}>Registrada em {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(achievement.earnedAt))}</p> : <div className={styles.achievementProgress}><span>{Math.min(achievement.progress, achievement.target)} de {achievement.target}</span><progress value={Math.min(achievement.progress, achievement.target)} max={achievement.target} aria-label={`Progresso da conquista: ${achievement.title}`} /></div>}
                </div>
              </article>;
            })}</div>
          </section>
          <footer className={styles.footer}><p>Seu progresso e seus itens ficam guardados. A personalização não altera notas nem o XP.</p><Link className={styles.link} href="/aprender">Voltar para Aprender hoje →</Link></footer>
        </>}
    </main>
  </div>;
}
