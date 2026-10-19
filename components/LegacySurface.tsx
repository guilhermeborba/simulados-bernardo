'use client';
import { usePathname } from 'next/navigation';
import '@/app/legacy-learning.css';

// Practice routes render inside PracticeShell; only guardian/teacher oversight keeps the full-page legacy surface.
const preservedRoutes = ['/acompanhamento'];
export default function LegacySurface({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const preserved = preservedRoutes.some(route => pathname === route || pathname?.startsWith(`${route}/`));
  return preserved ? <div className="legacy-learning">{children}</div> : <>{children}</>;
}
