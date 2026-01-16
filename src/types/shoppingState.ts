/**
 * Shopping state for a single product
 */
export interface ProductShoppingState {
  /** Whether the user already has this product at home */
  hay: boolean
  /** Whether the product was successfully purchased */
  comprado: boolean
  /** Current quantity to purchase */
  quantity: number
}

/**
 * Complete shopping state document stored per user
 */
export interface ShoppingStateDocument {
  /** User ID (Firebase Auth UID) */
  userId: string
  /** Last updated timestamp */
  updatedAt: Date
  /** Map of product ID to shopping state */
  items: Record<string, ProductShoppingState>
}
