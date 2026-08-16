/**
 * NO BEARER REACHES THE CHAIN INDEX OR THE FAUCET, MEASURED ON THE WIRE.
 *
 * `test/chainstatus.test.ts` and `test/faucet.test.ts` prove that every call goes through a single
 * `auth: false` helper. That is a check on the SHAPE of a module, and a shape check cannot see a
 * header. This file drives each of the four public calls with an access token in storage and
 * inspects what `fetch` was handed — which is the only form of the assertion a rewrite of the
 * clients cannot walk around.
 *
 * The control matters as much as the assertion: a stub that never sees a header would make all four
 * checks pass while measuring nothing. `the stub WOULD have seen one` drives an authenticated call
 * through the same stub and requires the header to appear, so a broken stub fails loudly.
 */
import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import {
  ApiError,
  __resetAuth,
  hasSession,
  noticeFor,
  readErrorBody,
  setTokens,
} from '../src/lib/api.ts'
import { getChainStatus } from '../src/lib/chainstatus.ts'
import { getDrip, getFaucetTerms, requestDrip } from '../src/lib/faucet.ts'
import { nimbus } from '../src/lib/api.ts'
import {
  installFetch,
  installStorage,
  installWindow,
  json,
  removeStorage,
  removeWindow,
  type FetchStub,
} from './browser-stubs.ts'

let stub: FetchStub | null = null

afterEach(() => {
  stub?.restore()
  stub = null
  removeStorage()
  removeWindow()
  __resetAuth()
})

/** A browser with a live session in storage. Every check below runs with one. */
function signedIn(): void {
  installWindow('https://network.cloudsforge.online/chain')
  installStorage({ 'cf.accessToken': 'access-token', 'cf.refreshToken': 'refresh-token' })
  assert.ok(hasSession(), 'the fixture did not establish a session, so the check proves nothing')
}

describe('the public calls send no credential', () => {
  const CALLS: ReadonlyArray<{ name: string; run: () => Promise<unknown> }> = [
    { name: 'chainStatus', run: () => getChainStatus({ chain: 'ember', network: 'testnet' }) },
    { name: 'faucetTerms', run: () => getFaucetTerms() },
    {
      name: 'requestDrip',
      run: () => requestDrip({ address: '0x0000000000000000000000000000000000000001', idempotencyKey: 'k' }),
    },
    { name: 'getDrip', run: () => getDrip('00000000-0000-4000-8000-000000000000') },
  ]

  for (const call of CALLS) {
    it(`${call.name} sends no authorization header`, async () => {
      signedIn()
      stub = installFetch(() => json(200, {}))
      await call.run()
      assert.equal(stub.calls.length, 1, `${call.name} made ${stub.calls.length} requests`)
      const headers = stub.calls[0]?.headers ?? {}
      const keys = Object.keys(headers).map((k) => k.toLowerCase())
      assert.equal(
        keys.includes('authorization'),
        false,
        `${call.name} sent ${JSON.stringify(headers)} with a session in storage`,
      )
    })
  }

  it('and the stub WOULD have seen one — the control that makes the four above mean something', () => {
    // Without this, a stub that dropped every header would pass all four checks while measuring
    // nothing. `/auth/me` is the one call in this bundle that DOES take a bearer.
    signedIn()
    stub = installFetch(() => json(200, { user: { handle: 'x' } }))
    return nimbus('/auth/me').then(() => {
      const headers = stub?.calls[0]?.headers ?? {}
      const keys = Object.keys(headers).map((k) => k.toLowerCase())
      assert.ok(keys.includes('authorization'), 'the stub cannot see headers at all')
      assert.equal(headers['authorization'], 'Bearer access-token')
    })
  })

  it('no public call sets any request header beyond accept and content-type', () => {
    // Neither service reads one. `micro-indexer` reads `authorization` on a domain route and
    // nothing else (`indexer/src/server.ts`); `micro-faucet` reads `authorization` and
    // `x-faucet-token` on /metrics only (`faucet/src/server.ts`). An `Idempotency-Key`
    // in particular would be silently ignored — the faucet's is a BODY FIELD
    // (`faucet/src/server.ts`).
    signedIn()
    stub = installFetch(() => json(200, {}))
    return requestDrip({ address: '0x0000000000000000000000000000000000000001', idempotencyKey: 'k' }).then(
      () => {
        const keys = Object.keys(stub?.calls[0]?.headers ?? {}).map((k) => k.toLowerCase()).sort()
        assert.deepEqual(keys, ['accept', 'content-type'])
      },
    )
  })

  it('the drip body carries exactly the two fields the handler reads', () => {
    signedIn()
    stub = installFetch(() => json(202, {}))
    return requestDrip({ address: '0xABC', idempotencyKey: 'key-1' }).then(() => {
      const body = JSON.parse(stub?.calls[0]?.body ?? '{}') as Record<string, unknown>
      assert.deepEqual(Object.keys(body).sort(), ['address', 'idempotencyKey'])
      assert.equal(body['address'], '0xABC')
    })
  })
})

