/**
 * Group N of docs/ecosystem/22-browser-journeys.md, the half that belongs to this surface —
 * BJ-NET-01..10, the home page, the chain page, mining, the node and the faucet. BJ-NET-11..21 are
 * `explorer-web`'s and are not here.
 *
 * ── The faucet is the reason this file matters ────────────────────────────────────────────────
 *
 * It is the one form on this surface that commits anything, and every assertion about it is about
 * what the CLIENT sends and what the page SHOWS — never about whether the faucet was right to
 * refuse. That distinction is doc 22 §3 and it is not a style preference: a client-side test of a
 * rule the client does not enforce passes against the defect it was written to catch. So
 * "the request body carries `address` and `idempotencyKey` and nothing else" is asserted here,
 * because the client is what puts them there; "a second request inside the cooldown is refused" is
 * asserted in `micro-faucet`, and cited.
 *
 * ── Why the numbers matter more here than the words ───────────────────────────────────────────
 *
 * `src/pages/faucet.tsx` says every figure on the page comes from `GET /v1/faucet` at render time
 * and that there is NO fallback set in this bundle. That is a claim about what happens when the
 * service does not answer, and there is exactly one way to find out.
 */
import assert from 'node:assert/strict'
import { assertMounted, open, type Stubs } from './browser.ts'
import {
  assertAxeClean,
  assertKnownStillBroken,
  assertLandmarks,
  assertSkipLink,
  textOrder,
  type KnownViolation,
} from './axe.ts'
import type { Scenario } from './scenario.ts'
import { CHAIN, FAUCET, HOME, MINE, NODE } from '../../src/content/copy.ts'
import { NOT_AN_INCOME } from '../../src/lib/format.ts'

/**
 * Empty, and checked to stay empty.
 *
 * The estate's one design-system contrast defect is `--cf-fg-mute` at 3.54:1 on micro-ui's chart
 * and tile surfaces. This bundle renders no chart tile, so the sweep runs with no exclusion at
 * all — `assertKnownStillBroken` would reject one that was not earned.
 */
const KNOWN_A11Y: readonly KnownViolation[] = []

/** identity's `/auth/me`, in the shape identity actually sends: the profile nested under `user`. */
const ME = { user: { id: 'u_1', handle: 'testuser', roles: ['user'] }, session: {}, organisations: [] }

/** A stand-in for a sign-in page, so a redirect to one completes instead of hanging (§8.1). */
const SIGNIN_STANDIN = {
  status: 200,
  contentType: 'text/html',
  body: '<!doctype html><title>stand-in</title><body>sign-in stand-in</body>',
}

/**
 * What `GET /v1/faucet` answers, in the shape `faucet/src/server.ts:341` serves.
 *
 * Every value is deliberately NOT a round or plausible default. If any of them appears on screen
 * when the service has not answered, the bundle is carrying a fallback set — which is the thing
 * BJ-NET-06 exists to disprove.
 */
const TERMS = {
  network: 'testnet',
  chainId: 7412,
  asset: 'EMBER',
  fundingAddress: '0x00000000000000000000000000000000000f0cc5',
  dripWei: '3000000000000000000',
  addressCooldownSeconds: 5431,
  requesterLimit: 7,
  requesterWindowSeconds: 9137,
  budgetRemainingWei: '41000000000000000000',
  budgetWindowSeconds: 21601,
  terms:
    'Testnet EMBER. It has no value, it is not tradeable, and the chain it funds may be reset without notice.',
}

/** `GET /v1/chains/ember/:network/status` — `indexer/src/server.ts:154`. */
const chainStatus = (network: string) => ({
  chain: 'ember',
  network,
  family: 'evm',
  asset: 'EMBER',
  chainId: network === 'mainnet' ? 7411 : 7412,
  requiredConfirmations: 12,
  reorgAlarmDepth: 6,
  tipHeight: 918_275,
  tipSeenAt: '2026-08-03T09:15:00.000Z',
  indexedHeight: 918_273,
  indexedHash: '0xabc0000000000000000000000000000000000000000000000000000000000001',
  lagBlocks: 2,
  halted: false,
  haltReason: null,
  providers: [],
  recentReorgs: [],
})

