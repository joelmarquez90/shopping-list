'use client'

import { useState, useCallback } from 'react'
import {
  createProduct,
  updateProduct,
  deleteProduct
} from '@/services/productService'
import type { Product, CreateProductInput, UpdateProductInput } from '@/types/product'
import type { ServiceResult } from '@/types/service'

export interface UseProductMutationsResult {
  create: (input: CreateProductInput) => Promise<ServiceResult<Product>>
  update: (id: string, input: UpdateProductInput) => Promise<ServiceResult<Product>>
  remove: (id: string) => Promise<ServiceResult<void>>
  loading: boolean
  error: string | null
}

/**
 * Hook for product CRUD mutations
 * Use with useProducts().refetch() to update the list after mutations
 */
export function useProductMutations(): UseProductMutationsResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (input: CreateProductInput) => {
    setLoading(true)
    setError(null)

    const result = await createProduct(input)

    if (!result.success) {
      setError(result.error || 'Failed to create product')
    }

    setLoading(false)
    return result
  }, [])

  const update = useCallback(async (id: string, input: UpdateProductInput) => {
    setLoading(true)
    setError(null)

    const result = await updateProduct(id, input)

    if (!result.success) {
      setError(result.error || 'Failed to update product')
    }

    setLoading(false)
    return result
  }, [])

  const remove = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    const result = await deleteProduct(id)

    if (!result.success) {
      setError(result.error || 'Failed to delete product')
    }

    setLoading(false)
    return result
  }, [])

  return {
    create,
    update,
    remove,
    loading,
    error
  }
}
