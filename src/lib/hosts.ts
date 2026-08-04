/**
 * Where this app talks to, resolved at runtime.
 *
 * `cloudsforgeHosts()` reads `window.location.hostname` on every call, so one image serves
 * localhost, a preview deployment and production. Nothing here reads a build-time constant; see
 * the note in vite.config.ts and `test/no-build-time-config.test.ts`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * THIS SURFACE READS TWO SERVICES, AND THE REGISTRY NAMES A SURFACE FOR NEITHER OF THEM DIRECTLY.
 * BOTH ARE RESOLVED THROUGH THE REGISTRY ANYWAY, NAMED HERE, AND PINNED BY TEST.
 *
 * A hard-coded host is a second, unversioned copy of the registry, and the copy is the one that
 * goes stale — the conclusion admin-web, mint-web, trade-web, worlds-web and explorer-web each
 * reached about their own entry. So the numbers below are reported, not patched over.
 *
 * ── 1. The chain index. Registry key `explorer`, and the read is CROSS-ORIGIN ─────────────────
 *
 * There is no `indexer` key: `SurfaceKey` is declared at `ui/packages/ui/src/surfaces.ts:23-38`
 * and `indexer` is not among them, and `CloudsForgeHosts` is `Record<SurfaceKey, string>`
 * (`ui/packages/ui/src/index.tsx:121`), so a frontend can only name a surface. The one that means
 * "the chain index" is `explorer`, whose devPort is **4008** — the port `micro-indexer` binds
 * (`ui/packages/ui/src/surfaces.ts:456`, `indexer/src/env.ts:364`). That entry was 8080 until
 * recently and micro-ui has since corrected it, with the reasoning in the comment above it.
 *
 * So `cloudsforgeHosts().explorer` is `https://explorer.<apex>` in production, and this bundle is
 * served from `https://network.<apex>` (`ui/packages/ui/src/surfaces.ts:192`). Those are different
 * origins, and THIS READ NOW WORKS. Three things had to be true and all three now are; each is
 * recorded because each was separately absent and each failed in a way that looked like one of
 * the others.
 *
 *   1. **CORS at the service.** `micro-indexer` used to send no `access-control-` header at all.
 *      It now sets one itself (`indexer/src/server.ts:898`), and answers a preflight
 *      (`indexer/src/server.ts:207-212`).
 *   2. **CORS at the gateway.** The estate's headers come from one middleware on the websecure
 *      entrypoint (`deploy/compose/docker-compose.gateway.yml:117`,
 *      `deploy/gateway/dynamic/policy.yml`), and `https://network.cloudsforge.online` was the one
 *      registry product missing from that list — an allowlist that omits an origin fails closed
 *      and in silence, because the browser refuses the response and nothing server-side records a
 *      refusal. It is on the list now, under both the production apex and `CF_WEB_APEX`.
 *   3. **A ROUTER, WHICH WAS THE LAST ONE AND THE ONE NOBODY WAS LOOKING FOR.** With 1 and 2
 *      fixed, this panel still read "No figures for ember:testnet — Request failed (404)", and
 *      the reason was not CORS: `https://explorer.<apex>` had a router for the BUNDLE and none
 *      for the chain index, so every `/v1` read was answered by explorer-web's own nginx.
 *      `deploy/gateway/dynamic/estate-web.yml` described the missing router in a COMMENT —
 *      naming `cf-api-explorer` and `cf-svc-indexer` — and never defined either, so the file that
 *      would know appeared to say it was routed. `cf-api-explorer` now exists, and
 *      `deploy/scripts/surface-routes.py` gained a check that fails on a cf-* name written in a
 *      comment and defined nowhere.
 *
 * `test/hosts.test.ts` pins 1 and 2, each as an INVERTED assertion — both used to require the
 * absence they now forbid — so a regression on either is still caught rather than merely
 * un-apologised-for. 3 is pinned in micro-deploy, where the router lives.
 *
 * The base still resolves through `resolveApiBase` rather than being written absolute, so the day
 * the chain index is ALSO routed behind `network.<apex>` the comparison makes the base `''` and
 * every request goes relative with no edit here. That day has not come and does not need to: the
 * cross-origin read is served, and a second router for the same service on a second hostname
 * would be a second place for it to drift.
 *
 * ── 2. The faucet. Registry key `faucet`, whose devPort is THIS PAGE ──────────────────────────
 *
 * `faucet` is a `surface` with `subdomain: 'network'`, `basePath: '/faucet'` and devPort **3003**
 * (`ui/packages/ui/src/surfaces.ts:365-380`) — "a route on the Network site rather than a host of
 * its own". `micro-faucet` the SERVICE binds **4013** (`faucet/src/env.ts:311`,
 * `faucet/.env.example:19`, `faucet/Dockerfile:84`).
 *
 * So `cloudsforgeHosts().faucet` is `https://network.<apex>/faucet` — a PAGE on this app, which is
 * exactly what the registry means by it, and not an API base. This is the same shape of confusion
 * the `explorer` row was corrected for, arriving from the other direction: there, one field had to
 * name a service; here, it names a page and there is no field left to name the service.
 *
 * Two consequences this file has to handle rather than assume away:
 *
 *   * **The basePath must be stripped before a request path is appended.** `${hosts.faucet}/v1/faucet`
 *     is `/faucet/v1/faucet`, which `micro-faucet` does not serve — its table is at
 *     `faucet/src/server.ts:301-437` and every path there starts `/v1`. `faucetBase()` below takes
 *     the ORIGIN and drops the path, and `test/hosts.test.ts` pins that.
 *   * **In production the origin is this page's**, so the base is `''` and the drip request is
 *     relative — which is what the registry asserts and what the gateway therefore has to route.
 *     Under `pnpm dev` it is `http://localhost:3003`, which is neither this bundle (5190, see
 *     vite.config.ts) nor the faucet (4013). The README says the one line that makes it work.
 *
 * And a third gap, in the service rather than in the registry — **now closed**. `micro-faucet`
 * DOES do CORS, with an allowlist and no wildcard, fed from `FAUCET_CORS_ORIGINS`. Its example
 * value used to be `https://faucet.cloudsforge.online`, a hostname the registry has never defined,
 * while the browser origin that posts a drip is `https://network.<apex>` — an allowlist naming a
 * host nobody serves fails closed and silently. It was reported from here and it has been fixed:
 * the example now names the network hostname. `test/faucet.test.ts` was written to go red the day
 * that happened, and did; the assertion is now inverted, so a regression is still caught.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */
