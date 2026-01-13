'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoginButton } from '@/components/auth/LoginButton'
import { AuthErrorDisplay } from '@/components/auth/AuthErrorDisplay'

export default function LoginPage() {
  const { user, loading, error, signInWithGoogle, clearError } = useAuth()
  const router = useRouter()

  // Redirect to home if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.replace('/')
    }
  }, [user, loading, router])

  // Show loading while checking auth state or redirecting
  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Lista de Compras</h1>
        <p className="text-muted mb-8">Gestiona tu lista de compras mensual</p>

        {error && (
          <AuthErrorDisplay
            error={error}
            onDismiss={clearError}
            className="mb-6"
          />
        )}

        <LoginButton onClick={signInWithGoogle} loading={loading} className="mx-auto" />
      </div>
    </main>
  )
}
