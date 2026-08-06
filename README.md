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
> half of that is no longer true — `deploy/cloudflared/config.mainnet.public.yml` publishes the
> mainnet JSON-RPC hostname on the public tunnel, and it answers `eth_chainId` with `0x1cf3` from
> off the estate. **A reachable chain is not a traded one**, and that is the reason now written
> down: EMBER has no market, no listing and no liquidity, so any price or capitalisation figure
> would be invented rather than merely unavailable. A block reward is a consensus constant and is
> stated as one; what a machine earns from it is a share against a difficulty that moves every
> block, and no number in this estate expresses that.
>
> **The public testnet now exists, and the hostname shape is the thing to get right.** Every name
> under `*.testnet.<apex>` fails its TLS handshake because Cloudflare's Universal SSL covers a
> single label (`deploy/gateway/dynamic/tls.yml`) — so testnet surfaces are **single-label**,
> `<surface>-testnet.<apex>`, and the two-label form is dead. Measured off the estate on
> 2026-08-05:
>
> | | |
> | --- | --- |
> | Testnet JSON-RPC | `https://rpc-testnet.cloudsforge.online` — `eth_chainId` → `0x1cf4` (7412) |
> | Testnet explorer | `https://explorer-testnet.cloudsforge.online` → `200 text/html` |
> | This site, on testnet | `https://network-testnet.cloudsforge.online` → `200 text/html` |
> | Testnet faucet API | `https://network-testnet.cloudsforge.online/v1/faucet` → `200` |
> | Testnet P2P | `wss://p2p-testnet.cloudsforge.online/p2p` — only the `/p2p` path is routed |
>
> The site apex `testnet.cloudsforge.online` keeps its name, because it is already one label.
> Mainnet is `https://rpc.cloudsforge.online`, chain id **7411** (`0x1cf3`) — a distinct id from
> testnet's 7412, deliberately, so a testnet transaction is not replayable on mainnet.
>
> The whole estate is one home server behind a Cloudflare Tunnel
> (`deploy/gateway/dynamic/estate-web.yml`) — no failover, and the standing notice on every
> route says so.

---

## What is on it

Five routes, all public, none gated. `src/lib/routes.ts` is the declaration; `src/app.tsx` and
`nginx.conf` are checked against it by `test/routes.test.ts`.

| Path | What it is | Requests it makes |
| --- | --- | --- |
| `/` | What Hearth is, and its own status table, reproduced from `hearth/MAP.md` | **none** |
| `/chain` | The state of the chain: two scopes, every figure fetched or absent | `GET /v1/chains/:chain/:network/status`, twice |
| `/mine` | How Homefire works, the three things it is not, and how to start | none |
| `/node` | The test suites, the conformance gate, a local chain in one command | none |
| `/faucet` | Testnet EMBER at an address | `GET /v1/faucet`, `POST /v1/drips`, `GET /v1/drips/:id` |

**`/faucet` is not a route this repository invented.** `ui/packages/ui/src/surfaces.ts`
registers the `faucet` surface with `subdomain: 'network'` and `basePath: '/faucet'` — "a route on
the Network site rather than a host of its own" — so every link to the faucet from anywhere in the
estate resolves to this path on this host. Not building it would have been a defect this repository
introduced, and `nginx.conf` answers a real 404 for an unknown address, so it would have been a
visibly broken link rather than a blank page.

## What it talks to

Every route below was read out of the serving service's own `server.ts`, one at a time, and names
the FILE it was read from rather than a line in it. Eight clients in this estate were built against
a surface somebody imagined; one made every on-chain escrow activation fail with a false diagnosis.

The line numbers are gone because they were the thing that kept breaking. `micro-faucet` changed
its requester hashing, every route below line 69 moved by seven, and all sixty-five citations here
went wrong in one commit while nothing in this repository had changed — and nothing runs this
suite when a service is edited, so it surfaced during a release.

### `micro-indexer` — one route called, eight declined

| Method | Path | Gate | Verified at |
| --- | --- | --- | --- |
| `GET` | `/v1/chains/:chain/:network/status` | `authoriseRead` — **anonymous** | `indexer/src/server.ts`, handler `chainStatus` |

The six other reads are anonymous and callable, and this surface calls none of them:

