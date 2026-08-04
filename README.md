# micro-network-site

[![ci](https://github.com/cloudsforge-online/micro-network-site/actions/workflows/ci.yml/badge.svg)](https://github.com/cloudsforge-online/micro-network-site/actions/workflows/ci.yml)
![licence](https://img.shields.io/badge/licence-MIT-97CA00)
![node](https://img.shields.io/badge/node-%3E%3D22-5FA04E?logo=node.js&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![module](https://img.shields.io/badge/module-ESM-F7DF1E?logo=javascript&logoColor=black)
![tests](https://img.shields.io/badge/tests-headless%20Chromium-2EAD33?logo=googlechrome&logoColor=white)

Forge Network's public surface: what Hearth is, how to run a node, how to mine, the state of the
chain, and the testnet faucet. It is the front door to
[`cloudsforge-online/hearth`](https://github.com/cloudsforge-online/hearth) — the one **public**
repository behind this platform, MIT licensed and open to outside contributors — and it deliberately
does **not** reimplement the block explorer, which is `micro-explorer-web` on its own hostname.

> **No figure about the network is written down in this repository.** Every one is fetched from
> `micro-indexer` at render time or is absent, and absent renders as the reason it is absent — never
> as a nought, never as an em dash, never as a plausible default. The type that carries a figure has
> four states and three of them hold no value at all (`Figure`, `src/lib/chainstatus.ts`), so there
> is no code path from "we did not fetch it" to a digit. `test/chainstatus.test.ts` asserts that
> property of the module rather than trusting it to review.
>
> The second refusal follows from the first: **this site states no price and implies no mining
> income.** It used to justify that with "there is no mainnet and no public testnet", and the first
> half of that is no longer true — `deploy/cloudflared/config.mainnet.public.yml:123` publishes the
> mainnet JSON-RPC hostname on the public tunnel, and it answers `eth_chainId` with `0x1cf3` from
> off the estate. **A reachable chain is not a traded one**, and that is the reason now written
> down: EMBER has no market, no listing and no liquidity, so any price or capitalisation figure
> would be invented rather than merely unavailable. A block reward is a consensus constant and is
> stated as one; what a machine earns from it is a share against a difficulty that moves every
> block, and no number in this estate expresses that.
>
> The public **testnet** is still absent, for a reason that has nothing to do with Hearth: every
> name under `*.testnet.<apex>` fails its TLS handshake because Cloudflare's Universal SSL covers a
> single label (`deploy/gateway/dynamic/tls.yml:76`). **This site publishes no testnet URL**, and
> the faucet is on that side of the line. The whole estate is one home server behind a Cloudflare
> Tunnel (`deploy/gateway/dynamic/estate-web.yml:1120`) — no failover, and the standing notice on
> every route says so.

---

## What is on it

Five routes, all public, none gated. `src/lib/routes.ts` is the declaration; `src/app.tsx` and
`nginx.conf` are checked against it by `test/routes.test.ts`.

| Path | What it is | Requests it makes |
| --- | --- | --- |
| `/` | What Hearth is, and its own status table, reproduced from `hearth/MAP.md:42-70` | **none** |
| `/chain` | The state of the chain: two scopes, every figure fetched or absent | `GET /v1/chains/:chain/:network/status`, twice |
| `/mine` | How Homefire works, the three things it is not, and how to start | none |
| `/node` | The test suites, the conformance gate, a local chain in one command | none |
| `/faucet` | Testnet EMBER at an address | `GET /v1/faucet`, `POST /v1/drips`, `GET /v1/drips/:id` |

**`/faucet` is not a route this repository invented.** `ui/packages/ui/src/surfaces.ts:365-380`
registers the `faucet` surface with `subdomain: 'network'` and `basePath: '/faucet'` — "a route on
the Network site rather than a host of its own" — so every link to the faucet from anywhere in the
estate resolves to this path on this host. Not building it would have been a defect this repository
introduced, and `nginx.conf` answers a real 404 for an unknown address, so it would have been a
visibly broken link rather than a blank page.

## What it talks to

Every route below was read out of the serving service's `src/server.ts`, one at a time, and carries
the line it was read from. Eight clients in this estate were built against a surface somebody
imagined; one made every on-chain escrow activation fail with a false diagnosis.

### `micro-indexer` — one route called, eight declined

| Method | Path | Gate | Verified at |
| --- | --- | --- | --- |
| `GET` | `/v1/chains/:chain/:network/status` | `authoriseRead` — **anonymous** | `indexer/src/server.ts:164`, handler `:426` |

The six other reads are anonymous and callable, and this surface calls none of them:

| Method | Path | At | Why not |
| --- | --- | --- | --- |
| `GET` | `/v1/addresses/:chain/:network/:address/activity` | `:165` | an address feed; this surface has no address to ask about |
| `GET` | `/v1/addresses/:chain/:network/:address/token-balances` | `:166` | a holding is an explorer question |
| `GET` | `/v1/transactions/:chain/:network/:hash` | `:167` | a record read, and the explorer owns record reads |
| `GET` | `/v1/transactions/:chain/:network/:hash/confirmations` | `:168` | a depth **verdict**, which is a decision input. Nothing here takes a decision, and rendering one would invite somebody to |
| `GET` | `/v1/tokens/:chain/:network/:address` | `:169` | token state belongs to ForgeMint and the explorer |
| `GET` | `/v1/blocks/:chain/:network/:height` | `:171` | a block page here would be a second explorer competing with a tested one |
| `POST` | `/v1/watch/:chain/:network/:address` | `:172` | `indexer:write` (`:616`) — enlarging what a shared deployment indexes is not a browser decision |
| `POST` | `/v1/backfills/:chain/:network` | `:173` | `indexer:write` (`:638`) — enqueues a range walk, which is provider calls, which is money |

`/livez`, `/readyz` and `/metrics` (`indexer/src/server.ts:382`, `:392`, `:399`) are platform probes
and are not wrapped either.

**The reads are anonymous and this client sends no bearer.** `authoriseRead`
(`indexer/src/server.ts:773-782`) returns `null` for a caller with no token and lets the handler run.
`auth: false` is load-bearing rather than an optimisation: a token that IS presented is still
verified, so an expired one would turn a page needing no session into a 401.

### `micro-faucet` — three routes called, four declined

`micro-faucet` has no module-level route table. Its routes are `define(method, path, handler)` calls
inside `buildRoutes()` (`faucet/src/server.ts:298-438`), so the citation is the `define` line, and
`test/faucet.test.ts` reads that line out of the service rather than assuming the indexer's shape.

| Method | Path | Gate | Verified at |
| --- | --- | --- | --- |
| `GET` | `/v1/faucet` | none | `faucet/src/server.ts:341` |
| `POST` | `/v1/drips` | none | `faucet/src/server.ts:375` |
| `GET` | `/v1/drips/:id` | none | `faucet/src/server.ts:411` |

| Method | Path | At | Why not |
| --- | --- | --- | --- |
| `OPTIONS` | `/v1/drips` | `:432` | the CORS preflight, issued by the browser rather than by application code. 204 for an allowlisted origin, **403** for any other (`:434`) |
| `GET` | `/metrics` | `:315` | gated on purpose — "an open /metrics here publishes the remaining budget" (`:316-317`). It takes an `x-faucet-token` or a `faucet:read` scope, and a browser bundle holds neither |
| `GET` | `/livez` | `:308` | a platform probe |
| `GET` | `/readyz` | `:310` | a platform probe; Beacon owns that question |

Two things this client may not send, both read off the service:

* **No amount.** `POST /v1/drips` reads `address` and `idempotencyKey` and nothing else
  (`faucet/src/server.ts:372-373`). `faucet/src/requests.ts:126-131` gives the reason in the frozen
  service's words: "every faucet that has ever been drained let the caller influence the amount".
* **No `Idempotency-Key` header.** The faucet's idempotency is a **body field**
  (`faucet/src/server.ts:386-388`) and there is no such header anywhere in that repository.
  `micro-trade` requires the header on every mutating route (`trade/src/server.ts:840-848`), so the
  two clients look alike and are not interchangeable.

### `micro-identity` — one route, for the shared bar and nothing else

`GET /auth/me` (`identity/src/server.ts:891-903`). **The profile is nested under `user`**, built by
`toPublicUser` (`identity/src/users.ts:52-63`). This bundle accepts only the nested shape;
`test/auth.test.ts` pins the absence of a flat fallback, because tolerating one would encode a
response identity does not send.

Nothing on this surface needs a session. The reader's handle reaches the company bar and stops
there.

## Known gaps — the two that stop this page reading the chain today

Neither is fixed from here, and neither is papered over with a literal host. Both are **asserted**
in `test/hosts.test.ts`, in the direction that makes them go red when they are fixed, so the apology
on the page is deleted rather than left to age.

### 1. The chain-index read is cross-origin and nothing supplies the headers

`cloudsforgeHosts().explorer` is `https://explorer.<apex>` and this bundle is served from
`https://network.<apex>` (`ui/packages/ui/src/surfaces.ts:192`, `:442`). Two things would have to be
true for that read to work and neither is:

* **`micro-indexer` sends no CORS headers at all.** `send()` (`indexer/src/server.ts:859-872`)
  writes `content-type`, `content-length`, `x-request-id` and `cache-control`, and there is no
  `access-control-` anywhere in that repository.
* **The gateway's allowlist does not name this surface.** The estate's CORS comes from one
  middleware on the websecure entrypoint (`deploy/compose/docker-compose.gateway.yml:90`) fed by one
  list, and `https://network.cloudsforge.online` is absent from it
  (`deploy/gateway/dynamic/policy.yml:45-60` names the apex, hub, market, mint, trade, worlds,
  explorer, admin, developers and status). `foresight` is absent too, and is also a registry product.

Either fix works: add this hostname to the allowlist, or route `/v1/chains/…` behind
`network.<apex>` as `explorer.<apex>` already fronts both a bundle and the indexer — in which case
`resolveApiBase` makes the base `''` with no edit here. Reported to micro-indexer and micro-deploy.

Until then the `/chain` panels render **"could not be fetched"** for every figure, with the reason
and both citations on screen. That is the correct behaviour, not a workaround.

### 2. The `faucet` registry row names a page, so nothing names the service

`faucet` has devPort **3003** with `basePath: '/faucet'` (`ui/packages/ui/src/surfaces.ts:373-374`),
which is this site's page URL. `micro-faucet` binds **4013** (`faucet/src/env.ts:311`,
`faucet/.env.example:19`, `faucet/Dockerfile:84`). This is the same shape of confusion the
`explorer` row was corrected for — there a field had to name a service; here it names a page and
there is no field left for the service.

Two consequences this repository handles rather than assumes away:

* The basePath is **stripped** before an API path is appended. `${hosts.faucet}/v1/faucet` is
  `/faucet/v1/faucet`, which the service does not serve. `originOf()` in `src/lib/hosts.ts` drops
  it, and `test/hosts.test.ts` pins that.
* In production the origin is this page's, so the base is `''` and the drip is relative — which is
  what the registry asserts and what the gateway therefore has to route. Under `pnpm dev` it is
  `http://localhost:3003`, which is neither this bundle (5190) nor the faucet (4013).

### 3. `micro-faucet`'s CORS example names a hostname that does not exist

`faucet/.env.example:112` suggests `FAUCET_CORS_ORIGINS=https://faucet.cloudsforge.online`. There is
no `faucet` subdomain in the registry — the faucet page is a route on `network.<apex>`, so that is
the browser origin that posts a drip. An allowlist naming a host nobody serves fails closed and
silently, which `deploy/gateway/dynamic/policy.yml:53-56` records having already fixed once for
`devportal` versus `developers`. Reported to micro-faucet; `test/faucet.test.ts` pins it.

### 4. `micro-explorer-web`'s prose is stale about its own devPort

Not this repository's to fix, and recorded because this one resolves the same registry row.
`explorer-web/src/lib/hosts.ts:23`, `explorer-web/vite.config.ts:37-39`,
`explorer-web/nginx.conf:37` and `explorer-web/test/hosts.test.ts:10` all still say the registry
gives `explorer` devPort **8080**; micro-ui corrected it to **4008**
(`ui/packages/ui/src/surfaces.ts:456`) and only that repository's assertions were updated. Its
citations to `surfaces.ts:443`, `:444` and `:446` now land on comment lines rather than on the
`devPort`, `accent` and `markId` keys they name — its `citations.test.ts` only checks a line exists,
not what it says, so the suite stays green. Reported to micro-explorer-web.

## Brand

`network` is entitled to the **full** set of eight assets (`brand/README.md:36`) and all eight exist
in `brand/assets/network/`. Four are shipped in `public/` — the three favicons and the Open Graph
card — because those are the browser chrome a hostname cannot inherit; `test/brand-chrome.test.ts`
compares the bytes in both directions.

The mark is rendered as **SVG** by `<Mark surface="network">` from the design system
(`ui/packages/ui/src/index.tsx:453`, drawing at `:330`) rather than as a PNG: it reads `--cf-accent`,
so it wears this surface's `#d6412f` molten without a second copy of the colour. Note that `Mark`
renders **nothing** for a surface it has no drawing for (`ui/packages/ui/src/index.tsx:455`),
silently — so the test checks `hasMark('network')` rather than assuming it.

Nothing here is generated. `brand/README.md` records the entitled set per surface and the assets are
copied byte-identical.

## Running it

```bash
pnpm --dir ../ui install --frozen-lockfile   # the design system is a link: dependency
pnpm install
pnpm dev                                      # http://localhost:5190
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` passes from a clone of this repository alone. The cross-repository checks — the route
citations, the token and class references, the gateway allowlist, the sibling vite ports — **skip**
when a sibling is not checked out and **say which ones they skipped**. CI checks every one of them
out and makes the absence fatal, so a green run never implies more than it measured.

### To make the registry true locally

The registry says this surface answers on **3003** and Vite binds **5190**. Nothing in this bundle
depends on the difference — the faucet is reached with a router link, not through
`cloudsforgeHosts().faucet` — but a sibling frontend resolving `cloudsforgeHosts().network` under
`pnpm dev` will look for 3003. One line fixes it:

```bash
pnpm dev --port 3003
```

`micro-site` made the same trade for the same reason and wrote it down (`site/vite.config.ts:31-42`):
a Vite port is a developer convenience and is not the port anything is served on in production.

### To exercise the chain panel

Start `micro-indexer` and let the browser reach it. Today the read is refused cross-origin (see
Known gaps 1), so the honest local arrangement is to serve both behind one origin — which is also
the arrangement production needs.

```bash
PORT=4008 pnpm --dir ../indexer dev
```

### To exercise the faucet

```bash
PORT=4013 pnpm --dir ../faucet dev
FAUCET_CORS_ORIGINS=http://localhost:5190 pnpm --dir ../faucet dev   # …and let the browser post
```

The second line is the correction to `faucet/.env.example:112` in one place: the origin that posts a
drip is wherever the Network site is served, never a `faucet.` hostname.

### The one temporary thing

`@cloudsforge/ui` is unpublished and is consumed as `link:../ui/packages/ui`. That is why the
Dockerfile takes a second build context and why `ci.yml` has local `check` and `image` jobs instead
of calling the org's reusable `web-ci.yml`. The day it is published, the specifier becomes `^1.0.0`
and everything from `check:` to the end of `image:` is deleted — the calling convention is in
`org/templates/web/_github/workflows/ci.yml`.

```bash
docker build -t network-site --build-context uipkg=../ui .
docker run --rm -p 8080:8080 network-site
```

## The rules this repository is held to

Each is a test, and each is also a `rules` job in CI so that deleting the test does not delete the
rule.

| Rule | Where |
| --- | --- |
| No build-time configuration; hosts come from `window.location` at runtime | `test/no-build-time-config.test.ts` |
| An unknown path answers **404** — `error_page 404 /index.html`, never `try_files $uri /index.html` | `test/routes.test.ts`, and probed in the running container |
| No literal CloudsForge hostname in `src` | `test/hosts.test.ts` |
| Every route called or explicitly declined, against the real service | `test/chainstatus.test.ts`, `test/faucet.test.ts` |
| Every `--cf-*` and every `cf-` class exists in the design system | `test/tokens.test.ts` |
| A digit may not appear in copy unless it is in the register | `test/content.test.ts` |
| No page claims a price, a yield, or a running network | `test/content.test.ts`, `test/render.test.ts` |
| No figure is produced from an absence | `test/chainstatus.test.ts`, `test/render.test.ts` |
| Every `path:line` in this repository names a line that exists | `test/citations.test.ts` |
| The image copies `public/` and serves the brand chrome | `Dockerfile`, probed in CI |
| No credential and no proxy in the image | `rules` job |

The mutation steps in CI are what make a pass evidence rather than a habit: one citation is bent by
a line and the suite must go red; the `auth: false` is deleted and the suite must go red; a class the
design system does not declare is injected and the token check must go red. **That canary names
`cf-not-a-real-class`, and it must keep naming something that genuinely does not exist** —
`micro-explorer-web`'s used to inject `cf-input` to prove the class check worked, and the day
`ui.css` grew `.cf-input` the canary started asserting the opposite of the truth.

---

## Provenance

The code in this repository was written by **Claude Opus 5** and **Claude Fable 5**, assets
generated with **FLUX 2 Pro**, under human direction and review.
