'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AuthField, AuthLayout, FormError } from './AuthLayout';
import { Button } from './ui';
import { isOffline, passwordError, resetPassword } from '@/lib/gizAccountApi';

export default function PasswordReset() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const confirmation = useRef<HTMLHeadingElement>(null);
  const tokenRead = useRef(false);
  useEffect(() => {
    if (tokenRead.current) return;
    tokenRead.current = true;
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token');
    setToken(value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null);
    // The backend sends the secret in a fragment; keep it out of history and requests.
    window.history.replaceState(null, '', window.location.pathname);
    setReady(true);
  }, []);
  useEffect(() => { if (done) confirmation.current?.focus(); }, [done]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token || isSubmitting) return;
    setError(undefined);
    const invalid = passwordError(password);
    setFieldError(invalid);
    if (invalid) { document.getElementById('reset-password')?.focus(); return; }
    if (isOffline()) { setError('Você está sem conexão. Conecte-se para alterar a senha.'); return; }
    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setPassword(''); setToken(null); setDone(true);
      try { window.sessionStorage.removeItem('giz:session-user'); } catch { /* Storage is optional. */ }
    } catch (err) { setError(isOffline() || err instanceof TypeError ? 'Não foi possível conectar. Verifique sua conexão e tente de novo.' : err instanceof Error ? err.message : 'Não foi possível alterar a senha. Tente de novo.'); }
    finally { setIsSubmitting(false); }
  }

  return <AuthLayout title="Crie uma nova senha" subtitle="Escolha uma senha com pelo menos 8 caracteres.">
    {!ready ? <p role="status">Conferindo o link…</p> : done ? <div className="account-confirmation" role="status"><h2 ref={confirmation} tabIndex={-1}>Senha alterada</h2><p>Entre com sua nova senha para continuar.</p><a href="/login" className="btn">Voltar para entrar</a></div> : token ? <form className="account-form" noValidate onSubmit={submit} aria-busy={isSubmitting}>
      <AuthField id="reset-password" label="Nova senha" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={e => setPassword(e.target.value)} error={fieldError} />
      {error && <FormError>{error}</FormError>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar nova senha'}</Button>
      <Link href="/recuperar-senha" className="account-link">Pedir outro link</Link>
    </form> : <div className="account-confirmation"><FormError>Este link é inválido ou já foi usado. Peça um novo link para recuperar sua senha.</FormError><Link href="/recuperar-senha" className="btn">Pedir novo link</Link></div>}
  </AuthLayout>;
}
