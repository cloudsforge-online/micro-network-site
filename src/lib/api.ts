/**
 * The request core: tokens, one refresh at a time, and one error shape.
 *
 * Carried forward from `micro-explorer-web/src/lib/api.ts`, which is the version of this file that
 * has actually been run against Nimbus. The behaviour worth preserving verbatim is the SINGLE-FLIGHT
 * REFRESH: a page that fires ten requests on mount, all of which 401 on an expired access token,
 * must perform ONE refresh. Ten refreshes against a rotating refresh token means nine of them
 * present a token that has just been superseded, and the user is signed out while holding a valid
 * session.
 *
 * ── What is different on THIS surface, and it is not a detail ──────────────────────────────────
 *
 * **Nothing this bundle reads needs a session.** The chain-index route it calls is anonymous
 * (`authoriseRead`, `indexer/src/server.ts`) and the three faucet routes are unauthenticated
 * by the service's own decision — "a testnet faucet whose terms require a credential to read is a
 * faucet nobody can use" (`faucet/src/server.ts`). Every one of them is issued with
 * `auth: false`; see `publicRead` in `src/lib/chainstatus.ts` and `publicCall` in
 * `src/lib/faucet.ts`.
 *
 * The token machinery below exists for exactly one caller, `/auth/me` on Nimbus, which puts the
 * reader's handle in the shared bar and nothing else.
 *
 * So the rule for this file is narrow and worth stating: **a bearer must never travel to the chain
 * index or to the faucet.** The indexer verifies whatever it is handed rather than ignoring it
 * (`indexer/src/server.ts`), so an expired token would turn a public page into a 401 — a
 * surface that has quietly made itself depend on a credential. `test/api.test.ts` drives every one
 * of the four public calls with an access token in storage and inspects what `fetch` was handed.
 */
import { attemptSilentSignIn, consumeAuthCallback, signInRedirect, signOutRedirect } from '@cloudsforge/ui'
import { APP_NAME, chainIndexBase, faucetBase, hosts, pageOrigin } from './hosts.ts'
import type { PageNetwork } from './hosts.ts'
import { chainIndexBaseOn } from './viewed.ts'
import { report } from './obs.ts'

/** Nimbus issues and refreshes tokens; it is cross-origin from every app, always. */
function nimbusUrl(): string {
  return hosts().nimbus
}

/**
 * The shared CloudsForge token keys.
 *
 * Deliberately the same strings in every product: a session established at the Account portal is
 * picked up here without a second round trip, and signing out of one app on a shared machine
 * clears the tokens the next app would have read.
 */
const ACCESS_KEY = 'cf.accessToken'
const REFRESH_KEY = 'cf.refreshToken'

/** Fired when a refresh fails. `AuthProvider` listens and drops the session. */
export const AUTH_EXPIRED_EVENT = 'cf:auth-expired'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

/* ---- token storage ------------------------------------------------- */

const memory = new Map<string, string>()

/**
 * Storage, with a memory fallback.
 *
 * `localStorage` throws rather than returning null in a Safari private window and in a
 * third-party iframe with storage blocked. A module that touched it directly would take the whole
 * bundle down at import time in both, and could not be unit tested outside a browser at all. The
 * fallback loses the session on reload, which is a worse experience than persistence and a much
 * better one than a blank page.
 */
function store(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  try {
    if (typeof localStorage !== 'undefined') {
      // Probe rather than trust: the throw happens on ACCESS, not on the typeof check.
      localStorage.getItem(ACCESS_KEY)
      return localStorage
    }
  } catch {
    // Fall through to memory.
  }
  return {
    getItem: (k) => memory.get(k) ?? null,
    setItem: (k, v) => void memory.set(k, v),
    removeItem: (k) => void memory.delete(k),
  }
}

export const getAccessToken = (): string | null => store().getItem(ACCESS_KEY)
export const getRefreshToken = (): string | null => store().getItem(REFRESH_KEY)

export function setTokens(tokens: AuthTokens): void {
  store().setItem(ACCESS_KEY, tokens.accessToken)
  store().setItem(REFRESH_KEY, tokens.refreshToken)
}

export function clearTokens(): void {
  store().removeItem(ACCESS_KEY)
  store().removeItem(REFRESH_KEY)
}

export const hasSession = (): boolean => Boolean(getAccessToken() && getRefreshToken())

/* ---- errors -------------------------------------------------------- */

