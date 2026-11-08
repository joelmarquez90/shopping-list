export type Store = 'masonline' | 'meli'

const HOSTS: Record<Store, ReadonlySet<string>> = {
  masonline: new Set(['www.masonline.com.ar', 'masonline.com.ar']),
  meli: new Set(['mercadolibre.com.ar', 'www.mercadolibre.com.ar', 'articulo.mercadolibre.com.ar', 'listado.mercadolibre.com.ar']),
}

/** Account redirects are navigation destinations, never product URLs. */
export function isStoreNavigationUrl(value: unknown, store: Store): value is string {
  if (isStoreUrl(value, store)) return true
  if (store !== 'meli' || typeof value !== 'string' || value.length > 8192) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      (HOSTS.meli.has(url.hostname) || ['mercadolibre.com', 'www.mercadolibre.com'].includes(url.hostname)) &&
      /^\/(?:jms\/mla|captcha|login)(?:\/|$)/.test(url.pathname)
  } catch {
    return false
  }
}

export function meliAccessStep(value: string): 'verification' | 'login' | null {
  if (!isStoreNavigationUrl(value, 'meli')) return null
  const pathname = new URL(value).pathname
  if (/^\/captcha(?:\/|$)/.test(pathname)) return 'verification'
  if (/^\/(?:jms\/mla|login)(?:\/|$)/.test(pathname)) return 'login'
  return null
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
