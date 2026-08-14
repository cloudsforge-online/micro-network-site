/**
 * The app shell: the company bar, the navigation, the standing state notice, and the page.
 *
 * The bar is `CloudsForgeBar` from @cloudsforge/ui and is never reimplemented. It is passed
 * `PRODUCT` — 'network' — so the switcher resolves this surface's entry and marks it as current.
 * `network` is `inSwitcher: true` (`ui/packages/ui/src/surfaces.ts`), which is correct: it is
 * one of the six products a person chooses between, unlike the explorer.
 *
 * ── The mark IS rendered here, and that is the difference from the explorer ────────────────────
 *
 * `network` carries `markId: 'mark-network'` (`ui/packages/ui/src/surfaces.ts`) and
 * `brand/README.md` gives it the **full** set of eight files, all of which exist in
 * `brand/assets/network/`. That is not true of every surface: `explorer` and `status` carry
 * `markId: null` deliberately, because "an explorer is part of Forge Network" and neither claims a
 * mark of its own (`brand/README.md`), and `micro-explorer-web`'s CI asserts the absence of
 * one in its own repository. This surface is the one they belong to.
 *
 * The mark is drawn by the shared `<Mark>` component from the design system rather than by
 * shipping the PNG into the page: it takes a `surface` KEY rather than a `markId`
 * (`ui/packages/ui/src/index.tsx`), reads `--cf-accent` so it wears this surface's molten
 * red without a second copy of the colour, and stays crisp at every size. `hasMark('network')` is
 * true because `MARK_DRAWINGS` has a `network` entry (`ui/packages/ui/src/index.tsx`), and
 * `test/brand-chrome.test.ts` checks that rather than assuming it — `Mark` renders NOTHING for a
 * surface it has no drawing for (`ui/packages/ui/src/index.tsx`), silently, which is exactly
 * the shape of failure this estate keeps shipping.
 *
 * The PNGs in `public/` are the browser chrome — the favicons and the Open Graph card — which is
 * what a separate hostname cannot inherit.
 *
 * ── The standing state notice, on EVERY route ─────────────────────────────────────────────────
 *
 * `STANDING_STATE` sits above the page on all five routes rather than only on the home page. A
 * reader arriving on `/mine` from a search result has not read the home page, and would otherwise
 * spend their whole visit believing there is a network to mine on. `hearth/README.md` puts the
 * same section above everything else in its own repository and calls it "Status, before anything
 * else"; this is the same decision, applied to a surface where a reader can arrive anywhere.
 *
 * It is a `<Note>` rather than a dismissible banner on purpose. A notice somebody can dismiss is a
 * notice that is absent for every reader who has been here before, which is precisely the reader
 * most likely to have formed the wrong impression.
 */
import { CloudsForgeBar, CookieBanner, Mark, miningOnHub } from '@cloudsforge/ui'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { STANDING_STATE } from '../content/copy.ts'
import { useSession } from '../lib/auth.tsx'
import { PRODUCT, currentNetwork, hosts } from '../lib/hosts.ts'
import type { PageNetwork } from '../lib/hosts.ts'
import { setViewedNetwork } from '../lib/viewed.ts'
import { NAV } from '../lib/routes.ts'
import { Note } from './parts.tsx'

export function AppShell({ unregistered = false }: { unregistered?: boolean }) {
  const { account, signIn, signOut } = useSession()
  // The viewed network: in-tab memory, defaulting to the hostname's own (micro-org#459 stage 3).
  // setViewedNetwork runs first in the switcher handler so the remounted tree reads the new value
  // on its very first render.
  const [viewed, setViewed] = useState<PageNetwork>(currentNetwork())

  return (
    <>
      {/* Skip link first in the DOM: these are long reading pages and a keyboard user should not
          have to tab the navigation to reach the text. */}
      <a className="ns-skip" href="#main">
        Skip to the page
      </a>
      {/*
        `mining` beside the account, as on every other surface that mounts this bar.

        THIS SURFACE IS THE REASON THE CONTROL EXISTS. `/mine` here is a page that DESCRIBES
        mining — what the reward is, what it is not, and that it is not an income — and for a
        while it was also the only way to find the miner at all. A capability you reach by
        remembering which page it was filed under is a capability most readers never find. The
        page keeps its job, which is explaining; starting it belongs beside the account, on every
        page, which is what this is.

        `miningOnHub()` — the miner is a WebSocket and two Web Workers on ONE origin, and this
        bundle is not served from it, so this renders an anchor to the surface that can start it.
      */}
      {/* In-app network context (micro-org#459 stage 3). The choice lives in lib/viewed.ts —
          memory only, never storage — and the key on the Outlet below is the refetch mechanism.
          The chain panels switch; the FAUCET does not, because it pays out and a write must never
          silently target a network the address bar does not name. The band follows the SELECTED
          network, so testnet figures under a mainnet address bar are unmistakable. */}
      <CloudsForgeBar
        current={PRODUCT}
        account={account}
        onSignIn={() => signIn()}
        onSignOut={signOut}
        mining={miningOnHub(hosts().hub)}
        networkSwitch={{
          selected: viewed === 'testnet' ? 'testnet' : 'mainnet',
          onSelect: (n) => {
            setViewedNetwork(n)
            setViewed(n)
          },
        }}
      />
      {/*
        The sub-nav is sticky at exactly `var(--cf-bar-h)` — the bar's own height token, not a
        number copied out of it. When the bar's height changes, this moves with it.
      */}
      <nav className="ns-subnav" aria-label="Sections">
        <div className="ns-subnav__inner">
          <span className="ns-subnav__brand">
            <Mark surface={PRODUCT} size={20} />
            <span className="ns-subnav__name">Forge Network</span>
          </span>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `ns-subnav__link${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="ns-main" id="main">
        {/*
          Not fatal, so not a refusal — this is a public reference surface and nothing here is a
          security boundary. But not silent either. `cloudsforgeHosts()` derives the apex by
          stripping a KNOWN subdomain, so an address the registry does not know makes every estate
          URL resolve one level too deep: the chain index, the faucet, and the account portal.
        */}
        {unregistered && (
          <Note tone="warn" title="This page is somewhere the registry does not know">
            <p>
              Every CloudsForge host this page resolves — the chain index it reads, the faucet it
              posts to, the account portal — is derived from the address in your bar, and this one
              is not one the surface registry recognises. Its home is the{' '}
              <code className="cf-num">network</code> surface.
            </p>
          </Note>
        )}
        <Note tone="warn" title={STANDING_STATE.headline}>
          <p>{STANDING_STATE.body}</p>
        </Note>
        <Outlet key={viewed} />
      </main>
      {/*
        Last in the DOM so it is last in the tab order: the gate is a decision about this visit, not
        a barrier in front of the page, and a reader who never touches it has still read everything.
        It draws nothing until `initAnalytics()` reports no stored answer.
      */}
      <CookieBanner />
    </>
  )
}
