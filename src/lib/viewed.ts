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
 * The FAUCET does not switch — `POST /v1/faucet` pays out, it is this estate's one write on this
 * surface, and a write must never silently target a network the address bar does not name (#459's
 * standing rule). A reader who switches the view to testnet and wants the testnet faucet is one
 * click from the real testnet page, where the address bar agrees with the payout.
 *
 * AND NEITHER DO THE CHAIN-INDEX READS, WHICH IS A REVERSAL — see `chainIndexBaseOn` below for
 * why, measured. They used to follow the switcher, through a `viewedChainIndexBase()` that read
 * the module state this file holds. What survives of the switcher on this surface is everything
 * that is ABOUT the reader's position rather than about a chain: the bar's label, the amber band,
 * and whether each outgoing product link carries `?net=`.
 */

import { envLabel, networkFromQuery, splitEnvLabel, withNetwork } from '@cloudsforge/ui'
import { keepNetworkInTheAddressBar } from '@cloudsforge/ui/network-view'
import { chainIndexBase } from './hosts.ts'
import type { PageNetwork } from './hosts.ts'
import { currentNetwork } from './hosts.ts'

/**
 * The choice a link arrived carrying, read ONCE, at load.
 *
 *     "if you select testnet and switch product you are back to mainnet"
 *
 * Every surface is its own origin, so the module state below stops at the hostname and a link
 * from Forge Hub to the chain pages could not bring the reader's network with it. `?net=` is the
 * one channel that survives a cross-origin navigation without being storage — and it survives the
 * combined view's retirement redirect too: `network-testnet.<apex>` 302s to `network.<apex>`
 * preserving path and query.
 *
 * Read, never written. Nothing persists, so the no-stored-network invariant is untouched: this is
 * a statement the LINK made for one navigation, not a preference the tab keeps. Navigate in-app
 * and it is gone.
 *
 * Off-registry (`local`) it answers null. There is no sibling estate to view from localhost and
 * `NetworkSwitcher` hides itself there, so no click could produce the state either. The FAUCET is
 * unaffected either way — it is this surface's one write and stays pinned to the estate the
 * address bar names.
 */
function fromLink(): PageNetwork | null {
  const here = currentNetwork()
  if (here === 'local') return null
  const asked = networkFromQuery()
  if (asked === null) return null
  return asked === here ? null : asked
}

let viewed: PageNetwork | null = fromLink()

/**
 * The address bar says what the reader is viewing, and keeps saying it.
 *
 *     "if we have testnet selected and we refresh the page it goes to mainnet"
 *
 * It did, and for exactly the reason the paragraph above treated as a virtue: the choice was
 * module memory, and a reload discards module memory. `keepNetworkInTheAddressBar` writes `?net=`
 * in place on every change — see it for why a reload reproducing what is on screen is not the
 * stored default this estate refuses. Nothing is stored: no `localStorage`, no cookie, no
 * preference; the FAUCET is untouched either way, since it stays pinned to the estate the address
 * bar names and the address bar cannot be moved by this.
 *
 * `local` is not a network anything can be viewed on — `fromLink` already refuses off-registry —
 * so it reads as no override, and the parameter is never composed for a development host.
 */
const syncAddressBar = keepNetworkInTheAddressBar(() =>
  viewed === 'mainnet' || viewed === 'testnet' ? viewed : null,
)
syncAddressBar()

/** The network the reader is viewing: their in-tab choice, or the hostname's network. */
export function viewedNetwork(): PageNetwork {
  return viewed ?? currentNetwork()
}

/** Record the reader's choice. Choosing the hostname's own network clears the override. */
export function setViewedNetwork(network: PageNetwork): void {
  viewed = network === currentNetwork() ? null : network
  syncAddressBar()
}