export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined
  /**
   * The server's id for the exact request that failed, echoed in both the `x-request-id` header
   * and the error body. Quoted by the user, it is what finds their request across every service
   * at once — which is why every failure state in this app displays it.
   */
  readonly requestId: string | undefined

  constructor(status: number, message: string, code?: string, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

/**
 * Pull the sentence, the code and the request id out of a service's error body.
 *
 * The estate's envelope is **nested** — `{error: {code, message, requestId}}`, built by
 * `errorReply()` in every service (`indexer/src/server.ts`,
 * `faucet/src/server.ts`, `identity/src/server.ts`). Every one of those three is
 * checked out in CI, so the shape is verified rather than remembered.
 *
 * This function used to read the envelope as FLAT, assigning `data.error` — an object — straight to
 * the displayed message. Every server-side failure in every app cut from that template would have
 * rendered as `[object Object]`, with the real message, the code and the request id all present in
 * the response and all discarded. The request id is the one thing a support conversation runs on,
 * so the failure was not cosmetic: it destroyed exactly the field the panel exists to show.
 *
 * Both shapes are accepted rather than only the nested one, because a proxy or an older service
 * on the rollback path may still answer flat, and a template that only understands the current
 * estate is a template that breaks during the migration it was written for.
 */
export function readErrorBody(body: unknown): {
  message?: string
  code?: string
  requestId?: string
} {
  if (typeof body !== 'object' || body === null) return {}
  const top = body as { error?: unknown; code?: unknown; requestId?: unknown; message?: unknown }
  const nested =
    typeof top.error === 'object' && top.error !== null
      ? (top.error as { code?: unknown; message?: unknown; requestId?: unknown })
      : undefined

  // A string `error` is the flat shape's message. An object `error` is the nested envelope, and
  // its fields win over any same-named field at the top level.
  const message =
    pickString(nested?.message) ??
    (typeof top.error === 'string' ? top.error : undefined) ??
    pickString(top.message)

  return {
    ...(message ? { message } : {}),
    ...(pickString(nested?.code) ?? pickString(top.code)
      ? { code: (pickString(nested?.code) ?? pickString(top.code)) as string }
      : {}),
    ...(pickString(nested?.requestId) ?? pickString(top.requestId)
      ? { requestId: (pickString(nested?.requestId) ?? pickString(top.requestId)) as string }
      : {}),
  }
}

function pickString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

/** What a failure state needs: the sentence, and the id to quote at support. */
export interface ErrorNotice {
  message: string
  requestId: string | undefined
  /**
   * The service's error CODE, carried through so a screen can branch on it.
   *
   * The web template drops it, and dropping it is how `micro-market` and `micro-mint` each
   * rendered a router 404 as a fact about a chain. `micro-indexer` distinguishes "no such
   * transaction" from "no such route" by code alone and says so at `indexer/src/server.ts`
   * — the status is 404 either way.
   */
  code: string | undefined
  /** The HTTP status, for the one case where the code is absent and the status is all there is. */
  status: number | undefined
}

/**
 * Normalise a caught error for display.
 *
 * `fallback` covers the non-ApiError case, which is a bug in this bundle rather than a server
 * response — so it is also the only case worth reporting from here. An ApiError has already been
 * logged by the service that produced it, under the request id shown to the user.
 */
export function noticeFor(err: unknown, fallback: string): ErrorNotice {
  if (err instanceof ApiError) {
    return {
      message: err.message,
      requestId: err.requestId,
      code: err.code,
      status: err.status,
    }
  }
  report({
    app: APP_NAME,
    type: err instanceof Error ? err.name : 'UnknownError',
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? (err.stack ?? null) : null,
    context: { fallback },
  })
  return {
    message: fallback,
    requestId: undefined,
    code: undefined,
    status: undefined,
  }
}

/* ---- the single-flight refresh ------------------------------------- */

let inflightRefresh: Promise<boolean> | null = null

/**
 * Refresh the session, at most once concurrently.
 *
 * Every caller that arrives while a refresh is in flight awaits THE SAME promise; the slot is
 * cleared when it settles, so the next 401 after this one starts a fresh attempt rather than
 * replaying a stale answer.
 */
export function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return Promise.resolve(false)
  if (!inflightRefresh) {
    inflightRefresh = performRefresh(refreshToken).finally(() => {
      inflightRefresh = null
    })
  }
  return inflightRefresh
}

async function performRefresh(refreshToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${nimbusUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) {
      // Returning false signs the user out either way, but the two causes are not the same event:
      // a 401 is an expired refresh token and routine, anything else is Nimbus failing. They were
      // indistinguishable for as long as neither was written down.
      if (res.status !== 401) {
        report({
          app: APP_NAME,
          type: 'RefreshFailed',
          message: `Token refresh failed (${res.status})`,
          statusCode: res.status,
          requestId: res.headers.get('x-request-id'),
        })
      }
      return false
    }
    setTokens((await res.json()) as AuthTokens)
    return true
  } catch (err) {
    report({
      app: APP_NAME,
      type: 'RefreshUnreachable',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? (err.stack ?? null) : null,
      context: { nimbus: nimbusUrl() },
    })
    return false
  }
}

