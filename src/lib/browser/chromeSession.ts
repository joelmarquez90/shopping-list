import { chromium, type BrowserContext, type Page } from 'playwright'
import { mkdir, lstat, chmod } from 'node:fs/promises'
import path from 'node:path'
import { isProductUrl, isStoreUrl, type Store } from '../storeUrls'

const USER_DATA_DIR = path.join(process.cwd(), '.masonline-session')
const shared = globalThis as typeof globalThis & { storeBrowser?: BrowserContext }

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Playwright's private pipe replaces the unauthenticated localhost CDP port. */
export async function openBrowserAt(url: string): Promise<void> {
  if (!isStoreUrl(url, 'masonline') && !isStoreUrl(url, 'meli')) throw new Error('Tienda no permitida.')
  if (!shared.storeBrowser) {
    await mkdir(USER_DATA_DIR, { recursive: true, mode: 0o700 })
    if (!(await lstat(USER_DATA_DIR)).isDirectory()) throw new Error('Perfil de navegador inválido.')
    await chmod(USER_DATA_DIR, 0o700)
    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      channel: 'chrome', headless: false, acceptDownloads: false,
      serviceWorkers: 'block', timeout: 30000,
    })
    context.on('close', () => { if (shared.storeBrowser === context) shared.storeBrowser = undefined })
    shared.storeBrowser = context
  }
  const page = await shared.storeBrowser.newPage()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
}

export async function connectToChrome(): Promise<{ context: BrowserContext }> {
  if (!shared.storeBrowser) throw new Error('Usá el botón «Sesión» para abrir el navegador local.')
  return { context: shared.storeBrowser }
}

/** Every job owns a tab, a total deadline, and a policy covering redirects too. */
export async function withStorePage<T>(store: Store, job: (page: Page) => Promise<T>): Promise<T> {
  const { context } = await connectToChrome()
  const page = await context.newPage()
  await page.route('**/*', async route => {
    const request = route.request()
    if (request.isNavigationRequest() && !isStoreUrl(request.url(), store)) {
      await route.abort('blockedbyclient')
    } else {
      await route.continue()
    }
  })
  const timer = setTimeout(() => { void page.close().catch(() => {}) }, 10 * 60 * 1000)
  try {
    return await job(page)
  } finally {
    clearTimeout(timer)
    await page.close().catch(() => {})
  }
}

export async function gotoProduct(page: Page, url: string, store: Store): Promise<void> {
  if (!isProductUrl(url, store)) throw new Error('URL de producto no permitida.')
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  if (!isProductUrl(page.url(), store)) throw new Error('El producto redirigió a una página no permitida.')
}

export function describeConnectionError(): Error {
  return new Error('No se pudo completar la operación. Revisá la sesión del navegador e intentá de nuevo.')
}
