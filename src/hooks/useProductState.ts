'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Product, ProductState, FilterType } from '@/types/product'

/**
 * Initialize product state from base product data
 */
const initializeState = (products: Product[]): ProductState[] => {
  return products.map(product => ({
    ...product,
    quantity: product.defaultQuantity,
    hay: product.defaultHay ?? false,
    comprado: false
  }))
}

/**
 * Custom hook for managing product list state
 */
export function useProductState(initialProducts: Product[]) {
  // Initialize products state with lazy initializer
  const [products, setProducts] = useState<ProductState[]>(() =>
    initialProducts.length > 0 ? initializeState(initialProducts) : []
  )
  const [filter, setFilter] = useState<FilterType>('ALL')

  // Re-initialize products when source data changes (e.g., from Firestore)
  // This is a valid use case: syncing React state with external data source
  useEffect(() => {
    let ignore = false

    if (!ignore && initialProducts.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing with external data source is a valid pattern
      setProducts(initializeState(initialProducts))
    }

    return () => {
      ignore = true
    }
  }, [initialProducts])

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
    counts
  }
}
