'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getMyAchievements, getMyAvatar, type ApiMyAchievements, type ApiMyAvatar } from '@/lib/apiClient';
import type { QuizSegment } from '@/lib/quiz-segments';
import AvatarPreview from './AvatarPreview';
import styles from './LearningCollection.module.css';

export default function LearningCollectionSummary({ segment }: { segment: QuizSegment | null }) {
  const { getSessionGeneration } = useAuth();
  const [data, setData] = useState<{ avatar: ApiMyAvatar; achievements: ApiMyAchievements } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const generation = getSessionGeneration();
    void Promise.all([getMyAvatar(controller.signal), getMyAchievements(controller.signal)]).then(([avatar, achievements]) => {
      if (!controller.signal.aborted && generation === getSessionGeneration()) setData({ avatar, achievements });
    }).catch(() => { if (!controller.signal.aborted && generation === getSessionGeneration()) setFailed(true); });
    return () => controller.abort();
  }, [getSessionGeneration]);
  const earned = data?.achievements.achievements.filter(achievement => achievement.earnedAt).length ?? 0;
  const owned = data?.avatar.items.filter(item => item.owned).length ?? 0;
  const selectedItem = data?.avatar.items.find(item => item.id === data.avatar.selection.itemId);
  return <section className={styles.summary} aria-labelledby="learning-collection-title">
    <div className={styles.summaryBody}><h3 id="learning-collection-title">{segment === 'INFANTIL' || segment === 'FUNDAMENTAL_I' ? 'Minha coleção' : 'Coleções e progresso'}</h3>
      <p>{data ? `${earned} ${earned === 1 ? 'conquista registrada' : 'conquistas registradas'} · ${owned} ${owned === 1 ? 'item disponível' : 'itens disponíveis'}. Escolha sua personalização.` : failed ? 'Sua coleção pode ser consultada na página de itens e conquistas.' : 'Seus itens e conquistas acompanham sua prática.'}</p>
      <Link href="/colecao" className={styles.link}>Ver minha coleção →</Link></div>
    {data && selectedItem && <AvatarPreview selection={data.avatar.selection} segment={segment} itemTitle={selectedItem.title} compact />}
  </section>;
}
