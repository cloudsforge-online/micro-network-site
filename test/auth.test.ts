/**
 * THE `/auth/me` SHAPE, AND THE ABSENCE OF A GATE.
 *
 * The profile is **nested under `user`** (`identity/src/server.ts:1286-1302`, built by `toPublicUser`
 * at `identity/src/users.ts:52-63`). The web template used to declare `interface Me { handle?, roles? }`
 * and read both off the TOP level, where they are not; four frontends inherited it, `roles` was then
 * always null, `isAdmin` in the shared bar was always false, and the switcher hid every `adminOnly`
 * entry from every signed-in operator.
 *
 * There is no flat fallback here and its absence is pinned. The template's own reason
 * (`web-template/src/lib/auth.tsx`) is the right one: "Tolerating the flat one as a fallback would
 * encode a response identity does not send, and the next reader would not be able to tell which is
 * real."
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { readReader } from '../src/lib/auth.tsx'

const at = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))

describe('the reader is read out of the nested shape', () => {
  it('takes handle and roles from `user`', () => {
    assert.deepEqual(readReader({ user: { handle: 'ada', roles: ['admin'] } }), {
      handle: 'ada',
      roles: ['admin'],
    })
  })

  it('REFUSES the flat shape, rather than tolerating it', () => {
    // The assertion that would have caught the estate's original defect. A flat body must produce
    // nobody, so a service that started answering flat is a visible change rather than a silent
    // half-working session.
    assert.deepEqual(readReader({ handle: 'ada', roles: ['admin'] }), { handle: null, roles: [] })
  })

  it('survives null, a string, an array and a missing user', () => {
    for (const body of [null, 'nope', [], {}, { user: null }, { user: 'x' }]) {
      assert.deepEqual(readReader(body), { handle: null, roles: [] })
    }
  })

  it('drops a non-string role rather than rendering one', () => {
    assert.deepEqual(readReader({ user: { handle: 'a', roles: ['ok', 3, null] } }), {
      handle: 'a',
      roles: ['ok'],
    })
  })

  it('treats an empty handle as no handle', () => {
    assert.deepEqual(readReader({ user: { handle: '', roles: [] } }), { handle: null, roles: [] })
  })
})

describe('nothing on this surface is gated', () => {
  const source = readFileSync(at('src/lib/auth.tsx'), 'utf8')

  it('there is no ProtectedRoute in this module', () => {
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !/^\s*\/\//.test(line))
      .join('\n')
    assert.doesNotMatch(code, /ProtectedRoute/)
  })

  it('and nothing consults a role before making a request', () => {
    // A client that predicts an authorisation decision is a client that will eventually disagree
    // with the service making it. `roles` reaches the shared bar and stops there.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(code, /isAdmin|roles\.includes/)
  })

  it('the session is used for the bar and for nothing else', () => {
    assert.match(source, /nimbus<unknown>\('\/auth\/me'\)/)
    // The one caller. Every other module reaches `chainIndex` or `faucet`, both of which pass
    // `auth: false`.
    for (const file of ['src/lib/chainstatus.ts', 'src/lib/faucet.ts']) {
      assert.doesNotMatch(readFileSync(at(file), 'utf8'), /useSession|auth\.tsx/)
    }
  })
})

describe('the /auth/me citation is a line that exists', () => {
  it('names the route handler in micro-identity', () => {
    const root = at('../identity')
    if (!existsSync(`${root}/src/server.ts`)) {
      console.log('UNCHECKED: the /auth/me citation — micro-identity is not checked out')
      return
    }
    const lines = readFileSync(`${root}/src/server.ts`, 'utf8').split('\n')
    // `identity/src/server.ts:1286-1302`, cited in four files here. Read the range rather than a
    // single line, because a range that has drifted onto a different handler reads as verified.
    const cited = lines.slice(1179, 1192).join('\n')
    assert.match(cited, /\/auth\/me/, `identity/src/server.ts:1286-1302 is:\n${cited.slice(0, 200)}`)
  })

  it('and the body really is built nested', () => {
    const root = at('../identity')
    if (!existsSync(`${root}/src/users.ts`)) return
    const lines = readFileSync(`${root}/src/users.ts`, 'utf8').split('\n')
    assert.match(lines.slice(51, 63).join('\n'), /handle/, 'toPublicUser is no longer at :52-63')
  })
})