/**
 * The chain index that FOLLOWS a given network — a function of the chain being asked about, and
 * of nothing else.
 *
 * ════════════════════════════════════════════════════════════════════════════════════════════════
 * THIS TOOK A NETWORK PARAMETER INSTEAD OF READING THE SWITCHER ON 2026-08-16, AND THE REASON IS
 * A MEASUREMENT.
 *
 * It was `viewedChainIndexBase()`: no argument, the module state above, every chain-index read on
 * the surface re-pointed at whichever estate the reader had selected. On a page with ONE scope that
 * is exactly right, and it is what `/chain` is not. `/chain` renders `HEARTH_SCOPES` — ember on
 * mainnet AND ember on testnet, side by side — and each estate's indexer follows exactly one EMBER
 * network (`deploy/compose/env/chain.mainnet.env`: "exactly one of this file and
 * `chain.testnet.env` is ever read, and no deploy can have half of each"). Sending both panels to
 * one indexer therefore guaranteed one of them was asking an index about a chain it does not walk,
 * whichever way the switcher was set. Measured on `network.cloudsforge.online/chain`:
 *
 *   before the click   ember:mainnet  walked head 40,977 / tip 40,977 / lag 0
 *                      ember:testnet  "not observed — this chain index does not follow this chain"
 *   after Testnet      ember:mainnet  "not observed — this chain index does not follow this chain"
 *                      ember:testnet  walked head 18,468 / tip 18,468 / lag 0
 *
 * The page was never dishonest about it — `CHAIN.notFollowed` says the figures are absences rather
 * than zeroes — but one empty panel was a compromise made when there was no way to read the other
 * estate, and the combined view is that way. Pinning the origin to the SCOPE fills both at once.
 *
 * The consequence is worth stating plainly, because it looks like a regression to anyone who reads
 * the switcher as "change what I am looking at": pressing Testnet no longer moves a number on
 * `/chain`, because both networks are already on screen. What it still does is everything it does
 * everywhere else — the amber band, the bar's label, and `?net=` on the way to the next product.
 * ════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * The own-network case returns `chainIndexBase()` untouched — the exact URL this surface has
 * always used, and the only one that carries a session. The other-network case rewrites the
 * EXPLORER host's first label between env spellings with the registry's own pair
 * (`envLabel`/`splitEnvLabel`), because the chain index lives behind the explorer surface on BOTH
 * estates and the label translation is the one operation those two functions exist to make
 * unambiguous.
 *
 * Off-registry there is one indexer and no sibling to compose an address for, so `local` — as the
 * page's network or as the network asked about — is the base untouched. A dev host would otherwise
 * have this rewriting a label it does not understand.
 */
export function chainIndexBaseOn(network: PageNetwork): string {
  const base = chainIndexBase()
  const here = currentNetwork()
  if (here === 'local' || network === 'local' || network === here) return base
  try {
    const url = new URL(base)
    const parts = url.hostname.split('.')
    if (parts.length < 3) return base
    const env = splitEnvLabel(parts[0] ?? '')
    const sub = env ? env.subdomain : (parts[0] ?? '')
    const label = envLabel(sub, network === 'testnet' ? 'testnet' : '')
    url.hostname = [label, ...parts.slice(1)].join('.')
    return url.origin
  } catch {
    return base
  }
}

/**
 * Put the reader's viewed network into a link that LEAVES this origin.
 *
 * ── WHY A QUERY PARAMETER AND NOT A HOSTNAME ────────────────────────────────────────────────────
 *
 * The obvious composition is the one `chainIndexBaseOn` above uses and the one this estate used
 * everywhere before the combined view: rewrite the first label and send the reader to
 * `<sub>-testnet.<apex>`. That is right for the chain index — its `/v1` paths still answer on the
 * testnet explorer host, which is why the retirement router carries `!PathPrefix('/v1')` — and it
 * is wrong for a WEB surface, twice over.
 *
 * FIRST, THE REDIRECT DROPS THE NETWORK. micro-org#459 turned every `*-testnet` web hostname into
 * a 302 to its mainnet counterpart. The redirect preserves path and query, but a hostname-composed
 * link carries no query, so the reader arrives at the mainnet page viewing mainnet — having asked
 * for testnet and been silently answered with the other network. A round trip to lose the thing it
 * was composed to carry.
 *
 * SECOND, AND ONLY FOR THE EXCHANGE, IT DOES NOT RESOLVE AT ALL. Measured 2026-08-16:
 * `market-testnet`, `network-testnet`, `hub-testnet` and `pool-testnet` all answer 302; the
 * exchange's own `exchange-testnet.<apex>` has no DNS record — the record is an owner-only action
 * in the Cloudflare dashboard and no file in any of these repositories can take it, exactly as
 * `site/src/content/stages.ts` says about the mainnet name it waited three days for. So the
 * composed link fails at connect, and `viewedSurfaceUrl`'s own note in
 * `ui/packages/ui/src/network-view.ts` says what that costs: "a link that fails tells the reader
 * the service is gone rather than that the page is confused."
 *
 * `?net=` has neither problem. It is the channel the combined view actually runs on — read once at
 * load by `networkFromQuery` above, attached by `resolveProducts` to every product link the bar
 * composes, and it survives a redirect. This is that mechanism, exposed for the links a page
 * composes itself.
 *
 * ONLY WHEN THE TWO DIFFER, which is `resolveProducts`'s rule and is kept for its reason: a reader
 * viewing the network they are already served is the ordinary case, and `?net=mainnet` on every
 * link out of a mainnet page is a parameter that changes nothing, in an address bar, for ever.
 * `local` is the dev checkout — one estate, no sibling to name — and the URL is returned untouched.
 */
export function carryNetwork(url: string): string {
  const here = currentNetwork()
  const viewed = viewedNetwork()
  if (here === 'local' || viewed === 'local' || viewed === here) return url
  return withNetwork(url, viewed)
}
