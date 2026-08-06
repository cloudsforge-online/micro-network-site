/**
 * THE ROUTE TABLE, THE ROUTER AND NGINX AGREE — AND AN UNKNOWN PATH 404s.
 *
 * Three files describe this app's addresses and all three have to be the same list:
 *
 *   1. `src/lib/routes.ts` — the declaration the navigation is derived from,
 *   2. `src/app.tsx`       — which component renders at each path,
 *   3. `nginx.conf`        — which addresses are served the app shell at all.
 *
 * The third is the one that bites, and it bites late. nginx enumerates the real routes and 404s
 * everything else ON PURPOSE, so that a wrong address answers 404 rather than 200 — an app that
 * answers 200 for every address serves its "page not found" screen as a success, which crawlers
 * index and monitors call healthy, and a deploy that drops a route looks exactly like a deploy that
 * did not. "Remember to update nginx.conf" is not a mechanism; this file is.
 *
 * ── The `/faucet` route is DERIVED FROM THE REGISTRY, not from a literal ──────────────────────
 *
 * `ui/packages/ui/src/surfaces.ts` gives the `faucet` surface `basePath: '/faucet'`, and every
 * link to the faucet in the estate resolves to that path on this host. So the expected route is
 * READ OUT OF THE REGISTRY here rather than written down again: a basePath changed upstream is a
 * red run in this repository, which is where the page it names lives.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { SURFACES } from '@cloudsforge/ui'
import { DEEP_LINK_PATH, NAV, NON_INDEX_PATHS, ROUTES } from '../src/lib/routes.ts'

const at = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))
const read = (p: string) => readFileSync(at(p), 'utf8')

const nginx = read('nginx.conf')
const app = read('src/app.tsx')
const ci = read('.github/workflows/ci.yml')

/** nginx.conf with its comments stripped — the header QUOTES the directive it forbids. */
const directives = nginx
  .split('\n')
  .filter((line) => !/^\s*#/.test(line))
  .join('\n')

describe('the declaration', () => {
  it('has an index route and four named ones', () => {
    assert.equal(ROUTES.filter((r) => r.path === '').length, 1, 'there is no index route')
    assert.equal(ROUTES.length, 5, `expected five routes, found ${ROUTES.length}`)
  })

  it('offers every route in the navigation, because none of them needs a parameter', () => {
    // Unlike the explorer, which hides four routes because `/blocks` with no height always 404s.
    // Every route here is a whole page, so `label: null` would be a route nobody could reach.
    assert.equal(NAV.length, ROUTES.length, 'a route is unreachable from the navigation')
  })

  it('is entirely public', () => {
    for (const route of ROUTES) assert.ok(route.public, `${route.path} is not public`)
  })

  it('includes the registry’s faucet basePath, read from the registry', () => {
    const basePath = SURFACES.find((s) => s.key === 'faucet')?.basePath
    assert.equal(basePath, '/faucet', 'the registry no longer puts the faucet on this host')
    const expected = (basePath ?? '').replace(/^\//, '')
    assert.ok(
      ROUTES.some((r) => r.path === expected),
      `the registry puts the faucet at /${expected} and this app does not serve it`,
    )
  })
})

describe('the router renders every declared route', () => {
  it('has a <Route> for each', () => {
    for (const route of ROUTES) {
      const pattern =
        route.path === ''
          ? /<Route index element=/
          : new RegExp(`path="${route.path}"`)
      assert.match(app, pattern, `src/app.tsx has no route for '/${route.path}'`)
    }
  })

  it('and a catch-all, so an unknown path renders inside the shell', () => {
    assert.match(app, /path="\*" element=\{<NotFoundPage \/>\}/)
  })

  it('declares no more routes than the table does', () => {
    const declared = [...app.matchAll(/<Route path="([^"*]+)"/g)].map((m) => m[1] ?? '')
    const known = ROUTES.map((r) => r.path)
    assert.deepEqual(
      declared.filter((p) => !known.includes(p)),
      [],
      'src/app.tsx renders a path that is not in ROUTES, so nginx will 404 it',
    )
  })
})

describe('nginx serves the shell for every declared route and nothing else', () => {
  it('enumerates them in one alternation, and matches the route EXACTLY', () => {
    /*
     * `/?$`, not `(/|$)`, and the pattern is asserted rather than assumed.
     *
     * `(/|$)` is a PREFIX. It matched /faucet and it also matched /faucet/history, /chain/ember and
     * every address beneath a route this app owns — none of which app.tsx routes, because no route
     * here takes a parameter. So React rendered NotFoundPage and nginx served it with a 200: the
     * not-found page delivered as a success, which is the exact failure the enumeration exists to
     * prevent. `test/browser-journeys.test.ts` probes /faucet/history in a browser and is what
     * found it; this line is what stops it coming back through a copy-paste from another frontend.
     */
    const m = /location ~ \^\/\(([^)]+)\)\/\?\$/.exec(directives)
    assert.ok(m, 'nginx.conf no longer enumerates the client routes as exact matches')
    assert.doesNotMatch(
      directives,
      /location ~ \^\/\([^)]+\)\(\/\|\$\)/,
      'a route block matches a PREFIX, so every address beneath it answers 200',
    )
    const served = (m[1] ?? '').split('|')
    assert.deepEqual(
      [...served].sort(),
      [...NON_INDEX_PATHS].sort(),
      'nginx.conf and ROUTES disagree about which addresses are served the shell',
    )
  })

  it('serves the index explicitly', () => {
    assert.match(directives, /location = \/ \{/)
  })

  it('KEEPS the 404 — error_page, never try_files $uri /index.html', () => {
    // The whole argument of this file. Comments are stripped first because the header of nginx.conf
    // quotes the directive it forbids in order to explain why the routes are enumerated by hand,
    // and a grep over the raw file would match the warning and fail a correct config.
    assert.doesNotMatch(
      directives,
      /try_files\s+\$uri\s+(\$uri\/\s+)?\/index\.html/,
      'the SPA fallback is back; every address would answer 200',
    )
    assert.match(directives, /error_page 404 \/index\.html/)
  })

  it('serves a real file or 404s, for everything that is not a route', () => {
    assert.match(directives, /location \/ \{\s*\n\s*try_files \$uri =404;/)
  })

  it('restates the security headers in every location that sets Cache-Control', () => {
    // nginx's `add_header` is all-or-nothing per level: a location declaring ANY add_header
    // inherits NONE from its parent. The template's `location /assets/` lost nosniff this way in
    // four frontends. Counted rather than eyeballed.
    const blocks = directives.split('location ').slice(1)
    for (const block of blocks) {
      if (!/Cache-Control/.test(block)) continue
      assert.match(block, /X-Content-Type-Options/, `a location sets Cache-Control and drops nosniff:\n${block.slice(0, 120)}`)
      assert.match(block, /X-Frame-Options/, 'a location sets Cache-Control and drops X-Frame-Options')
      assert.match(block, /Referrer-Policy/, 'a location sets Cache-Control and drops Referrer-Policy')
    }
  })

  it('proxies nothing and carries no credential', () => {
    // Also a `rules` job in CI, so deleting this test does not delete the rule. The tempting fix
    // for the cross-origin gap is a proxy with an Authorization header; an image is built once and
    // promoted, so a credential inside one is a published credential.
    assert.doesNotMatch(directives, /proxy_pass/i)
    assert.doesNotMatch(directives, /authorization|bearer/i)
    const dockerfile = read('Dockerfile')
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))
      .join('\n')
    assert.doesNotMatch(dockerfile, /TOKEN|SECRET/i, 'the image would carry a credential')
  })
})

