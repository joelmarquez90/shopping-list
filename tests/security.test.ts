import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import { isShoppingItems } from '../src/lib/shoppingStateValidation'
import { isProductUrl, isStoreUrl } from '../src/lib/storeUrls'
import { products } from '../src/data/products'
import { productInputError } from '../src/lib/productValidation'
import { ApiError, assertAutomationOwner, assertAutomationRequest, readAutomationBody, withAutomationLock } from '../src/lib/server/automationPolicy'
import { parseMasonlineProducts, parseMeliSelections, parseSearchProducts } from '../src/lib/server/automationInput'

const env = { ENABLE_BROWSER_AUTOMATION: 'true', AUTOMATION_OWNER_UID: 'owner', AUTOMATION_ORIGIN: 'http://localhost:3000' }
const request = (headers: Record<string, string> = {}, url = 'http://localhost:3000/api/masonline/login') => new Request(url, { method: 'POST', headers: { origin: 'http://localhost:3000', authorization: 'Bearer fake.token.signature', ...headers } })
const product = { id: 'rice', name: 'Arroz', quantity: 2, url: 'https://www.masonline.com.ar/arroz/p' }
const fails = (fn: () => unknown, status: number) => assert.throws(fn, e => e instanceof ApiError && e.status === status)

test('automation fails closed and pins its local origin and owner identity', () => {
  assert.equal(assertAutomationRequest(request(), env), 'fake.token.signature')
  fails(() => assertAutomationRequest(request(), {}), 503)
  fails(() => assertAutomationRequest(request({ origin: 'https://attacker.example' }), env), 403)
  fails(() => assertAutomationRequest(request({ authorization: '' }), env), 401)
  fails(() => assertAutomationRequest(request({}, 'http://attacker.example/api/masonline/login'), env), 403)
  fails(() => assertAutomationRequest(request(), { ...env, AUTOMATION_ORIGIN: 'https://public.example' }), 503)
  fails(() => assertAutomationOwner({ uid: 'other', email_verified: true }, 'owner'), 403)
  fails(() => assertAutomationOwner({ uid: 'owner', email_verified: false }, 'owner'), 403)
  assert.doesNotThrow(() => assertAutomationOwner({ uid: 'owner', email_verified: true }, 'owner'))
})

test('store URLs reject hostile schemes, hosts, credentials, ports and unrelated paths', () => {
  assert.equal(isProductUrl(product.url, 'masonline'), true)
  for (const url of ['http://www.masonline.com.ar/arroz/p', 'https://masonline.com.ar.attacker.example/arroz/p', 'https://masonline.com.ar@attacker.example/arroz/p', 'https://user:pass@www.masonline.com.ar/arroz/p', 'file:///etc/passwd', 'javascript:alert(1)', 'https://127.0.0.1/arroz/p', 'https://www.masonline.com.ar:9443/arroz/p', 'https://www.masonline.com.ar/account']) assert.equal(isProductUrl(url, 'masonline'), false, url)
  for (const url of ['https://www.mercadolibre.com.ar/p/MLA1234', 'https://www.mercadolibre.com.ar/nombre/p/MLA1234', 'https://articulo.mercadolibre.com.ar/MLA-1234-item-_JM', 'https://www.mercadolibre.com.ar/up/MLAU1234']) assert.equal(isProductUrl(url, 'meli'), true, url)
  assert.equal(isProductUrl('https://evil.example/p/MLA1234', 'meli'), false)
  assert.equal(isStoreUrl('https://www.mercadolibre.com.ar/gz/cart', 'meli'), true)
})

test('the existing catalog remains accepted by the destination policy', () => {
  for (const p of products) if (p.url) assert.equal(isProductUrl(p.url, 'masonline'), true, p.url)
})

test('automation input rejects wrong types, excessive batches and invalid quantities', () => {
  assert.deepEqual(parseMasonlineProducts({ products: [product] }), [product])
  for (const value of [null, {}, { products: [] }, { products: [null] }, { products: Array(101).fill(product) }]) fails(() => parseMasonlineProducts(value), 400)
  for (const quantity of ['2', 0, -1, 1.1, 100, Infinity, NaN]) fails(() => parseSearchProducts({ products: [{ ...product, quantity }] }), 400)
  fails(() => parseSearchProducts({ products: [{ ...product, name: 'x'.repeat(101) }] }), 400)
  fails(() => parseMasonlineProducts({ products: [{ ...product, url: 'https://evil.example/x/p' }] }), 400)
  fails(() => parseMeliSelections({ selections: [{ productId: 'x', productName: 'x', quantity: 1, url: product.url }] }), 400)
})

