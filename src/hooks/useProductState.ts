'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Product, ProductState, FilterType } from '@/types/product'
import { useShoppingState } from './useShoppingState'
import type { ProductShoppingState } from '@/types/shoppingState'

/**
 * Initialize product state from base product data and optional saved state
 */
const initializeState = (
  products: Product[],
  savedState: Record<string, ProductShoppingState>
): ProductState[] => {
  return products.map(product => {
    const saved = savedState[product.id]
    return {
      ...product,
      quantity: saved?.quantity ?? product.defaultQuantity,
      hay: saved?.hay ?? product.defaultHay ?? false,
      comprado: saved?.comprado ?? false
    }
  })
}

/**
 * Convert product states to shopping state record for Firestore
 */
const toShoppingState = (products: ProductState[]): Record<string, ProductShoppingState> => {
  const state: Record<string, ProductShoppingState> = {}
  for (const product of products) {
    state[product.id] = {
      hay: product.hay,
      comprado: product.comprado,
      quantity: product.quantity
    }
  }
  return state
}

interface UseProductStateOptions {
  /** User ID for syncing with Firestore (null = no sync) */
  userId?: string | null
}

/**
 * Custom hook for managing product list state with Firestore sync
 */
export function useProductState(
  initialProducts: Product[],
  options: UseProductStateOptions = {}
) {
  const { userId = null } = options
  
  // Shopping state from Firestore
  const { 
    shoppingState, 
    loading: stateLoading, 
    isLoaded: stateIsLoaded,
    saveState 
  } = useShoppingState(userId)

  // Initialize products state
  const [products, setProducts] = useState<ProductState[]>([])
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Track if we've merged Firestore state
  const hasMergedRef = useRef(false)

  // Initialize products when source data and Firestore state are ready
  useEffect(() => {
    // Wait for products to be available
    if (initialProducts.length === 0) {
      return
    }

    // If no user, just initialize with defaults
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing with external data source is valid
      setProducts(initializeState(initialProducts, {}))
      setIsInitialized(true)
      return
    }

    // Wait for Firestore state to load
    if (!stateIsLoaded) {
      return
    }

    // Only merge once per user/products combination
    if (!hasMergedRef.current) {
      hasMergedRef.current = true
      setProducts(initializeState(initialProducts, shoppingState))
      setIsInitialized(true)
    }
  }, [initialProducts, userId, stateIsLoaded, shoppingState])

  // Reset merge flag when user changes
  useEffect(() => {
    hasMergedRef.current = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset state when user changes is valid
    setIsInitialized(false)
  }, [userId])

  // Sync to Firestore when products change (after initialization)
  useEffect(() => {
    if (!userId || !isInitialized || products.length === 0) {
      return
    }

    const state = toShoppingState(products)
    saveState(state)
  }, [products, userId, isInitialized, saveState])

  /**
   * Toggle the "hay" (have it) status of a product
   */
  const toggleHay = useCallback((id: string) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === id
          ? { ...product, hay: !product.hay }
          : product
      )
    )
  }, [])

  /**
   * Toggle the "comprado" (purchased) status of a product
   */
  const toggleComprado = useCallback((id: string) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === id
          ? { ...product, comprado: !product.comprado }
          : product
      )
    )
  }, [])

  /**
   * Update the quantity of a product
   * @param id - Product ID
   * @param quantity - New quantity (0-99)
   */
  const updateQuantity = useCallback((id: string, quantity: number) => {
    // Validate quantity is within bounds
    const validQuantity = Math.max(0, Math.min(99, Math.floor(quantity)))

    setProducts(prev =>
      prev.map(product =>
        product.id === id
          ? { ...product, quantity: validQuantity }
          : product
      )
    )
  }, [])

  /**
   * Reset all products: clear hay, comprado, and set quantities to 0
   */
  const resetAll = useCallback(() => {
    setProducts(prev =>
      prev.map(product => ({
        ...product,
        hay: false,
        comprado: false,
        quantity: 0
      }))
    )
  }, [])

  /**
   * Get filtered products based on current filter
   */
  const filteredProducts = useMemo(() => {
    switch (filter) {
      case 'ALL':
        return products
      case 'PENDING':
        // Products that need to be purchased (not marked as "hay")
        return products.filter(p => !p.hay)
      case 'MISSING':
        // Products that couldn't be purchased (not "hay" and not "comprado")
        return products.filter(p => !p.hay && !p.comprado)
      default:
        return products
    }
  }, [products, filter])

  /**
   * Get counts for each filter type
   */
  const counts = useMemo(() => ({
    all: products.length,
    pending: products.filter(p => !p.hay).length,
    missing: products.filter(p => !p.hay && !p.comprado).length
  }), [products])

  return {
    products: filteredProducts,
    allProducts: products,
    filter,
    setFilter,
    toggleHay,
    toggleComprado,
    updateQuantity,
    resetAll,
    counts,
    loading: stateLoading || !isInitialized,
    syncing: stateLoading
  }
}
