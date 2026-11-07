import { ApiError } from './automationPolicy'
import { isProductUrl, type Store } from '../storeUrls'
import type { CartProduct } from '../masonline/cartAutomation'
import type { MeliSearchProduct, MeliSelection } from '../../types/meli'

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, 'Se requiere un objeto JSON.')
  }
  return value as Record<string, unknown>
}

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 100) {
    throw new ApiError(400, 'Identificador o nombre inválido (máximo 100 caracteres).')
  }
  return value.trim()
}

function quantity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 99) {
    throw new ApiError(400, 'La cantidad debe ser un entero entre 1 y 99.')
  }
  return value
}

function entries(body: unknown, key: string): Record<string, unknown>[] {
  const items = object(body)[key]
  if (!Array.isArray(items) || items.length < 1 || items.length > 100) {
    throw new ApiError(400, 'Enviá entre 1 y 100 productos por solicitud.')
  }
  return items.map(object)
}

function productUrl(value: unknown, store: Store): string {
  if (!isProductUrl(value, store)) throw new ApiError(400, 'La URL no corresponde a un producto de la tienda.')
  return value
}

export function parseSearchProducts(body: unknown): MeliSearchProduct[] {
  return entries(body, 'products').map(p => ({ id: text(p.id), name: text(p.name), quantity: quantity(p.quantity) }))
}

export function parseMasonlineProducts(body: unknown): CartProduct[] {
  return entries(body, 'products').map(p => ({
    id: text(p.id), name: text(p.name), quantity: quantity(p.quantity), url: productUrl(p.url, 'masonline'),
  }))
}

export function parseMeliSelections(body: unknown): MeliSelection[] {
  return entries(body, 'selections').map(p => ({
    productId: text(p.productId), productName: text(p.productName),
    quantity: quantity(p.quantity), url: productUrl(p.url, 'meli'),
  }))
}