| Method | Path | At | Why not |
| --- | --- | --- | --- |
| `GET` | `/v1/addresses/:chain/:network/:address/activity` | `indexer/src/server.ts` | an address feed; this surface has no address to ask about |
| `GET` | `/v1/addresses/:chain/:network/:address/token-balances` | `indexer/src/server.ts` | a holding is an explorer question |
| `GET` | `/v1/transactions/:chain/:network/:hash` | `indexer/src/server.ts` | a record read, and the explorer owns record reads |
| `GET` | `/v1/transactions/:chain/:network/:hash/confirmations` | `indexer/src/server.ts` | a depth **verdict**, which is a decision input. Nothing here takes a decision, and rendering one would invite somebody to |
| `GET` | `/v1/tokens/:chain/:network/:address` | `indexer/src/server.ts` | token state belongs to ForgeMint and the explorer |
| `GET` | `/v1/blocks/:chain/:network/:height` | `indexer/src/server.ts` | a block page here would be a second explorer competing with a tested one |
| `POST` | `/v1/watch/:chain/:network/:address` | `indexer/src/server.ts` | `indexer:write` — enlarging what a shared deployment indexes is not a browser decision |
| `POST` | `/v1/backfills/:chain/:network` | `indexer/src/server.ts` | `indexer:write` — enqueues a range walk, which is provider calls, which is money |

`/livez`, `/readyz` and `/metrics` (`indexer/src/server.ts`) are platform probes
and are not wrapped either.

**The reads are anonymous and this client sends no bearer.** `authoriseRead`
(`indexer/src/server.ts`) returns `null` for a caller with no token and lets the handler run.
`auth: false` is load-bearing rather than an optimisation: a token that IS presented is still
verified, so an expired one would turn a page needing no session into a 401.

### `micro-faucet` — three routes called, four declined

`micro-faucet` has no module-level route table. Its routes are `define(method, path, handler)` calls
inside `buildRoutes()` (`faucet/src/server.ts`), so the citation is the `define` line, and
`test/faucet.test.ts` reads that line out of the service rather than assuming the indexer's shape.

| Method | Path | Gate | Verified at |
| --- | --- | --- | --- |
| `GET` | `/v1/faucet` | none | `faucet/src/server.ts` |
| `POST` | `/v1/drips` | none | `faucet/src/server.ts` |
| `GET` | `/v1/drips/:id` | none | `faucet/src/server.ts` |

| Method | Path | At | Why not |
| --- | --- | --- | --- |
| `OPTIONS` | `/v1/drips` | `faucet/src/server.ts` | the CORS preflight, issued by the browser rather than by application code. 204 for an allowlisted origin, **403** for any other |
| `GET` | `/metrics` | `faucet/src/server.ts` | gated on purpose — "an open /metrics here publishes the remaining budget". It takes an `x-faucet-token` or a `faucet:read` scope, and a browser bundle holds neither |
| `GET` | `/livez` | `faucet/src/server.ts` | a platform probe |
| `GET` | `/readyz` | `faucet/src/server.ts` | a platform probe; Beacon owns that question |

Two things this client may not send, both read off the service:

* **No amount.** `POST /v1/drips` reads `address` and `idempotencyKey` and nothing else
  (`faucet/src/server.ts`). `faucet/src/requests.ts` gives the reason in the frozen
  service's words: "every faucet that has ever been drained let the caller influence the amount".
* **No `Idempotency-Key` header.** The faucet's idempotency is a **body field**
  (`faucet/src/server.ts`) and there is no such header anywhere in that repository.
  `micro-trade` requires the header on every mutating route (`trade/src/server.ts`), so the
  two clients look alike and are not interchangeable.

### `micro-identity` — one route, for the shared bar and nothing else

`GET /auth/me` (`identity/src/server.ts`). **The profile is nested under `user`**, built by
`toPublicUser` (`identity/src/users.ts`). This bundle accepts only the nested shape;
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
`https://network.<apex>` (`ui/packages/ui/src/surfaces.ts`). Two things would have to be
true for that read to work and neither is:

* **`micro-indexer` sends no CORS headers at all.** `send()` (`indexer/src/server.ts`)
  writes `content-type`, `content-length`, `x-request-id` and `cache-control`, and there is no
  `access-control-` anywhere in that repository.
* **The gateway's allowlist does not name this surface.** The estate's CORS comes from one
  middleware on the websecure entrypoint (`deploy/compose/docker-compose.gateway.yml`) fed by one
  list, and `https://network.cloudsforge.online` is absent from it
  (`deploy/gateway/dynamic/policy.yml` names the apex, hub, market, mint, trade, worlds,
  explorer, admin, developers and status). `foresight` is absent too, and is also a registry product.

