/**
 * The four states, and the rule that a screen whose QUESTION changes must re-ask it.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * THE DEFECT THE SECOND HALF OF THIS FILE PINS.
 *
 * `useResource` as the web template writes it re-runs its effect on `[nonce]` alone. `load` is
 * excluded on purpose — most callers recreate it every render and including it would make the
 * effect a render loop — and that is correct for a screen with one fixed question, which is every
 * screen the template was written for.
 *
 * It is wrong for a screen whose question changes. On this surface the question is a PATH
 * PARAMETER: `/backtests/:id` and `/bots/:id` reuse the same component when a customer moves from
 * one run to another, and with `[nonce]` as the only dependency the second address would render
 * the FIRST run's report — its return, its drawdown, its fee — under the new id in the address
 * bar. That is a page telling somebody a modelled number that belongs to a different run.
 *
 * The hook now takes the VALUES the question depends on. These tests assert that every page whose
 * question can change passes them, and that the pages whose question cannot do not pretend to.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { resourceState } from '../src/lib/resource.ts'

const read = (file: string): string => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

const notice = { message: 'boom', requestId: 'req-1', code: undefined, status: 500 }
/**
 * A 401 — which on this surface is now an ordinary failure and nothing more.
 *
 * There used to be a fifth state, `refused`, entered on 401 OR 403, because every `micro-indexer`
 * read demanded `indexer:read` or an admin. The reads are anonymous (`indexer/src/server.ts:792-801`)
 * and this bundle presents no credential, so an auth status can only mean the service was re-gated
 * or something in front of it injected one. Neither is a thing a reader can act on, and both are
 * exactly what `failed` says: a message, and a request id to quote.
 */
const authStatus = { message: 'nope', requestId: 'req-1', code: 'unauthenticated', status: 401 }

describe('the four states are four, and never collapse into each other', () => {
  it('is loading before anything has arrived', () => {
    assert.equal(resourceState({ loading: true, error: null, count: null }), 'loading')
  })

  it('is ok when there is something', () => {
    assert.equal(resourceState({ loading: false, error: null, count: 3 }), 'ok')
  })

  it('is empty when the query answered with nothing', () => {
    assert.equal(resourceState({ loading: false, error: null, count: 0 }), 'empty')
  })

  it('is failed when the query did not answer', () => {
    assert.equal(resourceState({ loading: false, error: notice, count: null }), 'failed')
  })

  it('an auth status is a failure like any other, with no state of its own', () => {
    assert.equal(resourceState({ loading: false, error: authStatus, count: null }), 'failed')
    assert.equal(
      resourceState({ loading: false, error: { ...authStatus, status: 403 }, count: null }),
      'failed',
    )
  })

  it('reports FAILURE rather than EMPTY when both could apply', () => {
    // A request that threw has told us nothing about whether data exists. Reporting "nothing
    // here" for a timeout is how an outage reads as a quiet week.
    assert.equal(resourceState({ loading: false, error: notice, count: 0 }), 'failed')
  })

  it('reports FAILURE rather than LOADING when both could apply', () => {
    assert.equal(resourceState({ loading: true, error: notice, count: null }), 'failed')
  })

  it('a failure outranks both loading and empty, whatever its status', () => {
    // A request that threw has told us nothing, so neither a spinner nor "no results" may hide it.
    assert.equal(resourceState({ loading: true, error: authStatus, count: 0 }), 'failed')
  })

  it('stays loading on a null count even when loading is false', () => {
    // No data and no error is a request that has not resolved. Calling it empty would render
    // "nothing here" for a request still in flight.
    assert.equal(resourceState({ loading: false, error: null, count: null }), 'loading')
  })
})

