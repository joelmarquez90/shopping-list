import { addProductsToCart } from '@/lib/masonline/cartAutomation'
import { automationResponse } from '@/lib/server/automation'
import { readAutomationBody } from '@/lib/server/automationPolicy'
import { parseMasonlineProducts } from '@/lib/server/automationInput'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return automationResponse(request, async () => {
    const products = parseMasonlineProducts(await readAutomationBody(request))
    return await addProductsToCart(products)
  })
}
