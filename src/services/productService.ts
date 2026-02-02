import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Product, CreateProductInput, UpdateProductInput } from '@/types/product'
import { ServiceResult, successResult, errorResult } from '@/types/service'

const PRODUCTS_COLLECTION = 'products'

/**
 * Get Firestore collection reference
 */
function getProductsCollection() {
  if (!db) {
    throw new Error('Firestore not initialized')
  }
  return collection(db, PRODUCTS_COLLECTION)
}

/**
 * Get Firestore document reference
 */
function getProductDoc(id: string) {
  if (!db) {
    throw new Error('Firestore not initialized')
  }
  return doc(db, PRODUCTS_COLLECTION, id)
}

/**
 * Retrieve all products from Firestore
 */
export async function getAllProducts(): Promise<ServiceResult<Product[]>> {
  try {
    const productsCol = getProductsCollection()
    const snapshot = await getDocs(productsCol)
    const products: Product[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product))
    return successResult(products)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products'
    return errorResult(message)
  }
}

/**
 * Retrieve a single product by ID
 */
export async function getProduct(id: string): Promise<ServiceResult<Product>> {
  try {
    const docRef = getProductDoc(id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return errorResult(`Product not found: ${id}`)
    }

    const product: Product = {
      id: docSnap.id,
      ...docSnap.data()
    } as Product

    return successResult(product)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch product'
    return errorResult(message)
  }
}

/**
 * Check if a product exists
 */
export async function productExists(id: string): Promise<boolean> {
  try {
    const docRef = getProductDoc(id)
    const docSnap = await getDoc(docRef)
    return docSnap.exists()
  } catch {
    return false
  }
}

/**
 * Generate a URL-friendly slug from a product name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .substring(0, 100) // Limit length
}

/**
 * Create a new product
 */
export async function createProduct(input: CreateProductInput): Promise<ServiceResult<Product>> {
  try {
    // Validate required fields
    if (!input.name || input.name.trim() === '') {
      return errorResult('Product name is required')
    }

    if (input.name.length > 100) {
      return errorResult('Product name too long')
    }

    // Generate ID from name
    const id = generateSlug(input.name)

    // Check for duplicate
    if (await productExists(id)) {
      return errorResult('Product ID already exists')
    }

    const product: Product = {
      id,
      name: input.name.trim(),
      url: input.url || undefined,
      defaultQuantity: input.defaultQuantity ?? 0,
      defaultHay: input.defaultHay ?? false
    }

    const docRef = getProductDoc(id)
    await setDoc(docRef, product)

    return successResult(product)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product'
    return errorResult(message)
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<ServiceResult<Product>> {
  try {
    // Check product exists
    const existing = await getProduct(id)
    if (!existing.success || !existing.data) {
      return errorResult(`Product not found: ${id}`)
    }

    // Validate name if provided
    if (input.name !== undefined) {
      if (input.name.trim() === '') {
        return errorResult('Product name is required')
      }
      if (input.name.length > 100) {
        return errorResult('Product name too long')
      }
    }

    // Build update object with only defined fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {}
    if (input.name !== undefined) updates.name = input.name.trim()
    if (input.url !== undefined) updates.url = input.url || ''
    if (input.defaultQuantity !== undefined) updates.defaultQuantity = input.defaultQuantity
    if (input.defaultHay !== undefined) updates.defaultHay = input.defaultHay

    const docRef = getProductDoc(id)
    await updateDoc(docRef, updates)

    // Return updated product
    const updated = await getProduct(id)
    if (!updated.success || !updated.data) {
      return errorResult('Failed to fetch updated product')
    }

    return successResult(updated.data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product'
    return errorResult(message)
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<ServiceResult<void>> {
  try {
    // Check product exists
    if (!(await productExists(id))) {
      return errorResult(`Product not found: ${id}`)
    }

    const docRef = getProductDoc(id)
    await deleteDoc(docRef)

    return successResult(undefined)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product'
    return errorResult(message)
  }
}

/**
 * Seed products from local data file
 * Uses batch writes for efficiency and atomicity
 */
export async function seedProducts(products: Product[]): Promise<ServiceResult<number>> {
  try {
    if (!db) {
      return errorResult('Firestore not initialized')
    }

    const batch = writeBatch(db)
    let count = 0

    for (const product of products) {
      const docRef = getProductDoc(product.id)
      // Use set with merge to handle re-runs (upsert behavior)
      batch.set(docRef, {
        id: product.id,
        name: product.name,
        url: product.url || null,
        defaultQuantity: product.defaultQuantity,
        defaultHay: product.defaultHay ?? false
      }, { merge: true })
      count++
    }

    await batch.commit()

    return successResult(count)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to seed products'
    return errorResult(message)
  }
}
