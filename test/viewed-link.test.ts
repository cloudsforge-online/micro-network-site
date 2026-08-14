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
import { afterEach, describe, it } from 'node:test'
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
