/**
 * WHERE THIS APP TALKS TO, AND EVERY NUMBER THAT DECIDES IT.
 *
 * Two of the three hosts this bundle resolves are wrong today, in different ways, and neither is
 * papered over with a literal — a hard-coded host is a second, unversioned copy of the surface
 * registry, and the copy is the one that goes stale. So both are RESOLVED through the registry and
 * PINNED here, in both directions, so that whichever moves first fails and names the other.
 *
 * The pattern is `micro-explorer-web`'s, which pinned its own devPort disagreement in exactly this
 * shape and then went red the day micro-ui corrected the row — which is what a pin is for. Its
 * prose did NOT go red, and four of its comments still describe the old number; that is the failure
 * this file is written to avoid, so every claim below is an assertion rather than a sentence.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, it } from 'node:test'
import { SURFACES, cloudsforgeHosts, type CloudsForgeHosts, type SurfaceKey } from '@cloudsforge/ui'
import {
  CHAIN_INDEX_SURFACE,
  FAUCET_SURFACE,
  PRODUCT,
  chainIndexBase,
  faucetBase,
  isLocal,
  isRegisteredPlacement,
  originOf,
  resolveApiBase,
} from '../src/lib/hosts.ts'
import { installWindow, removeWindow } from './browser-stubs.ts'

const at = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))
const read = (p: string) => readFileSync(at(p), 'utf8')

/** Where a sibling is, if it is checked out. */
const sibling = (name: string): string | null => {
  const dir = at(`../${name}`)
  return existsSync(dir) ? dir : null
}

afterEach(removeWindow)

/* ══════════════════════════ the registry rows this bundle depends on ══════════════════════════ */

const devPort = (key: string): number | undefined =>
  SURFACES.find((s) => s.key === (key as never))?.devPort

const surfaceRow = (key: string) => SURFACES.find((s) => s.key === (key as never))

