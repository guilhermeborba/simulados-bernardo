'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppShell } from './ui';
import '@/app/legacy-learning.css';
import './practice.css';

const sections = [
  ['/pratica', 'Visão geral'],
  ['/quizzes', 'Quizzes'],
  ['/quizzes/historico', 'Histórico'],
  ['/progresso', 'Habilidades'],
  ['/colecao', 'Coleção'],
] as const;

/** Quizzes, XP, missions, skills and collection live here, inside the Giz shell. */
export default function PracticeShell({ title, subtitle, children, flow = false, backHref }: { title: string; subtitle?: string; children: ReactNode; flow?: boolean; backHref?: string }) {
  const pathname = usePathname();
  const current = sections.map(([href]) => href).filter(href => pathname === href || pathname.startsWith(`${href}/`)).sort((a, b) => b.length - a.length)[0];
  return <AppShell title={title} subtitle={subtitle} flow={flow} backHref={backHref}>
    {!flow && <nav aria-label="Seções da prática" className="giz-chips practice-nav">{sections.map(([href, label]) => <Link key={href} href={href} className="chip" aria-current={current === href ? 'page' : undefined}>{label}</Link>)}</nav>}
    <div className="legacy-learning practice-surface">{children}</div>
  </AppShell>;
}
