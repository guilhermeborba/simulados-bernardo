import { Suspense } from 'react';
import RegisterForm from '@/components/RegisterForm';

export const metadata = {
  title: 'Criar conta — Simulados Bernardo',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6">Carregando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
