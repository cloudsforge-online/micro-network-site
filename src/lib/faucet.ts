/**
 * The `micro-faucet` surface, as this app is allowed to use it.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * EVERY ROUTE BELOW WAS READ OUT OF `faucet/src/server.ts`, ONE AT A TIME, AND CARRIES THE LINE
 * IT WAS READ FROM.
 *
 * The faucet's routes are not a module-level table the way `micro-indexer`'s are; they are
 * `define(method, path, handler)` calls inside `buildRoutes()` (`faucet/src/server.ts:298-438`),
 * one per entry, and the `define` helper is at `faucet/src/server.ts:294-298`. So the citation for
 * each is the `define` line itself, and `test/faucet.test.ts` reads that line out of the service
 * and matches the method and the path against it.
 *
 * | Method | Path             | Gate                    | Verified at              |
 * | ------ | ---------------- | ----------------------- | ------------------------ |
 * | GET    | /v1/faucet       | none                    | faucet/src/server.ts:341 |
 * | POST   | /v1/drips        | none                    | faucet/src/server.ts:375 |
 * | GET    | /v1/drips/:id    | none                    | faucet/src/server.ts:411 |
 *
 * ── FOUR routes are declined, and none of them is a decision this page could take anyway ──────
 *
 *   * `OPTIONS /v1/drips` (`faucet/src/server.ts:432`) — the CORS preflight. It is issued **by the
 *     browser**, not by application code, so a client that called it explicitly would be sending a
 *     second, pointless request. Declined because it is not ours to send, not because it is
 *     refused: it answers 204 for an allowlisted origin and **403 for any other**
 *     (`faucet/src/server.ts:434`).
 *   * `GET /metrics` (`faucet/src/server.ts:315`) — gated, and gated on purpose. `authorise` runs
 *     first (`faucet/src/server.ts:318`) and the service says why at `:316-317`: "an open /metrics
 *     here publishes the remaining budget, which tells an attacker exactly how much is left to take
 *     and when the window rolls." It takes an `x-faucet-token` or a `faucet:read` scope
 *     (`faucet/src/server.ts:498-509`), and a browser bundle holds neither and must not.
 *   * `GET /livez` (`faucet/src/server.ts:308`) and `GET /readyz` (`faucet/src/server.ts:310`) —
 *     the platform probes. A page rendering a liveness probe would be reporting that nginx is up,
 *     which is not a fact about the faucet. Beacon owns that question.
 *
 * ── THE THREE CALLED ROUTES ARE UNAUTHENTICATED BY THE SERVICE'S OWN DECISION ─────────────────
 *
 * Not by omission. `faucet/src/server.ts:334-335` — "Unauthenticated: a testnet faucet whose terms
 * require a credential to read is a faucet nobody can use" — and `:407-409` for the poll: "it holds
 * nothing worth gating: the recipient asked for it, the amount is published, and the transaction
 * hash is public on chain. The id is a v4 UUID, so it is not enumerable."
 *
 * So every call here passes `auth: false` through `publicCall`, for the same reason the chain read
 * does: `src/lib/api.ts` attaches a bearer whenever it holds one, and a credential arriving at a
 * route that does not want one is at best noise and at worst a token in somebody's access log.
 *
 * ── WHAT THIS CLIENT MAY NOT SEND, READ OFF THE SERVICE ───────────────────────────────────────
 *
 * **No amount.** `POST /v1/drips` reads `address` and `idempotencyKey` and nothing else
 * (`faucet/src/server.ts:372-373`, `:385-390`), and `requests.ts:126-131` states the rule in the
 * frozen service's words: "every faucet that has ever been drained let the caller influence the
 * amount". This client has no amount parameter and there is nowhere for one to arrive.
 *
 * **No `Idempotency-Key` HEADER.** The faucet's idempotency is a FIELD IN THE BODY —
 * `idempotencyKey` (`faucet/src/server.ts:386-388`) — and there is no `Idempotency-Key` header
 * anywhere in that repository. `micro-trade` requires the header on every mutating route
 * (`trade/src/server.ts:840-848`), so the two clients look alike and are not interchangeable;
 * sending the header here would be silently ignored and the retry would be a second drip.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */
import { faucet } from './api.ts'

/* ══════════════════════════════ what comes back ══════════════════════════════ */

