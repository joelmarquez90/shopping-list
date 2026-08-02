import { Page } from 'playwright'
import { connectToChrome, delay, describeConnectionError } from '@/lib/browser/chromeSession'
import { MeliCandidate, MeliSearchItem, MeliSearchProduct } from '@/types/meli'

const NAVIGATION_TIMEOUT = 45000
const DELAY_BETWEEN_SEARCHES = 1500
const RESULTS_TIMEOUT = 15000
const MAX_CANDIDATES = 4

const RESULT_ITEM_SELECTOR = 'li.ui-search-layout__item'

/**
 * Build the Mercado Libre listing URL for a product name.
 * "Aceite Girasol Natura 1,5L" -> "aceite-girasol-natura-15l"
 */
export function toSearchSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function isLoggedIn(page: Page): Promise<boolean> {
  return page.evaluate(() => !!document.querySelector('.nav-header-username'))
}

/**
 * Read the top listings off a Mercado Libre search results page.
 * Selectors are chained so a class rename on any single one is not fatal.
 */
async function scrapeCandidates(page: Page, max: number): Promise<MeliCandidate[]> {
  return page.evaluate(({ limit, selector }) => {
    const clean = (value: string | null | undefined) =>
      value?.replace(/\s+/g, ' ').trim() || undefined

    const pick = (root: Element, selectors: string[]): Element | null => {
      for (const selector of selectors) {
        const el = root.querySelector(selector)
        if (el) return el
      }
      return null
    }

    const items = document.querySelectorAll(selector)
    const results: MeliCandidate[] = []

    for (const item of items) {
      if (results.length >= limit) break

      const titleEl = pick(item, ['a.poly-component__title', '.poly-component__title', 'h3 a', 'h2 a'])
      const linkEl = pick(item, ['a.poly-component__title', 'a[href*="/p/MLA"]', 'a[href*="MLA"]'])
      const title = clean(titleEl?.textContent)
      const href = linkEl?.getAttribute('href')
      if (!title || !href) continue

      // Strip tracking fragments so the same listing is stable across runs
      const url = href.split('#')[0]

      // Sponsored results link through an ad redirect (click1/mclics) whose id
      // cannot be matched against the cart later. Keep only real listing URLs:
      // /p/MLA123 and /up/MLAU123 (catalog) or /MLA-123 (classic).
      if (!/\/(p|up)\/MLAU?\d+|\/MLA-\d+/.test(url)) continue
      if (results.some(r => r.url === url)) continue

      const amountEl = pick(item, [
        '.poly-price__current .andes-money-amount__fraction',
        '.andes-money-amount__fraction',
      ])
      const centsEl = item.querySelector('.poly-price__current .andes-money-amount__cents')
      const fraction = clean(amountEl?.textContent)
      const cents = clean(centsEl?.textContent)
      const price = fraction ? `$${fraction}${cents ? `,${cents}` : ''}` : 'Sin precio'

      const sellerEl = pick(item, ['.poly-component__seller', '.poly-component__brand'])
      const imgEl = pick(item, ['img.poly-component__picture', 'img'])
      const imageUrl =
        imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || undefined

      results.push({
        url,
        title,
        price,
        seller: clean(sellerEl?.textContent),
        imageUrl: imageUrl?.startsWith('http') ? imageUrl : undefined,
      })
    }

    return results
  }, { limit: max, selector: RESULT_ITEM_SELECTOR })
}

/**
 * Search each product on Mercado Libre and return the top candidates.
 * This is read-only: nothing is added to the cart here.
 */
export async function searchCandidates(products: MeliSearchProduct[]): Promise<MeliSearchItem[]> {
  const items: MeliSearchItem[] = []
  if (products.length === 0) return items

  try {
    const { context } = await connectToChrome()
    const page = context.pages()[0] || await context.newPage()
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT)

    // A background tab gets its rendering throttled, which starves the scraper
    await page.bringToFront()

    for (const product of products) {
      const item: MeliSearchItem = {
        productId: product.id,
        productName: product.name,
        quantity: product.quantity,
        candidates: [],
      }

      try {
        const slug = toSearchSlug(product.name)
        if (!slug) {
          throw new Error('El nombre no genera una busqueda valida')
        }

        console.log(`Buscando en Mercado Libre: ${product.name}`)
        await page.goto(`https://listado.mercadolibre.com.ar/${slug}`, { waitUntil: 'domcontentloaded' })

        // Wait for the results to actually render instead of guessing a delay.
        // 'attached' and not the default 'visible': the scraper reads the DOM,
        // and a background tab renders nothing while still building it.
        const hasResults = await page
          .waitForSelector(RESULT_ITEM_SELECTOR, { state: 'attached', timeout: RESULTS_TIMEOUT })
          .then(() => true)
          .catch(() => false)

        item.candidates = hasResults ? await scrapeCandidates(page, MAX_CANDIDATES) : []
        if (item.candidates.length === 0) {
          item.error = 'Sin resultados en Mercado Libre'
        }
      } catch (error) {
        item.error = error instanceof Error ? error.message : String(error)
        console.error(`  -> Error buscando ${product.name}: ${item.error}`)
      }

      items.push(item)
      await delay(DELAY_BETWEEN_SEARCHES)
    }

    console.log(`Busqueda terminada: ${items.filter(i => i.candidates.length > 0).length}/${items.length} con resultados`)
  } catch (error) {
    throw describeConnectionError(error)
  }

  return items
}
