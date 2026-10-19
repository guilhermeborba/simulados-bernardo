import { Suspense } from 'react';
import RegisterForm from '@/components/RegisterForm';

export const metadata = {
  title: 'Criar conta — Giz',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="page-shell" role="status">Carregando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
