import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { tokens } from './generated/tokens';
import { isGizTrack, type GizTrack } from './core/track';
export { tokens } from './generated/tokens';
export type Theme = 'light' | 'dark' | 'auto';
export type Palette = { [K in keyof typeof tokens.color.light]: string };
const preferenceFile = () => new File(Paths.document, 'giz-preferences.json');
const Context = createContext<{
  colors: Palette; tokens: typeof tokens; theme: Theme; timer: boolean; track: GizTrack | null; ready: boolean;
  setTheme(value: Theme): void; setTimer(value: boolean): void; selectTrack(value: GizTrack): void;
} | null>(null);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
 const system = useColorScheme();
 const [theme, setThemeValue] = useState<Theme>('light');
 const [timer, setTimerValue] = useState(true);
 const [track, setTrack] = useState<GizTrack | null>(null);
 const [loaded, setLoaded] = useState(false);
 useEffect(() => {
  let active = true;
  const read = async () => {
   try {
    const file = preferenceFile();
    if (file.exists) {
     const value = JSON.parse(await file.text());
     if (active) {
      if (['light','dark','auto'].includes(value.theme)) setThemeValue(value.theme);
      if (typeof value.timer === 'boolean') setTimerValue(value.timer);
      if (isGizTrack(value.track)) setTrack(value.track);
     }
    }
   } catch { /* Preferences are optional; credentials never use this file. */ }
   if (active) setLoaded(true);
  };
  void read(); return () => { active = false; };
 }, []);
 useEffect(() => {
  if (!loaded) return;
  try { const file = preferenceFile(); file.create({ overwrite: true, intermediates: true }); file.write(JSON.stringify({ theme, timer, track })); } catch { /* Keep preferences in memory if storage is unavailable. */ }
 }, [theme, timer, track, loaded]);
 const mode = theme === 'auto' ? (system === 'dark' ? 'dark' : 'light') : theme;
 const palette = tokens.color[mode];
 const colors = Object.fromEntries(Object.entries(palette).filter(([key]) => !key.startsWith('_')).map(([key,value]) => [key, typeof value === 'object' ? value.value : value])) as Palette;
 return <Context.Provider value={{ colors, tokens, theme, timer, track, ready: loaded, setTheme:setThemeValue, setTimer:setTimerValue, selectTrack:setTrack }}>{children}</Context.Provider>;
}
export function useTheme() { const value = useContext(Context); if (!value) throw new Error('Tema indisponível.'); return value; }
