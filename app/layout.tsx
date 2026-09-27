import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import './globals.css'

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-display'
})

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body'
})

export const metadata: Metadata = {
  title: 'TAFEL — Menu digital e pedidos à mesa',
  description: 'Plataforma multi-restaurante de menu digital e pedidos por QR Code.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${display.variable} ${body.variable} font-body bg-paper text-ink antialiased`}>
        {children}
      </body>
    </html>
  )
}
