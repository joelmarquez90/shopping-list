export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}

/** Pin the browser's single owner; the browser profile is never a multi-user service. */
export function assertAutomationRequest(request: Request, env: Readonly<Record<string, string | undefined>> = process.env): string {
  if (env.ENABLE_BROWSER_AUTOMATION !== 'true' || !env.AUTOMATION_OWNER_UID) {
    throw new ApiError(503, 'La automatización local no está configurada.')
  }
  const configured = env.AUTOMATION_ORIGIN || 'http://localhost:3000'
  let origin: URL
  try {
    origin = new URL(configured)
  } catch {
    throw new ApiError(503, 'El origen de automatización no es válido.')
  }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) ||
      !['http:', 'https:'].includes(origin.protocol) || configured !== origin.origin) {
    throw new ApiError(503, 'La automatización requiere un origen local.')
  }
  if (new URL(request.url).origin !== origin.origin || request.headers.get('origin') !== origin.origin) {
    throw new ApiError(403, 'Origen no permitido.')
  }
  const authorization = request.headers.get('authorization') || ''
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(authorization) || authorization.length > 8192) {
    throw new ApiError(401, 'Iniciá sesión para usar la automatización.')
  }
  return authorization.slice(7)
}

export function assertAutomationOwner(
  user: { uid: string; email_verified?: boolean },
  ownerUid: string | undefined,
): void {
  if (!ownerUid || user.uid !== ownerUid || user.email_verified !== true) {
    throw new ApiError(403, 'Esta sesión no puede controlar el navegador local.')
  }
}

const MAX_BODY_BYTES = 64 * 1024

export async function readAutomationBody(request: Request): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new ApiError(415, 'Se requiere application/json.')
  }
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
    throw new ApiError(413, 'La solicitud es demasiado grande.')
  }
  const reader = request.body?.getReader()
  if (!reader) throw new ApiError(400, 'Se requiere un cuerpo JSON.')
  let size = 0
  let timedOut = false
  const chunks: Uint8Array[] = []
  const timer = setTimeout(() => {
    timedOut = true
    void reader.cancel().catch(() => {})
  }, 5000)
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) throw new ApiError(413, 'La solicitud es demasiado grande.')
      chunks.push(value)
    }
    if (timedOut) throw new ApiError(408, 'Se agotó el tiempo para recibir la solicitud.')
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(400, 'El cuerpo JSON no es válido.')
  } finally {
    clearTimeout(timer)
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

type JobState = { busy: boolean; nextStart: number }
const shared = globalThis as typeof globalThis & { automationJob?: JobState }
const state = shared.automationJob ??= { busy: false, nextStart: 0 }

export async function withAutomationLock<T>(job: () => Promise<T>): Promise<T> {
  if (state.busy || Date.now() < state.nextStart) {
    throw new ApiError(429, 'El navegador está ocupado. Intentá de nuevo en unos segundos.')
  }
  state.busy = true
  state.nextStart = Date.now() + 3000
  try {
    return await job()
  } finally {
    state.busy = false
  }
}
