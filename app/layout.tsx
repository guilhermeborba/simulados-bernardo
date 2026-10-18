import { gizTokens } from '@/lib/gizTokens.generated'
import type { Metadata, Viewport } from 'next'
import { Fredoka, Nunito } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'
import GizPreferencesProvider from '@/components/giz/GizPreferencesProvider'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
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
        <AuthProvider><GizPreferencesProvider>{children}</GizPreferencesProvider></AuthProvider>
      </body>
    </html>
  )
}
