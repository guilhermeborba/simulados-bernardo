import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { AuthProvider } from '@/contexts/AuthContext'
import { LearningPreferencesProvider } from '@/contexts/LearningPreferencesContext'
import './globals.css'

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
  title: 'Simulados Bernardo',
  description: 'Aplicação interativa de simulados escolares para Ensino Fundamental',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <AuthProvider><LearningPreferencesProvider>{children}</LearningPreferencesProvider></AuthProvider>
      </body>
    </html>
  )
}
