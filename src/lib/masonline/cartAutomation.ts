import { Page } from 'playwright'
import { connectToChrome, delay, describeConnectionError, openBrowserAt } from '@/lib/browser/chromeSession'

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

const NAVIGATION_TIMEOUT = 30000
const DELAY_BETWEEN_PRODUCTS = 3000
const EXTRA_QUANTITY_RETRIES = 5

export async function openLoginPage(): Promise<void> {
  await openBrowserAt('https://www.masonline.com.ar/')
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
    throw describeConnectionError(error)
  }

  return result
}
