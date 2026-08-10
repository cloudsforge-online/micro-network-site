/**
 * The `micro-indexer` surface, as this app is allowed to use it.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * EVERY ROUTE BELOW WAS READ OUT OF `indexer/src/server.ts`, ONE AT A TIME, AND CARRIES THE LINE
 * IT WAS READ FROM.
 *
 * Not inferred from a sibling client, and not copied from `@cloudsforge/sdk`. Eight clients in
 * this estate were built against a surface somebody imagined; one made every on-chain escrow
 * activation fail with a false diagnosis, and one made every ForgeMint project page read "not yet
 * indexed" permanently. `micro-indexer`'s own route table says so in its header
 * (`indexer/src/server.ts`) and asks to be parsed rather than paraphrased.
 *
 * The table is `DOMAIN` at `indexer/src/server.ts`, one entry per line. Both spellings of
 * every path are mounted, because `PREFIXES` is `['/v1', '']` (`indexer/src/server.ts`) and
 * `buildRoutes` loops over it (`indexer/src/server.ts`). This client uses the `/v1` form:
 * it is the estate convention, and the service's own comment says the bare form
 * exists for the operator runbooks rather than for new callers.
 *
 * ── ONE route is called. TEN are declined, each with a reason ──────────────────────────────────
 *
 * | Method | Path                                                  | Gate                | Verified at               |
 * | ------ | ----------------------------------------------------- | ------------------- | ------------------------- |
 * | GET    | /v1/chains/:chain/:network/status | authoriseRead, in `chainStatus` | indexer/src/server.ts |
 *
 * The six other reads are **anonymous and callable**, and this surface calls none of them. That is
 * a decision about what this page IS, not about what it may do: **`micro-explorer-web` is the
 * surface that reads the chain index record by record**, it is registered separately
 * (`ui/packages/ui/src/surfaces.ts`), and a second explorer inside the Network site would
 * be a fork of one that already exists and is already tested. This page links to it.
 *
 *   * `GET /v1/addresses/:chain/:network/:address/activity` (`indexer/src/server.ts`,
 *     `authoriseRead`) — an address feed. This surface has no address to ask about.
 *   * `GET /v1/addresses/:chain/:network/:address/token-balances` (`indexer/src/server.ts`,
 *     `authoriseRead`) — a holding is an explorer question.
 *   * `GET /v1/transactions/:chain/:network/:hash` (`indexer/src/server.ts`, `authoriseRead`) — a record read, and the explorer owns record reads.
 *   * `GET /v1/transactions/:chain/:network/:hash/confirmations` (`indexer/src/server.ts`,
 *     `authoriseRead`) — a depth VERDICT, which is a decision input. Nothing on this
 *     surface takes a decision, and a page that rendered one would be inviting somebody to.
 *   * `GET /v1/tokens/:chain/:network/:address` (`indexer/src/server.ts`, `authoriseRead`) — token state belongs to ForgeMint and the explorer.
 *   * `GET /v1/blocks/:chain/:network/:height` (`indexer/src/server.ts`, `authoriseRead`) — a block page here would be a second explorer competing with a tested one.
 *
 * Two further reads are declined for a different reason — they are the domain GETs on this service
 * that take a token:
 *
 *   * `GET /v1/custody/:chain/:network/total` (`indexer/src/server.ts`) calls
 *     `authorise(ctx, deps, READ_SCOPE)` (`indexer/src/server.ts`). It is Σ confirmed native
 *     balance over the estate's custody set — the number `micro-ledger` reconciles its books
 *     against. The rule that opened the other seven reads is that what they return is already
 *     public, because each answers about a block, a hash or an address THE CALLER NAMED; this one
 *     answers about a set only the platform knows, so serving it anonymously would publish the
 *     treasury's size to anyone who can reach the port (`indexer/src/server.ts`). A public
 *     marketing surface holds no service token, and has nothing to say about the treasury.
 *   * `GET /v1/custody/:chain/:network/addresses/:address` (`indexer/src/server.ts`) is the other
 *     one, added beside the total and gated the same way: `authorise(ctx, deps, READ_SCOPE)`. It
 *     answers ONE named custody address's observed balance, at the depth and against the block
 *     hash the aggregate is measured at, so a reconciliation that fails can be broken down to the
 *     address that moved rather than re-derived from a number the two sides measured differently.
 *     The caller does name the address, which is what makes the other seven reads public — but
 *     the addresses worth naming here are the estate's own, so answering confirms membership of
 *     the set the total exists to keep private. Same conclusion, same reason: no service token on
 *     this surface, and nothing here to say about the treasury or any part of it.
 *
 * The two writes are refused to a browser and would be declined even if they were not:
 *
 *   * `POST /v1/watch/:chain/:network/:address` (`indexer/src/server.ts`) calls
 *     `authorise(ctx, deps, WRITE_SCOPE)`, whose scope constant is `WRITE_SCOPE` in the same
 *     file. "Watch
 *     this address" is an operator or a service decision about what this deployment indexes.
 *   * `POST /v1/backfills/:chain/:network` (`indexer/src/server.ts`) takes `indexer:write` too
 *     (`indexer/src/server.ts`) and enqueues a range walk — which is provider calls, which is
 *     money.
 *
 * `/livez`, `/readyz` and `/metrics` (`indexer/src/server.ts`) are the platform
 * probes and are not wrapped here either. Every declination above is re-enumerated in
 * `test/chainstatus.test.ts` with the line the handler is declared at and the gate it opens with,
 * so a route this app has never read is a red run rather than an omission somebody has to notice.
 *
 * ── THE READ IS ANONYMOUS, AND THIS CLIENT SENDS NO BEARER ────────────────────────────────────
 *
 * `authoriseRead` (`indexer/src/server.ts`) reads the `authorization` header and, when
 * there is none, **returns `null` and lets the handler run** (`indexer/src/server.ts`). The
 * service's reasoning is in the doc comment above it (`indexer/src/server.ts`): every read
 * answers with a chain fact anyone can obtain by running a Hearth node, this service stores nothing
 * linking an address to a person, and the check that used to sit there was "a lock on a public
 * library".
 *
 * `auth: false` is therefore load-bearing rather than an optimisation. `src/lib/api.ts` attaches a
 * bearer whenever it happens to hold an access token, and **a token that IS presented is still
 * verified**: a service principal without `indexer:read` is a 403 (`indexer/src/server.ts`)
 * and a broken or expired one is a 401. A reader whose access token had expired would then get a
 * 401 on a page that needs no session at all.
 *
 * ── The amounts rule, inherited even though this file reads no amount ──────────────────────────
 *
 * `reads.ts` puts every amount on the wire as a decimal string and says why in its header
 * (`indexer/src/reads.ts`): `JSON.stringify` cannot serialise a `bigint` at all, and
 * `Number(amount)` silently loses the low digits of any 18-decimal value above about 9 ETH.
 * `ChainStatus` carries no amount — every field on it is a height, a depth, a count or a
 * timestamp — but nothing here parses one with `Number` either, and `src/lib/format.ts` never
 * converts one.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */
