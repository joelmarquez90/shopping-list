export type Store = 'masonline' | 'meli'

const HOSTS: Record<Store, ReadonlySet<string>> = {
  masonline: new Set(['www.masonline.com.ar', 'masonline.com.ar']),
  meli: new Set(['www.mercadolibre.com.ar', 'articulo.mercadolibre.com.ar', 'listado.mercadolibre.com.ar']),
}

export function isStoreUrl(value: unknown, store: Store): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password &&
      !url.port && HOSTS[store].has(url.hostname)
  } catch {
    return false
  }
}

export function isProductUrl(value: unknown, store: Store): value is string {
  if (!isStoreUrl(value, store)) return false
  const path = new URL(value).pathname
  return store === 'masonline'
    ? /^\/(?:[^/]+\/)*[^/]+\/p\/?$/.test(path)
    : /^(?:\/p\/MLA\d+|\/up\/MLAU?\d+|\/MLA-?\d+[^/]*)\/?$/.test(path) ||
      /^\/[^/]+\/p\/MLA\d+\/?$/.test(path)
}

export function isSafeProductUrl(value: unknown): value is string {
  return isProductUrl(value, 'masonline') || isProductUrl(value, 'meli')
}
