'use client';
import { ReactNode, useEffect } from 'react';
import { getTheme, setTheme } from '@/lib/gizPreferences';
export default function GizPreferencesProvider({ children }: { children: ReactNode }) {
  useEffect(() => { setTheme(getTheme()); }, []);
  return <>{children}</>;
}
