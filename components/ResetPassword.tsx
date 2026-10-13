'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ApiError, resetPassword } from '@/lib/apiClient';
import styles from './PasswordRecovery.module.css';

export default function ResetPassword() {
  const [tokenReady, setTokenReady] = useState(false);
  const [readyGeneration, setReadyGeneration] = useState(0);
  const token = useRef<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lifecycle = useRef<AbortController | null>(null);
  const captured = useRef(false);
  const linkGeneration = useRef(0);
  const requestPending = useRef(false);
  useEffect(() => {
    const captureLink = () => {
      lifecycle.current?.abort();
      lifecycle.current = new AbortController();
      const currentGeneration = ++linkGeneration.current;
      const parameters = new URLSearchParams(window.location.hash.slice(1));
      const value = parameters.get('token');
      // Same-path links may only change the hash; each new link replaces the old one.
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
      token.current = value && /^[A-Za-z0-9_-]{43}$/.test(value) && parameters.getAll('token').length === 1 ? value : null;
      requestPending.current = false;
      setPassword(''); setConfirmation(''); setPending(false); setSuccess(false); setError(null);
      setReadyGeneration(currentGeneration); setTokenReady(true);
    };
    if (!captured.current) {
      captured.current = true;
      captureLink();
    } else {
      // StrictMode repeats effect setup after cleanup, after the initial hash is gone.
      lifecycle.current = new AbortController();
    }
    window.addEventListener('hashchange', captureLink);
    return () => {
      window.removeEventListener('hashchange', captureLink);
      lifecycle.current?.abort();
    };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const controller = lifecycle.current;
    const currentGeneration = linkGeneration.current;
    const activeToken = token.current;
    if (requestPending.current || pending || !activeToken || !controller || controller.signal.aborted || readyGeneration !== currentGeneration) return;
    const isCurrent = () => !controller.signal.aborted && currentGeneration === linkGeneration.current;
    setError(null);
    const bytes = new TextEncoder().encode(password).length;
    if (Array.from(password).length < 8 || bytes > 72) { setError('A nova senha precisa ter pelo menos 8 caracteres e até 72 bytes.'); return; }
    if (password !== confirmation) { setError('A confirmação precisa ser igual à nova senha.'); return; }
    requestPending.current = true; setPending(true);
    try {
      await resetPassword(activeToken, password, controller.signal);
      if (isCurrent()) { token.current = null; setPassword(''); setConfirmation(''); setSuccess(true); }
    } catch (cause) {
      if (isCurrent()) setError(cause instanceof ApiError && cause.status === 400 ? 'Este link é inválido, expirou ou já foi usado. Solicite outro link de recuperação.' : cause instanceof ApiError && cause.status === 429 ? 'Muitas tentativas. Aguarde um pouco e tente novamente.' : 'Não foi possível alterar a senha agora. Tente novamente.');
    } finally { if (isCurrent()) { requestPending.current = false; setPending(false); } }
  }
  return <main className={styles.shell}><section className={styles.card} aria-labelledby="reset-title">
    <h1 id="reset-title">Redefinir minha senha</h1>
    {!tokenReady ? <p role="status">Preparando recuperação…</p> : success ? <p className={styles.success} role="status">Senha alterada. Entre na sua conta com a nova senha.</p> : !token.current ? <p className={styles.error} role="alert">Abra o link completo recebido por e-mail para redefinir a senha. Se ele não estiver disponível, solicite outro link.</p> : <>
      <p>Escolha uma nova senha. O link pode ser usado uma única vez.</p>
      <form className={styles.form} onSubmit={event => void submit(event)}>
        <label htmlFor="new-password">Nova senha</label><input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} disabled={pending} aria-describedby="password-hint" />
        <p id="password-hint" className={styles.hint}>Use pelo menos 8 caracteres. Para senhas com acentos ou emojis, o limite de 72 bytes pode corresponder a menos de 72 caracteres.</p>
        <label htmlFor="password-confirmation">Confirmar nova senha</label><input id="password-confirmation" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={pending} />
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>
    </>}
    <div className={styles.footer}><Link href="/login">Entrar na minha conta</Link>{!success && <Link href="/esqueci-senha">Solicitar outro link</Link>}</div>
  </section></main>;
}