describe('the request URLs are the ones the registry resolves', () => {
  it('the chain read goes to the explorer host, cross-origin from this page', () => {
    signedIn()
    stub = installFetch(() => json(200, {}))
    return getChainStatus({ chain: 'ember', network: 'mainnet' }).then(() => {
      assert.equal(
        stub?.calls[0]?.url,
        'https://explorer.cloudsforge.online/v1/chains/ember/mainnet/status',
      )
    })
  })

  it('and the TESTNET scope goes to the testnet explorer, from this same mainnet page', () => {
    // This asserted `explorer.cloudsforge.online` for a testnet scope until 2026-08-16, which is
    // the defect rather than the contract: this page is `network.cloudsforge.online`, it renders a
    // mainnet panel and a testnet panel side by side, and the mainnet estate's index does not walk
    // testnet — so that request could only ever come back "never observed". The network in the
    // path and the network in the origin are one decision now (`src/lib/viewed.ts`).
    signedIn()
    stub = installFetch(() => json(200, {}))
    return getChainStatus({ chain: 'ember', network: 'testnet' }).then(() => {
      assert.equal(
        stub?.calls[0]?.url,
        'https://explorer-testnet.cloudsforge.online/v1/chains/ember/testnet/status',
      )
    })
  })

  it('the faucet call is RELATIVE, because the registry puts the faucet on this host', () => {
    signedIn()
    stub = installFetch(() => json(200, {}))
    return getFaucetTerms().then(() => {
      assert.equal(stub?.calls[0]?.url, 'https://network.cloudsforge.online/v1/faucet')
    })
  })

  it('…and the basePath is not in the path, which would be a route nobody serves', () => {
    // `${hosts.faucet}/v1/faucet` would be `/faucet/v1/faucet`. Every path micro-faucet serves
    // begins `/v1` (`faucet/src/server.ts`).
    signedIn()
    stub = installFetch(() => json(200, {}))
    return getFaucetTerms().then(() => {
      assert.doesNotMatch(stub?.calls[0]?.url ?? '', /\/faucet\/v1\//)
    })
  })
})

describe('the error envelope', () => {
  it('reads the estate’s nested shape', () => {
    assert.deepEqual(
      readErrorBody({ error: { code: 'address_cooldown', message: 'wait', requestId: 'req-9' } }),
      { message: 'wait', code: 'address_cooldown', requestId: 'req-9' },
    )
  })

  it('and tolerates a flat one, for a proxy or an older service on the rollback path', () => {
    assert.deepEqual(readErrorBody({ error: 'nope', requestId: 'req-1' }), {
      message: 'nope',
      requestId: 'req-1',
    })
  })

  it('never renders an object as the message, which is the defect it replaced', () => {
    const notice = noticeFor(new ApiError(429, 'wait a day', 'address_cooldown', 'req-2'), 'fallback')
    assert.equal(notice.message, 'wait a day')
    assert.equal(notice.code, 'address_cooldown')
    assert.equal(notice.requestId, 'req-2')
    assert.doesNotMatch(notice.message, /\[object Object\]/)
  })

  it('carries the CODE through, because a page branches on it', () => {
    // Dropping it is how `micro-market` and `micro-mint` each rendered a router 404 as a fact about
    // a chain. Here it is how the faucet page tells a rate limit from a fault.
    signedIn()
    stub = installFetch(() =>
      json(429, { error: { code: 'budget_exhausted', message: 'come back tomorrow', requestId: 'r' } }),
    )
    return requestDrip({ address: '0x1', idempotencyKey: 'k' }).then(
      () => assert.fail('a 429 resolved'),
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.equal(err.status, 429)
        assert.equal(err.code, 'budget_exhausted')
        assert.equal(err.message, 'come back tomorrow')
      },
    )
  })

  it('a network failure is a status of 0 and a sentence that blames nobody', () => {
    // A CORS refusal, a dead container and a bad connection are indistinguishable to a page, and
    // inventing a more specific diagnosis from here would be a guess. The /chain page adds the
    // specific, CITED reason itself — which is a fact about this estate rather than about the wire.
    signedIn()
    stub = installFetch(() => {
      throw new TypeError('Failed to fetch')
    })
    return getChainStatus({ chain: 'ember', network: 'testnet' }).then(
      () => assert.fail('a thrown fetch resolved'),
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.equal(err.status, 0)
        assert.match(err.message, /did not answer this page/)
      },
    )
  })
})

describe('the 401 guard is the template’s, not a fork of it', () => {
  it('does not expire a session that never existed', () => {
    // `auth` means "attach a bearer IF we hold one", not "we hold one". Expiring a session that
    // never existed dispatches `cf:auth-expired` and signs a user out of nothing. Reported by
    // micro-explorer-web and fixed upstream at `web-template/src/lib/api.ts`.
    installWindow('https://network.cloudsforge.online/chain')
    installStorage({})
    stub = installFetch(() => json(401, { error: { code: 'unauthenticated', message: 'no' } }))
    return getChainStatus({ chain: 'ember', network: 'testnet' }).then(
      () => assert.fail('a 401 resolved'),
      () => {
        // No `cf:auth-expired` dispatched, because there was no session to end.
        assert.equal(hasSession(), false)
      },
    )
  })
})

describe('tokens', () => {
  it('round-trip through storage', () => {
    installWindow('https://network.cloudsforge.online/')
    const store = installStorage({})
    setTokens({ accessToken: 'a', refreshToken: 'r' })
    assert.equal(store.get('cf.accessToken'), 'a')
    assert.equal(store.get('cf.refreshToken'), 'r')
    assert.ok(hasSession())
  })

  it('use the shared CloudsForge keys, so a session established elsewhere is picked up', () => {
    installWindow('https://network.cloudsforge.online/')
    installStorage({ 'cf.accessToken': 'a', 'cf.refreshToken': 'r' })
    assert.ok(hasSession())
  })
})
