'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AuthField, AuthLayout, FormError } from './AuthLayout';
import { Button, Icon } from './ui';
import { isOffline, requestPasswordRecovery } from '@/lib/gizAccountApi';

export default function PasswordRecovery() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const confirmation = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (sent) confirmation.current?.focus(); }, [sent]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(undefined);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError('Digite um e-mail válido.');
      document.getElementById('recovery-email')?.focus();
      return;
    }
    setFieldError(undefined);
    if (isOffline()) { setError('Você está sem conexão. Conecte-se para pedir o link.'); return; }
    setIsSubmitting(true);
    try { await requestPasswordRecovery(email.trim()); setSent(true); }
    catch (err) { setError(isOffline() || err instanceof TypeError ? 'Não foi possível conectar. Verifique sua conexão e tente de novo.' : err instanceof Error ? err.message : 'Não foi possível enviar o pedido. Tente de novo.'); }
    finally { setIsSubmitting(false); }
  }

  return <AuthLayout title="Esqueceu a senha?" subtitle="Peça um link para criar uma nova senha.">
    {sent ? <div className="account-confirmation" role="status">
      <div className="account-confirmation-icon"><Icon name="mail" size={28} /></div>
      <h2 ref={confirmation} tabIndex={-1}>Confira seu e-mail</h2>
      <p>Se o e-mail estiver cadastrado, você vai receber o link.</p>
      <p className="muted">Veja também a caixa de spam.</p>
      <Link href="/login" className="btn btn--secondary">Voltar para entrar</Link>
      <Button variant="text" type="button" onClick={() => setSent(false)}>Pedir outro link</Button>
    </div> : <form className="account-form" noValidate onSubmit={submit} aria-busy={isSubmitting}>
      <AuthField id="recovery-email" label="E-mail" type="email" inputMode="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.com" error={fieldError} />
      {error && <FormError>{error}</FormError>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enviando…' : 'Enviar link'}</Button>
    </form>}
    {!sent && <div className="account-footer"><Link href="/login" className="account-link">Voltar para entrar</Link></div>}
  </AuthLayout>;
}
