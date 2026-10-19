'use client';

import { useEffect, useRef, useState, type ReactNode, type InputHTMLAttributes } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tuca } from './ui';
import './account.css';

export function AuthLayout({ title, subtitle, children, mode, loginHref = '/login', registerHref = '/registro' }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  mode?: 'login' | 'register';
  loginHref?: string;
  registerHref?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);

  return (
    <main className="account-auth">
      <aside className="account-brand" aria-label="Giz Kids">
        <Link href="/" className="account-logo" aria-label="Giz, início"><Image unoptimized src="/giz/brand/giz-logo-papel.svg" alt="Giz" width="120" height="72" /></Link>
        <div className="account-brand-copy">
          <h2>Errou? Apaga e tenta de novo.</h2>
          <ul>
            <li>Simulados por ano, bimestre e disciplina</li>
            <li>Dica de Ouro para aprender com cada tentativa</li>
            <li>Acompanhe seu caminho e o da sua turma</li>
          </ul>
          <div className="account-brand-tuca"><Tuca pose="feliz" size={120} priority /></div>
        </div>
        <div className="account-brand-mobile"><Tuca pose="feliz" size={120} priority /></div>
      </aside>
      <div className="account-form-area">
        <section className="account-form-card" aria-labelledby="auth-title">
          <header className="account-form-heading"><h1 id="auth-title" tabIndex={-1} ref={heading}>{title}</h1><p>{subtitle}</p></header>
          {mode && <nav className="account-tabs" aria-label="Sua conta"><Link href={loginHref} aria-current={mode === 'login' ? 'page' : undefined}>Entrar</Link><Link href={registerHref} aria-current={mode === 'register' ? 'page' : undefined}>Criar conta</Link></nav>}
          {children}
        </section>
      </div>
    </main>
  );
}

export function AuthField({ id, label, error, type, ...props }: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="account-field">
      <label htmlFor={id}>{label}</label>
      <div className="account-input-wrap">
        <input {...props} id={id} type={type === 'password' && visible ? 'text' : type} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : props['aria-describedby']} />
        {type === 'password' && <button type="button" className="account-password-toggle" onClick={() => setVisible(!visible)} aria-label={visible ? 'Esconder senha' : 'Mostrar senha'} aria-pressed={visible}>{visible ? 'Ocultar' : 'Mostrar'}</button>}
      </div>
      {error && <p id={`${id}-error`} className="account-field-error">{error}</p>}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return <div role="alert" className="account-form-error"><Image unoptimized src="/giz/icones/alert.svg" alt="" width="24" height="24" /><p>{children}</p></div>;
}
