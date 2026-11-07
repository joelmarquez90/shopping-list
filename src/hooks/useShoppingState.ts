'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getShoppingState, saveShoppingState } from '@/services/shoppingStateService'
import type { ProductShoppingState } from '@/types/shoppingState'

export interface UseShoppingStateResult {
  /** Current shopping state from Firestore */
  shoppingState: Record<string, ProductShoppingState>
  /** Loading state */
  loading: boolean
  /** Error message if any */
  error: string | null
  /** Save shopping state to Firestore */
  saveState: (items: Record<string, ProductShoppingState>) => Promise<void>
  /** Whether initial state has been loaded */
  isLoaded: boolean
}

/**
 * Hook to manage shopping state sync with Firestore
 */
export function useShoppingState(userId: string | null): UseShoppingStateResult {
  const [shoppingState, setShoppingState] = useState<Record<string, ProductShoppingState>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  
  // Track if save is in progress to debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingStateRef = useRef<Record<string, ProductShoppingState> | null>(null)

  // Load shopping state when user changes
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    pendingStateRef.current = null
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing state when user logs out is valid
      setShoppingState({})
      setLoading(false)
      setIsLoaded(false)
      setLoadedUserId(null)
      return
    }

    let ignore = false

    const loadState = async () => {
      setLoading(true)
      setError(null)
      setIsLoaded(false)
      setShoppingState({})

      const result = await getShoppingState(userId)

      if (ignore) return

      if (result.success && result.data) {
        setShoppingState(result.data)
      } else {
        setError(result.error || 'Failed to load shopping state')
        setLoading(false)
        // Never overwrite saved state with defaults after a failed read.
        return
      }

      setLoading(false)
      setIsLoaded(true)
      setLoadedUserId(userId)
    }

    loadState()

    return () => {
      ignore = true
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      pendingStateRef.current = null
    }
  }, [userId])

  // Save shopping state with debounce (500ms)
  const saveState = useCallback(async (items: Record<string, ProductShoppingState>) => {
    if (!userId || loadedUserId !== userId || !isLoaded) return

    // Update local state immediately
    setShoppingState(items)
    pendingStateRef.current = items

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce the save
    saveTimeoutRef.current = setTimeout(async () => {
      if (!pendingStateRef.current) return

      const stateToSave = pendingStateRef.current
      pendingStateRef.current = null

      const result = await saveShoppingState(userId, stateToSave)
      
      if (!result.success) {
        setError(result.error || 'Failed to save shopping state')
      }
    }, 500)
  }, [userId, loadedUserId, isLoaded])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    shoppingState: loadedUserId === userId ? shoppingState : {},
    loading: loading || (!!userId && loadedUserId !== userId),
    error,
    saveState,
    isLoaded: isLoaded && loadedUserId === userId
  }
}
