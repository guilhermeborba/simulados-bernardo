'use client';

import { ButtonHTMLAttributes, ReactNode, useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { TRACK_INFO, applyTrack, followFaixa, subjectIcon, useGizTrack, type GizSubject } from '@/lib/gizTrack';
import { useAuth } from '@/contexts/AuthContext';
import { useLearningPreferences } from '@/contexts/LearningPreferencesContext';

export function Icon({ name, size = 24 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="giz-icon"><use href={`/giz/icones/_sprite.svg#i-${name}`} /></svg>;
}
/** The Tuca belongs to Giz Kids only; it also greets people who have not chosen a track yet. */
export function Tuca({ pose = 'feliz', size = 96, priority = false }: { pose?: string; size?: 72 | 96 | 120 | 140 | 160; priority?: boolean }) {
  const track = useGizTrack();
  if (track === 'escola' || track === 'tecnico') return null;
  return <Image unoptimized priority={priority} className="tuca" src={`/giz/tuca/tuca-${pose}.svg`} width={524} height={500} style={{ height: size, width: 'auto' }} alt="" aria-hidden="true" />;
}
export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'text' }) {
  return <button {...props} className={`btn ${variant === 'primary' ? '' : `btn--${variant}`} ${className}`} />;
}
export function Badge({ children, tone = 'soft' }: { children: ReactNode; tone?: 'new' | 'ok' | 'soft' | 'soon' | 'error' }) {
  return <span className={`giz-badge giz-badge--${tone}`}>{tone === 'ok' && <Icon name="check" size={14} />}{children}</span>;
}
/** Secondary level: "see more" between blocks of a screen, outlined with a chevron. */
export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="btn btn--secondary btn--more">{children}<Icon name="chevron-right" size={20} /></Link>;
}
/** Action line closing a card: the whole row is one link, ending in the chevron circle. */
export function ActionRow({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="giz-action-row"><span>{children}</span><span className="giz-action-dot" aria-hidden="true"><Icon name="chevron-right" size={20} /></span></Link>;
}
/** Decorative tile with a subject's colors (or the neutral book) behind its icon. */
export function SubjectTile({ subject, icon, small = false }: { subject: GizSubject | null; icon?: string; small?: boolean }) {
  return <span className={`giz-tile ${small ? 'giz-tile--sm' : ''} ${subject ? `giz-tile--${subject}` : ''}`} aria-hidden="true"><Icon name={icon ?? subjectIcon(subject)} size={small ? 24 : 26} /></span>;
}
const navItems = [ ['/', 'home', 'Início'], ['/simulados', 'book', 'Simulados'], ['/ranking', 'cup', 'Ranking'], ['/eu', 'user', 'Eu'] ];
/** `root` is Início: no breadcrumb, and the brand moves into the phone header. `topLevel` menu screens drop the breadcrumb too, and their first block rises over the phone header. */
export function AppShell({ title, subtitle, children, backHref, flow = false, root = false, topLevel = false, actions }: { title: string; subtitle?: string; children: ReactNode; backHref?: string; flow?: boolean; root?: boolean; topLevel?: boolean; actions?: ReactNode }) {
  const pathname = usePathname();
  const track = useGizTrack();
  const brand = TRACK_INFO[track ?? 'kids'].name;
  useEffect(() => { if (track !== undefined) applyTrack(track); }, [track]);
  const { user } = useAuth();
  const { preferences, isLoading: preferencesLoading } = useLearningPreferences();
  useEffect(() => { if (user && !preferencesLoading) followFaixa(user.id, preferences.schoolYear); }, [user, preferencesLoading, preferences.schoolYear]);
  const Heading = pathname.startsWith('/simulado/') || pathname.startsWith('/quiz/') ? 'h2' : 'h1';
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [pathname]);
  return <div className={`giz-app ${flow ? 'giz-app--flow' : ''} ${root ? 'giz-app--root' : ''} ${topLevel ? 'giz-app--top' : ''}`}>
    <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <aside className="giz-sidebar">
      <Link href="/" className="giz-brand" aria-label={`${brand}, início`}><Image unoptimized className="giz-logo-light" src="/giz/brand/giz-logo-lousa.svg" width="84" height="60" alt="Giz" /><Image unoptimized className="giz-logo-dark" src="/giz/brand/giz-logo-papel.svg" width="84" height="60" alt="Giz" /><span>{brand.replace('Giz ', '')}</span></Link>
      <nav aria-label="Principal" className="giz-nav">{navItems.map(([href, icon, label]) => <Link key={href} href={href} aria-current={(href === '/' ? pathname === '/' || ['/pratica', '/quizzes', '/quiz/', '/progresso', '/colecao'].some(route => pathname.startsWith(route)) : pathname.startsWith(href) || (href === '/eu' && pathname === '/historico') || (href === '/simulados' && pathname.startsWith('/simulado/'))) ? 'page' : undefined}><span className="giz-nav-icon"><Icon name={icon} /></span><span className="giz-nav-label">{label}</span></Link>)}</nav>
      <div className="giz-sidebar-foot"><Link href="/sobre" target="_blank" rel="noopener" className="giz-sidebar-about"><Icon name="info" size={20} /><span className="giz-sidebar-about-label">Conheça o Giz<span className="sr-only"> (abre em nova aba)</span></span><Icon name="external" size={20} /></Link></div>
    </aside>
    <div className="giz-workspace">
      <header className="giz-page-head">
        {root ? <p className="giz-head-brand"><Image unoptimized src="/giz/brand/giz-logo-papel.svg" width="51" height="36" alt="Giz" /><span>{brand.replace('Giz ', '')}</span></p> : !topLevel && <nav className="giz-breadcrumb" aria-label="Você está em"><Link href="/">{brand}</Link><span aria-hidden="true"> / </span><span>{title}</span></nav>}
        <div className="giz-page-heading">{backHref && <Link className="icon-button" href={backHref} aria-label="Voltar"><Icon name="back" /></Link>}<div><Heading ref={heading} tabIndex={-1}>{title}</Heading>{subtitle && <p>{subtitle}</p>}</div>{actions && <div className="giz-head-actions">{actions}</div>}</div>
      </header>
      <main id="conteudo" className="giz-content">{children}</main>
    </div>
  </div>;
}
export function Progress({ value, max }: { value: number; max: number }) {
  const safeMax = Math.max(max, 1);
  return <div className="giz-progress-row"><div className="giz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={Math.max(0, Math.min(value, safeMax))} aria-label="Progresso"><span style={{ width: `${Math.min(100, Math.max(0, value / safeMax * 100))}%` }} /></div><span>{value} de {max}</span></div>;
}
export function FeedbackBlock({ correct, children }: { correct: boolean; children: ReactNode }) {
  return <div className={`giz-feedback ${correct ? 'giz-feedback--fun' : 'giz-feedback--tip'}`}><Icon name={correct ? 'spark' : 'bulb'} /><div><strong>{correct ? 'Você sabia?' : 'Dica de Ouro'}</strong><div>{children}</div></div></div>;
}
export function ScreenState({ kind, title, message, action }: { kind: 'loading' | 'empty' | 'error' | 'offline'; title?: string; message?: string; action?: ReactNode }) {
  if (kind === 'loading') return <div className="giz-loading" role="status" aria-label="Carregando"><span className="sr-only">Carregando…</span><div className="giz-skeleton" /><div className="giz-skeleton" /><div className="giz-skeleton" /></div>;
  return <section className="card giz-state" role={kind === 'error' ? 'alert' : 'status'}><Tuca pose={kind === 'empty' ? 'lupa' : 'respira-fundo'} size={140} priority /><h2>{title || (kind === 'offline' ? 'Sem conexão' : kind === 'error' ? 'Vamos tentar de novo?' : 'Nada por aqui ainda')}</h2>{message && <p>{message}</p>}{action}</section>;
}
/** `sheet` slides up from the bottom with a grab handle and starts focus on its title. */
export function Modal({ title, onClose, children, sheet = false }: { title: string; onClose: () => void; children: ReactNode; sheet?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const el = dialog.current;
    el?.showModal();
    el?.querySelector<HTMLElement>('[data-autofocus], button, a, input')?.focus();
    return () => { el?.close(); previouslyFocused?.focus(); };
  }, []);
  return <dialog className={`giz-modal ${sheet ? 'giz-modal--sheet' : ''}`} ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div className="stack">{sheet && <span className="giz-sheet-handle" aria-hidden="true" />}<h2 id={titleId} tabIndex={sheet ? -1 : undefined} data-autofocus={sheet || undefined}>{title}</h2>{children}</div></dialog>;
}
export function Toast({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }) {
  useEffect(() => { const timeout = setTimeout(onDismiss, 4000); return () => clearTimeout(timeout); }, [onDismiss]);
  return <div className="giz-toast" role="status"><Icon name="bell" />{children}</div>;
}
