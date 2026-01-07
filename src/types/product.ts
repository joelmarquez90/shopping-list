/**
 * Base product data - immutable, hardcoded
 */
export interface Product {
  /** Unique identifier for the product */
  id: string

  /** Display name of the product */
  name: string

  /** URL to the product page on the supermarket website (optional) */
  url?: string

  /** Default quantity to purchase each month */
  defaultQuantity: number

  /** Default "hay" (have it) state from spreadsheet */
  defaultHay?: boolean
}

/**
 * Product with session state - mutable during user session
 */
export interface ProductState extends Product {
  /** Current quantity to purchase (user-editable) */
  quantity: number

  /** Whether the user already has this product at home */
  hay: boolean

  /** Whether the product was successfully purchased/added to cart */
  comprado: boolean
}

/**
 * Filter types for the product list
 */
export type FilterType = 'ALL' | 'PENDING' | 'MISSING'

/**
 * Filter labels for display
 */
export const FILTER_LABELS: Record<FilterType, string> = {
  ALL: 'Todos',
  PENDING: 'Pendientes',
  MISSING: 'Faltantes'
}