import { cloudsforgeHosts, type CloudsForgeHosts, type SurfaceKey } from '@cloudsforge/ui'

/**
 * The surface this application IS.
 *
 * `ui/packages/ui/src/surfaces.ts:187-199` registers `network` as a **product**: verb `Mine`,
 * subdomain `network`, devPort 3003, accent `#d6412f`, glyph `●`, `markId: 'mark-network'` and
 * `inSwitcher: true`. Unlike the explorer, this surface DOES have a mark — `brand/README.md:36`
 * gives `network` the **full** set of eight files and `brand/assets/network/` holds all eight —
 * and `test/brand-chrome.test.ts` checks the four this bundle ships byte for byte.
 */
export const PRODUCT: SurfaceKey = 'network'

/**
 * The registry key that means "the chain index".
 *
 * Named as a constant rather than written at the call site because it is the load-bearing
 * substitution in this file: the surface this bundle IS and the surface it READS are different
 * rows, and confusing them is how `explorer` came to resolve to its own nginx port.
 */
export const CHAIN_INDEX_SURFACE: SurfaceKey = 'explorer'

/** The registry key for the faucet. A page on THIS host; see the header. */
export const FAUCET_SURFACE: SurfaceKey = 'faucet'

/** The name reported to the observability ingest and shown in error copy. */
export const APP_NAME = 'network-site'

/**
 * The accent block this page's `<html>` names.
 *
 * `[data-cf-product='network']` exists at `ui/packages/ui/src/tokens.css:340-345` and carries
 * `#d6412f`, the exact accent the registry gives this surface
 * (`ui/packages/ui/src/surfaces.ts:194`). Checked rather than assumed: tokens.css says at
 * `:389-396` that "every key an app may set is declared", precisely so a surface cannot fall
 * through to the company ember in silence, which is what `admin` did.
 */