Either fix works: add this hostname to the allowlist, or route `/v1/chains/…` behind
`network.<apex>` as `explorer.<apex>` already fronts both a bundle and the indexer — in which case
`resolveApiBase` makes the base `''` with no edit here. Reported to micro-indexer and micro-deploy.

Until then the `/chain` panels render **"could not be fetched"** for every figure, with the reason
and both citations on screen. That is the correct behaviour, not a workaround.

### 2. The `faucet` registry row names a page, so nothing names the service

`faucet` has devPort **3003** with `basePath: '/faucet'` (`ui/packages/ui/src/surfaces.ts`),
which is this site's page URL. `micro-faucet` binds **4013** (`faucet/src/env.ts`,
`faucet/.env.example`, `faucet/Dockerfile`). This is the same shape of confusion the
`explorer` row was corrected for — there a field had to name a service; here it names a page and
there is no field left for the service.

Two consequences this repository handles rather than assumes away:

* The basePath is **stripped** before an API path is appended. `${hosts.faucet}/v1/faucet` is
  `/faucet/v1/faucet`, which the service does not serve. `originOf()` in `src/lib/hosts.ts` drops
  it, and `test/hosts.test.ts` pins that.
* In production the origin is this page's, so the base is `''` and the drip is relative — which is
  what the registry asserts and what the gateway therefore has to route. Under `pnpm dev` it is
  `http://localhost:3003`, which is neither this bundle (5190) nor the faucet (4013).

### 3. The `/faucet` page is served on the **mainnet** apex, where no faucet exists

Measured 2026-08-05:

```
https://network.cloudsforge.online/faucet            -> 200 text/html   (this page)
https://network.cloudsforge.online/v1/faucet         -> 404             (no service)
https://network-testnet.cloudsforge.online/v1/faucet -> 200             (the service)
```

`micro-faucet` is testnet-only in code — its `NETWORK` is an `as const`, not configuration, so
`NETWORK === 'mainnet'` is a type error rather than a branch a deploy can reach. The estate
therefore gates the `cf-api-network` router on `CF_EMBER_NETWORK`, and a mainnet estate answers
`404` — "there is no such service", which is true — instead of the `502` it used to answer.

What is left is this page. On a mainnet estate it renders the drip form **disabled**, saying the
faucet did not answer, which a reader cannot tell apart from the faucet being down. The honest page
says there is no mainnet faucet and links to the testnet one. This is ours to fix, and it is the
open item `micro-faucet`'s README hands to this repository by name.

### 4. `micro-faucet`'s CORS example names a hostname that does not exist

`faucet/.env.example` suggests `FAUCET_CORS_ORIGINS=https://faucet.cloudsforge.online`. There is
no `faucet` subdomain in the registry — the faucet page is a route on `network.<apex>`, so that is
the browser origin that posts a drip. An allowlist naming a host nobody serves fails closed and
silently, which `deploy/gateway/dynamic/policy.yml` records having already fixed once for
`devportal` versus `developers`. Reported to micro-faucet; `test/faucet.test.ts` pins it.

### 5. `micro-explorer-web`'s prose is stale about its own devPort

Not this repository's to fix, and recorded because this one resolves the same registry row.
`explorer-web/src/lib/hosts.ts`, `explorer-web/vite.config.ts`,
`explorer-web/nginx.conf` and `explorer-web/test/hosts.test.ts` all still say the registry
gives `explorer` devPort **8080**; micro-ui corrected it to **4008**
(`ui/packages/ui/src/surfaces.ts`) and only that repository's assertions were updated. Its
citations to `surfaces.ts` now land on comment lines rather than on the
`devPort`, `accent` and `markId` keys they name — its `citations.test.ts` only checks a line exists,
not what it says, so the suite stays green. Reported to micro-explorer-web.

## Brand

`network` is entitled to the **full** set of eight assets (`brand/README.md`) and all eight exist
in `brand/assets/network/`. Four are shipped in `public/` — the three favicons and the Open Graph
card — because those are the browser chrome a hostname cannot inherit; `test/brand-chrome.test.ts`
compares the bytes in both directions.

The mark is rendered as **SVG** by `<Mark surface="network">` from the design system
(`ui/packages/ui/src/index.tsx`) rather than as a PNG: it reads `--cf-accent`,
so it wears this surface's `#d6412f` molten without a second copy of the colour. Note that `Mark`
renders **nothing** for a surface it has no drawing for (`ui/packages/ui/src/index.tsx`),
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

`micro-site` made the same trade for the same reason and wrote it down (`site/vite.config.ts`):
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

The second line is the correction to `faucet/.env.example` in one place: the origin that posts a
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
