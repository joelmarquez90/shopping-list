import { chromium, Page } from 'playwright'
import { execFile } from 'child_process'
import path from 'path'

export interface CartProduct {
  name: string
  url: string
  quantity: number
}

export interface CartResult {
  success: string[]
  failed: { name: string; error: string }[]
}

const USER_DATA_DIR = path.join(process.cwd(), '.masonline-session')
const CDP_PORT = 9222
const CDP_URL = `http://localhost:${CDP_PORT}`
const NAVIGATION_TIMEOUT = 30000
const DELAY_BETWEEN_PRODUCTS = 3000

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Launch Chrome as a normal process (no automation flags).
 * Uses --remote-debugging-port so Playwright can connect later via CDP.
 */
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

export async function openLoginPage(): Promise<void> {
  launchChromeProcess('https://www.masonline.com.ar/')
}

async function connectToChrome() {
  const browser = await chromium.connectOverCDP(CDP_URL)
  const context = browser.contexts()[0]
  if (!context) {
    throw new Error('No se encontro un contexto de Chrome. Asegurate de abrir Chrome primero con el boton "Sesion".')
  }
  return { browser, context }
}

/**
 * Click "Agregar" using force:true to bypass the valtech-gdn-incompatible-cart-blocker overlay.
 * force:true skips overlay checks but still dispatches real mouse events (mousedown/mouseup/click).
 */
async function clickAddToCart(page: Page): Promise<void> {
  // Find the "Agregar" button (not "Agregar a una lista")
  const addButton = page.locator('button').filter({ hasText: /agregar/i }).filter({ hasNotText: /lista/i }).first()
  if (await addButton.count() > 0) {
    await addButton.click({ force: true })
    return
  }

  throw new Error('No se encontro el boton "Agregar" en la pagina')
}

/**
 * After clicking "Agregar", the button changes to +/- controls.
 * Click "+" (quantity - 1) times using force:true for real mouse events.
 */
async function adjustQuantity(page: Page, quantity: number): Promise<void> {
  if (quantity <= 1) return

  // Wait for the +/- UI to appear after adding
  await delay(2000)

  const clicksNeeded = quantity - 1

  // Build locator chain for the "+" button
  const plusSelectors = [
    page.locator('[class*="numeric-stepper"] [class*="plus"]').first(),
    page.locator('button[class*="plus"]').first(),
    page.locator('button').filter({ hasText: '+' }).first(),
  ]

  for (let i = 0; i < clicksNeeded; i++) {
    let clicked = false

    for (const locator of plusSelectors) {
      if (await locator.count() > 0) {
        await locator.click({ force: true })
        clicked = true
        break
      }
    }

    if (!clicked) {
      throw new Error(`No se encontro el boton "+" (click ${i + 1} de ${clicksNeeded})`)
    }

    // Wait for VTEX to process the quantity update
    await delay(1000)
  }
}

export async function addProductsToCart(products: CartProduct[]): Promise<CartResult> {
  const result: CartResult = {
    success: [],
    failed: []
  }

  if (products.length === 0) {
    return result
  }

  try {
    const { context } = await connectToChrome()

    const page = context.pages()[0] || await context.newPage()
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT)

    for (const product of products) {
      try {
        console.log(`Procesando: ${product.name} (x${product.quantity})`)

        await page.goto(product.url, { waitUntil: 'networkidle' })
        await delay(2000)

        await clickAddToCart(page)
        console.log(`  -> Agregado al carrito: ${product.name}`)

        // After adding, click "+" to reach desired quantity
        await adjustQuantity(page, product.quantity)
        if (product.quantity > 1) {
          console.log(`  -> Cantidad ajustada a ${product.quantity}`)
        }

        result.success.push(product.name)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`  -> Error con ${product.name}: ${errorMessage}`)
        result.failed.push({ name: product.name, error: errorMessage })
      }

      await delay(DELAY_BETWEEN_PRODUCTS)
    }

    console.log(`\nResumen: ${result.success.length} exitosos, ${result.failed.length} fallidos`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('ECONNREFUSED') || msg.includes('connect')) {
      throw new Error('Chrome no esta corriendo. Usa el boton "Sesion" primero para abrir Chrome.')
    }
    throw error
  }

  return result
}
