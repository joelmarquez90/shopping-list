'use client'

import { useContext } from 'react'
import { AuthContext } from '@/components/auth/AuthProvider'
import { AuthContextValue } from '@/types/auth'

/**
 * Hook to access authentication state and methods
 * Must be used within an AuthProvider
 *
 * @example
 * ```tsx
 * const { user, loading, signInWithGoogle, signOut } = useAuth();
 *
 * if (loading) return <Spinner />;
 * if (!user) return <LoginButton onClick={signInWithGoogle} />;
 * return <UserMenu user={user} onSignOut={signOut} />;
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
