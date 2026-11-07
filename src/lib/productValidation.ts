import type { CreateProductInput, UpdateProductInput } from '../types/product'
import { isProductUrl } from './storeUrls'

export function productInputError(input: CreateProductInput | UpdateProductInput): string | null {
  if (input.name !== undefined && (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 100)) {
    return 'El nombre debe tener entre 1 y 100 caracteres.'
  }
  if (input.url !== undefined && input.url !== '' && !isProductUrl(input.url, 'masonline')) {
    return 'Ingresá una URL HTTPS de un producto de MasOnline.'
  }
  if (input.defaultQuantity !== undefined && (!Number.isInteger(input.defaultQuantity) || input.defaultQuantity < 0 || input.defaultQuantity > 99)) {
    return 'La cantidad debe ser un entero entre 0 y 99.'
  }
  if (input.defaultHay !== undefined && typeof input.defaultHay !== 'boolean') return 'El estado Hay no es válido.'
  return null
}
