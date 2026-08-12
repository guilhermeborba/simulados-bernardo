'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push(searchParams.get('returnTo') || '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="card card--hero">
          <h1 className="text-3xl mb-6 text-center">📚 Entrar</h1>

          <form onSubmit={handleSubmit}>
            <label className="block text-left text-sm font-bold mb-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="input-field mb-4"
              required
            />

            <label className="block text-left text-sm font-bold mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="input-field mb-4"
              required
            />

            {error && (
              <p className="text-sm mb-4" style={{ color: 'var(--bubble-deep)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn--lg w-full btn--grass"
            >
              {isSubmitting ? 'Entrando...' : '✨ Entrar'}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: 'var(--muted)' }}>
            Não tem conta?{' '}
            <Link href="/registro" className="font-bold" style={{ color: 'var(--ink)' }}>
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
