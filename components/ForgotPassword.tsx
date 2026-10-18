'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ApiError, requestPasswordRecovery } from '@/lib/apiClient';
import styles from './PasswordRecovery.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lifecycle = useRef<AbortController | null>(null);
  useEffect(() => { const controller = new AbortController(); lifecycle.current = controller; return () => controller.abort(); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const controller = lifecycle.current;
    if (pending || !controller || controller.signal.aborted) return;
    setPending(true); setError(null);
    try {
      await requestPasswordRecovery(email.trim(), controller.signal);
      if (!controller.signal.aborted) setSuccess(true);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof ApiError && cause.status === 429 ? 'Muitas solicitações. Aguarde um pouco e tente novamente.' : 'Não foi possível solicitar a recuperação agora. Tente novamente.');
    } finally { if (!controller.signal.aborted) setPending(false); }
  }
  return <main className={styles.shell}><section className={styles.card} aria-labelledby="recovery-title">
    <h1 id="recovery-title">Esqueci minha senha</h1>
    <p>Informe seu e-mail para receber um link e escolher uma nova senha.</p>
    {success ? <p className={styles.success} role="status">Se houver uma conta ativa para este e-mail, enviaremos as instruções de recuperação.</p> : <form className={styles.form} onSubmit={event => void submit(event)}>
      <label htmlFor="recovery-email">E-mail da sua conta</label><input id="recovery-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={pending} />
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" disabled={pending}>{pending ? 'Solicitando…' : 'Enviar link de recuperação'}</button>
    </form>}
    <div className={styles.footer}><Link href="/login">Voltar para entrar</Link></div>
  </section></main>;
}
