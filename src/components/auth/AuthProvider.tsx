'use client'

import { createContext, useEffect, useState, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import {
  AuthUser,
  AuthError,
  AuthContextValue,
  ALLOWED_EMAILS,
  AUTH_ERROR_MESSAGES,
  mapFirebaseError,
} from '@/types/auth'

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Converts Firebase User to AuthUser
 */
function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName,
    photoURL: user.photoURL,
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  // Listen for auth state changes
  useEffect(() => {
    // If Firebase is not configured, stop loading immediately
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email && ALLOWED_EMAILS.includes(firebaseUser.email)) {
        setUser(toAuthUser(firebaseUser))
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    if (!auth) {
      setError({
        type: 'UNKNOWN',
        message: 'Firebase is not configured. Please set up environment variables.',
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      // Check if email is in allowlist
      if (!firebaseUser.email || !ALLOWED_EMAILS.includes(firebaseUser.email)) {
        // Sign out unauthorized user
        await firebaseSignOut(auth)
        setUser(null)
        setError({
          type: 'UNAUTHORIZED',
          message: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
        })
        setLoading(false)
        return
      }

      setUser(toAuthUser(firebaseUser))
    } catch (err) {
      const firebaseError = err as { code?: string }
      const errorType = mapFirebaseError(firebaseError.code || '')
      setError({
        type: errorType,
        message: AUTH_ERROR_MESSAGES[errorType],
      })
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!auth) {
      return
    }

    setLoading(true)
    try {
      await firebaseSignOut(auth)
      setUser(null)
    } catch {
      setError({
        type: 'UNKNOWN',
        message: AUTH_ERROR_MESSAGES.UNKNOWN,
      })
    } finally {
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value: AuthContextValue = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
