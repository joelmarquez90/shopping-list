/**
 * Product Service Contract
 *
 * This file defines the interface for the product service layer.
 * Implementation will be in /src/services/productService.ts
 */

import type { Product, CreateProductInput, UpdateProductInput } from '@/types/product'

/**
 * Result type for operations that can fail
 */
export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Product Service Interface
 *
 * Provides CRUD operations for products stored in Firestore.
 * All methods are async and return ServiceResult for consistent error handling.
 */
export interface IProductService {
  /**
   * Retrieve all products from Firestore
   * @returns Array of all products
   */
  getAllProducts(): Promise<ServiceResult<Product[]>>

  /**
   * Retrieve a single product by ID
   * @param id - Product document ID
   * @returns Product if found, error if not
   */
  getProduct(id: string): Promise<ServiceResult<Product>>

  /**
   * Create a new product
   * @param input - Product data (id auto-generated from name if not provided)
   * @returns Created product with assigned ID
   */
  createProduct(input: CreateProductInput): Promise<ServiceResult<Product>>

  /**
   * Update an existing product
   * @param id - Product document ID
   * @param input - Fields to update (partial update)
   * @returns Updated product
   */
  updateProduct(id: string, input: UpdateProductInput): Promise<ServiceResult<Product>>

  /**
   * Delete a product
   * @param id - Product document ID
   * @returns Success status
   */
  deleteProduct(id: string): Promise<ServiceResult<void>>

  /**
   * Check if a product exists
   * @param id - Product document ID
   * @returns Boolean indicating existence
   */
  productExists(id: string): Promise<boolean>

  /**
   * Seed products from local data file
   * Used for initial migration from hardcoded products
   * @param products - Array of products to seed
   * @returns Count of products seeded
   */
  seedProducts(products: Product[]): Promise<ServiceResult<number>>
}

/**
 * Hook interface for React components
 */
export interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseProductMutationResult {
  create: (input: CreateProductInput) => Promise<ServiceResult<Product>>
  update: (id: string, input: UpdateProductInput) => Promise<ServiceResult<Product>>
  remove: (id: string) => Promise<ServiceResult<void>>
  loading: boolean
  error: string | null
}
