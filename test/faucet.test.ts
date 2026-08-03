/**
 * THE FAUCET ROUTE TABLE, CHECKED AGAINST THE SERVICE THAT SERVES IT.
 *
 * `micro-faucet` does not have a module-level route table the way `micro-indexer` does. Its routes
 * are `define(method, path, handler)` calls inside `buildRoutes()`
 * (`faucet/src/server.ts:298-438`), so the line a route is "registered at" is the `define` line
 * itself. This file reads those lines out of the service and matches the method and the path
 * against each citation — the same check `test/chainstatus.test.ts` runs against the indexer's
 * `DOMAIN`, adapted to the shape this service actually has rather than to the shape it would be
 * convenient for it to have.
 *
 * That adaptation is the point. A checker written for one service's table and pointed at another's
 * would find nothing and pass, which is the failure mode of every guard in this estate that has
 * ever gone quiet.
 *
 * ── EVERY ROUTE IS CALLED OR DECLINED ────────────────────────────────────────────────────────
 *
 * Three called, four declined, and the union is asserted to be exactly the set of `define` calls in
 * the service. A route the faucet grows that neither table knows about is a red run.
 *
 * ── NO LINE NUMBER IS HARDCODED INSIDE A CHECK ────────────────────────────────────────────────
 *
 * Every line appears once, in the table below, and every assertion reads it from there. Two guards
 * elsewhere in this estate kept passing while grading a different function after a shift, because
 * the number had been written into the assertion instead.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { DRIP_STATUSES, REFUSAL_CODES, isRefusal } from '../src/lib/faucet.ts'

const here = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))

const FAUCET_CANDIDATES = [process.env['CLOUDSFORGE_FAUCET_DIR'], here('../faucet')].filter(
  (v): v is string => Boolean(v),
)
const faucetRoot = FAUCET_CANDIDATES.find((p) => existsSync(`${p}/src/server.ts`))

const client = readFileSync(here('src/lib/faucet.ts'), 'utf8')

/** The three routes this bundle calls, with the `define` line each was read from. */
const CALLED: ReadonlyArray<{ method: string; path: string; line: number }> = [
  { method: 'GET', path: '/v1/faucet', line: 341 },
  { method: 'POST', path: '/v1/drips', line: 375 },
  { method: 'GET', path: '/v1/drips/:id', line: 411 },
]

/** Every route the faucet serves that this bundle does not call, with the reason it does not. */
const DECLINED: ReadonlyArray<{ method: string; path: string; line: number; why: string }> = [
  {
    method: 'OPTIONS',
    path: '/v1/drips',
    line: 432,
    why: 'the CORS preflight, issued by the browser rather than by application code; calling it explicitly would be a second, pointless request',
  },
  {
    method: 'GET',
    path: '/metrics',
    line: 315,
    why: 'gated on purpose — an open /metrics publishes the remaining budget, and a browser bundle holds no operator credential and must not',
  },
  {
    method: 'GET',
    path: '/livez',
    line: 308,
    why: 'a platform probe; rendering it would report that a process is up, which is not a fact about the faucet',
  },
  {
    method: 'GET',
    path: '/readyz',
    line: 310,
    why: 'a platform probe; Beacon owns the question of whether a service is in the balancer',
  },
]