function expireSession(): void {
  clearTokens()
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
}

/* ---- the request core ---------------------------------------------- */

export interface RequestOptions {
  method?: string
  body?: unknown
  /** Default true: attach the bearer token and refresh once on 401. */
  auth?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
  signal?: AbortSignal
  /**
   * Extra request headers. **Nothing on this surface sets one, and that is a fact about the two
   * APIs rather than a style choice.**
   *
   * `micro-indexer` reads exactly one request header on a domain route — `authorization`, in
   * `authoriseRead` (`indexer/src/server.ts`) and `authorise` — plus `x-request-id`
   * and `host` in the server frame (`indexer/src/server.ts`). `micro-faucet` reads
   * `authorization` and `x-faucet-token` on `/metrics` only (`faucet/src/server.ts`),
   * plus `origin` for CORS (`faucet/src/server.ts`) and `x-forwarded-for` for the per-requester
   * limit (`faucet/src/server.ts`). **Neither repository contains an `Idempotency-Key`**, and
   * the faucet's own idempotency is a FIELD IN THE BODY — `idempotencyKey`
   * (`faucet/src/server.ts`) — not a header. Sending the header would be ignored; sending
   * the field is required. Copying `trade-web`'s client here would have got it exactly backwards,
   * and copying this one to `trade` would fail every write with a 400
   * (`trade/src/server.ts`).
   *
   * The parameter is kept rather than deleted because it is the template's and because deleting it
   * would make the next writer add it back without the note.
   *
   * `authorization` and `content-type` are set by this function AFTER these are spread, so a
   * caller cannot accidentally drop the bearer token by passing a header map of its own.
   */
  headers?: Record<string, string>
}

async function request<T>(base: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, query, signal, headers: extra } = opts

  // `base` may be '' (relative, same origin), so resolve against the page origin.
  const url = new URL(base + path, pageOrigin())
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
    }
  }

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = { accept: 'application/json', ...extra }
    if (body !== undefined) headers['content-type'] = 'application/json'
    const token = getAccessToken()
    if (auth && token) headers['authorization'] = `Bearer ${token}`
    return fetch(url, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(signal ? { signal } : {}),
    })
  }

  let res: Response
  try {
    res = await send()
  } catch (err) {
    // The user-facing sentence is the right one whether the cause is their wifi, our container or
    // a CORS refusal — a browser reports all three identically to the page, and inventing a more
    // specific diagnosis from here would be a guess. The cause itself only exists here, so it is
    // reported: discarding it is how a service being down looked exactly like a bad connection.
    report({
      app: APP_NAME,
      type: 'NetworkError',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? (err.stack ?? null) : null,
      context: { method, url: url.toString() },
    })
    throw new ApiError(0, 'Could not reach the service. It did not answer this page.')
  }

  // One silent refresh and retry on expiry. Ten of these at once share one refresh.
  if (res.status === 401 && auth && getRefreshToken()) {
    if (await refreshSession()) {
      res = await send()
    } else {
      expireSession()
      throw new ApiError(
        401,
        'Your session expired. Sign in again.',
        'session_expired',
        res.headers.get('x-request-id') ?? undefined,
      )
    }
  }

  if (!res.ok) {
    // Every service sets this header on every response, error or not, so it is present even when
    // the body is a proxy's HTML page rather than ours.
    let requestId = res.headers.get('x-request-id') ?? undefined
    let message = res.statusText || `Request failed (${res.status})`
    let code: string | undefined
    try {
      const parsed = readErrorBody(await res.json())
      if (parsed.message) message = parsed.message
      if (parsed.code) code = parsed.code
      if (parsed.requestId) requestId = parsed.requestId
    } catch (err) {
      // A non-JSON error body means something in FRONT of the service answered — a gateway, a
      // CDN, a misrouted deploy — and the request never reached it. Nothing server-side logs
      // that, so it has to be reported from here.
      report({
        app: APP_NAME,
        type: 'NonJsonErrorBody',
        message: `${res.status} response from ${url.pathname} was not JSON`,
        stack: err instanceof Error ? (err.stack ?? null) : null,
        statusCode: res.status,
        requestId,
        context: { method, contentType: res.headers.get('content-type') },
      })
    }
    // `auth` means "attach a bearer IF we hold one", not "we hold one", so a 401 to a call made
    // without a session is the route saying it needs authentication rather than a session ending —
    // and expiring one that never existed dispatches `cf:auth-expired`, which signs a user out of
    // a session they never had. This line is the template's
    // (`web-template/src/lib/api.ts`), not a fork of it, and `test/api.test.ts` checks the two
    // agree. It is not what keeps this surface quiet — every public call passes `auth: false` and
    // never reaches this branch — but it is still right for `/auth/me`, and a client that is only
    // correct because of where it happens to be called is a client waiting to be moved.
    if (res.status === 401 && auth && hasSession()) expireSession()
    throw new ApiError(res.status, message, code, requestId)
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return undefined as T
  return (await res.json()) as T
}

