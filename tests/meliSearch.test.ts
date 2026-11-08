import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import { EventEmitter } from 'node:events'
import childProcess from 'node:child_process'
import fs from 'node:fs/promises'
import { chromium, type BrowserContext, type Route } from 'playwright'
import { searchCandidates } from '../src/lib/meli/search'
import { ApiError } from '../src/lib/server/automationPolicy'

const product = { id: 'ariel', name: 'Ariel', quantity: 1 }
const searchUrl = 'https://listado.mercadolibre.com.ar/ariel'

for (const { redirect, delayed } of [
  { redirect: 'https://mercadolibre.com.ar/captcha/wall?go_url=https%3A%2F%2Fevil.example', delayed: false },
  { redirect: 'https://www.mercadolibre.com/jms/mla/lgz/login', delayed: false },
  { redirect: 'https://www.mercadolibre.com.ar/captcha/wall', delayed: true },
]) {
  test(`search hands ${delayed ? 'delayed ' : ''}${new URL(redirect).pathname} to the human and stops the batch`, async () => {
    mock.method(fs, 'mkdir', async () => undefined)
    mock.method(fs, 'lstat', async () => ({ isDirectory: () => true }))
    mock.method(fs, 'chmod', async () => undefined)
    const child = Object.assign(new EventEmitter(), { unref() {} })
    const spawn = mock.method(childProcess, 'spawn', () => {
      queueMicrotask(() => child.emit('spawn'))
      return child
    })
    let url = 'about:blank'
    let closed = false
    const visited: string[] = []
    let navigationPolicy!: (route: Route) => Promise<void>
    const page = {
      route: async (_pattern: string, handler: typeof navigationPolicy) => { navigationPolicy = handler },
      setDefaultNavigationTimeout() {},
      bringToFront: async () => {},
      isClosed: () => closed,
      url: () => url,
      goto: async (destination: string) => {
        visited.push(destination)
        url = delayed ? destination : redirect
        await navigationPolicy({
          request: () => ({ isNavigationRequest: () => true, url: () => url }),
          abort: async () => { throw new Error('Legitimate store/account redirect blocked') },
          continue: async () => {},
        } as unknown as Route)
      },
      waitForSelector: async () => {
        assert.equal(delayed, true, 'Do not scrape a visible CAPTCHA as if it were a listing')
        url = redirect
        throw new Error('No listing while access verification is pending')
      },
      close: async () => { closed = true },
    }
    const context = Object.assign(new EventEmitter(), {
      newPage: async () => page,
      close: async () => { closed = true; context.emit('close') },
    })
    mock.method(chromium, 'launchPersistentContext', async () => context as unknown as BrowserContext)
    try {
      await assert.rejects(searchCandidates([product, { id: 'rice', name: 'Arroz', quantity: 2 }]),
        e => e instanceof ApiError && e.status === 409 && /Chrome normal/.test(e.message))
      assert.deepEqual(visited, [searchUrl], 'Stop instead of navigating through the rest of the batch')
      assert.equal(closed, true, 'Release the profile before normal Chrome opens')
      const args = spawn.mock.calls[0].arguments[1]
      assert.ok(args?.includes(searchUrl))
      assert.ok(!args?.includes(redirect), 'Never launch CAPTCHA go_url parameters or account tokens')
      assert.ok(args?.every(arg => !/debugging|automation/.test(arg)))
    } finally {
      child.emit('exit', 0)
      context.emit('close')
      mock.restoreAll()
    }
  })
}

test('an ordinary listing still returns safe candidates without opening a manual browser', async () => {
  mock.method(fs, 'mkdir', async () => undefined)
  mock.method(fs, 'lstat', async () => ({ isDirectory: () => true }))
  mock.method(fs, 'chmod', async () => undefined)
  const spawn = mock.method(childProcess, 'spawn', () => { throw new Error('No human check is needed') })
  const candidate = { url: 'https://www.mercadolibre.com.ar/p/MLA1234', title: 'Ariel', price: '$100' }
  const page = {
    route: async () => {}, setDefaultNavigationTimeout() {}, bringToFront: async () => {},
    isClosed: () => false, url: () => searchUrl, goto: async () => {},
    waitForSelector: async () => ({}), close: async () => {},
    evaluate: async () => [candidate, { ...candidate, url: 'https://evil.example/p/MLA1234' }],
  }
  const context = Object.assign(new EventEmitter(), { newPage: async () => page })
  mock.method(chromium, 'launchPersistentContext', async () => context as unknown as BrowserContext)
  try {
    const items = await searchCandidates([product])
    assert.deepEqual(items[0].candidates, [candidate])
    assert.equal(items[0].error, undefined)
    assert.equal(spawn.mock.callCount(), 0)
  } finally {
    context.emit('close')
    mock.restoreAll()
  }
})