import { chainIndex } from './api.ts'

/* ══════════════════════════════ scope ══════════════════════════════ */

/**
 * The chains this service runs, as `indexer/src/chains.ts` declares them, in its order.
 *
 * `shard` is deliberately absent upstream and the reason is at `indexer/src/chains.ts`:
 * SHARD exists in `CHAINS` only so that record is total, it never exists on a chain, and "an
 * indexer that accepted it would be advertising an endpoint that can only ever answer empty".
 * Restated here rather than imported, because a browser bundle must not depend on a service's
 * source tree; `test/chainstatus.test.ts` reads the real list and fails if this one drifts.
 *
 * **THE COUNT IS NO LONGER STATED, AND THAT IS THE SECOND LESSON RATHER THAN A STYLE CHOICE.**
 * This opened "the six chains", which was a fact about upstream at the time of writing and has
 * been wrong twice since. A number in the sentence above a list is a second copy of the list's
 * length, kept by hand, in a repository nothing notifies when the real one changes.
 *
 * `ltc` JOINED ON 2026-08-05 and this list did not, which is exactly the drift that test exists
 * to catch — it went red on the next push rather than at a reader's expense. `etc` and `doge`
 * JOINED ON 2026-08-07 with micro-contracts `c0e7c77`, and it happened AGAIN: this list still
 * had six, the drift test had been red for it, and nothing had acted on the red. Neither new
 * chain needs a worker of its own upstream — Dogecoin's spec carries `family: 'bitcoin'` and
 * Ethereum Classic's `family: 'evm'`, and the indexer selects a worker by family
 * (`indexer/src/chains.ts`), which is why a chain can arrive there without a line of new code
 * and arrive here without anybody noticing.
 *
 * **Being on this list is being ASKABLE, never being followed, and on this surface it is not even
 * that.** `INDEXER_CHAINS` is what a deployment actually walks and both live estates set it to a
 * single scope. Nothing here renders the list at all — Forge Network is `ember` alone
 * (`HEARTH_CHAIN` below) and the custodied chains belong on the explorer — so these entries are a
 * restatement of upstream truth and change no pixel. In particular no copy on this site says
 * DOGE or ETC can be held or deposited, because no deposit in either has ever been credited at
 * any depth (`contracts/packages/chain/src/index.ts`).
 */
