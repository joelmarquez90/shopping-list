import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ShoppingStateDocument, ProductShoppingState } from '@/types/shoppingState'
import { ServiceResult, successResult, errorResult } from '@/types/service'

const SHOPPING_STATE_COLLECTION = 'shoppingState'

/**
 * Get Firestore document reference for user's shopping state
 */
function getShoppingStateDoc(userId: string) {
  if (!db) {
    throw new Error('Firestore not initialized')
  }
  return doc(db, SHOPPING_STATE_COLLECTION, userId)
}

/**
 * Get the shopping state for a user
 */
export async function getShoppingState(
  userId: string
): Promise<ServiceResult<Record<string, ProductShoppingState>>> {
  try {
    const docRef = getShoppingStateDoc(userId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      // Return empty state if no document exists
      return successResult({})
    }

    const data = docSnap.data() as ShoppingStateDocument
    return successResult(data.items || {})
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch shopping state'
    return errorResult(message)
  }
}

/**
 * Save the complete shopping state for a user
 */
export async function saveShoppingState(
  userId: string,
  items: Record<string, ProductShoppingState>
): Promise<ServiceResult<void>> {
  try {
    const docRef = getShoppingStateDoc(userId)
    
    await setDoc(docRef, {
      userId,
      updatedAt: serverTimestamp(),
      items
    })

    return successResult(undefined)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save shopping state'
    return errorResult(message)
  }
}

/**
 * Update a single product's shopping state
 */
export async function updateProductShoppingState(
  userId: string,
  productId: string,
  state: Partial<ProductShoppingState>
): Promise<ServiceResult<void>> {
  try {
    // First get current state
    const result = await getShoppingState(userId)
    if (!result.success) {
      return errorResult(result.error || 'Failed to get current state')
    }

    const currentItems = result.data || {}
    const currentProductState = currentItems[productId] || { hay: false, comprado: false, quantity: 0 }

    // Merge the update
    const updatedItems = {
      ...currentItems,
      [productId]: {
        ...currentProductState,
        ...state
      }
    }

    // Save back
    return await saveShoppingState(userId, updatedItems)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product state'
    return errorResult(message)
  }
}