export const ACCENT_SURFACE = 'network'

/**
 * Resolve a base URL for a surface, comparing ORIGINS.
 *
 * A surface may carry a `basePath` — the wallet inside Hub, the faucet inside this site — so the
 * comparison is between origins rather than whole URLs; otherwise every such surface would look
 * cross-origin to itself. The result is `''` when the surface shares this page's origin, so the
 * request stays relative and no CORS question arises.
 *
 * Derived by comparison rather than by a `DEV` flag, because a flag is a build-time constant and
 * this repository has none: an image built for production and opened on localhost would then point
 * at a host that is not there.
 */
export function resolveApiBase(
  pageOrigin: string,
  hosts: CloudsForgeHosts,
  key: SurfaceKey,
): string {
  const own = hosts[key]
  // With no page origin there is nothing for a relative URL to resolve against, so the absolute
  // form is the only correct answer.
  if (!pageOrigin) return originOf(own)
  return originOf(own) === pageOrigin ? '' : originOf(own)
}

/**
 * The ORIGIN of a registry URL, with any `basePath` dropped.
 *
 * This is not tidying. `hosts.faucet` is `https://network.<apex>/faucet`, and appending an API
 * path to it produces `/faucet/v1/drips` — a path `micro-faucet` does not serve
 * (`faucet/src/server.ts:301-437`; every entry begins `/v1`). A 404 from a path shape nobody
 * serves is indistinguishable from a service that is down, which is exactly the class of defect
 * this estate keeps shipping.
 */
export function originOf(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    // An unparseable registry value is a bug upstream, not something to guess at. Returning the
    // input unchanged makes the failure visible in the request URL rather than silently correct.
    return url
  }
}

/** The same four names `cloudsforgeHosts()` treats as development. Kept in step by test. */
export function isLocal(hostname: string): boolean {
  return (
    hostname === '' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.local')
  )
}

/**
 * Whether this bundle is being served from an address the surface registry knows.
 *
 * `cloudsforgeHosts()` derives the apex by stripping a KNOWN subdomain prefix
 * (`ui/packages/ui/src/index.tsx:149-158`). Served from an unknown name, the whole name becomes
 * the apex, and every CloudsForge URL derived from it — the chain index, the account portal,
 * Lantern — resolves one level too deep. The app still renders, because this is a public reference
 * surface and nothing here is a security boundary; but it says so, once, in the shell.
 */
export function isRegisteredPlacement(
  pageOrigin: string,
  hostname: string,
  hosts: CloudsForgeHosts,
): boolean {
  if (isLocal(hostname)) return true
  if (!pageOrigin) return true
  return originOf(hosts[PRODUCT]) === pageOrigin
}

/** Every CloudsForge base URL, for the current environment. */
export function hosts(): CloudsForgeHosts {
  return cloudsforgeHosts()
}

/** The page origin, or a stable placeholder when there is no document (tests, prerender). */
export function pageOrigin(): string {
  return typeof window === 'undefined' ? 'http://localhost' : window.location.origin
}

/**
 * The chain index's base. Call it per request; never cache it in a module constant.
 *
 * Cross-origin in every environment that exists today. See the header for the two upstream
 * changes that would make it relative, and `test/hosts.test.ts` for the assertions that go red
 * when either lands.
 */
export function chainIndexBase(): string {
  return resolveApiBase(pageOrigin(), cloudsforgeHosts(), CHAIN_INDEX_SURFACE)
}

/** The faucet API's base, with the registry `basePath` dropped. See the header. */
export function faucetBase(): string {
  return resolveApiBase(pageOrigin(), cloudsforgeHosts(), FAUCET_SURFACE)
}

/** Whether the current address is one the registry knows. Read by the shell. */
export function placementIsKnown(): boolean {
  if (typeof window === 'undefined') return true
  return isRegisteredPlacement(window.location.origin, window.location.hostname, cloudsforgeHosts())
}
