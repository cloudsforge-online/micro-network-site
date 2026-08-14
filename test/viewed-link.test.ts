/**
 * THE NETWORK SURVIVES A PRODUCT SWITCH — the carrier half, on the reading side.
 *
 * *"if you select testnet and switch product you are back to mainnet"*
 *
 * `@cloudsforge/ui` composes the outgoing link with `?net=`, because every surface is its own
 * origin and neither storage nor the hostname can carry the reader's choice across one: the
 * combined view retired the testnet frontends, so `network-testnet.<apex>` 302s straight back to
 * `network.<apex>`. This file asserts the other end — that arriving here with the parameter
 * re-points the CHAIN INDEX reads, and that the faucet is not among them.
 *
 * Each case installs its window first and then imports a FRESH copy of the module (the `?case=`
 * suffix defeats the module cache), because the seed is read once at load — which is the property
 * that makes it a carrier rather than a store.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { afterEach, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { installWindow, removeWindow } from './browser-stubs.ts'

let seq = 0

/** A fresh `viewed.ts`, loaded as a browser would load it at `url`. */
async function loadAt(url: string): Promise<typeof import('../src/lib/viewed.ts')> {
  installWindow(url)
  seq += 1
  return (await import(`../src/lib/viewed.ts?case=${seq}`)) as typeof import('../src/lib/viewed.ts')
}

afterEach(() => {
  removeWindow()
})

describe('the network a link arrived carrying', () => {
  it('is what the reader is viewing, and the chain index follows it', async () => {
    const m = await loadAt('https://network.cloudsforge.online/chain?net=testnet')
    assert.equal(m.viewedNetwork(), 'testnet')
    assert.equal(m.viewedChainIndexBase(), 'https://explorer-testnet.cloudsforge.online')
  })

  it('works in the other direction too', async () => {
    const m = await loadAt('https://network-testnet.cloudsforge.online/chain?net=mainnet')
    assert.equal(m.viewedNetwork(), 'mainnet')
    assert.equal(m.viewedChainIndexBase(), 'https://explorer.cloudsforge.online')
  })

  it('is ignored when it agrees with the hostname', async () => {
    const m = await loadAt('https://network.cloudsforge.online/chain?net=mainnet')
    assert.equal(m.viewedNetwork(), 'mainnet')
    assert.equal(m.viewedChainIndexBase(), 'https://explorer.cloudsforge.online')
  })

  it('is ignored when it is absent or nonsense', async () => {
    for (const search of ['', '?tab=blocks', '?net=', '?net=maiinet', '?net=MAINNET']) {
      const m = await loadAt(`https://network.cloudsforge.online/chain${search}`)
      assert.equal(m.viewedNetwork(), 'mainnet', search)
    }
  })

  it('does nothing off-registry, where the network is `local`', async () => {
    // `viewedChainIndexBase` rewrites a hostname label. A seeded override on a development host
    // would have it rewriting one it does not understand, and `NetworkSwitcher` hides itself
    // there, so no click could ever have produced this state.
    const m = await loadAt('http://localhost:3003/chain?net=testnet')
    assert.equal(m.viewedNetwork(), 'local')
  })

  it('is a starting point, not a lock — the switcher still wins', async () => {
    const m = await loadAt('https://network.cloudsforge.online/chain?net=testnet')
    m.setViewedNetwork('mainnet')
    assert.equal(m.viewedNetwork(), 'mainnet')
    assert.equal(m.viewedChainIndexBase(), 'https://explorer.cloudsforge.online')
  })

  it('is read, never written back — nothing about it persists', async () => {
    const browser = installWindow('https://network.cloudsforge.online/chain?net=testnet')
    seq += 1
    await import(`../src/lib/viewed.ts?case=${seq}`)
    assert.deepEqual(browser.replaced, [])
    assert.deepEqual(browser.assigned, [])
  })
})