describe('a screen whose question can change re-asks it', () => {
  /** Every `useResource(...)` INVOCATION in a page, as source text. */
  function calls(page: string): string[] {
    const source = read(`src/pages/${page}.tsx`)
    const out: string[] = []
    // `useResource<T>(`, the INVOCATION — not `ReturnType<typeof useResource<T>>`, which is a type
    // annotation on a sub-component's props and carries no dependency array at all. The template's
    // matcher is `useResource[<(]`, which catches both; this surface splits its pages into a page
    // and its panels, so the looser form would report phantom call sites with no deps and would
    // have failed a correct file.
    for (const m of source.matchAll(/useResource<[^>]*>\(/g)) {
      const at = m.index
      const next = source.indexOf('\n\n', at)
      out.push(source.slice(at, next === -1 ? undefined : next))
    }
    return out
  }

  /**
   * There are exactly two reads on this surface and they have OPPOSITE dependency needs, which is
   * why both are asserted rather than one rule being applied to both.
   *
   * `chain.tsx` renders one panel per scope and the panel is a component that stays mounted while
   * its `scope` prop changes — so its read MUST take the scope as a dependency. Without it the
   * `ember:mainnet` panel would render the `ember:testnet` answer under a heading that says
   * mainnet, which on a page about a chain is not a stale panel, it is a wrong answer rendered
   * confidently.
   *
   * `faucet.tsx` asks one fixed question — what this faucet will do — and takes NO dependencies. A
   * dependency array there would be a value that never changes, and a reader would have to work out
   * which. `useResource` re-runs it on `reload` alone.
   */
  it('the chain panel re-asks when its scope changes', () => {
    const found = calls('chain')
    assert.equal(found.length, 1, `chain.tsx makes ${found.length} reads, not one`)
    assert.match(
      found[0] ?? '',
      /\[scope\.chain, scope\.network\]/,
      'the chain read does not re-run when the scope changes',
    )
  })

  it('and it really is one read per scope, driven from a list rather than written twice', () => {
    // Two panels, one component. A page that hard-coded two reads would work and would drift the
    // moment one of them was edited.
    const page = read('src/pages/chain.tsx')
    assert.match(page, /HEARTH_SCOPES\.map\(\(scope\) =>/)
    assert.match(page, /<ScopePanel key=\{`\$\{scope\.chain\}:\$\{scope\.network\}`\}/)
  })

  it('the faucet read asks a fixed question, so it takes NO dependencies', () => {
    const found = calls('faucet')
    assert.equal(found.length, 1, `faucet.tsx makes ${found.length} reads, not one`)
    assert.match(found[0] ?? '', /\[\],\n\s*\)/, 'the faucet terms read has grown a dependency')
    // …and it really does read the service, so this is not passing on a page that fetches nothing.
    assert.match(read('src/pages/faucet.tsx'), /getFaucetTerms\(signal\)/)
  })

  it('the pages that call nothing really call nothing', () => {
    // Three of the five routes are prose. A fetch on one of them would make the prose wait for a
    // service that is not needed to display it.
    for (const page of ['home', 'mine', 'node', 'not-found']) {
      assert.deepEqual(calls(page), [], `${page}.tsx now fetches something`)
      assert.doesNotMatch(read(`src/pages/${page}.tsx`), /from '\.\.\/lib\/api\.ts'/)
    }
  })

  it('no page passes `load` itself as a dependency', () => {
    // It is recreated every render by every caller here, so it would make the effect a render
    // loop — which is why the hook takes values rather than the closure.
    for (const page of ['chain', 'faucet']) {
      for (const call of calls(page)) {
        assert.doesNotMatch(call, /,\s*\[load\]/, `${page} passes load as a dependency`)
      }
    }
  })

  it('neither read reports EMPTY, because neither answer can be empty', () => {
    // Both `count` functions return 1 unconditionally, and that is a decision about the SHAPE of
    // the two answers rather than laziness. A `ChainStatus` always carries the chain's depth policy
    // even when it has observed nothing, and a `FaucetTerms` always carries the chain id and the
    // drip. An "empty" state on either would be a lie about a 200.
    for (const page of ['chain', 'faucet']) {
      assert.match(read(`src/pages/${page}.tsx`), /\(\) => 1,/, `${page}.tsx can report EMPTY`)
    }
  })

  it('the hook threads the dependencies into the effect rather than accepting and ignoring them', () => {
    // A parameter that is taken and dropped is worse than none: every call site then reads as
    // though it re-fetches.
    assert.match(read('src/lib/resource.ts'), /\}, \[nonce, \.\.\.deps\]\)/)
  })

  it('the hook still aborts the in-flight request when the question changes', () => {
    // The cleanup is what stops a slow answer to the old question landing after the new one.
    assert.match(read('src/lib/resource.ts'), /return \(\) => controller\.abort\(\)/)
  })
})
