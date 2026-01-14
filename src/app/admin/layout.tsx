'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Admin Header */}
      <header className="border-b border-card-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Admin</h1>
            <nav className="flex gap-4">
              <Link
                href="/admin/products"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                Productos
              </Link>
            </nav>
          </div>
          <Link
            href="/"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Volver a la lista
          </Link>
        </div>
      </header>

      {/* Admin Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
