'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { bloquearTrocaDeTrilha, salvarTrilha } from '@/lib/trilha';
import { isOffline, passwordError, safeReturnTo } from '@/lib/gizAccountApi';
import { AuthField, AuthLayout, FormError } from '@/components/giz/AuthLayout';
import { Button } from '@/components/giz/ui';

interface RegisterFormProps { inviteToken?: string; }

export default function RegisterForm({ inviteToken }: RegisterFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const returnInvite = returnTo?.startsWith('/convite?') ? new URL(returnTo, 'https://giz.invalid').searchParams.get('t') : null;
  const token = inviteToken ?? searchParams.get('convite') ?? returnInvite ?? undefined;
  const loginHref = token ? `/login?returnTo=${encodeURIComponent(`/convite?t=${encodeURIComponent(token)}`)}` : returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fields, setFields] = useState<{ name?: string; email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    const errors = {
      name: name.trim().length >= 2 ? undefined : 'Conte como podemos chamar você (pelo menos 2 letras).',
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? undefined : 'Digite um e-mail válido.',
      password: passwordError(password),
    };
    setFields(errors);
    const firstInvalid = errors.name ? 'register-name' : errors.email ? 'register-email' : errors.password ? 'register-password' : null;
    if (firstInvalid) { document.getElementById(firstInvalid)?.focus(); return; }
    if (isOffline()) { setError('Você está sem conexão. Conecte-se para criar a conta.'); return; }
    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password, token);
      if (token) { salvarTrilha('basica'); bloquearTrocaDeTrilha(); }
      router.push(token ? '/' : (returnTo || '/trilha'));
    } catch (err) {
      setError(isOffline() || err instanceof TypeError ? 'Não foi possível conectar. Verifique sua conexão e tente de novo.' : err instanceof Error ? err.message : 'Não foi possível criar a conta. Tente de novo.');
    } finally { setIsSubmitting(false); }
  }

  return (
    <AuthLayout title="Crie sua conta" subtitle="Vamos aprender um pouco a cada tentativa." mode="register" loginHref={loginHref}>
      {token && <p className="account-note">Você está entrando por um convite de turma. Ao criar a conta, os simulados da turma aparecem para você.</p>}
      <form className="account-form" noValidate onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <AuthField id="register-name" label="Seu nome" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Como podemos chamar você?" error={fields.name} required minLength={2} maxLength={120} />
        <AuthField id="register-email" label="E-mail" type="email" autoComplete="email" inputMode="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.com" error={fields.email} required />
        <AuthField id="register-password" label="Senha" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Pelo menos 8 caracteres" error={fields.password} required minLength={8} maxLength={72} />
        {error && <FormError>{error}</FormError>}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Criando conta…' : 'Criar conta'}</Button>
      </form>
    </AuthLayout>
  );
}
