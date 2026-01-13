'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  loadingComponent?: ReactNode
  redirectTo?: string
}

function DefaultLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function ProtectedRoute({
  children,
  loadingComponent,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  if (loading) {
    return <>{loadingComponent || <DefaultLoadingSpinner />}</>
  }

  if (!user) {
    // Show loading while redirecting
    return <>{loadingComponent || <DefaultLoadingSpinner />}</>
  }

  return <>{children}</>
}
