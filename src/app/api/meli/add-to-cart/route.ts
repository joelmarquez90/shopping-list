import { addSelectionsToCart } from '@/lib/meli/cartAutomation'
import { automationResponse } from '@/lib/server/automation'
import { readAutomationBody } from '@/lib/server/automationPolicy'
import { parseMeliSelections } from '@/lib/server/automationInput'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return automationResponse(request, async () => {
    const products = parseMeliSelections(await readAutomationBody(request))
    return await addSelectionsToCart(products)
  })
}
