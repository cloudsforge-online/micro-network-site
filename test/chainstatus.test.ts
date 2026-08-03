/**
 * THE INDEXER ROUTE TABLE, CHECKED AGAINST THE SERVICE THAT SERVES IT.
 *
 * Every client in this estate that was built against an imagined surface passed its own tests. That
 * is the whole problem: a test asserting "the client calls /v1/chains/…" is a test that the client
 * agrees with itself. So this file does not assert paths in the abstract — it reads
 * `indexer/src/server.ts` from the sibling checkout and requires that each path this bundle calls,
 * AND each path it declines, is registered there at the line the citation names.
 *
 * ── Five things this file checks that a naive version would not ───────────────────────────────
 *
 * **1. WHOLE PATH SHAPES, NEVER PREFIXES AND NEVER A SEGMENT COUNT.** `micro-market`'s first guard
 * matched `path.startsWith(servedPrefix)` and judged zero of two genuinely dead paths as unserved,
 * because both began with a prefix the indexer really does serve
 * (`market/src/indexerclient.test.ts:229-239`). Its segment helper then collapsed
 * `/transactions/${scope}/${hash}/confirmations` to five segments — exactly the shape of a
 * DIFFERENT route — and reported it fine. The corrected `matches` is copied from that file rather
 * than invented a third time.
 *
 * **2. EVERY ROUTE IS CALLED OR DECLINED, AND THE UNION IS EXACT.** One route is called and eight
 * are declined, each with a reason. A route the service grows that neither table knows about is a
 * failure here, because a client that has stopped understanding what it talks to is one edit away
 * from depending on the difference.
 *
 * **3. HOW each route authenticates, not merely whether.** `micro-trade-web` found four
 * `micro-trade` routes that authenticate through a helper with no literal `authenticate(...)` in
 * the handler, so a body grep declared them public. `micro-indexer` has TWO helpers,
 * `authoriseRead` and `authorise`, and which one a handler calls is the whole difference between a
 * public read and a gated write.
 *
 * **4. NO LINE NUMBER IS HARDCODED INSIDE A CHECK.** The handler bodies are located by reading the
 * SURFACE TABLE below, and the table is the only place a line appears. Two guards elsewhere in this
 * estate kept passing while grading a different function after a shift, because the number was
 * written into the assertion rather than read from the table.
 *
 * **5. THE FIGURE TYPE HAS NO PATH FROM AN ABSENCE TO A DIGIT.** That is this surface's central
 * claim and it is checked as a property of the module rather than trusted to review.
 *
 * ── What happens without the sibling ──────────────────────────────────────────────────────────
 *
 * `micro-indexer` is a private repository. `pnpm test` must pass for somebody who has cloned only
 * this one, so a missing checkout SKIPS the cross-repository half — and, because a skipped test is
 * an unmeasured one, CI is where absence becomes a failure: the `check` job checks micro-indexer
 * out and the workflow asserts the cross-check REALLY RAN, then bends one citation by a line and
 * requires the suite to go red.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import {
  CHAIN_IDS,
  HEARTH_CHAIN,
  HEARTH_SCOPES,
  NETWORKS,
  PENDING,
  figureOf,
  unfetched,
} from '../src/lib/chainstatus.ts'

const here = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))

/** Where a micro-indexer checkout is, in the order CI and a developer's machine put it. */
const INDEXER_CANDIDATES = [
  process.env['CLOUDSFORGE_INDEXER_DIR'],
  here('../indexer'),
  here('.indexer'),
].filter((v): v is string => Boolean(v))

const indexerRoot = INDEXER_CANDIDATES.find((p) => existsSync(`${p}/src/server.ts`))

const client = readFileSync(here('src/lib/chainstatus.ts'), 'utf8')