export const CHAIN_IDS = ['ember', 'eth', 'etc', 'btc', 'sol', 'xrp', 'ltc', 'doge'] as const
export type ChainId = (typeof CHAIN_IDS)[number]

/** `indexer/src/chains.ts`. */
export const NETWORKS = ['mainnet', 'testnet'] as const
export type Network = (typeof NETWORKS)[number]

/**
 * The chain this surface is about.
 *
 * Forge Network is Hearth, and Hearth's asset is EMBER — `indexer/src/chains.ts` maps the
 * `ember` slug to the `EMBER` asset code, and `contracts/packages/chain/src/index.ts` is the
 * spec it reads. The other four chains the indexer runs are chains this platform CUSTODIES, not
 * chains it operates, so they belong on the explorer and not here.
 */
export const HEARTH_CHAIN: ChainId = 'ember'

/**
 * The unit every route is scoped by.
 *
 * `indexer/src/chains.ts` says there is no function in that repository that takes a chain
 * without a network, and `indexer/src/chains.ts` says why: XRP has no network binding today,
 * so the same seed and the same address exist on testnet and mainnet and a signed Payment is
 * submittable on either. Every request from this app carries both segments for the same reason.
 */
export interface Scope {
  readonly chain: ChainId
  readonly network: Network
}

/**
 * The two scopes this page asks about, in the order it renders them.
 *
 * **Mainnet first, and that ordering is a claim about Hearth rather than a layout preference.**
 *
 * THIS WAS TESTNET-FIRST, AND THE REASON IT WAS HAS INVERTED. The comment here read "neither scope
 * has a chain behind it today, and asking about mainnet first would put the more absent of the two
 * at the top", citing `hearth/MAP.md` for "there is no live endpoint, no testnet and no mainnet".
 * Half of that is now false. `deploy/cloudflared/config.mainnet.public.yml` publishes the
 * mainnet JSON-RPC hostname on the public tunnel and it answers `eth_chainId` from off the estate,
 * so mainnet is the scope with a chain behind it.
 *
 * **AND THE SECOND HALF HAS NOW INVERTED TOO, WHICH CHANGES THE REASON WITHOUT CHANGING THE
 * ORDER.** This paragraph read: "Testnet is not merely unpublished — it is unreachable for a
 * reason that has nothing to do with Hearth: `deploy/gateway/dynamic/tls.yml` records that
 * Cloudflare's Universal SSL is one label deep, so every two-label name under the testnet apex
 * fails its TLS handshake before any request is made." The TLS fact is still true and the
 * conclusion no longer follows from it: testnet hostnames stopped being two labels deep. An
 * environment is now a SUFFIX inside the first label (`<surface>-testnet.<apex>`,
 * `ui/packages/ui/src/surfaces.ts`), the wildcard covers them, and
 * `rpc-testnet.cloudsforge.online` answers `eth_chainId` with `0x1cf4` from off the estate.
 *
 * **AND A THIRD FACT, WHICH IS ABOUT THE INDEX RATHER THAN ABOUT THE CHAINS.** Both scopes have a
 * chain behind them and no single deployment can answer for both: each estate's chain index follows
 * exactly one EMBER network, and `deploy/compose/env/chain.mainnet.env` opens by saying so —
 * "exactly one of this file and `chain.testnet.env` is ever read, and no deploy can have half of
 * each". So one of these two panels is always about a chain the index this page talks to is not
 * walking. That panel is kept rather than dropped, because the reader's question is "is there a
 * testnet" and the answer is yes, over there — see `CHAIN.notFollowed` and the `followed` field.
 * Dropping it was the alternative and it hides the question instead of answering it.
 *
 * So BOTH scopes now have a chain behind them, and "the more absent of the two" is no longer the
 * argument for this order. The argument that replaces it is about what a reader is looking at:
 * mainnet is the chain whose balances are permanent, testnet's coin is given away and disposable,
 * and the permanent one belongs at the top. `test/chainstatus.test.ts` pins the order either way,
 * so a reorder stays a decision somebody argues for rather than a diff nobody notices.
 */
export const HEARTH_SCOPES: readonly Scope[] = [
  { chain: HEARTH_CHAIN, network: 'mainnet' },
  { chain: HEARTH_CHAIN, network: 'testnet' },
]

/* ══════════════════════════════ what comes back ══════════════════════════════ */

