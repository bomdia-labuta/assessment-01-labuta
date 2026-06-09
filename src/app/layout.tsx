import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Assessment Labuta',
  description: 'Avaliação de habilidades - Labuta Labs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
