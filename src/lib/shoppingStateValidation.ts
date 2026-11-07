import type { ProductShoppingState } from '../types/shoppingState'

export function isShoppingItems(value: unknown): value is Record<string, ProductShoppingState> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entries = Object.entries(value)
  return entries.length <= 500 && entries.every(([id, item]) => {
    if (!id || id.length > 100 || !item || typeof item !== 'object' || Array.isArray(item)) return false
    const state = item as Record<string, unknown>
    return Object.keys(state).length === 3 && typeof state.hay === 'boolean' &&
      typeof state.comprado === 'boolean' && typeof state.quantity === 'number' &&
      Number.isInteger(state.quantity) && state.quantity >= 0 && state.quantity <= 99
  })
}
