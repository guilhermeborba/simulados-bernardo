import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export const metadata = {
  title: 'Entrar — Simulados Bernardo',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