/**
 * AND THE BAR IS TOLD THE SAME NETWORK THE MODULE HONOURS.
 *
 *     "if you have testnet and you choose forge network it return you to mainnet,
 *      the rest products seems to keep it"           — reported 2026-08-14
 *
 * Every assertion above passed while that was true. They prove `lib/viewed.ts` reads the link;
 * they say nothing about what the SHELL hands to `CloudsForgeBar`, and the shell seeded its state
 * from `currentNetwork()` — the hostname — so the module was viewing testnet while the bar was
 * describing mainnet.
 *
 * That gap is not cosmetic, because the bar spends `networkSwitch.selected` three ways
 * (`ui/packages/ui/src/index.tsx`): the switcher's label, whether `TestnetBand` renders, and the
 * `viewedNetwork` handed to `resolveProducts`, which decides whether each outgoing product link
 * carries `?net=`. A shell seeded from the hostname therefore does not merely mislabel itself — it
 * DROPS the reader's choice on the way out, which is why this one surface reset the whole tour.
 *
 * Checked against the source rather than a render because this suite has no DOM by design (see
 * `render.test.ts`), and because the defect is exactly one identifier: the check that would have
 * caught it is the check that reads which identifier is there.
 */
describe('the shell seeds the bar from the viewed network', () => {
  const shell = readFileSync(
    fileURLToPath(new URL('../src/components/shell.tsx', import.meta.url)),
    'utf8',
  )
  /** The shell with its comments stripped: this is a rule about CODE, not about the prose. */
  const code = shell
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n')

  it('seeds its state from viewedNetwork(), which honours the link', () => {
    assert.match(code, /useState<PageNetwork>\(viewedNetwork\(\)\)/)
  })

  it('does not seed it from the hostname', () => {
    // The whole bug, in one call. `currentNetwork()` answers what this deployment IS, which is the
    // right question for the faucet and the wrong one for the bar.
    assert.doesNotMatch(code, /useState<PageNetwork>\(currentNetwork\(\)\)/)
  })

  it('passes that state to the bar, so the two cannot drift apart', () => {
    assert.match(code, /networkSwitch=\{\{/)
    assert.match(code, /selected: viewed/)
  })
})

/**
 * AND THE CHOICE SURVIVES A RELOAD, BECAUSE THE ADDRESS BAR CARRIES IT.
 *
 *     "if we have testnet selected and we refresh the page it goes to mainnet"   — 2026-08-14
 *
 * The mechanism is `keepNetworkInTheAddressBar` in `@cloudsforge/ui/network-view`, tested there
 * against a full history stub. These cases pin THIS module's wiring to it — and that the FAUCET is
 * unaffected, which it is by construction: it reads the address bar's own network, and nothing
 * here can move the address bar off `network.cloudsforge.online`.
 */
describe('the viewed network survives a reload', () => {
  it('is written into the address bar when the reader switches', async () => {
    const browser = installWindow('https://network.cloudsforge.online/chain')
    seq += 1
    const m = (await import(`../src/lib/viewed.ts?case=${seq}`)) as typeof import('../src/lib/viewed.ts')
    m.setViewedNetwork('testnet')
    assert.deepEqual(browser.replaced, ['/chain?net=testnet'])
  })

  it('and a fresh load at that address is viewing testnet — the reload, end to end', async () => {
    const m = await loadAt('https://network.cloudsforge.online/chain?net=testnet')
    assert.equal(m.viewedNetwork(), 'testnet')
    assert.equal(m.viewedChainIndexBase(), 'https://explorer-testnet.cloudsforge.online')
  })

  it('and switching back leaves the URL as it was found', async () => {
    const browser = installWindow('https://network.cloudsforge.online/chain')
    seq += 1
    const m = (await import(`../src/lib/viewed.ts?case=${seq}`)) as typeof import('../src/lib/viewed.ts')
    m.setViewedNetwork('testnet')
    m.setViewedNetwork('mainnet')
    assert.deepEqual(browser.replaced, ['/chain?net=testnet', '/chain'])
  })

  it('writes nothing on a development host, where there is no sibling estate', async () => {
    const browser = installWindow('http://localhost:3003/chain')
    seq += 1
    const m = (await import(`../src/lib/viewed.ts?case=${seq}`)) as typeof import('../src/lib/viewed.ts')
    m.setViewedNetwork('testnet')
    assert.deepEqual(browser.replaced, [])
  })
})