/** `indexer/src/reads.ts`. */
export interface ProviderView {
  readonly provider: string
  readonly host: string
  readonly state: 'healthy' | 'degraded' | 'down'
  readonly consecutiveFailures: number
  readonly totalRequests: number
  readonly totalFailures: number
  readonly latencyMs: number | null
  readonly lastOkAt: string | null
  readonly lastFailureAt: string | null
  readonly lastError: string | null
  readonly rateLimitedUntil: string | null
}

/** One recorded reorg, as `status` reports it (`indexer/src/reads.ts`). */
export interface ReorgView {
  readonly id: string
  readonly detectedAt: string
  readonly depth: number
  readonly commonAncestorHeight: number
  /** True when the depth crossed the alarm threshold and the chain was halted. */
  readonly alarming: boolean
  readonly orphanedBlocks: number
  readonly orphanedTransactions: number
  readonly orphanedActivity: number
}

/**
 * The state of one chain, as `status` builds it (`indexer/src/reads.ts`).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * **EVERY HEIGHT ON THIS SHAPE IS NULLABLE, AND THE NULL IS THE ANSWER THIS PAGE MOST OFTEN GETS.**
 *
 * `status` reads a checkpoint row and returns `checkpoint?.tipHeight ?? null` and
 * `checkpoint?.height ?? null` (`indexer/src/reads.ts`). A deployment that has never
 * followed `ember:testnet` has no checkpoint row, so it answers **200** with `tipHeight: null`,
 * `indexedHeight: null`, `lagBlocks: null`, `providers: []` and `recentReorgs: []`. That is not a
 * failure and it is not "zero": it is the service saying it has not observed anything.
 *
 * `indexer/src/reads.ts` states the rule for one of them in the service's own words — "Null
 * when no tip has ever been observed; a lag of zero would be a lie, not a default" — and this file
 * applies it to all of them. `figureOf()` below is the only way a number reaches the screen, and
 * it cannot return one from a null. Nothing in this bundle writes `?? 0` against a height.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *
 * `indexedHeight` and `tipHeight` are different numbers and the difference is the whole point.
 * `indexedHeight` is the highest canonical block this service has walked and would have detected a
 * reorg in; `tipHeight` is what a provider last claimed. `indexer/src/reads.ts` says counting
 * against the second "over-reports depth, and over-reporting depth credits early". This app renders
 * both, always, and never one without the other.
 */
export interface ChainStatus {
  readonly chain: string
  readonly network: string
  readonly family: string
  readonly asset: string
  /** Ember mainnet is 7411, testnet 7412 (`contracts/packages/chain/src/index.ts`). */
  readonly chainId: number | null
  readonly requiredConfirmations: number
  readonly reorgAlarmDepth: number
  readonly tipHeight: number | null
  readonly tipSeenAt: string | null
  readonly indexedHeight: number | null
  readonly indexedHash: string | null
  /** Null when no tip has ever been observed — "a lag of zero would be a lie, not a default." */
  readonly lagBlocks: number | null
  /**
   * Whether the index this page is talking to FOLLOWS this scope (`indexer/src/reads.ts`).
   *
   * Optional, and the optionality is the compatibility seam rather than an uncertainty about the
   * field: an index older than the release that added it answers without the key, and this page is
   * served from a bundle that can reach an estate mid-deploy. `undefined` is read as "it did not
   * say", which this page renders as the answer it used to give.
   *
   * It was added because this page rendered the failure. On 2026-08-10 the mainnet index still
   * held an `ember:testnet` checkpoint left by a provider that had run on that host on 2026-08-04,
   * halted at height 87, and `INDEXER_CHAINS` had not listed the scope for six days. Nothing
   * cleared the row and nothing distinguished it, so this panel told every reader "This chain is
   * halted" — a present-tense alarm about a chain the service was not walking.
   */
  readonly followed?: boolean
  /**
   * True once an alarming reorg has made this service stop vouching for the chain.
   *
   * Upstream gates this on `followed` (`indexer/src/reads.ts`), so an index at or past that
   * release cannot report a halt for a scope it does not follow. This page still checks
   * `followed` before rendering the alarm, because it may be talking to an older one.
   */
  readonly halted: boolean
  readonly haltReason: string | null
  readonly providers: readonly ProviderView[]
  readonly recentReorgs: readonly ReorgView[]
}

/* ══════════════════════════════ a figure, or the reason there is none ══════════════════════════════ */

