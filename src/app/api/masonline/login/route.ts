import { openLoginPage } from '@/lib/masonline/cartAutomation'
import { automationResponse } from '@/lib/server/automation'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return automationResponse(request, async () => {
    await openLoginPage()
    return { ok: true }
  })
}