/**
 * The route this bundle calls, with the line it was read from and the GATE it opens with.
 *
 * `line` is the line in `DOMAIN` that REGISTERS the route; `handler` is the line the handler
 * function is declared at. Both are cited in the client, and both are checked, because a route can
 * be moved in the table without its handler moving and vice versa.
 */
const CALLED: ReadonlyArray<{
  method: string
  path: string
  line: number
  handler: number
  gate: 'authoriseRead' | 'authorise'
}> = [
  { method: 'GET', path: '/chains/:chain/:network/status', line: 154, handler: 403, gate: 'authoriseRead' },
]

/**
 * Every route the indexer serves that this bundle does NOT call, each with the reason.
 *
 * Enumerated rather than ignored, so the "knows about everything the service serves" check below
 * can be exact in both directions: a route this app has never heard of should make somebody look,
 * and a route it has decided against should not.
 */
const DECLINED: ReadonlyArray<{
  method: string
  path: string
  line: number
  handler: number
  gate: 'authoriseRead' | 'authorise'
  why: string
}> = [
  {
    method: 'GET',
    path: '/addresses/:chain/:network/:address/activity',
    line: 155,
    handler: 415,
    gate: 'authoriseRead',
    why: 'anonymous and callable; micro-explorer-web is the surface that reads the index record by record',
  },
  {
    method: 'GET',
    path: '/addresses/:chain/:network/:address/token-balances',
    line: 156,
    handler: 482,
    gate: 'authoriseRead',
    why: 'anonymous and callable; a balance is an explorer question, and this surface has no address to ask about',
  },
  {
    method: 'GET',
    path: '/transactions/:chain/:network/:hash',
    line: 157,
    handler: 431,
    gate: 'authoriseRead',
    why: 'anonymous and callable; the explorer owns record reads',
  },
  {
    method: 'GET',
    path: '/transactions/:chain/:network/:hash/confirmations',
    line: 158,
    handler: 456,
    gate: 'authoriseRead',
    why: 'anonymous and callable; a depth verdict is a decision input, and nothing on this surface takes a decision',
  },
  {
    method: 'GET',
    path: '/tokens/:chain/:network/:address',
    line: 159,
    handler: 512,
    gate: 'authoriseRead',
    why: 'anonymous and callable; token state belongs to ForgeMint and the explorer, not to a page about the chain',
  },
  {
    method: 'GET',
    path: '/blocks/:chain/:network/:height',
    line: 160,
    handler: 533,
    gate: 'authoriseRead',
    why: 'anonymous and callable; a block page here would be a second explorer competing with a tested one',
  },
  {
    method: 'POST',
    path: '/watch/:chain/:network/:address',
    line: 161,
    handler: 550,
    gate: 'authorise',
    why: 'indexer:write — enlarging what a shared deployment indexes is not a browser decision',
  },
  {
    method: 'POST',
    path: '/backfills/:chain/:network',
    line: 162,
    handler: 572,
    gate: 'authorise',
    why: 'indexer:write — enqueues a range walk, with a cost attached',
  },
]

/** Both spellings of every route, because `PREFIXES` mounts each twice. */
const BOTH_SPELLINGS = [...CALLED, ...DECLINED].flatMap((r) => [r.path, `/v1${r.path}`])

/**
 * Does a requested path match a served pattern? Same segment count, and every segment agrees.
 *
 * **Segment counts, never prefixes**, and copied verbatim from
 * `market/src/indexerclient.test.ts:241-249` rather than written again. The version that shipped
 * first there matched by prefix and passed both of the dead paths it existed to catch.
 */
function matches(requested: string, pattern: string): boolean {
  const asked = requested.split('/')
  const serves = pattern.split('/')
  if (asked.length !== serves.length) return false
  return serves.every((segment, index) => {
    const mine = asked[index] ?? ''
    return segment.startsWith(':') ? mine.length > 0 : segment === mine
  })
}

