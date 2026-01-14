'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllProducts } from '@/services/productService'
import type { Product } from '@/types/product'

export interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage products from Firestore
 */
export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async (ignore = false) => {
    if (!ignore) {
      setLoading(true)
      setError(null)
    }

    const result = await getAllProducts()

    // Only update state if not ignored (component still mounted)
    if (ignore) return

    if (result.success && result.data) {
      setProducts(result.data)
    } else {
      setError(result.error || 'Failed to fetch products')
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    let ignore = false

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetching data on mount is a valid pattern
    fetchProducts(ignore)

    return () => {
      ignore = true
    }
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    refetch: () => fetchProducts(false)
  }
}
