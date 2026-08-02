import { Page } from 'playwright'
import { connectToChrome, delay, describeConnectionError } from '@/lib/browser/chromeSession'
import { isLoggedIn } from '@/lib/meli/search'
import { MeliCartResult, MeliSelection } from '@/types/meli'

const NAVIGATION_TIMEOUT = 45000
const DELAY_BETWEEN_PRODUCTS = 3000
const CART_URL = 'https://www.mercadolibre.com.ar/gz/cart'
const CART_TIMEOUT = 15000

/** One row of the cart. The page also renders recommendation carousels, so
 *  reading anything outside these cards would report products that are merely
 *  suggested as if they had been added. */
const CART_ITEM_SELECTOR = '.cl-item-card'

/** Highest quantity offered directly in the dropdown; above it ML asks for a typed amount */
const MAX_DROPDOWN_QUANTITY = 6

const LOGGED_OUT_ERROR =
  'No hay sesion iniciada en Mercado Libre. Inicia sesion en el Chrome abierto y volve a intentar.'

/**
 * Listing id inside a Mercado Libre URL.
 * Catalog page: /p/MLA16010049 -> MLA16010049
 * Catalog variant: /up/MLAU249672016 -> MLAU249672016
 * Classic item: /MLA-1234567890-nombre -> MLA-1234567890
 */
export function extractItemId(url: string): string | null {
  return url.match(/MLA-?U?\d+/)?.[0] ?? null
}

/** Read the quantity currently selected, from "Cantidad:3 unidades(+50 disponibles)" */
async function readSelectedQuantity(page: Page): Promise<number> {
  const text = await page
    .locator('#quantity-selector, .ui-pdp-buybox__quantity__trigger')
    .first()
    .textContent()
    .catch(() => null)

  if (!text) return 1
  const match = text.replace(/\s+/g, ' ').match(/(\d+)\s*unidad/i)
  return match ? parseInt(match[1], 10) : 1
}

/**
 * Pick the quantity on the product page before adding it.
 * Returns the quantity actually selected, which may be lower than the target
 * when the listing caps the available stock.
 */
async function setQuantity(page: Page, target: number): Promise<number> {
  if (target <= 1) return 1

  const trigger = page.locator('#quantity-selector, .ui-pdp-buybox__quantity__trigger').first()
  if (await trigger.count() === 0) {
    // Listing sold as a single unit
    return 1
  }

  await trigger.click()
  await delay(1200)

  if (target <= MAX_DROPDOWN_QUANTITY) {
    const option = page
      .locator('[role="option"], .andes-list__item')
      .filter({ hasText: new RegExp(`^\\s*${target} unidades?\\s*$`) })
      .first()

    if (await option.count() > 0) {
      await option.click()
      await delay(1500)
      return readSelectedQuantity(page)
    }
  }

  // Above the dropdown range: "Mas de N unidades" opens a free-text field
  const moreOption = page
    .locator('[role="option"], .andes-list__item')
    .filter({ hasText: /m[áa]s de/i })
    .first()

  if (await moreOption.count() > 0) {
    await moreOption.click()
    await delay(1200)

    const input = page
      .locator('.ui-pdp-buybox__quantity input.andes-form-control__field, .ui-pdp-buybox__quantity input[type="text"]')
      .first()

    if (await input.count() > 0) {
      await input.fill(String(target))
      const apply = page.locator('button').filter({ hasText: /^\s*Aplicar\s*$/i }).first()
      if (await apply.count() > 0) {
        await apply.click()
        await delay(2000)
      }
    }
  }

  return readSelectedQuantity(page)
}

