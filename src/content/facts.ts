/**
 * Every number this site is allowed to print, and where each one comes from.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WHY A PAGE ABOUT A CHAIN NEEDS A REGISTER OF NUMBERS
 *
 * `docs/ecosystem/01-product-vision.md:126` is principle 5, "Honest copy", and this is the surface
 * most able to break it. A fabricated figure here — a hashrate, a block height, a yield, a supply —
 * is not a placeholder somebody tidies up before launch. It is a false statement about a currency,
 * published under the company's own name, and it stays true-looking long after the person who typed
 * it has forgotten they guessed.
 *
 * `micro-site` solved this first and this file is its mechanism, adopted rather than reinvented
 * (`site/src/content/claims.ts`). The rule:
 *
 *   **A digit may not appear in this site's copy unless it appears below.**
 *
 * `test/content.test.ts` walks every string exported from `src/content`, strips the `path:line`
 * citations (which are rendered, and whose digits are line numbers rather than claims), extracts
 * every remaining run of digits, and fails on any token that is not the `rendered` form of an entry
 * here. Adding a number to a sentence therefore means adding it here, and adding it here means
 * writing down where it came from — which is the step that makes somebody check.
 *
 * ── WHAT IS DELIBERATELY NOT HERE ─────────────────────────────────────────────────────────────
 *
 * **No price, and no market capitalisation.** THE PREMISE THIS USED TO REST ON HAS CHANGED AND THE
 * CONCLUSION HAS NOT. It read "there is no mainnet and no public testnet, so EMBER is not traded
 * anywhere" — and mainnet is now published and answering
 * (`deploy/cloudflared/config.mainnet.public.yml:123`). A true statement resting on a false premise
 * is one edit away from being deleted along with it, so the real reason is written down instead:
 * **EMBER has no market, no listing and no liquidity.** Nothing quotes it, nothing settles it, and
 * a reachable chain is not a traded one. Any price or capitalisation figure here would be invented
 * rather than merely unavailable. `micro-faucet` says the same thing in the string it serves to
 * this page — "Testnet EMBER. It has no value, it is not tradeable" (`faucet/src/server.ts:358-360`).
 *
 * The public testnet is a separate matter and is still absent: every name under
 * `*.testnet.<apex>` fails its TLS handshake because Cloudflare's Universal SSL covers a single
 * label (`deploy/gateway/dynamic/tls.yml:76`), so nothing outside the estate can reach it.
 *
 * **No hashrate, no difficulty, no block height, no supply.** Those are facts about a running
 * network, and they belong to the chain index at runtime or nowhere. The `/chain` page fetches
 * them; when it cannot, it says it could not — see `Figure` in `src/lib/chainstatus.ts`, which has
 * no branch from an absence to a digit. **A figure about the network must never be in this file.**
 * `test/content.test.ts` asserts that no entry's `meaning` describes a runtime measurement.
 *
 * **No yield.** A block reward is a consensus constant and appears below; what a machine EARNS is a
 * share of it against a difficulty that moves every block, and no number in this estate expresses
 * that. `NOT_AN_INCOME` in `src/lib/format.ts` is the sentence that says so.
 *
 * ── WHAT A SOURCE IS ──────────────────────────────────────────────────────────────────────────
 *
 * `source` is a path into `cloudsforge-online/hearth` or into this estate, with a line number where
 * the value is a constant. `test/citations.test.ts` checks that every one names a line that exists
 * in the checked-out repository, and CI checks Hearth out for exactly that reason: Hearth is the one
 * PUBLIC repository this surface is about, so a reader can follow every citation here.
 *
 * Where Hearth's own documents disagree with each other, `hearth/MAP.md:1-7` settles it: "Where this
 * contradicts `README.md`, `WHITEPAPER.md`, `TESTNET.md` or anything in `docs/`, believe this file
 * and the line it cites." Several entries below therefore cite MAP.md rather than the README, and
 * two of them record a disagreement rather than resolving one.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */

/** One published number, with its provenance. */
export interface Fact {
  /** Exactly how the number appears in copy. This is what the content scan matches against. */
  readonly rendered: string
  /** What it means, for a reader of this file rather than of the site. */
  readonly meaning: string
  /** Where the value comes from: a path, with a line where there is one. */
  readonly source: string
}