describe('the registry rows this surface reads', () => {
  it('gives `network` devPort 3003, a `network` subdomain and the molten accent', () => {
    const row = surfaceRow('network')
    assert.ok(row, '`network` is gone from the registry')
    assert.equal(row.devPort, 3003)
    assert.equal(row.subdomain, 'network')
    assert.equal(row.accent, '#d6412f')
    assert.equal(row.kind, 'product')
    assert.equal(row.inSwitcher, true)
    // A product with a mark of its own, unlike `explorer` and `status`, which carry null.
    assert.equal(row.markId, 'mark-network')
  })

  it('gives `faucet` the SAME 3003, with basePath /faucet — deliberate co-hosting, not a collision', () => {
    const row = surfaceRow('faucet')
    assert.ok(row, '`faucet` is gone from the registry')
    assert.equal(row.devPort, 3003, 'the faucet is no longer co-hosted with the Network site')
    assert.equal(row.subdomain, 'network')
    assert.equal(row.basePath, '/faucet')
    // The registry's own guard names the pair, so the collision check treats it as a decision. If
    // that set stops naming it, somebody has decided the two are separate hosts and this app's
    // `/faucet` route is in the wrong repository.
    const ui = sibling('ui')
    if (ui === null) {
      console.log('UNCHECKED: the CO_HOSTED set — micro-ui is not checked out')
      return
    }
    const test = readFileSync(`${ui}/packages/ui/src/surfaces.test.ts`, 'utf8')
    assert.match(
      test,
      /const CO_HOSTED = new Set\(\[[^\]]*'faucet\+network'/,
      'faucet+network is no longer declared as deliberate co-hosting',
    )
  })

  it('gives `explorer` devPort 4008 — the port micro-indexer binds, not this bundle', () => {
    // micro-ui corrected this from 8080, which was micro-explorer-web's own nginx container port,
    // so under `pnpm dev` that bundle asked ITSELF for chain data. This surface resolves the same
    // row for the same service, so the correction is load-bearing here too.
    assert.equal(devPort('explorer'), 4008)
    const indexer = sibling('indexer')
    if (indexer === null) {
      console.log('UNCHECKED: micro-indexer binds 4008 — the repository is not checked out')
      return
    }
    assert.match(readFileSync(`${indexer}/src/env.ts`, 'utf8'), /port\(source, 'PORT', 4008\)/)
  })
})

/* ══════════════════════════ the two live disagreements ══════════════════════════ */

describe('the faucet devPort names a page, and micro-faucet binds something else', () => {
  it('the registry number is this site, and the service is on 4013', () => {
    // Two facts, both pinned, so that the sentence in src/lib/hosts.ts is a checked claim rather
    // than a remembered one. `faucet` devPort 3003 is correct FOR A PAGE and cannot also be an API
    // base — which is the same shape of confusion the `explorer` row was corrected for, arriving
    // from the other direction.
    assert.equal(devPort('faucet'), 3003)
    const faucet = sibling('faucet')
    if (faucet === null) {
      console.log('UNCHECKED: micro-faucet binds 4013 — the repository is not checked out')
      return
    }
    assert.match(readFileSync(`${faucet}/src/env.ts`, 'utf8'), /integer\(source, 'PORT', 4013/)
    assert.notEqual(devPort('faucet'), 4013, 'the registry now names the service port; re-read hosts.ts')
  })
})

describe('the chain-index read is cross-origin, and three separate things now make it work', () => {
  it('this surface and the chain index are different subdomains', () => {
    assert.notEqual(surfaceRow(PRODUCT)?.subdomain, surfaceRow(CHAIN_INDEX_SURFACE)?.subdomain)
  })

  it('micro-indexer now sets a CORS header of its own', () => {
    // Was `doesNotMatch`, and was written to go red the day it changed so the apology on the
    // /chain page could be deleted. It changed. Flipped rather than removed: an assertion dropped
    // because it started passing leaves nothing watching for the regression.
    const indexer = sibling('indexer')
    if (indexer === null) {
      console.log('UNCHECKED: the indexer CORS claim — micro-indexer is not checked out')
      return
    }
    const server = readFileSync(`${indexer}/src/server.ts`, 'utf8')
    assert.match(
      server,
      /access-control-allow-origin/i,
      'micro-indexer has stopped setting CORS headers; a browser on this host cannot read it again',
    )
  })

  it('and the gateway allowlist now names this surface', () => {
    /*
     * The other half of the same story, and the same flip.
     *
     * The estate's CORS comes from ONE middleware on the websecure entrypoint, fed by one list.
     * `network` was absent from it while `explorer`, `hub`, `market` and six others were present;
     * this assertion required that absence and said "the day it is added, this goes red and the
     * apology in `CHAIN.crossOrigin` is deleted rather than left to age". It has been added.
     */
    const deploy = sibling('deploy')
    if (deploy === null) {
      console.log('UNCHECKED: the gateway CORS allowlist — micro-deploy is not checked out')
      return
    }
    const policy = readFileSync(`${deploy}/gateway/dynamic/policy.yml`, 'utf8')
    assert.match(policy, /accessControlAllowOriginList:/, 'the CORS middleware is gone from the policy')
    // Not vacuous: a hostname that was ALREADY on the list, so a broken read of the file fails
    // here first rather than reporting this surface as allowlisted when nothing was read.
    // The literal mainnet origins were deleted on purpose — one templated list now renders per
    // environment from CF_WEB_SUFFIX, so a literal `.cloudsforge.online` here would only ever have
    // proved the MAINNET half. Asserting the template proves both.
    assert.match(policy, /- https:\/\/explorer\{\{ env "CF_WEB_SUFFIX" \}\}/)
    assert.match(
      policy,
      /- https:\/\/network\{\{ env "CF_WEB_SUFFIX" \}\}/,
      'this surface has been dropped from the gateway CORS allowlist; the chain read fails closed again',
    )
  })
})

/* ══════════════════════════ resolution ══════════════════════════ */

describe('a base is resolved by comparing origins', () => {
  const hosts = (overrides: Partial<CloudsForgeHosts>): CloudsForgeHosts =>
    ({ ...cloudsforgeHosts(), ...overrides }) as CloudsForgeHosts

  it('is empty when the surface shares this page origin, so the request stays relative', () => {
    const h = hosts({ explorer: 'https://network.example.test' })
    assert.equal(resolveApiBase('https://network.example.test', h, 'explorer'), '')
  })

  it('is absolute when it does not', () => {
    const h = hosts({ explorer: 'https://explorer.example.test' })
    assert.equal(
      resolveApiBase('https://network.example.test', h, 'explorer'),
      'https://explorer.example.test',
    )
  })

  it('DROPS a basePath, because a page URL is not an API base', () => {
    // The trap this function exists for: `${hosts.faucet}/v1/drips` is `/faucet/v1/drips`, which
    // micro-faucet does not serve. Every path in its table begins `/v1`
    // (`faucet/src/server.ts`).
    const h = hosts({ faucet: 'https://network.example.test/faucet' })
    assert.equal(resolveApiBase('https://other.example.test', h, 'faucet'), 'https://network.example.test')
    assert.equal(resolveApiBase('https://network.example.test', h, 'faucet'), '')
  })

  it('is absolute with no page origin, because there is nothing for a relative URL to resolve against', () => {
    const h = hosts({ explorer: 'https://explorer.example.test' })
    assert.equal(resolveApiBase('', h, 'explorer'), 'https://explorer.example.test')
  })

  it('originOf returns an unparseable value unchanged rather than guessing', () => {
    assert.equal(originOf('https://a.example.test/x'), 'https://a.example.test')
    assert.equal(originOf('not a url'), 'not a url')
  })
})

describe('the resolved bases in a real browser', () => {
  it('under pnpm dev, the chain index is the indexer port and the faucet is the registry page port', () => {
    installWindow('http://localhost:5190/chain')
    assert.equal(chainIndexBase(), `http://localhost:${devPort('explorer')}`)
    // 3003 — this site's own registry port, which is neither this bundle under `pnpm dev` (5190)
    // nor micro-faucet (4013). Asserted as the CURRENT truth so that a fix upstream is a red run.
    assert.equal(faucetBase(), `http://localhost:${devPort('faucet')}`)
  })

  it('in production the chain index is cross-origin and the faucet is relative', () => {
    installWindow('https://network.cloudsforge.online/faucet')
    assert.equal(chainIndexBase(), 'https://explorer.cloudsforge.online')
    // Relative, because the registry says the faucet is a route on THIS host. Which means the
    // gateway has to route `/v1/...` here — and the README says so.
    assert.equal(faucetBase(), '')
  })
})

describe('placement', () => {
  it('treats the four development names as local', () => {
    for (const name of ['', 'localhost', '127.0.0.1', 'dev.local']) assert.ok(isLocal(name))
    for (const name of ['cloudsforge.online', 'network.cloudsforge.online']) {
      assert.equal(isLocal(name), false)
    }
  })

  it('accepts this surface’s own production hostname', () => {
    const h = cloudsforgeHosts()
    assert.ok(
      isRegisteredPlacement('https://network.cloudsforge.online', 'network.cloudsforge.online', {
        ...h,
        network: 'https://network.cloudsforge.online',
      } as CloudsForgeHosts),
    )
  })

  it('refuses an address the registry does not know', () => {
    assert.equal(
      isRegisteredPlacement('https://pr-42.example.dev', 'pr-42.example.dev', {
        ...cloudsforgeHosts(),
        network: 'https://network.cloudsforge.online',
      } as CloudsForgeHosts),
      false,
    )
  })
})

/* ══════════════════════════ the vite port ══════════════════════════ */

describe('the vite port is distinct from every sibling and from the registry', () => {
  const vitePort = (source: string): number | null => {
    const m = /server: \{ port: (\d+)/.exec(source)
    return m?.[1] ? Number(m[1]) : null
  }

  it('this bundle binds 5190', () => {
    assert.equal(vitePort(read('vite.config.ts')), 5190)
  })

  it('which is NOT the registry devPort for this surface, and the README says how to bridge it', () => {
    assert.notEqual(vitePort(read('vite.config.ts')), devPort('network'))
    assert.match(
      read('README.md'),
      /pnpm dev --port 3003/,
      'the README no longer says the one line that makes the registry true locally',
    )
  })

  it('and it collides with no sibling frontend', () => {
    // Read from the siblings rather than from a list here: a list is a copy, and the copy is the
    // one that goes stale. Reported as UNCHECKED when they are absent, never passed over quietly.
    const names = [
      'site',
      'hub-web',
      'foresight-web',
      'admin-web',
      'mint-web',
      'foresight-admin-web',
      'trade-web',
      'market-web',
      'status-web',
      'explorer-web',
      'devportal-web',
      'emberkin-web',
      'worlds-web',
      'web-template',
    ]
    const absent: string[] = []
    const taken = new Map<number, string>()
    for (const name of names) {
      const root = sibling(name)
      if (root === null || !existsSync(`${root}/vite.config.ts`)) {
        absent.push(name)
        continue
      }
      const port = vitePort(readFileSync(`${root}/vite.config.ts`, 'utf8'))
      if (port !== null) taken.set(port, name)
    }
    if (absent.length > 0) console.log(`UNCHECKED: vite ports of ${absent.join(', ')}`)
    assert.ok(taken.size >= 1, 'no sibling vite config was read, so this check measured nothing')
    assert.equal(
      taken.get(5190),
      undefined,
      `5190 is already ${taken.get(5190) ?? 'nobody'}'s vite port`,
    )
  })
})

/* ══════════════════════════ the surface keys are real ══════════════════════════ */

describe('every registry key this bundle names exists', () => {
  it('resolves all three without throwing', () => {
    const h = cloudsforgeHosts()
    for (const key of [PRODUCT, CHAIN_INDEX_SURFACE, FAUCET_SURFACE] as SurfaceKey[]) {
      assert.ok(typeof h[key] === 'string' && h[key].length > 0, `${key} resolves to nothing`)
    }
  })

  it('and no literal hostname appears anywhere in src', () => {
    // Also a `rules` job in CI, so deleting this test does not delete the rule. There is exactly
    // one literal URL in this bundle and it is github.com — not a CloudsForge surface, so the
    // registry has no key for it, and a fabricated key would be worse than the literal.
    for (const file of [
      'src/lib/hosts.ts',
      'src/lib/routes.ts',
      'src/lib/api.ts',
      'src/pages/home.tsx',
      'src/pages/chain.tsx',
      'src/pages/faucet.tsx',
      'src/components/shell.tsx',
    ]) {
      const code = read(file).replace(/\/\*[\s\S]*?\*\//g, '')
      assert.doesNotMatch(code, /cloudsforge\.online/, `${file} names a hostname`)
    }
  })
})
