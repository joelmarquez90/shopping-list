import { searchCandidates } from '@/lib/meli/search'
import { automationResponse } from '@/lib/server/automation'
import { readAutomationBody } from '@/lib/server/automationPolicy'
import { parseSearchProducts } from '@/lib/server/automationInput'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return automationResponse(request, async () => {
    const products = parseSearchProducts(await readAutomationBody(request))
    return { items: await searchCandidates(products) }
  })
}
