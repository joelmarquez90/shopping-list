import { chromium, type BrowserContext, type Page } from 'playwright'
import childProcess, { type ChildProcess } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { isProductUrl, isStoreUrl, type Store } from '../storeUrls'
import { ApiError } from '../server/automationPolicy'

const USER_DATA_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), '.masonline-session')
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const CLOSE_LOGIN_MESSAGE = 'Terminá de iniciar sesión y salí del Chrome de las tiendas con ⌘Q. Después volvé a intentar.'
const shared = globalThis as typeof globalThis & { storeBrowser?: BrowserContext; storeLogin?: ChildProcess }

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function prepareProfile(): Promise<void> {
  await fs.mkdir(/* turbopackIgnore: true */ USER_DATA_DIR, { recursive: true, mode: 0o700 })
  // This is local runtime state, never an asset to inspect or bundle at build time.
  if (!(await fs.lstat(/* turbopackIgnore: true */ USER_DATA_DIR)).isDirectory()) throw new Error('Perfil de navegador inválido.')
  await fs.chmod(/* turbopackIgnore: true */ USER_DATA_DIR, 0o700)
}

/** Human sign-in uses ordinary Chrome, without any debugging or automation flags. */
export async function openBrowserAt(url: string): Promise<void> {
  if (!isStoreUrl(url, 'masonline') && !isStoreUrl(url, 'meli')) throw new Error('Tienda no permitida.')
  if (shared.storeBrowser) await shared.storeBrowser.close()
  await prepareProfile()
  const loginArgs = [
    `--user-data-dir=${USER_DATA_DIR}`, '--no-first-run', '--no-default-browser-check', '--disable-background-mode', url,
  ]
  const login = childProcess.spawn(/* turbopackIgnore: true */ CHROME_PATH, /* turbopackIgnore: true */ loginArgs, { stdio: 'ignore', detached: true })
  // Repeated clicks forward a new tab to the existing process; keep tracking its owner.
  shared.storeLogin ??= login
  const clear = () => { if (shared.storeLogin === login) shared.storeLogin = undefined }
  login.once('exit', clear)
  login.once('error', clear)
  await new Promise<void>((resolve, reject) => {
    login.once('spawn', resolve)
    login.once('error', () => reject(new ApiError(503, 'No se pudo abrir Google Chrome. Comprobá que esté instalado.')))
  })
  login.unref()
}

/** Reopen the signed-in profile only after the human has closed the login browser. */
export async function connectToChrome(): Promise<{ context: BrowserContext }> {
  if (shared.storeLogin) throw new ApiError(409, CLOSE_LOGIN_MESSAGE)
  if (!shared.storeBrowser) {
    await prepareProfile()
    let context: BrowserContext
    try {
      context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        channel: 'chrome', headless: false, acceptDownloads: false,
        serviceWorkers: 'block', timeout: 30000,
        // Use Chrome's real keychain so cookies from the human sign-in stay readable.
        ignoreDefaultArgs: ['--use-mock-keychain', '--password-store=basic'],
      })
    } catch {
      // Also covers a login Chrome left open across a server restart.
      throw new ApiError(409, 'No se pudo abrir el perfil de las tiendas. Salí de ese Chrome con ⌘Q y volvé a intentar; si sigue fallando, comprobá que Google Chrome esté instalado.')
    }
    context.on('close', () => { if (shared.storeBrowser === context) shared.storeBrowser = undefined })
    shared.storeBrowser = context
  }
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

export function describeConnectionError(error?: unknown): Error {
  if (error instanceof ApiError) return error
  return new Error('No se pudo completar la operación. Revisá la sesión del navegador e intentá de nuevo.')
}
