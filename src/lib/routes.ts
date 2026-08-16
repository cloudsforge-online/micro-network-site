/**
 * The route table, as data, in one place.
 *
 * Three files describe this app's addresses and all three have to agree:
 *
 *   1. `src/lib/routes.ts` — this file, from which the navigation is derived,
 *   2. `src/app.tsx`       — which component renders at each path,
 *   3. `nginx.conf`        — which addresses are served the app shell at all.
 *
 * The third is the one that bites, and it bites late. nginx enumerates the real routes and 404s
 * everything else ON PURPOSE, so that a wrong address answers 404 rather than 200 — an app that
 * answers 200 for every address serves its "page not found" screen as a success, which crawlers
 * index and monitors call healthy, and a deploy that drops a route looks exactly like a deploy
 * that did not.
 *
 * The price of that honesty is this list, in triplicate, so `test/routes.test.ts` reads
 * `nginx.conf` and `app.tsx` and fails the build when either has drifted. "Remember to update
 * nginx.conf" is not a mechanism; a test is.
 *
 * This module deliberately imports nothing — not React, not the router — so the test that reads it
 * does not have to boot a browser to find out what the routes are.
 *
 * ── `/faucet` IS A ROUTE HERE BECAUSE THE REGISTRY SAYS IT IS ─────────────────────────────────
 *
 * `ui/packages/ui/src/surfaces.ts` gives the `faucet` surface `subdomain: 'network'` and
 * `basePath: '/faucet'`, with the reason on the line above the key: "A route on the Network site
 * rather than a host of its own: a faucet is one form on one page and does not warrant a
 * certificate." `cloudsforgeHosts()` appends that basePath (`ui/packages/ui/src/index.tsx`),
 * so every surface in the estate that links to the faucet resolves `https://network.<apex>/faucet`.
 *
 * A Network site without that route would make every one of those links a 404 — and this bundle's
 * nginx answers a real 404 rather than a 200, so it would be a visibly broken link rather than a
 * blank page. Building the page is therefore not scope creep; NOT building it would be a defect
 * this repository introduced. `test/routes.test.ts` derives the expected path from the registry
 * rather than from a literal, so a basePath changed upstream is a red run here.
 */

export interface AppRoute {
  /** The top-level path segment, without a leading slash. `''` is the index route. */
  readonly path: string
  /** The navigation label, or null for a route that is reachable but not offered. */
  readonly label: string | null
  /** True when the route owns everything beneath it. */
  readonly wildcard: boolean
  /**
   * True when the route renders without a session.
   *
   * **Every route on this surface is public, and every one of them works that way.** The chain read
   * behind `/chain` is anonymous — `authoriseRead` returns `null` for a caller with no token and
   * lets the handler run (`indexer/src/server.ts`) — and all three faucet routes are
   * unauthenticated by the service's own decision (`faucet/src/server.ts`).
   * This bundle attaches no bearer to any of them.
   *
   * There is no `ProtectedRoute` in this repository, and `test/routes.test.ts` asserts its absence
   * so that adding one is a decision somebody has to argue for. A gate on this surface would demand
   * a session before showing what a public chain is — and `docs/ecosystem/15-monetisation-model.md`
   * settles the neighbouring case in one line: "A public chain whose explorer is paywalled is not a
   * public chain."
   */
  readonly public: boolean
}

export const ROUTES: readonly AppRoute[] = [
  // The front page: what Hearth is, and what state it is actually in. It makes NO request — the
  // status of the chain is a question with its own page, and a home page that renders a spinner
  // over a paragraph of prose has made the prose wait for a service.
  { path: '', label: 'Hearth', wildcard: false, public: true },
  // The one page in this bundle that reads a service for a figure. Every number on it is fetched
  // or is absent; see `Figure` in src/lib/chainstatus.ts.
  { path: 'chain', label: 'The chain', wildcard: false, public: true },
  { path: 'mine', label: 'Mining', wildcard: false, public: true },
  { path: 'node', label: 'Run a node', wildcard: false, public: true },
  // The registry's `faucet` basePath. See the header.
  { path: 'faucet', label: 'Faucet', wildcard: false, public: true },
]

