'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { isOffline, safeReturnTo } from '@/lib/gizAccountApi';
import { AuthField, AuthLayout, FormError } from '@/components/giz/AuthLayout';
import { Button } from '@/components/giz/ui';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const [completed, setCompleted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fields, setFields] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const registerHref = returnTo ? `/registro?returnTo=${encodeURIComponent(returnTo)}` : '/registro';

  useEffect(() => {
    if (!completed || !user) return;
    const destination = returnTo || (['GUARDIAN', 'TEACHER', 'ADMIN'].includes(user.role) ? '/acompanhamento' : '/');
    router.push(destination);
  }, [completed, user, returnTo, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    const errors = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? undefined : 'Digite um e-mail válido.',
      password: password ? undefined : 'Digite sua senha.',
    };
    setFields(errors);
    if (errors.email || errors.password) {
      document.getElementById(errors.email ? 'login-email' : 'login-password')?.focus();
      return;
    }
    if (isOffline()) { setError('Você está sem conexão. Conecte-se para entrar.'); return; }
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      setCompleted(true);
    } catch (err) {
      setError(isOffline() || err instanceof TypeError ? 'Não foi possível conectar. Verifique sua conexão e tente de novo.' : err instanceof Error && /credentials|credenciais|senha|unauthorized/i.test(err.message) ? 'E-mail ou senha não conferem. Tente de novo.' : 'Não foi possível entrar agora. Tente de novo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Bem-vindo de volta" subtitle="Entre para continuar de onde parou." mode="login" registerHref={registerHref}>
      <form className="account-form" noValidate onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <AuthField id="login-email" label="E-mail" type="email" autoComplete="email" inputMode="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.com" error={fields.email} required />
        <AuthField id="login-password" label="Senha" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" error={fields.password} required />
        <div className="account-forgot"><Link href="/recuperar-senha" className="account-link">Esqueci a senha</Link></div>
        {error && <FormError>{error}</FormError>}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Entrando…' : 'Entrar'}</Button>
      </form>
    </AuthLayout>
  );
}
