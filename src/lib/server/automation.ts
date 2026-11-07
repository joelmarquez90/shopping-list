import { NextResponse } from 'next/server'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { ApiError, assertAutomationOwner, assertAutomationRequest, withAutomationLock } from './automationPolicy'

export async function authorizeAutomation(request: Request): Promise<void> {
  const token = assertAutomationRequest(request)
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) throw new ApiError(503, 'Firebase del servidor no está configurado.')
  const app = getApps().find(a => a.name === 'automation') || initializeApp({ projectId }, 'automation')
  try {
    const user = await getAuth(app).verifyIdToken(token, true)
    assertAutomationOwner(user, process.env.AUTOMATION_OWNER_UID)
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(401, 'La sesión venció o no es válida.')
  }
}

export async function automationResponse(request: Request, action: () => Promise<unknown>) {
  try {
    await authorizeAutomation(request)
    const result = await withAutomationLock(action)
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500
    // Do not expose Playwright diagnostics, internal paths or remote page content.
    return NextResponse.json(
      { error: error instanceof ApiError ? error.message : 'No se pudo completar la automatización. Revisá la sesión local.' },
      { status, headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '3' } : {}) } },
    )
  }
}
