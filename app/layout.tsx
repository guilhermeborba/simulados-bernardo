import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
