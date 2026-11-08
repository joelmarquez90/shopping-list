import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import { EventEmitter } from 'node:events'
import childProcess from 'node:child_process'
import fs from 'node:fs/promises'
import { chromium, type BrowserContext } from 'playwright'
import { openBrowserAt, connectToChrome, describeConnectionError } from '../src/lib/browser/chromeSession'
import { ApiError } from '../src/lib/server/automationPolicy'

const storeUrl = 'https://www.masonline.com.ar/'

class LoginProcess extends EventEmitter {
  exitCode: number | null = null
  signalCode: NodeJS.Signals | null = null
  kill = mock.fn((signal: NodeJS.Signals): boolean => signal === 'SIGTERM')
  unref() {}
  exit() {
    this.exitCode = 0
    this.emit('exit', 0)
  }
}

test('human login and private-pipe automation take turns using the same dedicated profile', async () => {
  mock.method(fs, 'mkdir', async () => undefined)
  mock.method(fs, 'lstat', async () => ({ isDirectory: () => true }))
  mock.method(fs, 'chmod', async () => undefined)
  const children: LoginProcess[] = []
  const spawn = mock.method(childProcess, 'spawn', () => {
    const child = new LoginProcess()
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
    assert.equal(launch.mock.callCount(), 0)

    // A second launch forwards a tab and exits; the original login process still owns the profile.
    await openBrowserAt(storeUrl)
    children[1].exit()
    const connecting = connectToChrome()
    assert.deepEqual(children[0].kill.mock.calls[0].arguments, ['SIGTERM'])
    assert.equal(children[1].kill.mock.callCount(), 0)
    // Never reopen the profile before Chrome has finished flushing it.
    assert.equal(launch.mock.callCount(), 0)
    children[0].exit()
    assert.equal((await connecting).context, context)
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
    children[2].exit()
    launch.mock.mockImplementation(async () => { throw new Error('Sensitive browser diagnostics') })
    await assert.rejects(connectToChrome(), e => e instanceof ApiError && e.status === 409 && !e.message.includes('Sensitive'))
  } finally {
    for (const child of children) child.exit()
    context.emit('close')
    mock.restoreAll()
  }
})

test('failed handover keeps the profile closed to automation and allows retry without force-killing', async () => {
  mock.method(fs, 'mkdir', async () => undefined)
  mock.method(fs, 'lstat', async () => ({ isDirectory: () => true }))
  mock.method(fs, 'chmod', async () => undefined)
  const child = new LoginProcess()
  mock.method(childProcess, 'spawn', () => {
    queueMicrotask(() => child.emit('spawn'))
    return child
  })
  const context = new EventEmitter()
  const launch = mock.method(chromium, 'launchPersistentContext', async () => context as unknown as BrowserContext)
  try {
    await openBrowserAt(storeUrl)
    child.kill.mock.mockImplementation(() => { throw new Error('private process error') })
    await assert.rejects(connectToChrome(), e => e instanceof ApiError && e.status === 409 && !e.message.includes('private'))
    assert.equal(launch.mock.callCount(), 0)

    child.kill.mock.mockImplementation(() => true)
    mock.timers.enable({ apis: ['setTimeout'] })
    const rejected = assert.rejects(connectToChrome(), e => e instanceof ApiError && e.status === 409 && /sin abrir «Sesión»/.test(e.message))
    mock.timers.tick(10000)
    await rejected
    assert.equal(launch.mock.callCount(), 0)
    assert.ok(child.kill.mock.calls.every(call => call.arguments[0] === 'SIGTERM'))
    mock.timers.reset()

    // Reconcile an exited child even if the exit listener has not run yet.
    child.exitCode = 0
    const signalCount = child.kill.mock.callCount()
    await connectToChrome()
    assert.equal(child.kill.mock.callCount(), signalCount)
    assert.equal(launch.mock.callCount(), 1)
  } finally {
    child.exit()
    context.emit('close')
    mock.timers.reset()
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