export const FACTS = {
  /* ── chain identity ───────────────────────────────────────────────────────────────────── */

  chainIdMainnet: {
    rendered: '7411',
    meaning:
      'EIP-155 chain id of Hearth mainnet. No longer merely allocated: the endpoint published at deploy/cloudflared/config.mainnet.public.yml:123 answers eth_chainId with 0x1cf3, which is this value. The chain being reachable says nothing about it being established, and nothing else in this register may borrow that fact.',
    source: 'contracts/packages/chain/src/index.ts:58 — CHAINS.EMBER.chainId.mainnet',
  },
  chainIdTestnet: {
    rendered: '7412',
    meaning:
      'EIP-155 chain id of the testnet. It is what the three-node compose stack runs and what the faucet dispenses on, and it is not reachable from outside: every name under the testnet apex fails its TLS handshake, because the wildcard in front of them covers a single label (deploy/gateway/dynamic/tls.yml:76).',
    source: 'contracts/packages/chain/src/index.ts:58 — CHAINS.EMBER.chainId.testnet',
  },
  blockSeconds: {
    rendered: '15',
    meaning:
      'TARGET block time, in seconds. The number the LWMA retarget aims at, and never a rate anything here has observed. Mainnet is reachable now, which makes an observed spacing a thing somebody could measure and write down — it must not be written down here, because a measurement is a runtime figure and belongs to the chain index.',
    source: 'hearth/README.md:77 — "Block time: 15 seconds"',
  },
  decimals: {
    rendered: '18',
    meaning:
      "EMBER's smallest-unit exponent under the account model. Every wei figure this site renders is divided by this and by nothing else.",
    source: 'contracts/packages/chain/src/index.ts:53 — CHAINS.EMBER.decimals',
  },
  sparksPerEmber: {
    rendered: '100000000',
    meaning:
      'The RETIRED UTXO ledger\'s unit, 1e8, still defined in the node. Recorded because it disagrees with the 18 above and Hearth says so itself rather than hiding it.',
    source: 'hearth/node/src/params.js:6 — SPARKS_PER_EMBER',
  },

  /* ── crediting depth, which is this platform's number rather than Hearth's ──────────────── */

  emberConfirmations: {
    rendered: '60',
    meaning:
      'Blocks an EMBER deposit waits before CloudsForge will credit it. A platform decision, not a consensus rule — the chain has no finality gadget and depth is the only defence available.',
    source: 'contracts/packages/chain/src/index.ts:56 — CHAINS.EMBER.confirmations',
  },
  emberConfirmationMinutes: {
    rendered: '15',
    meaning:
      'The same depth said as a wait: 60 blocks at the 15-second TARGET. "60 blocks" tells a reader nothing. It is a nominal figure, and the real wait is whatever the chain is producing at, which on a young network is longer.',
    source: 'contracts/packages/chain/src/index.ts:44-46 — the comment above CHAINS',
  },
  emberReorgAlarmDepth: {
    rendered: '5',
    meaning:
      'A reorg this deep halts crediting and pages an operator. Deliberately below the credit depth: a shallower reorg cannot have produced a wrong credit.',
    source: 'contracts/packages/chain/src/index.ts:57 — CHAINS.EMBER.reorgAlarmDepth',
  },

  /* ── emission. Consensus constants, and not an income ───────────────────────────────────── */

  genesisReward: {
    rendered: '6',
    meaning: 'EMBER paid to the miner of the first block. The schedule is a deterministic integer table.',
    source: 'hearth/README.md:78 — the emission line, produced by hearth/node/src/params.js:140-151',
  },
  halfLifeYears: {
    rendered: '2',
    meaning: 'Years between halvings of the block reward.',
    source: 'hearth/README.md:78',
  },
  tailReward: {
    rendered: '0.3',
    meaning:
      'EMBER per block, for ever, once the schedule reaches the floor. It exists so security never depends on a fee market.',
    source: 'hearth/README.md:78',
  },
  commonsShare: {
    rendered: '10',
    meaning:
      'Per cent of every block reward paid to the on-chain Commons treasury instead of to the miner.',
    source: 'hearth/README.md:78',
  },

  /* ── the proof of work, including the number that is a known gap ────────────────────────── */

  scratchKib: {
    rendered: '64',
    meaning:
      'KiB of scratchpad each proof-of-work evaluation fills. Every block ever produced used this size.',
    source: 'hearth/TESTNET.md:96 — POW_SCRATCH_KIB, "the value mainnet will launch with too"',
  },
  maxScratchKib: {
    rendered: '4096',
    meaning: 'KiB. The node refuses to start above this, so the pad cannot be raised by configuration.',
    source: 'hearth/TESTNET.md:98 — POW_MAX_SCRATCH_KIB',
  },
  bigPadSeconds: {
    rendered: '185.7',
    meaning:
      'Seconds per evaluation measured for the 2 GiB pad the documents used to promise. A validator pays one evaluation per block received, against a 15-second block time — which is why the pad is 64 KiB and why raising it is a redesign rather than a constant.',
    source: 'hearth/TESTNET.md:98-100, and hearth/README.md:42',
  },
  walkSteps: {
    rendered: '256',
    meaning: 'Steps of the pseudo-random walk that reads and rewrites the pad.',
    source: 'hearth/TESTNET.md:101 — POW_WALK_STEPS',
  },
  hashesPerThread: {
    rendered: '225',
    meaning:
      'Hashes per second per thread, measured for the browser miner at the shipped parameters. About 1.37x the node\'s own native-crypto implementation, because per-call overhead dominates.',
    source: 'hearth/docs/mining.md:124-126',
  },

  /* ── evidence. These are test counts, which are facts about the repository ──────────────── */

  vmTests: {
    rendered: '609',
    meaning: "Ethereum VMTests the EVM passes, out of 609. Hearth's EVM is written from scratch.",
    source: 'hearth/MAP.md:52 — the status table',
  },
  stateTests: {
    rendered: '20077',
    meaning: 'Ethereum GeneralStateTests the state transition passes, out of 20,077.',
    source: 'hearth/MAP.md:55',
  },
  swapGas: {
    rendered: '112456',
    meaning:
      'Gas for a real Uniswap V2 swap executed on Hearth\'s own EVM, against about 150,000 on Ethereum mainnet.',
    source: 'hearth/MAP.md:72 — node/test/dex.js, 167/167',
  },
  suites: {
    rendered: '27',
    meaning: 'Test suites `npm test` runs from a clean clone, with no install, no corpus and no network.',
    source: 'hearth/README.md:149',
  },

  /* ── the ports a reader will type ───────────────────────────────────────────────────────── */

  evmRpcPort: {
    rendered: '8545',
    meaning: 'Where a local node serves the `eth_*` JSON-RPC surface.',
    source: 'hearth/MAP.md:56 — mounted by node/src/evmnode.js',
  },
  seedRpcPort: {
    rendered: '8645',
    meaning: 'Host port of the seed node in the compose stacks. Node RPC inside every container.',
    source: 'hearth/docs/network.md:25',
  },
  probePort: {
    rendered: '8745',
    meaning:
      'The port the developer kit\'s RPC probe is started on in the walkthrough. A suggestion in a command line rather than a default in the code, and it is quoted because a reader will type it.',
    source: 'hearth/README.md:203 — `node tools/rpc-probe/stub.js --port 8745`',
  },
  httpNotFound: {
    rendered: '404',
    meaning:
      'The status an address this site does not serve answers with. A fact about THIS repository rather than about Hearth: the shell is served through error_page, so the status survives.',
    source: 'nginx.conf:1',
  },
  nodes: {
    rendered: '3',
    meaning: 'Node containers `docker-compose.testnet.yml` starts: one seed and two miners.',
    source: 'hearth/TESTNET.md:140-144',
  },
} as const satisfies Record<string, Fact>

export type FactKey = keyof typeof FACTS

/**
 * The rendered form of a fact, for use in copy.
 *
 * A template literal is what makes the value and the register impossible to separate: writing the
 * digits into a sentence would pass typechecking and fail `test/content.test.ts`, which is the point.
 */
export function fact(key: FactKey): string {
  return FACTS[key].rendered
}

/**
 * A grouped rendering, for the four figures that are large enough to be unreadable ungrouped.
 *
 * The register holds the BARE digits so the content scan has one spelling to match; the grouping is
 * applied here rather than stored, so `20077` and `20,077` cannot drift apart.
 */
export function grouped(key: FactKey): string {
  return Number(FACTS[key].rendered).toLocaleString('en-GB')
}