describe('the CI deep-link probe names a real route', () => {
  it('DEEP_LINK_PATH is a route this app owns', () => {
    const owned = ROUTES.map((r) => `/${r.path}`)
    assert.ok(owned.includes(DEEP_LINK_PATH), `${DEEP_LINK_PATH} is not a route this app serves`)
  })

  it('is the path CI actually probes', () => {
    assert.ok(
      ci.includes(`http://127.0.0.1:8080${DEEP_LINK_PATH}`),
      `ci.yml does not probe ${DEEP_LINK_PATH}`,
    )
  })

  it('and CI also probes an address the app does NOT own, requiring a 404', () => {
    // Without this the probe proves only that something answers. The assertion the org's reusable
    // image job cannot make, because it requires a 200 for any deep link.
    assert.match(ci, /unknown=\$\(curl[^\n]*\/nope\/not\/a\/route/)
    assert.match(ci, /\[ "\$unknown" = "404" \]/)
  })

  it('and a near-miss of a real route, because that is the typo people actually make', () => {
    assert.match(ci, /\/faucets\/|\/chains\b/, 'CI probes no near-miss of a real route')
  })
})

describe('nothing is gated behind a session', () => {
  it('there is no ProtectedRoute anywhere in src', () => {
    // Asserted as an ABSENCE, because the reflex is to add one back. Comments are stripped first:
    // app.tsx, auth.tsx and routes.ts all NAME the thing they refuse in order to explain the
    // refusal, and a raw grep matches the explanation and fails a correct file.
    const strip = (s: string) =>
      s
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((line) => !/^\s*\/\//.test(line))
        .join('\n')
    for (const file of [
      'src/app.tsx',
      'src/lib/auth.tsx',
      'src/lib/routes.ts',
      'src/components/shell.tsx',
    ]) {
      assert.doesNotMatch(strip(read(file)), /ProtectedRoute/, `${file} gates a route`)
    }
  })
})