/**
 * The chain index — `micro-indexer`, behind the registry's `explorer` surface.
 *
 * Cross-origin from this page in every environment that exists today, and the header of
 * `src/lib/hosts.ts` records the two upstream changes that would make it relative.
 */
export const chainIndex = <T,>(
  network: PageNetwork,
  path: string,
  opts?: RequestOptions,
): Promise<T> => {
  // The index that FOLLOWS the network being asked about (micro-org#459 stage 3, corrected — see
  // `chainIndexBaseOn`). Own network: the base this surface has always used. Other network: the
  // sibling estate's explorer host, anonymously — the indexer's public-read `*` is what admits the
  // read, and auth:false is what keeps the request simple (a bearer means nothing at the other
  // estate until stage 2, and would buy a preflight for a request that fails anyway).
  const base = chainIndexBaseOn(network)
  if (base === chainIndexBase()) return request<T>(base, path, opts)
  return request<T>(base, path, { ...opts, auth: false })
}

/** The faucet — `micro-faucet`, whose registry row is a page on this host. See hosts.ts. */
export const faucet = <T,>(path: string, opts?: RequestOptions): Promise<T> =>
  request<T>(faucetBase(), path, opts)

/** Nimbus, which is cross-origin from everywhere. */
export const nimbus = <T,>(path: string, opts?: RequestOptions): Promise<T> =>
  request<T>(nimbusUrl(), path, opts)

/* ---- boot and sign-in --------------------------------------------- */

/**
 * Redeem an SSO hand-off code, if the Account portal sent us back with one.
 *
 * Called once from main.tsx BEFORE React renders, so the first paint already knows whether there
 * is a session and no screen flashes signed-out and then signed-in.
 *
 * The strip-then-exchange ordering inside `consumeAuthCallback` is load-bearing and is documented
 * where it is implemented (`ui/packages/ui/src/index.tsx`): the code leaves the address bar
 * before it goes over the wire, so it is never in the history, in a referrer, or in a screenshot
 * taken while the request is in flight. Nothing here may reorder that, and nothing here may
 * re-read `location.hash` afterwards.
 */
export async function bootstrapSession(): Promise<boolean> {
  try {
    const tokens = await consumeAuthCallback()
    if (tokens) {
      setTokens(tokens)
      return true
    }
  } catch (err) {
    // A failed exchange is a signed-out boot, not a broken app: the sign-in button is right there.
    report({
      app: APP_NAME,
      type: 'AuthCallbackFailed',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? (err.stack ?? null) : null,
    })
  }
  // ── COLLECT A SESSION THIS SURFACE CANNOT SEE (cross-surface sign-in) ────────────────────────
  //
  // Tokens live in `localStorage`, which is scoped to one origin, and every surface here is its
  // own origin — so a reader signed in at the portal arrived and was shown a signed-out page. The
  // SSO chain to fix that already existed end to end; nothing ever asked it. This asks, ONCE per
  // tab, and only when the apex hint says a session exists somewhere. An anonymous visitor is
  // never redirected: `attemptSilentSignIn` returns false with no hint, so a public page is
  // exactly as fast as it was.
  const local = hasSession()
  if (attemptSilentSignIn(local)) {
    // A navigation has started and this document is going away. Answer "no session" so nothing
    // paints a signed-out shell in the moments before it does.
    return false
  }
  return local
}

/**
 * Send the browser to the Account portal, returning here afterwards.
 *
 * `returnTo` defaults to the CURRENT URL including its path and query, which is what puts a reader
 * who deep-linked back on the page they were reading.
 */
export function signIn(returnTo?: string): void {
  signInRedirect(returnTo ?? (typeof window === 'undefined' ? undefined : window.location.href))
}

/** Clear this app's tokens FIRST — the portal cannot reach them — then end the shared session. */
export function signOut(returnTo?: string): void {
  clearTokens()
  signOutRedirect(returnTo ?? (typeof window === 'undefined' ? undefined : window.location.origin))
}

/** Reset module state. Tests only. */
export function __resetAuth(): void {
  inflightRefresh = null
  memory.clear()
}
