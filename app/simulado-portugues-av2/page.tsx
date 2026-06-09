import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Simulado AV2 - Português 2º Bimestre - 3º Ano',
  description: 'Simulado preparatório AV2 de Português para alunos do 3º ano, 2º bimestre com 30 questões sobre a Dona Aranha, nasalização, substantivos e mais.',
};

export default function Page() {
  redirect('/simulado-portugues?year=terceiro&bimestre=2&assessment=AV2');
}

