import { chromium, Page } from 'playwright'
import { execFile, execSync } from 'child_process'
import path from 'path'

export interface CartProduct {
  id: string
  name: string
  url: string
  quantity: number
}

export interface CartResultItem {
  id: string
  name: string
}

export interface CartResult {
  success: CartResultItem[]
  failed: { id: string; name: string; error: string }[]
}

const USER_DATA_DIR = path.join(process.cwd(), '.masonline-session')
const CDP_PORT = 9222
const CDP_URL = `http://localhost:${CDP_PORT}`
const NAVIGATION_TIMEOUT = 30000
const DELAY_BETWEEN_PRODUCTS = 3000
const EXTRA_QUANTITY_RETRIES = 5

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function killExistingChrome(): void {
  try {
    // Graceful quit via AppleScript avoids Chrome's auto-restart mechanism
    execSync('osascript -e \'quit app "Google Chrome"\'', { stdio: 'ignore' })
    execSync('sleep 2', { stdio: 'ignore' })
  } catch {
    // No Chrome running, that's fine
  }
}

function launchChromeProcess(url: string): void {
  killExistingChrome()
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

export async function openLoginPage(): Promise<void> {
  launchChromeProcess('https://www.masonline.com.ar/')
  await waitForCDP()
}

async function connectToChrome() {
  const browser = await chromium.connectOverCDP(CDP_URL)
  const context = browser.contexts()[0]
  if (!context) {
    throw new Error('No se encontro un contexto de Chrome. Asegurate de abrir Chrome primero con el boton "Sesion".')
  }
  return { browser, context }
}

async function clickAddToCart(page: Page): Promise<void> {
  const addButton = page.locator('button').filter({ hasText: /agregar/i }).filter({ hasNotText: /lista/i }).first()
  if (await addButton.count() > 0) {
    await addButton.click({ force: true })
    return
  }

  throw new Error('No se encontro el boton "Agregar" en la pagina')
}

/**
 * Read the current quantity displayed on the product page.
 */
async function readCurrentQuantity(page: Page): Promise<number> {
  const value = await page.evaluate(() => {
    // Try input fields first (numeric stepper input)
    const inputSelectors = [
      '[class*="numeric-stepper"] input',
      '[class*="numericStepper"] input',
      '[class*="stepper"] input',
      '[class*="quantity"] input',
      'input[type="tel"]',
    ]
    for (const sel of inputSelectors) {
      const el = document.querySelector(sel) as HTMLInputElement
      if (el?.value) {
        const n = parseInt(el.value, 10)
        if (!isNaN(n)) return n
      }
    }

    // Try span/div between - and + buttons
    const stepperContainers = document.querySelectorAll('[class*="numeric-stepper"], [class*="numericStepper"], [class*="stepper"]')
    for (const container of stepperContainers) {
      const spans = container.querySelectorAll('span, div')
      for (const span of spans) {
        const text = span.textContent?.trim()
        if (text && /^\d+$/.test(text)) {
          return parseInt(text, 10)
        }
      }
    }

    return -1
  })

  return value
}

/**
 * After clicking "Agregar", the button changes to +/- controls.
 * Click "+" until the quantity matches the target, with validation.
 */
async function adjustQuantity(page: Page, targetQuantity: number): Promise<number> {
  if (targetQuantity <= 1) return 1

  // Wait for the +/- UI to appear after adding
  await delay(2000)

  const plusSelectors = [
    page.locator('[class*="numeric-stepper"] [class*="plus"]').first(),
    page.locator('button[class*="plus"]').first(),
    page.locator('button').filter({ hasText: '+' }).first(),
  ]

  // Find which plus locator works
  let plusLocator = null
  for (const locator of plusSelectors) {
    if (await locator.count() > 0) {
      plusLocator = locator
      break
    }
  }

  if (!plusLocator) {
    throw new Error('No se encontro el boton "+"')
  }

  // Click "+" until we reach the target quantity, with validation
  // Max retries = clicks needed + extra buffer for missed clicks
  const maxRetries = (targetQuantity - 1) + EXTRA_QUANTITY_RETRIES
  let retries = 0
  while (retries < maxRetries) {
    const current = await readCurrentQuantity(page)
    if (current >= targetQuantity) {
      return current
    }

    await plusLocator.click({ force: true })
    retries++

    // Wait for VTEX to process
    await delay(1500)
  }

  // Final read after all retries
  const finalQuantity = await readCurrentQuantity(page)
  return finalQuantity
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

        const finalQuantity = await adjustQuantity(page, product.quantity)

        if (product.quantity > 1) {
          if (finalQuantity >= product.quantity) {
            console.log(`  -> Cantidad verificada: ${finalQuantity}`)
          } else if (finalQuantity > 0) {
            console.log(`  -> Cantidad parcial: ${finalQuantity} de ${product.quantity}`)
          }
        }

        if (finalQuantity >= product.quantity) {
          result.success.push({ id: product.id, name: product.name })
        } else {
          result.failed.push({
            id: product.id,
            name: product.name,
            error: `Cantidad esperada: ${product.quantity}, cantidad final: ${finalQuantity}`
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`  -> Error con ${product.name}: ${errorMessage}`)
        result.failed.push({ id: product.id, name: product.name, error: errorMessage })
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