/**
 * The faucet's own description of itself — `GET /v1/faucet` (`faucet/src/server.ts:341-363`).
 *
 * **`dripWei`, `budgetRemainingWei` and every other amount are DECIMAL STRINGS, never numbers**,
 * and the service says why at `faucet/src/server.ts:350-351`: "1e19 wei is past what JSON's number
 * type carries exactly, and a client parsing it with JSON.parse would get a rounded value". This
 * file types them as `string`, and `src/lib/format.ts` divides them with `BigInt` arithmetic —
 * there is no `Number()` anywhere on this path.
 */
export interface FaucetTerms {
  /** Always the string `testnet` (`faucet/src/server.ts:346`). Not a variable. */
  readonly network: string
  /**
   * 7412. Read from `@cloudsforge/contracts-chain`, not from an environment variable
   * (`faucet/.env.example:7-13`): "This service dispenses on 7412 and there is no value of any
   * variable that changes that."
   */
  readonly chainId: number
  readonly asset: string
  /** Public the moment the first drip lands, and an operator topping up needs it (`:337-339`). */
  readonly fundingAddress: string
  readonly dripWei: string
  readonly addressCooldownSeconds: number
  readonly requesterLimit: number
  readonly requesterWindowSeconds: number
  readonly budgetRemainingWei: string
  readonly budgetWindowSeconds: number
  /**
   * The terms, served by the service rather than written on this page.
   *
   * `faucet/src/server.ts:358-360` — "Testnet EMBER. It has no value, it is not tradeable, and the
   * chain it funds may be reset without notice." This surface RENDERS that string; it does not
   * paraphrase it, and `test/render.test.ts` asserts no page carries a second wording of it. A
   * disclaimer that exists in two places is a disclaimer that will disagree with itself.
   */
  readonly terms: string
}

/** What `POST /v1/drips` answers (`faucet/src/server.ts:393-403`). */
export interface DripAccepted {
  readonly id: string
  readonly recipient: string
  readonly amountWei: string
  readonly status: string
  /** True when this request was already known — a retry, answered with the original dispense. */
  readonly duplicate: boolean
  /** The service's own poll path, e.g. `/v1/drips/<uuid>` (`faucet/src/server.ts:401`). */
  readonly poll: string
}

/**
 * One dispense, for the caller that is polling (`faucet/src/server.ts:414-427`).
 *
 * Note what is NOT here, and it is not an omission in this file: `readDispense` does not select
 * `raw_tx`, `nonce` or `custody_audit_id` (`faucet/src/requests.ts:249-256`). "The raw transaction
 * is a signature over the funding address's authority… there is no reason for a public read surface
 * to serve it."
 */
export interface DripView {
  readonly id: string
  readonly recipient: string
  /** `faucet/src/server.ts:458` enumerates the six: queued, signing, signed, broadcast, confirmed, failed. */
  readonly status: string
  readonly amountWei: string
  readonly txHash: string | null
  readonly confirmations: number
  /** A decimal string or null — a block number is a `bigint` in the store (`requests.ts:243`). */
  readonly blockNumber: string | null
  readonly failureReason: string | null
  readonly createdAt: string
  readonly settledAt: string | null
}

/**
 * The six statuses a dispense moves through, in order.
 *
 * `faucet/src/server.ts:458` is the list the service scrapes a gauge for, and
 * `faucet/README.md` describes the sequence as `queued → signing → signed → broadcast → confirmed`
 * with the bytes committed before the broadcast. Restated here so the page can render a position in
 * a sequence rather than a bare word; `test/faucet.test.ts` reads the real list and fails if this
 * one drifts.
 */
export const DRIP_STATUSES = [
  'queued',
  'signing',
  'signed',
  'broadcast',
  'confirmed',
  'failed',
] as const

/**
 * Every refusal code `POST /v1/drips` can answer with, and what each one means.
 *
 * Enumerated because **a refusal here is the limiter working, not a fault** — the service logs it
 * at INFO and says so (`faucet/src/server.ts:250-252`) — and a page that painted all five red would
 * teach a reader that a correct answer is a failure. Three come from `RefusalCode`
 * (`faucet/src/limits.ts:56-59`) and two from `acceptDrip` (`faucet/src/requests.ts:111`, `:123`).
 *
 * The MESSAGE is always the service's own and is always shown. `faucet/src/server.ts:246-248`:
 * "The message is the limiter's own and is safe to serve: it names a rule and a number, never a
 * balance, an address the caller did not send, or anything about the funding key." This page adds
 * no wording of its own to a refusal.
 */