async function clickAddToCart(page: Page): Promise<void> {
  // Match by exact text: "Agregar al carrito" is primary on some listings and
  // secondary on others (when "Comprar ahora" takes the primary slot).
  const byText = page
    .locator('button, a')
    .filter({ hasText: /^\s*Agregar al carrito\s*$/i })
    .first()

  if (await byText.count() > 0) {
    await byText.click()
    return
  }

  const byClass = page.locator('.ui-pdp-action--secondary, .ui-pdp-action--primary').first()
  if (await byClass.count() > 0) {
    await byClass.click()
    return
  }

  throw new Error('No se encontro el boton "Agregar al carrito" en la publicacion')
}

interface CartEntry {
  id: string
  quantity: number
}

/** Listing id and quantity of every row actually in the cart */
async function readCartItems(page: Page): Promise<CartEntry[]> {
  await page.goto(CART_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector(CART_ITEM_SELECTOR, { state: 'attached', timeout: CART_TIMEOUT }).catch(() => null)

  return page.evaluate((selector) => {
    const entries: { id: string; quantity: number }[] = []

    for (const card of document.querySelectorAll(selector)) {
      const href = card.querySelector('a[href*="MLA"]')?.getAttribute('href') || ''
      const id = href.match(/MLA-?U?\d+/)?.[0]
      if (!id) continue

      const quantityText = card.querySelector('.andes-input-stepper__value')?.textContent?.trim()
      const quantity = quantityText && /^\d+$/.test(quantityText) ? parseInt(quantityText, 10) : 1

      entries.push({ id, quantity })
    }

    return entries
  }, CART_ITEM_SELECTOR)
}

/**
 * Add the confirmed selections to the Mercado Libre cart, then read the cart
 * back to report what actually landed there.
 */
export async function addSelectionsToCart(selections: MeliSelection[]): Promise<MeliCartResult> {
  const result: MeliCartResult = { success: [], failed: [] }
  if (selections.length === 0) return result

  try {
    const { context } = await connectToChrome()
    const page = context.pages()[0] || await context.newPage()
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT)

    /** Selections that got through the click without throwing, pending cart confirmation */
    const attempted: MeliSelection[] = []

    for (const selection of selections) {
      try {
        console.log(`Agregando a Mercado Libre: ${selection.productName} (x${selection.quantity})`)

        await page.goto(selection.url, { waitUntil: 'domcontentloaded' })
        await delay(2500)

        if (!await isLoggedIn(page)) {
          throw new Error(LOGGED_OUT_ERROR)
        }

        const selectedQuantity = await setQuantity(page, selection.quantity)
        console.log(`  -> Cantidad seleccionada: ${selectedQuantity}`)

        await clickAddToCart(page)
        await delay(2500)

        attempted.push(selection)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`  -> Error con ${selection.productName}: ${message}`)
        result.failed.push({ id: selection.productId, name: selection.productName, error: message })

        // A logged-out session fails every remaining product the same way
        if (message === LOGGED_OUT_ERROR) {
          for (const pending of selections.slice(selections.indexOf(selection) + 1)) {
            result.failed.push({ id: pending.productId, name: pending.productName, error: message })
          }
          return result
        }
      }

      await delay(DELAY_BETWEEN_PRODUCTS)
    }

    // Confirm against the real cart instead of trusting the clicks
    const cartItems = await readCartItems(page)

    for (const selection of attempted) {
      const itemId = extractItemId(selection.url)
      const entry = itemId ? cartItems.find(item => item.id === itemId) : undefined

      if (!entry) {
        result.failed.push({
          id: selection.productId,
          name: selection.productName,
          error: 'No aparece en el carrito de Mercado Libre',
        })
      } else if (entry.quantity < selection.quantity) {
        result.failed.push({
          id: selection.productId,
          name: selection.productName,
          error: `Cantidad esperada: ${selection.quantity}, en el carrito: ${entry.quantity}`,
        })
      } else {
        result.success.push({ id: selection.productId, name: selection.productName })
      }
    }

    console.log(`\nResumen Mercado Libre: ${result.success.length} exitosos, ${result.failed.length} fallidos`)
  } catch (error) {
    throw describeConnectionError(error)
  }

  return result
}