/**
 * WHY A NUMBER ON THIS PAGE IS A TAGGED UNION RATHER THAN `number | null`.
 *
 * `docs/ecosystem/01-product-vision.md` is principle 5, "Honest copy", and the estate's status
 * page turned it into a structural property rather than a habit: `status-web/src/lib/degrade.ts`
 * records that **no branch of its failure reducer can produce `operational`**, so green-on-unknown
 * is unreachable rather than merely unlikely.
 *
 * The same rule, applied to a number: **there is no code path from "we did not fetch it" to a
 * digit.** A `Figure` is either `known` with a value, or one of three absences that each say
 * something different:
 *
 *   | state       | what happened                                        | what the page says                    |
 *   | ----------- | ---------------------------------------------------- | ------------------------------------- |
 *   | `known`     | the index answered and the field carried a value     | the number                            |
 *   | `unobserved`| the index answered and the field was **null**        | it has not observed this yet          |
 *   | `unfetched` | the request did not answer at all                    | we could not fetch it, and the reason |
 *   | `pending`   | the request is in flight                             | nothing yet                           |
 *
 * They are not collapsed into "—" because they are not the same fact, and a reader deciding
 * whether this chain is running is entitled to the difference. `test/chainstatus.test.ts` asserts
 * that `figureOf` has no branch returning a value from a null input, and `test/render.test.ts`
 * asserts that no page formats a height except through `Figure`.
 */
export type Figure =
  | { readonly state: 'known'; readonly value: number }
  | { readonly state: 'unobserved' }
  | { readonly state: 'unfetched'; readonly why: string }
  | { readonly state: 'pending' }

/** A field of an answered status. `null` upstream becomes `unobserved`, never zero. */
export function figureOf(value: number | null | undefined): Figure {
  return typeof value === 'number' ? { state: 'known', value } : { state: 'unobserved' }
}

/** Every figure on a panel that could not be fetched carries the same reason. */
export function unfetched(why: string): Figure {
  return { state: 'unfetched', why }
}

export const PENDING: Figure = { state: 'pending' }

/* ══════════════════════════════ the call ══════════════════════════════ */

/**
 * Each path is written out SEGMENT BY SEGMENT, with no helper standing for `chain/network`.
 *
 * `micro-market`'s guard learned this the expensive way and wrote it down
 * (`market/src/indexerclient.test.ts`): a `${scope}` holding `chain/network` is ONE
 * template segment, so `/transactions/${scope}/${hash}/confirmations` collapses to five segments —
 * which is exactly the shape of `/transactions/:chain/:network/:hash`, a DIFFERENT route. The
 * checker then matched it against the wrong pattern and reported it fine. A shape check can only
 * judge the shape it is shown, and a helper hides one.
 */
const seg = (value: string): string => encodeURIComponent(value)

/**
 * Every call in this file goes through here, and here is the ONLY place `auth` is decided.
 *
 * One route is called today, so one flag would be one copy. The helper exists anyway, because the
 * failure it prevents is silent and the second reader is the one who adds the second route:
 * `src/lib/api.ts` attaches a bearer whenever it holds one, the indexer verifies whatever it is
 * handed, and an expired token turns a public page into a 401. One helper makes "this bundle
 * presents no credential" a property of the module instead of a habit —
 * `test/chainstatus.test.ts` asserts that nothing here reaches `chainIndex()` directly.
 */
function publicRead<T>(path: string, opts: { signal?: AbortSignal } = {}) {
  return chainIndex<T>(path, {
    auth: false,
    ...(opts.signal ? { signal: opts.signal } : {}),
  })
}

/**
 * `GET /v1/chains/:chain/:network/status` — `indexer/src/server.ts`.
 *
 * Authenticates: `authoriseRead(ctx, deps)` at `indexer/src/server.ts`. Anonymous is served
 * (`indexer/src/server.ts`), and this call presents nothing.
 *
 * A chain this estate does not run is a **404 `unknown_chain`** rather than a 400, and the service
 * says why (`indexer/src/server.ts`): the path names a resource that does not exist, and a
 * caller asking for `/chains/doge/mainnet/status` "has not made a malformed request, it has asked
 * for a chain this estate does not run". `ember` is one of the five it runs
 * (`indexer/src/chains.ts`), so this page's own two scopes cannot produce that answer — but a
 * 404 arriving anyway would mean the chain list changed under this bundle, and `src/pages/chain.tsx`
 * branches on the CODE rather than on the status for exactly that reason.
 */
export function getChainStatus(scope: Scope, signal?: AbortSignal): Promise<ChainStatus> {
  return publicRead<ChainStatus>(`/v1/chains/${seg(scope.chain)}/${seg(scope.network)}/status`, {
    ...(signal ? { signal } : {}),
  })
}
