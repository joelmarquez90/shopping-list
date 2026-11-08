import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import { EventEmitter } from 'node:events'
import childProcess from 'node:child_process'
import fs from 'node:fs/promises'
import { chromium, type BrowserContext } from 'playwright'
import { openBrowserAt, connectToChrome, describeConnectionError } from '../src/lib/browser/chromeSession'
import { ApiError } from '../src/lib/server/automationPolicy'

const storeUrl = 'https://www.masonline.com.ar/'

test('human login and private-pipe automation take turns using the same dedicated profile', async () => {
  mock.method(fs, 'mkdir', async () => undefined)
  mock.method(fs, 'lstat', async () => ({ isDirectory: () => true }))
  mock.method(fs, 'chmod', async () => undefined)
  const children: EventEmitter[] = []
  const spawn = mock.method(childProcess, 'spawn', () => {
    const child = Object.assign(new EventEmitter(), { unref() {} })
    children.push(child)
    queueMicrotask(() => child.emit('spawn'))
    return child
  })
  const context = new EventEmitter() as EventEmitter & { close(): Promise<void> }
  let closes = 0
  context.close = async () => { closes++; context.emit('close') }
  const launch = mock.method(chromium, 'launchPersistentContext', async () => context as unknown as BrowserContext)

  try {
    await assert.rejects(openBrowserAt('https://attacker.example/'), /Tienda no permitida/)
    assert.equal(spawn.mock.callCount(), 0)
    await openBrowserAt(storeUrl)
    const [executable, args] = spawn.mock.calls[0].arguments
    assert.equal(executable, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    assert.ok(args?.includes(storeUrl))
    assert.ok(args?.some(arg => arg.startsWith('--user-data-dir=') && arg.endsWith('.masonline-session')))
    assert.ok(args?.every(arg => !/debugging|automation|no-sandbox|mock-keychain|password-store/.test(arg)))
    await assert.rejects(connectToChrome(), e => e instanceof ApiError && e.status === 409 && /⌘Q/.test(e.message))
    assert.equal(launch.mock.callCount(), 0)

    // A second launch forwards a tab and exits; the original login process still owns the profile.
    await openBrowserAt(storeUrl)
    children[1].emit('exit', 0)
    await assert.rejects(connectToChrome(), e => e instanceof ApiError && e.status === 409)
    children[0].emit('exit', 0)
    assert.equal((await connectToChrome()).context, context)
    assert.equal((await connectToChrome()).context, context)
    assert.equal(launch.mock.callCount(), 1)
    const [profile, options] = launch.mock.calls[0].arguments
    assert.ok(args?.includes(`--user-data-dir=${profile}`))
    assert.deepEqual(options?.ignoreDefaultArgs, ['--use-mock-keychain', '--password-store=basic'])
    assert.equal(options?.channel, 'chrome')
    assert.equal(options?.headless, false)

    // Returning to login flushes the automated context before opening normal Chrome.
    await openBrowserAt(storeUrl)
    assert.equal(closes, 1)
    children[2].emit('exit', 0)
    launch.mock.mockImplementation(async () => { throw new Error('Sensitive browser diagnostics') })
    await assert.rejects(connectToChrome(), e => e instanceof ApiError && e.status === 409 && !e.message.includes('Sensitive'))
  } finally {
    for (const child of children) child.emit('exit', 0)
    context.emit('close')
    mock.restoreAll()
  }
})

test('login launch failures are safe and do not keep automation locked', async () => {
  mock.method(fs, 'mkdir', async () => undefined)
  mock.method(fs, 'lstat', async () => ({ isDirectory: () => true }))
  mock.method(fs, 'chmod', async () => undefined)
  mock.method(childProcess, 'spawn', () => {
    const child = new EventEmitter()
    queueMicrotask(() => child.emit('error', new Error('Private executable path')))
    return child
  })
  const launch = mock.method(chromium, 'launchPersistentContext', async () => { throw new Error('locked') })
  try {
    await assert.rejects(openBrowserAt(storeUrl), e => e instanceof ApiError && e.status === 503 && !e.message.includes('Private'))
    await assert.rejects(connectToChrome(), e => e instanceof ApiError && e.status === 409)
    assert.equal(launch.mock.callCount(), 1)
    const actionable = new ApiError(409, 'Cerrá el Chrome de las tiendas.')
    assert.equal(describeConnectionError(actionable), actionable)
    assert.ok(!describeConnectionError(new Error('private diagnostics')).message.includes('private'))
  } finally {
    mock.restoreAll()
  }
})