/** What the navigation renders, with the leading slash a `NavLink` wants. */
export const NAV: ReadonlyArray<{ to: string; label: string }> = ROUTES.filter(
  (route): route is AppRoute & { label: string } => route.label !== null,
).map((route) => ({ to: `/${route.path}`, label: route.label }))

/** Every path nginx has to serve the shell for, excluding the index. */
export const NON_INDEX_PATHS: readonly string[] = ROUTES.filter((r) => r.path !== '').map(
  (r) => r.path,
)

/**
 * A route this app owns, used as the CI deep-link probe.
 *
 * It must be a REAL address — a probe against a path the app does not own proves only that the 404
 * page renders, which is the opposite of what the check is for. `/faucet` is the right choice
 * rather than `/chain`: it is the path the rest of the estate links to through
 * `cloudsforgeHosts().faucet`, so a deploy that dropped it would break links in six other
 * repositories, and this is the check that would say so.
 */
export const DEEP_LINK_PATH = '/faucet'

/**
 * Where the record-by-record chain explorer lives.
 *
 * A KEY, not a URL. `micro-explorer-web` is the surface that reads the chain index block by block
 * (`ui/packages/ui/src/surfaces.ts`), and this site links to it rather than reimplementing
 * it — see the declination list in `src/lib/chainstatus.ts`. Naming the registry key keeps the
 * hostname out of this bundle; the `rules` job in CI greps `src` for a literal `cloudsforge.online`
 * and fails on one.
 */
export const EXPLORER_SURFACE = 'explorer' as const

/**
 * Where the exchange lives, and the one page under it this site names.
 *
 * A KEY for the same reason `EXPLORER_SURFACE` is one. What is different here is the second
 * constant: `RECEIPTS_PATH` is a PATH, and the registry holds hostnames and nothing else, so no
 * amount of key-resolving will produce it. It is written here rather than inline in the page for
 * the reason every path constant in this bundle is — one place to change when the route moves, and
 * one place a reader can find the note about where the route is actually defined.
 *
 * THE ROUTE IS `exchange-web/src/app.tsx` — `<Route path="receipts">` under the shell — and it is
 * not checked from this repository. A link to another bundle's path is a promise this repository's
 * CI cannot keep; what makes it acceptable is that the receipt page is the whole reason the tile
 * exists, and a tile called Forge Receipt that lands on a swap form has failed the reader more
 * surely than a link that might one day rot. If it does rot, the exchange answers its own 404 with
 * its navigation on it.
 *
 * ONE HOSTNAME, BOTH NETWORKS. There is no `exchange-testnet` here and there must not be: the
 * combined view retired the `-testnet` web hostnames, so a reader viewing testnet is carried by
 * `?net=testnet` on this same address — see `carryNetwork` in `src/lib/viewed.ts`. The exchange
 * declares `viewsAnyNetwork: true` in the registry, which is the flag that says it will honour it.
 */
export const EXCHANGE_SURFACE = 'exchange' as const

/** The receipt page under {@link EXCHANGE_SURFACE}. See that constant for why a path is here. */
export const RECEIPTS_PATH = '/receipts'

/**
 * Hearth's own repository, which is where everything technical on this surface points.
 *
 * **It is a literal URL and it is the only one in this bundle, deliberately.** `github.com` is not
 * a CloudsForge surface, so the registry has no key for it and `cloudsforgeHosts()` cannot resolve
 * it; a fabricated key would be worse than a literal. `cloudsforge-online/hearth` is the one PUBLIC
 * repository this surface is about — it is MIT licensed (`hearth/LICENSE`), it takes outside
 * contributors (`hearth/CONTRIBUTING.md`), and every claim this site makes about the chain is
 * checkable in it.
 *
 * `test/content.test.ts` asserts that every `hearth/…` path this site links to is a file that
 * exists in the checked-out repository, so a document renamed upstream is a red run rather than a
 * 404 for a reader.
 */
export const HEARTH_REPO = 'https://github.com/cloudsforge-online/hearth'

/** A path inside the Hearth repository, as a link a reader can follow. */
export function hearthFile(path: string): string {
  return `${HEARTH_REPO}/blob/main/${path}`
}