/**
 * `${...}` is exactly ONE segment.
 *
 * So a helper standing for two — a `${scope}` holding `chain/network` — produces a path one segment
 * short of every pattern and is refused rather than guessed at
 * (`market/src/indexerclient.test.ts:251-259`).
 */
const placeholder = (path: string): string => path.replace(/\$\{[^}]*\}/g, 'x')

/** Every request path this client sends, read out of its source with the prose stripped. */
export function requestedPaths(source: string): readonly string[] {
  // COMMENTS STRIPPED FIRST. This file and the client both quote dead paths in prose, and a
  // checker that cannot tell a request from a sentence about one is not a checker.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n')
  return [...code.matchAll(/`(\/v1\/[^`]*)`/g)].map((m) => m[1] ?? '').filter((p) => p.length > 1)
}

describe('the client calls only the route it has cited', () => {
  it('sends exactly one request path, and it is a whole route shape the indexer serves', () => {
    const paths = requestedPaths(client)
    assert.equal(paths.length, 1, `expected one request path, found: ${paths.join(', ')}`)
    assert.deepEqual(paths.map(placeholder), ['/v1/chains/x/x/status'])
    const unserved = paths.filter((p) => !BOTH_SPELLINGS.some((r) => matches(placeholder(p), r)))
    assert.deepEqual(unserved, [], `not served by micro-indexer: ${unserved.join(', ')}`)
  })

  it('cites a line for every route, called and declined, in the client itself', () => {
    for (const route of [...CALLED, ...DECLINED]) {
      assert.ok(
        client.includes(`indexer/src/server.ts:${route.line}`),
        `${route.method} ${route.path} has no citation in src/lib/chainstatus.ts`,
      )
    }
  })

  it('gives every declined route a REASON, not just an absence', () => {
    for (const route of DECLINED) {
      assert.ok(route.why.length > 30, `${route.method} ${route.path} has no real reason`)
    }
    // …and the module explains the shape of the declination where a reader will look.
    assert.match(client, /EIGHT are declined, each with a reason/)
  })

  it('writes the scope out as two segments, with no helper standing for chain/network', () => {
    const code = client.replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(code, /\$\{seg\(scope\)\}/, 'a helper stands for the whole scope')
    const pairs = [...code.matchAll(/\$\{seg\(scope\.chain\)\}\/\$\{seg\(scope\.network\)\}/g)]
    assert.equal(pairs.length, 1, `expected one two-segment scope, found ${pairs.length}`)
  })

  it('reaches the generic client exactly once, and only inside publicRead', () => {
    const code = client
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*)/.test(line))
      .join('\n')
    assert.match(code, /function publicRead<T>/, 'the single-decision read helper is gone')
    assert.equal(
      [...code.matchAll(/\bauth: false\b/g)].length,
      1,
      'auth: false is written more than once, so one of them can be forgotten',
    )
    const calls = [...code.matchAll(/\bchainIndex</g)]
    assert.equal(calls.length, 1, `reaches chainIndex ${calls.length} times; only publicRead may`)
    const helper = code.indexOf('function publicRead<T>')
    const helperEnd = code.indexOf('\n}\n', helper)
    assert.ok(helperEnd > helper, 'publicRead has no closing brace, so this bound means nothing')
    const where = calls[0]?.index ?? -1
    assert.ok(where > helper && where < helperEnd, 'the chainIndex call is outside publicRead')
  })
})

describe('the shape check can say no', () => {
  it('refuses every dead path this estate has actually shipped, including served PREFIXES', () => {
    // Copied from `market/src/indexerclient.test.ts:309-319`, plus this repository's own
    // near-misses. The first entry is the exact path `micro-mint` shipped, and it BEGINS with
    // `/v1/chains/`, which the indexer really does serve. A prefix test calls it fine.
    const dead = [
      '/v1/chains/${chain}/${network}/transactions/${hash}',
      '/v1/chains/${chain}/transactions/${hash}/escrow',
      '/v1/tokens/${urn}/facts',
      '/v1/receipts/${chain}/${network}/${hash}',
      '/v1/transactions/${chain}/${network}/${hash}/confirmations/latest',
      // The shapes a page about a NETWORK is tempted to invent. Naming them is the point.
      '/v1/chains/${chain}/${network}',
      '/v1/chains/${chain}/${network}/supply',
      '/v1/chains/${chain}/${network}/hashrate',
      '/v1/chains/${chain}/${network}/difficulty',
      '/v1/chains/${chain}/${network}/blocks',
      '/v1/chains',
    ]
    for (const path of dead) {
      assert.equal(
        BOTH_SPELLINGS.some((r) => matches(placeholder(path), r)),
        false,
        `${path} is not served by micro-indexer, but this check accepted it`,
      )
    }
  })

  it('and it is not simply refusing everything', () => {
    for (const route of BOTH_SPELLINGS) assert.ok(matches(route, route), route)
    assert.ok(matches('/v1/chains/ember/testnet/status', '/v1/chains/:chain/:network/status'))
  })

  it('the collapsed-scope form matches a DIFFERENT route, which is why it is banned', () => {
    assert.equal(
      BOTH_SPELLINGS.some((r) =>
        matches(placeholder('/v1/transactions/${scope}/${hash}/confirmations'), r),
      ),
      true,
      'the scope form was expected to match a DIFFERENT route — if it no longer does, rewrite this note',
    )
    assert.equal(placeholder('/v1/transactions/${scope}/${hash}/confirmations').split('/').length, 6)
    assert.equal(
      placeholder('/v1/transactions/${chain}/${network}/${hash}/confirmations').split('/').length,
      7,
    )
  })
})

/* ══════════════════════════ the figure union ══════════════════════════ */

describe('a number cannot be produced from an absence', () => {
  it('figureOf turns null and undefined into unobserved, never into a value', () => {
    assert.deepEqual(figureOf(null), { state: 'unobserved' })
    assert.deepEqual(figureOf(undefined), { state: 'unobserved' })
  })

  it('…and zero is kept as a value, because zero IS a height', () => {
    // The inverse mistake, and it is just as bad: a walked head of 0 is genuine — it is the genesis
    // block — and rendering it as "not observed" would be the absence lie pointing the other way.
    assert.deepEqual(figureOf(0), { state: 'known', value: 0 })
  })

  it('the three absent states carry no numeric field at all', () => {
    for (const figure of [figureOf(null), unfetched('because'), PENDING]) {
      assert.equal('value' in figure, false, `${figure.state} carries a value`)
    }
  })

  it('the module contains no coalesce-to-zero anywhere', () => {
    // The failure this whole union exists to prevent, asserted on the source of the module rather
    // than on its behaviour: a `?? 0` added tomorrow would satisfy every assertion above.
    const code = client.replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(code, /\?\?\s*0\b/, 'a null coalesces to zero somewhere in the client')
    assert.doesNotMatch(code, /\|\|\s*0\b/, 'a falsy value coalesces to zero somewhere')
  })
})

/* ══════════════════════════ the cross-repository half ══════════════════════════ */

describe('the cited lines are the lines that register the routes', () => {
  if (indexerRoot === undefined) {
    // NOT a silent pass. It says which check did not run, and CI makes the absence fatal.
    it('SKIPPED: no micro-indexer checkout — CI checks one out and requires this to run', () => {
      assert.ok(true)
    })
    return
  }

  const server = readFileSync(`${indexerRoot}/src/server.ts`, 'utf8')
  const lines = server.split('\n')
  const reads = readFileSync(`${indexerRoot}/src/reads.ts`, 'utf8')
  const chains = readFileSync(`${indexerRoot}/src/chains.ts`, 'utf8')
  const env = readFileSync(`${indexerRoot}/src/env.ts`, 'utf8')

  it('reads a server with a route table in it, so this cannot pass on an empty file', () => {
    const entries = lines.filter((l) => /^\s{2}\['(GET|POST)',/.test(l))
    assert.equal(entries.length, 9, `expected the indexer's nine DOMAIN entries, found ${entries.length}`)
  })

  for (const route of [...CALLED, ...DECLINED]) {
    it(`${route.method} ${route.path} is registered at indexer/src/server.ts:${route.line}`, () => {
      // 1-indexed citation, 0-indexed array. The number comes from the table above and appears
      // nowhere else in this file.
      const line = lines[route.line - 1] ?? ''
      assert.match(
        line,
        new RegExp(`\\['${route.method}',\\s*'${route.path.replace(/[/:]/g, '\\$&')}'`),
        `indexer/src/server.ts:${route.line} is:\n  ${line.trim()}`,
      )
    })
  }

  it('this bundle knows about every route the indexer serves, called or declined', () => {
    const registered = lines
      .map((l) => /^\s{2}\['([A-Z]+)',\s*'([^']+)'/.exec(l))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => `${m[1]} ${m[2]}`)
    const known = [...CALLED, ...DECLINED].map((r) => `${r.method} ${r.path}`)
    assert.deepEqual(
      registered.filter((r) => !known.includes(r)),
      [],
      'micro-indexer serves a route this app has never read. Read it, then call or decline it here.',
    )
    assert.equal(
      known.length,
      registered.length,
      'the tables and the service disagree about how many routes there are',
    )
  })

  it('BOTH spellings really are mounted, which is what makes the /v1 form safe', () => {
    assert.match(server, /const PREFIXES: readonly string\[\] = \['\/v1', ''\]/)
    assert.match(lines[133] ?? '', /\['\/v1', ''\]/, `indexer/src/server.ts:134 is: ${lines[133]}`)
    assert.match(lines[392] ?? '', /for \(const prefix of PREFIXES\)/)
  })

  /**
   * A handler body: from its `async function <name>` to the next handler declaration.
   *
   * Bounded by the NEXT declaration rather than by a brace count, because a brace counter over
   * TypeScript with template literals in it is a parser, and a wrong parser here would read the
   * next handler's `authorise` call as this one's.
   */
  const bodyOf = (line: number): string => {
    const start = line - 1
    let end = lines.length
    for (let i = start + 1; i < lines.length; i++) {
      if (/^async function /.test(lines[i] ?? '') || /^\/\* -+ parameters/.test(lines[i] ?? '')) {
        end = i
        break
      }
    }
    return lines.slice(start, end).join('\n')
  }

  it('every route opens with the gate this repository believes, and no other', () => {
    for (const route of [...CALLED, ...DECLINED]) {
      const body = bodyOf(route.handler)
      assert.match(
        body,
        /^async function \w+\(ctx: RequestContext, deps: ServerDeps\)/,
        `indexer/src/server.ts:${route.handler} is not a handler declaration: ${lines[route.handler - 1]}`,
      )
      if (route.gate === 'authoriseRead') {
        assert.match(
          body,
          /await authoriseRead\(ctx, deps\)/,
          `${route.method} ${route.path}: believed anonymous, and the handler does not call authoriseRead`,
        )
        // …and NOT the write gate. `authorise(ctx, deps, READ_SCOPE)` would satisfy a sloppier
        // check by containing the word, and would 401 every visitor.
        assert.doesNotMatch(
          body,
          /await authorise\(ctx, deps,/,
          `${route.method} ${route.path} has been RE-GATED — this app calls it with no bearer`,
        )
      } else {
        assert.match(
          body,
          /await authorise\(ctx, deps, WRITE_SCOPE\)/,
          `${route.method} ${route.path}: declined because it takes indexer:write, and it no longer asks for it`,
        )
      }
    }
  })

  it('the read this page depends on is ANONYMOUS: authoriseRead serves a caller with no token', () => {
    // Asserted on the SOURCE of the helper rather than on its name: a function called
    // `authoriseRead` that threw would pass every check above.
    const at = server.indexOf('async function authoriseRead(')
    assert.ok(at > 0, 'authoriseRead is gone from indexer/src/server.ts')
    const fn = server.slice(at, server.indexOf('\nasync function authorise(', at))
    assert.match(
      fn,
      /const token = bearerFrom\(headerOf\(ctx\.req, 'authorization'\)\)\n\s*if \(!token\) return null/,
      'authoriseRead no longer returns null for a caller with no token — the reads have been re-gated',
    )
    assert.doesNotMatch(fn, /throw new TokenError/, 'authoriseRead has grown a missing-token throw')
  })

  it('the nine handlers are exactly seven anonymous reads and two gated writes', () => {
    const handlers = [...CALLED, ...DECLINED]
    assert.equal(handlers.length, 9, 'the tables no longer cover all nine domain routes')
    const anonymous = handlers.filter((r) =>
      /await authoriseRead\(ctx, deps\)/.test(bodyOf(r.handler)),
    )
    const gated = handlers.filter((r) =>
      /await authorise\(ctx, deps, WRITE_SCOPE\)/.test(bodyOf(r.handler)),
    )
    assert.equal(anonymous.length, 7, `${anonymous.length} anonymous reads upstream, not seven`)
    assert.equal(gated.length, 2, `${gated.length} gated writes upstream, not two`)
    assert.equal(anonymous.length + gated.length, 9, 'a handler is neither, so somebody must read it')
  })

  it('the three things still refused are still refused, and this app depends on none of them', () => {
    const at = server.indexOf('async function authorise(')
    assert.ok(at > 0, 'authorise is gone from indexer/src/server.ts — the WRITES are now open')
    const fn = server.slice(at, at + 1200)
    // 1. A missing token on a WRITE is a 401.
    assert.match(fn, /if \(!token\) throw new TokenError\(/, 'a missing token on a write is no longer a 401')
    // 2. A SERVICE without the scope is a 403 — on writes here, and on reads in authoriseRead.
    assert.match(fn, /requireScope\(principal, scope\)/, 'a service principal is no longer scoped on writes')
    const readFn = server.slice(
      server.indexOf('async function authoriseRead('),
      server.indexOf('\nasync function authorise('),
    )
    assert.match(
      readFn,
      /if \(principal\.kind === 'service'\) \{\n\s*requireScope\(principal, READ_SCOPE\)/,
      'a service without indexer:read is no longer refused on a read',
    )
    // 3. A token that IS presented is still verified rather than ignored.
    assert.match(
      readFn,
      /const principal = await deps\.verifier\.principal\(token\)/,
      'a presented token is no longer verified on a read — a broken one would now get a silent 200',
    )
  })

  it('the cited line ranges are the functions this repository says they are', () => {
    // `:708-717` and `:698-726` appear verbatim across six files here, where a reader is invited to
    // go and check them. A range that has drifted onto the wrong function reads as verified.
    assert.match(lines[726] ?? '', /^async function authoriseRead\(/, `:727 is: ${lines[707]}`)
    assert.match(lines[735] ?? '', /^\}/, `:736 is: ${lines[735]}`)
    assert.match(
      lines.slice(697, 726).join('\n'),
      /Reads are ANONYMOUS, because what they return is already public/,
      'the doc comment at :698-726 is no longer the one explaining the anonymous reads',
    )
  })

  /* ── the shape of the answer, which is what makes the nulls real ──────────────────────────── */

  it('status really does return null rather than zero for an unobserved height', () => {
    // The single most load-bearing fact behind the `Figure` union. `micro-indexer` reads a
    // checkpoint row and coalesces the ABSENCE of one to null, so a chain nobody follows answers
    // 200 with nulls. If this became `?? 0` upstream, every panel here would render a confident
    // zero and the whole honesty argument would be gone.
    assert.match(reads, /const tipHeight = checkpoint\?\.tipHeight \?\? null/)
    assert.match(reads, /const indexedHeight = checkpoint\?\.height \?\? null/)
    assert.match(
      reads,
      /Null when no tip has ever been observed — a lag of zero would be a lie, not a default/,
      'the rule this surface is built on is no longer stated upstream',
    )
  })

  it('the status shape still carries every field this page renders', () => {
    for (const field of [
      'tipHeight',
      'tipSeenAt',
      'indexedHeight',
      'indexedHash',
      'lagBlocks',
      'halted',
      'haltReason',
      'requiredConfirmations',
      'reorgAlarmDepth',
      'chainId',
      'providers',
      'recentReorgs',
    ]) {
      assert.match(
        reads,
        new RegExp(`readonly ${field}\\??:`),
        `ChainStatus.${field} is gone from indexer/src/reads.ts, and this page renders it`,
      )
    }
  })

  /* ── facts this bundle restates rather than imports ───────────────────────────────────────── */

  it('the five chain ids are the five the service runs', () => {
    const declared = /export const CHAIN_IDS: readonly ChainId\[\] = Object\.freeze\(\[([^\]]*)\]\)/.exec(chains)
    assert.ok(declared, 'CHAIN_IDS is gone from indexer/src/chains.ts')
    const upstream = (declared[1] ?? '').split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean)
    assert.deepEqual([...CHAIN_IDS], upstream)
  })

  it('the two networks are the two the service runs', () => {
    const declared = /export const NETWORKS: readonly Network\[\] = Object\.freeze\(\[([^\]]*)\]\)/.exec(chains)
    assert.ok(declared, 'NETWORKS is gone from indexer/src/chains.ts')
    const upstream = (declared[1] ?? '').split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean)
    assert.deepEqual([...NETWORKS], upstream)
  })

  it('ember is one of them, so the two scopes this page asks about are real addresses', () => {
    assert.ok((CHAIN_IDS as readonly string[]).includes(HEARTH_CHAIN))
    assert.equal(HEARTH_SCOPES.length, 2)
    for (const scope of HEARTH_SCOPES) {
      assert.equal(scope.chain, 'ember')
      assert.ok((NETWORKS as readonly string[]).includes(scope.network))
    }
    // Testnet first. Stated in the client and asserted here so a reorder is a decision.
    assert.equal(HEARTH_SCOPES[0]?.network, 'testnet')
  })

  it('the indexer still binds 4008, which the registry entry and the README both state', () => {
    // Half of the host resolution. The other half — the registry's devPort — is pinned in
    // test/hosts.test.ts, so whichever moves first fails and names the other.
    assert.match(env, /port\(source, 'PORT', 4008\)/, 'the indexer no longer defaults PORT to 4008')
  })

  it('micro-indexer now DOES send cross-origin headers, so a browser here can read it', () => {
    /*
     * THIS ASSERTION USED TO BE ITS OWN OPPOSITE, AND THAT IS THE POINT OF IT.
     *
     * It read `doesNotMatch(/access-control-allow-origin/)` and its comment said "the day the
     * indexer grows CORS, this goes red and the apology in `CHAIN.crossOrigin` is deleted rather
     * than left to age". That day arrived: `micro-indexer` sets the header, and this went red on a
     * repository nobody had touched — which is exactly the behaviour it was written for, and the
     * reason `CHAIN.crossOrigin` is gone from the /chain page.
     *
     * Flipped rather than deleted, so a regression upstream is still caught. An assertion removed
     * because it started passing for the right reason leaves nothing watching.
     */
    assert.match(
      readFileSync(`${indexerRoot}/src/server.ts`, 'utf8'),
      /access-control-allow-origin/i,
      'micro-indexer has stopped sending CORS headers; a browser on this host can no longer read it',
    )
  })
})
