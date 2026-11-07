import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'

export const metadata: Metadata = {
  title: 'Lista de Compras',
  description: 'Aplicación para gestionar tu lista de compras mensual',
  icons: { icon: { url: '/icon.svg', type: 'image/svg+xml' } },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