export const REFUSAL_CODES = [
  'invalid_address',
  'own_address',
  'address_cooldown',
  'requester_limit',
  'budget_exhausted',
] as const
export type RefusalCode = (typeof REFUSAL_CODES)[number]

export function isRefusal(code: string | undefined): code is RefusalCode {
  return typeof code === 'string' && (REFUSAL_CODES as readonly string[]).includes(code)
}

/* ══════════════════════════════ the calls ══════════════════════════════ */

/**
 * Every call in this file goes through here, and here is the ONLY place `auth` is decided.
 *
 * Three copies of a flag is two chances to forget one, and the failure is silent. `test/faucet.test.ts`
 * asserts that nothing in this module reaches `faucet()` around this helper, and
 * `test/api.test.ts` measures the absence of the header on the wire rather than in the shape.
 */
function publicCall<T>(
  path: string,
  opts: { method?: string; body?: unknown; signal?: AbortSignal } = {},
) {
  return faucet<T>(path, {
    auth: false,
    ...(opts.method ? { method: opts.method } : {}),
    ...(opts.body === undefined ? {} : { body: opts.body }),
    ...(opts.signal ? { signal: opts.signal } : {}),
  })
}

/**
 * `GET /v1/faucet` — `faucet/src/server.ts:341`.
 *
 * Unauthenticated. Answers what this faucet is and what it will do: the chain id, the asset, the
 * funding address, the drip, the three limits and how much budget is left in the current window.
 *
 * **Every number this page prints about the faucet comes from here**, at runtime. There is no
 * hard-coded drip amount and no hard-coded cooldown in this repository; `test/content.test.ts`
 * fails on a digit in copy that is not in the register, and the register has no faucet entry.
 */
export function getFaucetTerms(signal?: AbortSignal): Promise<FaucetTerms> {
  return publicCall<FaucetTerms>('/v1/faucet', { ...(signal ? { signal } : {}) })
}

/**
 * `POST /v1/drips` — `faucet/src/server.ts:375`.
 *
 * **202, not 200, and that is the contract.** The request is QUEUED — nothing has been signed and
 * no nonce has been read — and the caller polls `GET /v1/drips/:id` (`faucet/src/server.ts:368-370`).
 * A retry the service recognises answers **200** with `duplicate: true` (`:394`), which is a
 * different fact from a fresh acceptance and this page renders it as one.
 *
 * `idempotencyKey` is optional and is a BODY FIELD. When it is absent the service derives one from
 * the recipient and the cooldown window (`faucet/src/requests.ts:135-138`), so two clicks inside one
 * cooldown are recognised as one request even from a client that sent nothing. This page sends one
 * anyway, generated once per form submission, because the derived key changes when the window rolls
 * and a retry that straddles a roll would otherwise be a second drip.
 *
 * Refusals are 400/429 with a code from `REFUSAL_CODES` and the limiter's own message.
 */
export function requestDrip(
  input: { address: string; idempotencyKey: string },
  signal?: AbortSignal,
): Promise<DripAccepted> {
  return publicCall<DripAccepted>('/v1/drips', {
    method: 'POST',
    // The body carries exactly the two fields the handler reads. Nothing else would be looked at:
    // `faucet/src/server.ts:372-373` — "NOTHING IN THE BODY EXCEPT `address` AND `idempotencyKey`
    // IS READ. Not an amount, not a token, not a chain id."
    body: { address: input.address, idempotencyKey: input.idempotencyKey },
    ...(signal ? { signal } : {}),
  })
}

/**
 * `GET /v1/drips/:id` — `faucet/src/server.ts:411`.
 *
 * Unauthenticated. An id that is not a v4 UUID is a **404** rather than a database error, and the
 * bound is applied before the query (`faucet/src/requests.ts:258-260`) so a caller-controlled string
 * never reaches a log as a `22P02`.
 */
export function getDrip(id: string, signal?: AbortSignal): Promise<DripView> {
  return publicCall<DripView>(`/v1/drips/${encodeURIComponent(id)}`, {
    ...(signal ? { signal } : {}),
  })
}
