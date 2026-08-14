/**
 * The network the reader is VIEWING — in-app network context (micro-org#459 stage 3).
 *
 * The explorer's `lib/viewed.ts` carries the full reconciliation with the estate's no-stored-
 * network invariant; this is the same shape with the same three properties kept: nothing is
 * persisted (module memory, per tab), the default is the hostname's own network, and the viewed
 * network is always on screen (the bar's switcher shows it and the amber band follows it).
 *
 * ── WHAT SWITCHES HERE, AND WHAT DELIBERATELY DOES NOT ────────────────────────────────────────
 *
 * The CHAIN INDEX reads switch: they go to the sibling estate's explorer host, anonymously, and
 * ride the indexer's documented public-read `*`. The FAUCET does not switch — `POST /v1/faucet`
 * pays out, it is this estate's one write on this surface, and a write must never silently target
 * a network the address bar does not name (#459's standing rule). A reader who switches the view
 * to testnet and wants the testnet faucet is one click from the real testnet page, where the
 * address bar agrees with the payout.
 */

import { envLabel, splitEnvLabel } from '@cloudsforge/ui'
import { chainIndexBase } from './hosts.ts'
import type { PageNetwork } from './hosts.ts'
import { currentNetwork } from './hosts.ts'

let viewed: PageNetwork | null = null

/** The network the reader is viewing: their in-tab choice, or the hostname's network. */
export function viewedNetwork(): PageNetwork {
  return viewed ?? currentNetwork()
}

/** Record the reader's choice. Choosing the hostname's own network clears the override. */
export function setViewedNetwork(network: PageNetwork): void {
  viewed = network === currentNetwork() ? null : network
}

/**
 * The chain-index base for the viewed network.
 *
 * The own-network case returns `chainIndexBase()` untouched — the exact URL this surface has
 * always used. The other-network case rewrites the EXPLORER host's first label between env
 * spellings with the registry's own pair (`envLabel`/`splitEnvLabel`), because the chain index
 * lives behind the explorer surface on BOTH estates and the label translation is the one
 * operation those two functions exist to make unambiguous.
 */
export function viewedChainIndexBase(): string {
  const base = chainIndexBase()
  if (viewed === null) return base
  try {
    const url = new URL(base)
    const parts = url.hostname.split('.')
    if (parts.length < 3) return base
    const env = splitEnvLabel(parts[0] ?? '')
    const sub = env ? env.subdomain : (parts[0] ?? '')
    const label = envLabel(sub, viewed === 'testnet' ? 'testnet' : '')
    url.hostname = [label, ...parts.slice(1)].join('.')
    return url.origin
  } catch {
    return base
  }
}