/** Every request path this client sends, read out of its source with the prose stripped. */
function requestedPaths(source: string): readonly string[] {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n')
  return [
    ...[...code.matchAll(/'(\/v1\/[^']*)'/g)].map((m) => m[1] ?? ''),
    ...[...code.matchAll(/`(\/v1\/[^`]*)`/g)].map((m) => m[1] ?? ''),
  ].filter((p) => p.length > 1)
}

/** Same segment-count matcher as the indexer check. Whole shapes, never prefixes. */
function matches(requested: string, pattern: string): boolean {
  const asked = requested.split('/')
  const serves = pattern.split('/')
  if (asked.length !== serves.length) return false
  return serves.every((segment, index) => {
    const mine = asked[index] ?? ''
    return segment.startsWith(':') ? mine.length > 0 : segment === mine
  })
}

const placeholder = (path: string): string => path.replace(/\$\{[^}]*\}/g, 'x')

describe('the faucet client calls only routes it has cited', () => {
  it('sends exactly the three paths the table names', () => {
    const shapes = requestedPaths(client).map(placeholder).sort()
    assert.deepEqual(shapes, ['/v1/drips', '/v1/drips/x', '/v1/faucet'])
  })

  it('every path it sends is a whole route shape the faucet serves', () => {
    const served = [...CALLED, ...DECLINED].map((r) => r.path)
    for (const path of requestedPaths(client)) {
      assert.ok(
        served.some((pattern) => matches(placeholder(path), pattern)),
        `${path} is not a route micro-faucet serves`,
      )
    }
  })

  it('cites a line for every route, called and declined', () => {
    for (const route of [...CALLED, ...DECLINED]) {
      assert.ok(
        client.includes(`faucet/src/server.ts:${route.line}`),
        `${route.method} ${route.path} has no citation in src/lib/faucet.ts`,
      )
    }
  })

  it('gives every declined route a real reason', () => {
    for (const route of DECLINED) {
      assert.ok(route.why.length > 40, `${route.method} ${route.path} has no real reason`)
    }
  })

  it('reaches the generic client exactly once, and only inside publicCall', () => {
    const code = client
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*)/.test(line))
      .join('\n')
    assert.match(code, /function publicCall<T>/, 'the single-decision helper is gone')
    assert.equal(
      [...code.matchAll(/\bauth: false\b/g)].length,
      1,
      'auth: false is written more than once, so one of them can be forgotten',
    )
    const calls = [...code.matchAll(/\bfaucet</g)]
    assert.equal(calls.length, 1, `reaches faucet() ${calls.length} times; only publicCall may`)
    const helper = code.indexOf('function publicCall<T>')
    const helperEnd = code.indexOf('\n}\n', helper)
    assert.ok(helperEnd > helper)
    const where = calls[0]?.index ?? -1
    assert.ok(where > helper && where < helperEnd, 'the faucet() call is outside publicCall')
  })

  it('sends no amount, anywhere, under any name', () => {
    // The rule `faucet/src/requests.ts:126-131` states in the frozen service's words: "every faucet
    // that has ever been drained let the caller influence the amount". Asserted as an ABSENCE over
    // the whole client and the page that drives it, because the reflex is to add a field.
    const page = readFileSync(here('src/pages/faucet.tsx'), 'utf8')
    const strip = (s: string) =>
      s
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
        .split('\n')
        .filter((line) => !/^\s*(\/\/|\*)/.test(line))
        .join('\n')
    for (const [name, source] of [
      ['src/lib/faucet.ts', strip(client)],
      ['src/pages/faucet.tsx', strip(page)],
    ] as const) {
      // The REQUEST-BUILDING side only. `dripWei` and `amountWei` are fields on what the service
      // ANSWERS with and are rendered, so a blanket ban on the word would fail a correct file —
      // which is the kind of check somebody deletes rather than satisfies.
      assert.doesNotMatch(source, /\bbody:\s*\{[^}]*amount/i, `${name} puts an amount in a body`)
      assert.doesNotMatch(source, /requestDrip\([^)]*amount/i, `${name} passes an amount to requestDrip`)
    }
    // …and positively: the drip body is exactly two fields, named.
    assert.match(
      strip(client),
      /body:\s*\{ address: input\.address, idempotencyKey: input\.idempotencyKey \}/,
      'the drip body is no longer exactly the two fields the handler reads',
    )
    // The client's public signature has no amount parameter, which is where one would arrive.
    assert.match(
      strip(client),
      /export function requestDrip\(\n\s*input: \{ address: string; idempotencyKey: string \},/,
      'requestDrip has grown a parameter',
    )
  })

  it('sends the idempotency key as a BODY FIELD and never as a header', () => {
    // `micro-trade` requires an `Idempotency-Key` HEADER on every mutation
    // (`trade/src/server.ts:840-848`) and `micro-faucet` reads a body field
    // (`faucet/src/server.ts:386-388`). Two clients that look alike and are not interchangeable is
    // exactly the shape this estate keeps shipping, so both halves are asserted.
    const code = client.replace(/\/\*[\s\S]*?\*\//g, '')
    assert.match(code, /idempotencyKey: input\.idempotencyKey/, 'the key is no longer a body field')
    assert.doesNotMatch(code, /'Idempotency-Key'/i, 'an Idempotency-Key header is being sent')
    assert.doesNotMatch(code, /headers:/, 'this client sets a request header, and neither route reads one')
  })
})

describe('the refusal codes are the service’s', () => {
  it('recognises all five and nothing else', () => {
    for (const code of REFUSAL_CODES) assert.ok(isRefusal(code))
    for (const code of ['internal', 'not_found', 'unauthenticated', undefined, '']) {
      assert.equal(isRefusal(code), false, `${String(code)} was taken for a refusal`)
    }
  })
})

/* ══════════════════════════ the cross-repository half ══════════════════════════ */

describe('the cited lines are the lines that define the routes', () => {
  if (faucetRoot === undefined) {
    it('SKIPPED: no micro-faucet checkout — CI checks one out and requires this to run', () => {
      assert.ok(true)
    })
    return
  }

  const server = readFileSync(`${faucetRoot}/src/server.ts`, 'utf8')
  const lines = server.split('\n')
  const requests = readFileSync(`${faucetRoot}/src/requests.ts`, 'utf8')
  const limits = readFileSync(`${faucetRoot}/src/limits.ts`, 'utf8')

  it('reads a server with route definitions in it, so this cannot pass on an empty file', () => {
    const defined = lines.filter((l) => /define\('[A-Z]+', '/.test(l))
    assert.equal(defined.length, 7, `expected seven define() calls, found ${defined.length}`)
  })

  for (const route of [...CALLED, ...DECLINED]) {
    it(`${route.method} ${route.path} is defined at faucet/src/server.ts:${route.line}`, () => {
      const line = lines[route.line - 1] ?? ''
      assert.match(
        line,
        new RegExp(`define\\('${route.method}', '${route.path.replace(/[/:]/g, '\\$&')}'`),
        `faucet/src/server.ts:${route.line} is:\n  ${line.trim()}`,
      )
    })
  }

  it('this bundle knows about every route the faucet serves, called or declined', () => {
    const defined = lines
      .map((l) => /define\('([A-Z]+)', '([^']+)'/.exec(l))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => `${m[1]} ${m[2]}`)
    const known = [...CALLED, ...DECLINED].map((r) => `${r.method} ${r.path}`)
    assert.deepEqual(
      defined.filter((r) => !known.includes(r)),
      [],
      'micro-faucet serves a route this app has never read. Read it, then call or decline it here.',
    )
    assert.equal(known.length, defined.length, 'the tables and the service disagree about the count')
  })

  /**
   * The body of one handler: from its `define(` line to the next one.
   *
   * Bounded by the NEXT `define` rather than by a brace count, for the same reason
   * `test/chainstatus.test.ts` bounds the indexer's handlers by the next declaration: a brace
   * counter over TypeScript with template literals in it is a parser, and a wrong one would read
   * the next handler's `authorise` call as this one's.
   */
  const bodyOf = (line: number): string => {
    const start = line - 1
    let end = lines.length
    for (let i = start + 1; i < lines.length; i++) {
      if (/^\s{4}define\('/.test(lines[i] ?? '')) {
        end = i
        break
      }
    }
    return lines.slice(start, end).join('\n')
  }

  it('the three routes this page calls are UNAUTHENTICATED, and still are', () => {
    // The whole reason this surface can have a working faucet form with no session. Asserted per
    // route rather than once, because a gate added to one of the three would break exactly one
    // thing and would otherwise be invisible here.
    for (const route of CALLED) {
      assert.doesNotMatch(
        bodyOf(route.line),
        /await authorise\(ctx, deps\)/,
        `${route.method} ${route.path} has been GATED — this page calls it with no credential`,
      )
    }
  })

  it('…and /metrics is still gated, which is why it is declined', () => {
    const metrics = DECLINED.find((r) => r.path === '/metrics')
    assert.ok(metrics)
    assert.match(
      bodyOf(metrics.line),
      /await authorise\(ctx, deps\)/,
      '/metrics is no longer gated — the budget is now public, which is a finding for micro-faucet',
    )
  })

  it('the OPTIONS preflight still refuses an origin that is not allowlisted', () => {
    const preflight = DECLINED.find((r) => r.method === 'OPTIONS')
    assert.ok(preflight)
    assert.match(
      bodyOf(preflight.line),
      /if \(!origin \|\| !deps\.corsOrigins\.includes\(origin\)\) return \{ status: 403 \}/,
      'the preflight no longer checks the allowlist',
    )
  })

  it('the drip handler still reads ONLY address and idempotencyKey', () => {
    const drip = CALLED.find((r) => r.method === 'POST')
    assert.ok(drip)
    const body = bodyOf(drip.line)
    const reads = [...body.matchAll(/payload\['([a-zA-Z]+)'\]/g)].map((m) => m[1]).sort()
    assert.deepEqual(
      [...new Set(reads)],
      ['address', 'idempotencyKey'],
      'the drip handler now reads a third field, and this client sends two',
    )
  })

  it('the amount is still a server-side constant with nowhere for a caller to influence it', () => {
    assert.match(requests, /THE AMOUNT IS A SERVER-SIDE CONSTANT/)
    assert.match(requests, /const amountWei = deps\.limits\.dripWei/)
    // Whitespace-normalised: the sentence is wrapped across two comment lines upstream, and a
    // regex that assumed one line would fail a correct file the next time somebody reflowed it.
    assert.match(
      requests.replace(/\n\s*\*\s?/g, ' ').replace(/\s+/g, ' '),
      /every faucet that has ever been drained let the caller influence the amount/,
    )
  })

  it('the terms string is still served by the service, so this page renders one wording', () => {
    // The page prints `terms.terms` verbatim. If the field were dropped, the page would render an
    // empty disclaimer — which is worse than none, because the panel around it says there is one.
    assert.match(server, /terms:\n?\s*'Testnet EMBER\. It has no value, it is not tradeable/)
  })

  it('the five refusal codes are still the five this client knows', () => {
    const declared = /export type RefusalCode =\n([\s\S]*?)\n\n/.exec(limits)
    assert.ok(declared, 'RefusalCode is gone from faucet/src/limits.ts')
    const upstream = [...(declared[1] ?? '').matchAll(/'([a-z_]+)'/g)].map((m) => m[1] ?? '')
    // Three come from the limiter and two from acceptDrip; both halves are checked so a code
    // renamed in either place turns this red.
    for (const code of upstream) {
      assert.ok(
        (REFUSAL_CODES as readonly string[]).includes(code),
        `micro-faucet can answer '${code}' and this client does not know it`,
      )
    }
    for (const own of ['invalid_address', 'own_address']) {
      assert.match(requests, new RegExp(`'${own}'`), `${own} is no longer answered by acceptDrip`)
    }
  })

  it('the six dispense statuses are still the six this page renders', () => {
    const declared =
      /for \(const status of \[([^\]]*)\] as const\)/.exec(server) ??
      /const status of \[([^\]]*)\]/.exec(server)
    assert.ok(declared, 'the status list is gone from faucet/src/server.ts')
    const upstream = [...(declared[1] ?? '').matchAll(/'([a-z]+)'/g)].map((m) => m[1] ?? '')
    assert.deepEqual([...DRIP_STATUSES].sort(), upstream.sort())
  })

  it('the faucet binds 4013, which is NOT the port its registry row names', () => {
    // Half of the host resolution finding. The other half — the registry's 3003 for `faucet`, which
    // is this site's own page port — is pinned in test/hosts.test.ts, so whichever moves first
    // fails and names the other.
    const env = readFileSync(`${faucetRoot}/src/env.ts`, 'utf8')
    assert.match(env, /integer\(source, 'PORT', 4013/, 'micro-faucet no longer defaults PORT to 4013')
  })

  it('and its CORS example now names the hostname the registry actually has', () => {
    /*
     * THIS ASSERTION WAS ITS OWN OPPOSITE UNTIL micro-faucet WAS FIXED.
     *
     * It required `FAUCET_CORS_ORIGINS=https://faucet.…` — a hostname the registry has never
     * defined — and said it was asserted "so that the day it IS fixed, this goes red and the note
     * in src/lib/hosts.ts is deleted rather than left to age into another stale inherited claim".
     * micro-faucet now suggests `https://network.cloudsforge.online`, which is where the faucet
     * page lives, so the note is gone and this is the guard against it coming back.
     */
    const example = `${faucetRoot}/.env.example`
    if (!existsSync(example)) return
    const text = readFileSync(example, 'utf8')
    assert.match(
      text,
      /FAUCET_CORS_ORIGINS=https:\/\/network\./,
      'micro-faucet no longer allows the origin the faucet page is served from; a drip would fail closed',
    )
    assert.doesNotMatch(
      text,
      /FAUCET_CORS_ORIGINS=[^\n]*faucet\.cloudsforge/,
      'the example names faucet.<apex> again, a hostname the registry does not define',
    )
  })
})
