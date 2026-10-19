import { gizTokens } from '@/lib/gizTokens.generated'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { LearningPreferencesProvider } from '@/contexts/LearningPreferencesContext'
import LegacySurface from '@/components/LegacySurface'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'
import GizPreferencesProvider from '@/components/giz/GizPreferencesProvider'

const fredoka = localFont({
  src: './fonts/fredoka-latin.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-fredoka',
  display: 'swap',
})

const nunito = localFont({
  src: './fonts/nunito-latin.woff2',
  weight: '500 800',
  style: 'normal',
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Giz Kids — Aprender a cada tentativa', template: '%s — Giz Kids' },
  description: 'Simulados escolares para aprender com dicas e curiosidades, uma questão de cada vez.',
  icons: { icon: '/giz/brand/app-kids.svg', apple: '/giz/brand/png/app-kids-180.png' },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: gizTokens.color.light.head.value }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <AuthProvider><LearningPreferencesProvider><GizPreferencesProvider><LegacySurface>{children}</LegacySurface></GizPreferencesProvider></LearningPreferencesProvider></AuthProvider>
      </body>
    </html>
  )
}
