import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export const metadata = {
  title: 'Entrar — Giz',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-shell" role="status">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
