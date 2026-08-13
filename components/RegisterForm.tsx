'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(name, email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="card card--hero">
          <h1 className="text-3xl mb-6 text-center">✨ Criar conta</h1>

          <form onSubmit={handleSubmit}>
            <label className="block text-left text-sm font-bold mb-2">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="input-field mb-4"
              required
              minLength={2}
            />

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
              placeholder="Mínimo 8 caracteres"
              className="input-field mb-4"
              required
              minLength={8}
            />

            {error && (
              <p className="text-sm mb-4" style={{ color: 'var(--bubble-deep)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn--lg w-full btn--grass"
            >
              {isSubmitting ? 'Criando conta...' : '✨ Criar conta'}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: 'var(--muted)' }}>
            Já tem conta?{' '}
            <Link href="/login" className="font-bold" style={{ color: 'var(--ink)' }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
