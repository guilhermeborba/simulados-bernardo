'use client';

import { useId } from 'react';
import { useLearningPreferences } from '@/contexts/LearningPreferencesContext';
import styles from './QuizCatalog.module.css';

export default function QuizPreferencesControls() {
  const id = useId();
  const { preferences, isLoading, isSaving, error, updatePreferences, reload } = useLearningPreferences();
  const disabled = isLoading || isSaving;

  return (
    <details className={styles.preferences}>
      <summary>Som e movimento</summary>
      <div className={styles.preferencesBody}>
        <p>Você escolhe como estudar. O áudio começa somente quando você pedir.</p>
        <label className={styles.toggle} htmlFor={`${id}-audio`}>
          <input id={`${id}-audio`} type="checkbox" checked={preferences.audioEnabled} disabled={disabled} onChange={(event) => { void updatePreferences({ audioEnabled: event.target.checked }).catch(() => undefined); }} />
          <span>Habilitar áudio das questões</span>
        </label>
        <label className={styles.toggle} htmlFor={`${id}-motion`}>
          <input id={`${id}-motion`} type="checkbox" checked={preferences.motionEnabled} disabled={disabled} onChange={(event) => { void updatePreferences({ motionEnabled: event.target.checked }).catch(() => undefined); }} />
          <span>Permitir animações</span>
        </label>
        <p className={styles.hint}>A preferência de reduzir movimento do seu dispositivo também é respeitada.</p>
        {isLoading && <p role="status">Carregando preferências…</p>}
        {isSaving && <p role="status">Salvando preferências…</p>}
        {error && <div role="alert"><p>{error}</p><button className={styles.textButton} type="button" disabled={disabled} onClick={() => { void reload(); }}>Recarregar preferências</button></div>}
      </div>
    </details>
  );
}
