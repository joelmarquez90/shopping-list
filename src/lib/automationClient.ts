import { auth } from './firebase'

export async function automationFetch(path: string, body: unknown = {}): Promise<Response> {
  const user = auth?.currentUser
  if (!user) throw new Error('Iniciá sesión para usar la automatización.')
  const token = await user.getIdToken()
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}