test('body parsing bounds actual streamed bytes and handles malformed JSON', async () => {
  const json = (body: string, headers = { 'content-type': 'application/json' }) => new Request('http://localhost', { method: 'POST', headers, body })
  assert.deepEqual(await readAutomationBody(json('{"products":[]}')), { products: [] })
  await assert.rejects(readAutomationBody(json('{')), e => e instanceof ApiError && e.status === 400)
  await assert.rejects(readAutomationBody(json('{}', { 'content-type': 'text/plain' })), e => e instanceof ApiError && e.status === 415)
  await assert.rejects(readAutomationBody(json(JSON.stringify({ value: 'x'.repeat(65536) }))), e => e instanceof ApiError && e.status === 413)
})

test('shared browser lock rejects concurrent jobs and releases after failure', async () => {
  let release!: () => void
  const running = withAutomationLock(() => new Promise<void>(resolve => { release = resolve }))
  await assert.rejects(withAutomationLock(async () => {}), e => e instanceof ApiError && e.status === 429)
  release()
  await running
  await assert.rejects(withAutomationLock(async () => {}), e => e instanceof ApiError && e.status === 429)
  let now = Date.now() + 4000
  const clock = mock.method(Date, 'now', () => now)
  try {
    await assert.rejects(withAutomationLock(async () => { throw new Error('fixture failure') }), /fixture failure/)
    now += 4000
    assert.equal(await withAutomationLock(async () => 'released'), 'released')
  } finally {
    clock.mock.restore()
  }
})

test('catalog input rejects dangerous URLs and out-of-range quantities', () => {
  assert.equal(productInputError({ name: 'Arroz', url: product.url, defaultQuantity: 99 }), null)
  for (const input of [{ name: ' ' }, { defaultQuantity: 100 }, { defaultQuantity: -1 }, { defaultQuantity: NaN }, { url: 'javascript:alert(1)' }, { url: 'https://evil.example/x/p' }]) assert.ok(productInputError(input))
})


test('all HTTP automation entrypoints reject anonymous callers before browser work', async () => {
  process.env.ENABLE_BROWSER_AUTOMATION = 'true'
  process.env.AUTOMATION_OWNER_UID = 'owner'
  process.env.AUTOMATION_ORIGIN = 'http://localhost:3000'
  const handlers = await Promise.all([
    import('../src/app/api/masonline/login/route'),
    import('../src/app/api/masonline/add-to-cart/route'),
    import('../src/app/api/meli/search/route'),
    import('../src/app/api/meli/add-to-cart/route'),
  ])
  try {
    for (const { POST } of handlers) {
      const response = await POST(request({ authorization: '' }))
      assert.equal(response.status, 401)
      assert.equal(response.headers.get('cache-control'), 'no-store')
    }
  } finally {
    delete process.env.ENABLE_BROWSER_AUTOMATION
    delete process.env.AUTOMATION_OWNER_UID
    delete process.env.AUTOMATION_ORIGIN
  }
})

test('saved shopping state rejects malformed fields and oversized maps', () => {
  assert.equal(isShoppingItems({ rice: { hay: false, comprado: true, quantity: 2 } }), true)
  for (const value of [null, [], { rice: { hay: false, comprado: true, quantity: '2' } }, { rice: { hay: false, comprado: true, quantity: 100 } }, Object.fromEntries(Array.from({ length: 501 }, (_, i) => [String(i), { hay: false, comprado: false, quantity: 1 }]))]) assert.equal(isShoppingItems(value), false)
})

test('a stalled body cannot turn a valid JSON prefix into an accepted request', async () => {
  const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode('{}')) } })
  const input = new Request('http://localhost', { method: 'POST', headers: { 'content-type': 'application/json' }, body: stream, duplex: 'half' } as RequestInit & { duplex: string })
  await assert.rejects(readAutomationBody(input), e => e instanceof ApiError && e.status === 408)
})
