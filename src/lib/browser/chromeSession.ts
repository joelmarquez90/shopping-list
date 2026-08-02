import { chromium, BrowserContext } from 'playwright'
import { execFile } from 'child_process'
import path from 'path'

/**
 * Shared Chrome/CDP session used by every store automation.
 *
 * A single Chrome instance with a persistent profile keeps the user logged in
 * to all the stores at once, so both MasOnline and Mercado Libre connect to the
 * same debugging port.
 */

const USER_DATA_DIR = path.join(process.cwd(), '.masonline-session')
const CDP_PORT = 9222
const CDP_URL = `http://localhost:${CDP_PORT}`

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function launchChromeProcess(url: string): void {
  execFile(CHROME_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    url
  ], (error) => {
    if (error) {
      console.error('Error launching Chrome:', error.message)
    }
  })
}

async function waitForCDP(maxWaitMs = 20000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(`${CDP_URL}/json/version`, { signal: AbortSignal.timeout(1000) })
      if (res.ok) return
    } catch {
      // not ready yet
    }
    await delay(500)
  }
  throw new Error('Chrome no arrancó a tiempo. Intentá de nuevo.')
}

/**
 * Open Chrome at the given URL and wait until CDP is reachable.
 * If Chrome is already running with this profile, the URL opens in a new tab
 * of the existing instance.
 */
export async function openBrowserAt(url: string): Promise<void> {
  launchChromeProcess(url)
  await waitForCDP()
}

export async function connectToChrome(): Promise<{ context: BrowserContext }> {
  const browser = await chromium.connectOverCDP(CDP_URL)
  const context = browser.contexts()[0]
  if (!context) {
    throw new Error('No se encontro un contexto de Chrome. Asegurate de abrir Chrome primero con el boton "Sesion".')
  }
  return { context }
}

/**
 * Normalize a connection error into the actionable message the UI shows.
 */
export function describeConnectionError(error: unknown): Error {
  const msg = error instanceof Error ? error.message : String(error)
  if (msg.includes('ECONNREFUSED') || msg.includes('connect')) {
    return new Error('Chrome no esta corriendo. Usa el boton "Sesion" primero para abrir Chrome.')
  }
  return error instanceof Error ? error : new Error(msg)
}
