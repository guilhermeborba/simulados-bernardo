'use client';
import { ReactNode, useEffect } from 'react';
import { setTheme } from '@/lib/gizPreferences';
export default function GizPreferencesProvider({ children }: { children: ReactNode }) {
  useEffect(() => { setTheme('light'); }, []);
  return <>{children}</>;
}