const ANONYMOUS: Stubs = [['/account/login', SIGNIN_STANDIN]]

const CHAIN_UP: Stubs = [
  ['GET /v1/chains/ember/mainnet/status', { json: chainStatus('mainnet') }],
  ['GET /v1/chains/ember/testnet/status', { json: chainStatus('testnet') }],
  ...ANONYMOUS,
]

const FAUCET_UP: Stubs = [['GET /v1/faucet', { json: TERMS }], ...ANONYMOUS]

const OWNED = ['/', '/chain', '/mine', '/node', '/faucet']

export const CATALOGUE: readonly Scenario[] = [
  /* ---- doc 22 §5.1 ---------------------------------------------------- */
  {
    id: 'BJ-NETWORK-404',
    title: 'every route this surface owns survives a hard refresh and every other address answers 404',
    tier: 2,
    asserts: 'navigation',
    gate: true,
    expectStatus: 404,
    ownedBy: 'network-site/test/routes.test.ts#nginx',
    async run(surface) {
      assert.equal(surface.nginx.honest404, true, 'nginx.conf has no error_page 404 /index.html')
      for (const path of OWNED) {
        const { status } = await surface.fetchStatus(path)
        assert.equal(status, 200, `${path} answered ${status}; an owned route must survive a refresh`)
      }
      for (const path of ['/nope', '/explorer', '/blocks/1', '/faucet/history', '/v1/faucet']) {
        const { status } = await surface.fetchStatus(path)
        assert.equal(status, 404, `${path} answered ${status}; it must 404`)
      }

      const session = await open(surface.origin, { path: '/blocks/1', stubs: ANONYMOUS })
      try {
        assert.equal(session.status, 404)
        await assertMounted(session)
      } finally {
        await session.close()
      }
    },
  },

  /* ---- doc 22 BJ-NET-01 ----------------------------------------------- */
  {
    id: 'BJ-NET-01',
    title: 'the home page puts its status table second, and makes no request at all',
    tier: 1,
    asserts: 'presentation',
    async run(surface) {
      const session = await open(surface.origin, { stubs: ANONYMOUS })
      try {
        await assertMounted(session, { showing: [HOME.what.title, HOME.state.title] })
        // SECOND, not a footnote. A reader who finds out at the bottom of the page that none of
        // this is running has been misled by the layout rather than by the words.
        assert.equal(
          await textOrder(session.page, HOME.what.title, HOME.state.title),
          'before',
          'the status table is not where the page says it is',
        )
        assert.equal(
          await textOrder(session.page, HOME.state.title, HOME.where.title),
          'before',
          'the status table has been pushed below "where to go next"',
        )
        // And it asks nothing. The chain read is anonymous and would be served; the point is that
        // there is no question on this page a service answers, and a home page rendering a spinner
        // over a paragraph of prose has made the prose wait for something it does not need.
        assert.deepEqual(
          session.apiCalls().map((c) => `${c.method} ${c.url}`),
          [],
          'the home page made a request',
        )
      } finally {
        await session.close()
      }
    },
  },

  /* ---- doc 22 BJ-NET-02 and BJ-NET-03 ---------------------------------- */
  {
    id: 'BJ-NET-02',
    title: 'every figure on the chain page is fetched at render time, and equals what the index returned',
    tier: 2,
    asserts: 'presentation',
    gate: true,
    async run(surface) {
      const session = await open(surface.origin, { path: '/chain', stubs: CHAIN_UP })
      try {
        const text = await assertMounted(session, { showing: [CHAIN.title] })
        // The read happened, for both scopes the page declares. A page that renders numbers
        // without asking for them is rendering numbers from somewhere else.
        const reads = session.apiCalls().filter((c) => c.url.includes('/v1/chains/'))
        assert.equal(reads.length, 2, `${reads.length} chain reads for two declared scopes`)
        // …and the figures on screen are the response's, not a rounding or a recomputation of it.
        assert.ok(text.includes('918,273') || text.includes('918273'), 'the indexed height is not on the page')
        assert.ok(text.includes('918,275') || text.includes('918275'), 'the chain height is not on the page')
      } finally {
        await session.close()
      }
    },
  },
  {
    id: 'BJ-NET-03',
    title: 'with the index unreachable the figures are absent and the page says so, with no defaulted number',
    tier: 1,
    asserts: 'presentation',
    async run(surface) {
      const session = await open(surface.origin, {
        path: '/chain',
        stubs: [['GET /v1/chains/*', { abort: true }], ...ANONYMOUS],
      })
      try {
        const text = await assertMounted(session, {
          tolerateFailures: [/\/v1\/chains\//],
        })
        // There is no third option: fetched, or absent. A zero, a dash or a stale height would all
        // read as current, and a reader has no way to tell which of the three they are looking at.
        assert.equal(text.includes('918,273'), false, 'a figure appeared with nothing to fetch it from')
        assert.ok(
          text.includes(CHAIN.absence.title) || /unavailable|did not answer|not fetched/i.test(text),
          `the page does not say why its figures are missing. It says: ${text.slice(0, 500)}`,
        )
      } finally {
        await session.close()
      }
    },
  },

  /* ---- doc 22 BJ-NET-04 ------------------------------------------------ */
  {
    id: 'BJ-NET-04',
    title: 'the mining page puts the caveats before the instructions, and states no yield',
    tier: 1,
    asserts: 'presentation',
    async run(surface) {
      const session = await open(surface.origin, { path: '/mine', stubs: ANONYMOUS })
      try {
        const text = await assertMounted(session, {
          showing: [NOT_AN_INCOME, MINE.caveats.title, MINE.start.title],
        })
        // The order is the point. A corrected claim survives longest on a marketing surface,
        // because nobody re-reads it — so the income caveat is the first thing on the page and
        // "three things this is not" comes above "how to start".
        // FIRST, before anything that describes a reward at all — not merely somewhere above the
        // steps. The page's own header says so, and an earlier version of this assertion only
        // compared the caveat to "how to start": moving the caveat down past two whole sections
        // left it green. An assertion that a deliberate regression cannot break is not an
        // assertion, so it is pinned to the first section instead.
        assert.equal(
          await textOrder(session.page, NOT_AN_INCOME, MINE.how.title),
          'before',
          'the income caveat is below the section describing what the chain does',
        )
        assert.equal(
          await textOrder(session.page, MINE.caveats.title, MINE.start.title),
          'before',
          'the three things Homefire is not are below "how to start"',
        )
        /*
         * A LITERAL, NOT THE IMPORTED CONSTANT.
         *
         * Every other assertion in this scenario compares the page against `MINE` and
         * `NOT_AN_INCOME` — the modules it renders FROM. That catches a page that stops rendering
         * the caveat or moves it, and it cannot catch the caveat being softened: rewriting
         * `format.ts` rewrites both sides and stays green. This is the one sentence this surface
         * says about what mining pays, so the clause that carries the meaning is written out here.
         * Scoped to the warn note rather than the page, because a whole-page search for a common
         * phrase finds it somewhere else and passes for the wrong reason — which happened once
         * already, in micro-site's build page.
         */
        const caveat = await session.page
          .locator('.ns-note', { hasText: 'What mining pays, before anything else' })
          .first()
          .innerText()
        assert.ok(
          caveat.includes('a block reward, not an income'),
          `the yield caveat no longer says a block reward is not an income. It says: ${caveat.slice(0, 200)}`,
        )
        assert.ok(
          caveat.includes('no market to price it in'),
          'the caveat no longer says EMBER has no market to price a reward in',
        )

        // Nothing on the page states or implies a yield. A block reward is a consensus constant;
        // what a machine earns is its share of one against a difficulty that moves every block,
        // and there is no market to price it in.
        for (const word of ['APY', 'profit', 'return on', 'earn per']) {
          assert.equal(
            text.toLowerCase().includes(word.toLowerCase()),
            false,
            `the mining page says "${word}"`,
          )
        }
      } finally {
        await session.close()
      }
    },
  },

  /* ---- doc 22 BJ-NET-05 ------------------------------------------------ */
  {
    id: 'BJ-NET-05',
    title: 'the node page states at the top that everything runs on one machine, and offers no peer to dial',
    tier: 1,
    asserts: 'presentation',
    async run(surface) {
      const session = await open(surface.origin, { path: '/node', stubs: ANONYMOUS })
      try {
        const text = await assertMounted(session, { showing: [NODE.title] })
        assert.ok(
          /one machine|127\.0\.0\.1|nothing routes it|localhost/i.test(text),
          'the node page never says the testnet is a single machine',
        )
        // The page SAYS there is no bootstrap list and no peer to dial. Asserted as the positive
        // sentence rather than as a banned word: a grep for "bootstrap" fires on the very sentence
        // that gets this right, and a guard that fires on its own rationale gets deleted. This
        // estate has found that pattern six times.
        assert.ok(
          /no bootstrap list and no peer to dial/i.test(text),
          'the node page does not say there is no bootstrap list and no peer to dial',
        )
        // …and there is nothing to dial one INTO. A "connect to the network" step would be
        // inventing a network, so what is asserted is the absence of a field or a command carrying
        // a peer address — an `enode://` or a routable host — not the absence of the word.
        assert.equal(
          /enode:\/\/|\/dns4\/|--bootnodes/.test(text),
          false,
          'the node page offers a peer to dial, and nothing routes this chain',
        )
      } finally {
        await session.close()
      }
    },
  },

  /* ---- doc 22 BJ-NET-06 ------------------------------------------------ */
  {
    id: 'BJ-NET-06',
    title: 'every number on the faucet page comes from GET /v1/faucet, and none is in the bundle',
    tier: 2,
    asserts: 'presentation',
    gate: true,
    async run(surface) {
      const session = await open(surface.origin, { path: '/faucet', stubs: FAUCET_UP })
      try {
        const text = await assertMounted(session, { showing: [FAUCET.title] })
        const read = session.apiCalls().find((c) => c.url.endsWith('/v1/faucet'))
        assert.ok(read, 'the faucet page never asked the faucet what it will do')
        assert.equal(read.method, 'GET')

        // Every figure the service sent is on screen. The values in TERMS are deliberately not
        // round: if any of them can appear without the service having sent it, this assertion is
        // not the one doing the work.
        for (const [what, needle] of [
          ['the chain id', String(TERMS.chainId)],
          ['the funding address', TERMS.fundingAddress.slice(0, 10)],
          ['the per-requester limit', String(TERMS.requesterLimit)],
        ] as const) {
          assert.ok(text.includes(needle), `${what} is not on the page`)
        }
        // The service's own terms string, verbatim. A disclaimer that exists in two places is a
        // disclaimer that will disagree with itself.
        assert.ok(text.includes(TERMS.terms), 'the faucet’s own terms were paraphrased')
      } finally {
        await session.close()
      }

      // …and with the service answering DIFFERENT numbers, the page shows those instead. This is
      // what separates "renders the response" from "renders a constant that happens to match".
      const other = await open(surface.origin, {
        path: '/faucet',
        stubs: [['GET /v1/faucet', { json: { ...TERMS, chainId: 991, requesterLimit: 2 } }], ...ANONYMOUS],
      })
      try {
        await assertMounted(other)
        // Scoped to the terms panel. 7412 is also a REGISTERED FACT in this site's prose
        // (src/content/facts.ts), and it belongs there — so a whole-page search would be asking
        // whether the copy mentions the chain, not whether the panel follows the response.
        const panel = await other.page
          .locator('section', { hasText: 'What this faucet will do' })
          .first()
          .innerText()
        assert.ok(panel.includes('991'), 'the chain id in the terms panel did not follow the response')
        assert.equal(
          panel.includes(String(TERMS.chainId)),
          false,
          'the terms panel still shows the first response’s chain id',
        )
      } finally {
        await other.close()
      }
    },
  },

  /* ---- doc 22 BJ-NET-07 ------------------------------------------------ */
  {
    id: 'BJ-NET-07',
    title: 'with the faucet unreachable the panel says so and the form cannot be submitted',
    tier: 1,
    asserts: 'presentation',
    gate: true,
    noServerRule:
      'The faucet answered nothing at all, so there is no server decision to own. What is asserted ' +
      'is that this bundle disables its own form and says the service did not answer, rather than ' +
      'posting into a hole and rendering the network error as though it were a refusal.',
    async run(surface) {
      const session = await open(surface.origin, {
        path: '/faucet',
        stubs: [['GET /v1/faucet', { abort: true }], ...ANONYMOUS],
      })
      try {
        const text = await assertMounted(session, { tolerateFailures: [/\/v1\/faucet/] })
        assert.ok(
          text.includes(FAUCET.unavailable.title),
          `the page does not say the faucet did not answer. It says: ${text.slice(0, 400)}`,
        )
        // No figure survives. There is no fallback set in this repository, so a terms panel here
        // would be numbers somebody typed. Asserted as the panel's absence rather than as a search
        // for 7412, which is a registered fact this site's prose is entitled to state.
        assert.equal(
          await session.page.locator('section', { hasText: 'What this faucet will do' }).count(),
          0,
          'the faucet terms panel rendered with no faucet behind it',
        )
        assert.equal(
          text.includes(TERMS.fundingAddress.slice(0, 10)),
          false,
          'a funding address appeared with no faucet',
        )

        // The form is rendered — so the page keeps its shape and a reader can see what WOULD be
        // asked for — and it is disabled. A request posted into an unreachable service fails in a
        // way that looks like a refusal, and a reader would read it as one.
        const field = session.page.locator('#drip-address')
        const button = session.page.locator('form button[type="submit"]')
        assert.equal(await field.count(), 1, 'the form is not rendered at all')
        assert.equal(await field.isDisabled(), true, 'the address field is live with no faucet behind it')
        assert.equal(await button.isDisabled(), true, 'the submit button is live with no faucet behind it')

        // Nothing left the browser. The strongest form of "cannot be submitted".
        assert.deepEqual(
          session.apiCalls().filter((c) => c.method === 'POST').map((c) => c.url),
          [],
          'the page posted something anyway',
        )
      } finally {
        await session.close()
      }
    },
  },

  /* ---- doc 22 BJ-NET-08 ------------------------------------------------ */
  {
    id: 'BJ-NET-08',
    title: 'the drip request carries an address and an idempotency key, and nothing else',
    tier: 1,
    asserts: 'client-request',
    gate: true,
    // The SERVICE ignoring an amount it was sent anyway is faucet's own test. This asserts the
    // half this repository owns: that there is no field for one, and nothing in the body that
    // could carry one. Every faucet that has ever been drained let the caller influence the amount.
    serverRule: 'the faucet ignores any amount a caller names',
    ownedBy: 'faucet/src/server.test.ts#ignores every attempt to name an amount',
    async run(surface) {
      const session = await open(surface.origin, {
        path: '/faucet',
        stubs: [
          ['GET /v1/faucet', { json: TERMS }],
          ['POST /v1/drips', { status: 202, json: { id: 'drip-1', duplicate: false, status: 'queued' } }],
          ['GET /v1/drips/*', { json: { id: 'drip-1', status: 'queued', amountWei: TERMS.dripWei } }],
          ...ANONYMOUS,
        ],
      })
      try {
        await assertMounted(session)

        // There is no amount field anywhere on the page. Not disabled, not hidden — absent.
        const inputs = await session.page.$$eval('form input, form select, form textarea', (nodes) =>
          nodes.map((n) => ({
            id: n.getAttribute('id') ?? '',
            name: n.getAttribute('name') ?? '',
            type: n.getAttribute('type') ?? '',
          })),
        )
        assert.equal(inputs.length, 1, `the drip form has ${inputs.length} fields; it should have one`)
        assert.equal(inputs[0]?.id, 'drip-address')

        await session.page.fill('#drip-address', '0x1111111111111111111111111111111111111111')
        await session.page.click('form button[type="submit"]')
        await session.page.waitForFunction(() => document.body.innerText.includes('drip-1'), undefined, {
          timeout: 10_000,
        })

        const post = session.apiCalls().find((c) => c.method === 'POST' && c.url.includes('/v1/drips'))
        assert.ok(post, 'nothing was posted')
        const body = JSON.parse(post.body ?? '{}') as Record<string, unknown>
        // The whole body, compared as a key set. An extra field is the failure, whatever it is
        // called — `amount`, `amountWei`, `wei`, `multiplier`.
        assert.deepEqual(Object.keys(body).sort(), ['address', 'idempotencyKey'])
        assert.equal(body['address'], '0x1111111111111111111111111111111111111111')
        assert.equal(typeof body['idempotencyKey'], 'string')
        assert.ok(String(body['idempotencyKey']).length >= 16, 'the idempotency key is too short to be unique')

        // No `Idempotency-Key` HEADER either. The faucet's idempotency is a field in the body;
        // micro-trade requires the header on every mutating route, so the two clients look alike
        // and are not interchangeable — a header here is silently ignored and the retry is a
        // second drip.
        const headerNames = Object.keys(post.headers).map((h) => h.toLowerCase())
        assert.equal(headerNames.includes('idempotency-key'), false, 'the client sent a header the faucet ignores')

        // And the URL carries nothing either: a query parameter is a body field with a different
        // spelling.
        assert.equal(new URL(post.url).search, '', 'the drip request carried a query string')
      } finally {
        await session.close()
      }
    },
  },

  /* ---- doc 22 BJ-NET-09 ------------------------------------------------ */
  {
    id: 'BJ-NET-09',
    title: 'a refusal is shown in the limiter’s own words, with no second wording composed here',
    tier: 1,
    asserts: 'presentation',
    gate: true,
    // The rule — that a second request inside the cooldown IS refused — is the faucet's, and is
    // cited. What is asserted here is only that this bundle renders the sentence it was given.
    serverRule: 'a second drip to one address inside the cooldown is refused',
    ownedBy: 'faucet/src/server.test.ts#address_cooldown',
    async run(surface) {
      const message = 'One drip per address every 90 minutes. Try again at 14:32 UTC.'
      const session = await open(surface.origin, {
        path: '/faucet',
        stubs: [
          ['GET /v1/faucet', { json: TERMS }],
          [
            'POST /v1/drips',
            {
              status: 429,
              headers: { 'x-request-id': 'cf-req-limiter-1' },
              json: { error: { code: 'address_cooldown', message, requestId: 'cf-req-limiter-1' } },
            },
          ],
          ...ANONYMOUS,
        ],
      })
      try {
        await assertMounted(session)
        await session.page.fill('#drip-address', '0x2222222222222222222222222222222222222222')
        await session.page.click('form button[type="submit"]')
        await session.page.waitForFunction(
          (needle: string) => document.body.innerText.includes(needle),
          message,
          { timeout: 10_000 },
        )

        const text = await session.page.evaluate(() => document.body.innerText)
        // VERBATIM. A second wording here would be a second thing to keep true, and the softer of
        // the two is the one a reader would quote back.
        assert.ok(text.includes(message), 'the limiter’s sentence was replaced')
        assert.ok(text.includes('address_cooldown'), 'the code the faucet answered is not shown')
        assert.ok(text.includes('cf-req-limiter-1'), 'the request id to quote at support is not shown')
        // A refusal is the limiter WORKING, so it is not painted as a fault.
        assert.ok(
          text.includes('That is the rate limiter, not a fault'),
          'a rate-limit refusal is presented as a breakage',
        )
      } finally {
        await session.close()
      }
    },
  },

  /* ---- doc 22 BJ-NET-10 / BJ-ADV-18-H1 --------------------------------- */
  {
    id: 'BJ-ADV-18-H1',
    title: 'pressing the drip button twice before the first answer produces one request',
    tier: 1,
    asserts: 'client-request',
    async run(surface) {
      const session = await open(surface.origin, {
        path: '/faucet',
        stubs: [
          ['GET /v1/faucet', { json: TERMS }],
          // Slow, so the second press lands while the first is still in flight. That is the whole
          // hazard: a control that disables itself only once the answer arrives has a window.
          ['POST /v1/drips', { status: 202, json: { id: 'drip-1', duplicate: false }, delayMs: 1200 }],
          ['GET /v1/drips/*', { json: { id: 'drip-1', status: 'queued', amountWei: TERMS.dripWei } }],
          ...ANONYMOUS,
        ],
      })
      try {
        await assertMounted(session)
        await session.page.fill('#drip-address', '0x3333333333333333333333333333333333333333')
        const button = session.page.locator('form button[type="submit"]')
        await button.click()
        // Disabled the moment the request is sent, not when it answers. Asserted rather than
        // inferred, because "click twice quickly" is a race and this is the property underneath it.
        await session.page.waitForFunction(
          () => (document.querySelector('form button[type="submit"]') as HTMLButtonElement | null)?.disabled === true,
          undefined,
          { timeout: 2_000 },
        )
        await button.click({ force: true, timeout: 2_000 }).catch(() => undefined)
        await session.page.waitForFunction(() => document.body.innerText.includes('drip-1'), undefined, {
          timeout: 10_000,
        })

        const posts = session.apiCalls().filter((c) => c.method === 'POST' && c.url.includes('/v1/drips'))
        assert.equal(posts.length, 1, `${posts.length} drip requests left the browser for one intent`)
      } finally {
        await session.close()
      }
    },
  },

  /* ---- doc 22 BJ-A11Y-07 ----------------------------------------------- */
  {
    id: 'BJ-A11Y-07',
    title: 'the faucet form is operable by keyboard alone, and its disabled state is announced rather than only styled',
    tier: 1,
    asserts: 'presentation',
    noServerRule:
      'Nothing is submitted. The scenario walks the form with the keyboard and reads the ' +
      'accessibility tree; no service is asked anything and no rule is involved.',
    async run(surface) {
      // Live: the field and the submit are both reachable and operable with the keyboard alone.
      const live = await open(surface.origin, { path: '/faucet', stubs: FAUCET_UP })
      try {
        await assertMounted(live)
        await live.page.locator('#drip-address').focus()
        await live.page.keyboard.type('0x4444444444444444444444444444444444444444')
        assert.equal(
          await live.page.inputValue('#drip-address'),
          '0x4444444444444444444444444444444444444444',
        )
        // Tab from the field reaches the submit control. A control that needs a pointer to reach
        // is a control some readers do not have.
        await live.page.keyboard.press('Tab')
        const focused = await live.page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null
          return { tag: el?.tagName.toLowerCase() ?? '', type: el?.getAttribute('type') ?? '' }
        })
        assert.deepEqual(focused, { tag: 'button', type: 'submit' })
      } finally {
        await live.close()
      }

      // Dead: the disabled state is a PROPERTY, so assistive technology announces it. A control
      // greyed out with CSS and left operable is announced as available and does nothing.
      const dead = await open(surface.origin, {
        path: '/faucet',
        stubs: [['GET /v1/faucet', { abort: true }], ...ANONYMOUS],
      })
      try {
        await assertMounted(dead, { tolerateFailures: [/\/v1\/faucet/] })
        const state = await dead.page.evaluate(() => {
          const field = document.querySelector('#drip-address') as HTMLInputElement | null
          const button = document.querySelector('form button[type="submit"]') as HTMLButtonElement | null
          return {
            fieldDisabled: field?.disabled ?? null,
            buttonDisabled: button?.disabled ?? null,
            // The reason is on the page as text, not as a colour. `role="alert"` is what carries
            // it to a reader who never sees the panel.
            announced: Boolean(document.querySelector('[role="alert"]')),
          }
        })
        assert.equal(state.fieldDisabled, true, 'the field is only styled as disabled')
        assert.equal(state.buttonDisabled, true, 'the button is only styled as disabled')
        assert.equal(state.announced, true, 'nothing announces why the form cannot be used')
        await assertAxeClean(dead.page, '/faucet with the faucet down', KNOWN_A11Y)
      } finally {
        await dead.close()
      }
    },
  },

  /* ---- estate-wide, on this surface ------------------------------------ */
  {
    id: 'BJ-ACC-06',
    title: 'the SSO callback code is stripped from the address bar before the exchange is sent',
    tier: 1,
    asserts: 'client-request',
    async run(surface) {
      const session = await open(surface.origin, {
        path: '/#cf_code=handoff-code-123',
        stubs: [
          ['POST /auth/handoff/redeem', { json: { accessToken: 'a', refreshToken: 'r' } }],
          ['GET /auth/me', { json: ME }],
          ...ANONYMOUS,
        ],
      })
      try {
        await assertMounted(session)
        const hash = await session.page.evaluate(() => window.location.hash)
        assert.equal(hash.includes('cf_code'), false, `cf_code is still in the address bar: ${hash}`)
        const redeem = session.apiCalls().find((c) => c.url.includes('/auth/handoff/redeem'))
        assert.ok(redeem, 'the hand-off code was never redeemed')
        assert.ok(redeem.body?.includes('handoff-code-123'), 'the code was not sent in the body')
        assert.equal(redeem.url.includes('handoff-code-123'), false, 'the code was put in a URL')
      } finally {
        await session.close()
      }
    },
  },
  {
    id: 'BJ-ACC-08',
    title: 'every route here renders anonymously, with no sign-in prompt and no credential sent',
    tier: 2,
    asserts: 'client-request',
    async run(surface) {
      for (const path of OWNED) {
        const session = await open(surface.origin, {
          path,
          stubs: [...CHAIN_UP, ...FAUCET_UP],
        })
        try {
          await assertMounted(session)
          // The page did not bounce anybody anywhere. A public chain whose explorer is paywalled
          // is not a public chain, and the services here serve anonymous callers by their own
          // decision — so a gate would demand a session for facts anyone can read.
          assert.equal(
            session.page.url().includes('/account/login'),
            false,
            `${path} sent an anonymous reader to sign in`,
          )
          // And no credential went out. `src/lib/api.ts` attaches a bearer whenever it holds one,
          // so a route that does not read one would otherwise get a token in its access log.
          const withAuth = session
            .apiCalls()
            .filter((c) => Object.keys(c.headers).some((h) => h.toLowerCase() === 'authorization'))
          assert.deepEqual(withAuth.map((c) => c.url), [], `${path} sent a credential`)
        } finally {
          await session.close()
        }
      }
    },
  },
  {
    id: 'BJ-A11Y-01',
    title: 'axe finds no serious or critical violation on any route of this surface',
    tier: 2,
    asserts: 'presentation',
    gate: true,
    async run(surface) {
      const seen = new Set<string>()
      for (const path of [...OWNED, '/nope']) {
        const session = await open(surface.origin, { path, stubs: [...CHAIN_UP, ...FAUCET_UP] })
        try {
          await assertMounted(session)
          for (const id of await assertAxeClean(session.page, path, KNOWN_A11Y)) seen.add(id)
        } finally {
          await session.close()
        }
      }
      assertKnownStillBroken(seen, KNOWN_A11Y)
    },
  },
  {
    id: 'BJ-A11Y-12',
    title: 'a reachable skip link, one main landmark, and a heading order with no level skipped',
    tier: 2,
    asserts: 'presentation',
    async run(surface) {
      for (const path of OWNED) {
        const session = await open(surface.origin, { path, stubs: [...CHAIN_UP, ...FAUCET_UP] })
        try {
          await assertMounted(session)
          await assertLandmarks(session.page, path)
          await assertSkipLink(session.page, path)
        } finally {
          await session.close()
        }
      }
    },
  },

  /* ---- specified, and not writable today -------------------------------- */
  {
    id: 'BJ-ADV-18-H2',
    title: 'the back button after a drip does not re-arm a second request against the same intent',
    tier: 1,
    asserts: 'navigation',
    expectStatus: 200,
    blocked:
      'There is no navigation to go back from. The drip form does not change the address: the ' +
      'submission, the refusal and the progress panel all render in place on /faucet, so the ' +
      'browser has one history entry and pressing Back leaves this surface entirely. The hazard ' +
      'is real for a multi-step commit and this one is single-step, so the scenario is recorded ' +
      'rather than written against a step that does not exist.',
  },
  {
    id: 'BJ-ADV-18-H6',
    title: 'a faucet answering slowly rather than failing leaves the control disabled with the reason',
    tier: 1,
    asserts: 'presentation',
    blocked:
      'The faucet client has no retry-after or degraded path to drive: `getFaucetTerms` either ' +
      'resolves or throws, and a slow answer is indistinguishable from a fast one once it lands. ' +
      'Covered in part by BJ-NET-07, which is the failed case. Making this runnable needs a ' +
      'client deadline in src/lib/faucet.ts, which is a product decision rather than a test one.',
  },
]
