/**
 * The words on this site, as data.
 *
 * Copy lives here rather than inside components for the reason `micro-site` gives
 * (`site/src/content/pages.ts`): a string inside JSX cannot be walked by a test, and the two
 * rules this surface is held to are both rules about strings.
 *
 *   1. **A digit may not appear here unless it is in the register** (`./facts.ts`). Enforced by
 *      `test/content.test.ts`.
 *   2. **No sentence may claim finality, a yield, a price, or a network that is running.** Enforced
 *      by `test/content.test.ts` and again by the `rules` job in CI, so deleting the test does not
 *      delete the rule.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * THE ONE THING THIS SURFACE MUST NOT GET WRONG
 *
 * THIS BLOCK USED TO SAY THERE WAS NO NETWORK AT ALL. HALF OF THAT IS NOW FALSE, AND ONLY HALF.
 *
 * Mainnet is reachable. `deploy/cloudflared/config.mainnet.public.yml` publishes
 * `rpc.<apex>` on the public tunnel, and a POST to it from off the estate answers `eth_chainId`
 * with `0x1cf3` — 7411, the id this file already carried as merely allocated. Blocks advance
 * between reads. So the old headline, "there is no public Hearth network yet", is a false
 * statement about a currency and had to go.
 *
 * EVERYTHING ELSE THE OLD WORDING PROTECTED AGAINST IS STILL TRUE, AND IS WORDED MORE CAREFULLY
 * BECAUSE IT NOW HAS TO SURVIVE NEXT TO GOOD NEWS:
 *
 *   * **EMBER has no monetary value.** No market, no listing, no liquidity, no price. A chain
 *     being reachable is not a chain being traded, and this site may never blur the two.
 *   * **The chain is new and short.** "Live" here means reachable, not established. Nothing on
 *     this surface may state a height, an age or a block time it OBSERVED — the /chain page
 *     fetches those or renders their absence.
 *   * **The testnet IS publicly reachable, as of 2026-08-05, and this bullet used to say the
 *     opposite.** It read: "Everything under `*.testnet.<apex>` fails its TLS handshake:
 *     Cloudflare's Universal SSL is one label deep (`deploy/gateway/dynamic/tls.yml`), so a
 *     two-label name has no certificate to present. The faucet is on that side of the line. No
 *     testnet URL may be published here." The TLS diagnosis was correct about a scheme that was
 *     then ABANDONED: an environment is now a suffix inside the FIRST label
 *     (`<surface>-testnet.<apex>`, `ui/packages/ui/src/surfaces.ts`), so every testnet
 *     name is one label deep and the existing certificate covers it.
 *
 *     **So testnet URLs may now be published here, and the faucet is one of them** — it is the
 *     whole reason this reversal matters, because the faucet is a testnet-only service and the
 *     old rule made it unlinkable. What replaces the prohibition is a NARROWER one that survives
 *     the good news: **a testnet URL must never be published without the word testnet next to
 *     it.** Free coin and mined coin must not be made to look alike.
 *   * **The whole estate is one home server behind a Cloudflare Tunnel**
 *     (`deploy/gateway/dynamic/estate-web.yml`). No second machine, no failover.
 *
 * So this site may not print a price, may not imply a mining income, and may not imply that a
 * reachable endpoint is an established network. What it CAN do is send somebody to a repository
 * where every claim is checkable, and be the first page in the estate that says plainly what state
 * the chain is in — `hearth/README.md` puts that section above everything else and calls it
 * "Status, before anything else". This one does the same.
 *
 * A note on where the wording comes from: where Hearth already has a sentence for something, this
 * file uses Hearth's, not a paraphrase. A paraphrase of a caveat is how a caveat gets softer.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */
import { fact, grouped } from './facts.ts'

/* ══════════════════════════════ shared ══════════════════════════════ */

/**
 * The one paragraph every page could be reduced to.
 *
 * Rendered in the shell above the navigation on every route, not only on the home page, because a
 * reader arriving on `/mine` from a search result has not read the home page and would otherwise
 * spend their whole visit believing there is a network to mine on.
 */
export const STANDING_STATE = {
  headline: 'Hearth is a new network. Please read this before you rely on it.',
  body:
    'EMBER cannot be bought or sold. There is no market for it, no listing and no price, so ' +
    'nothing you mine here is money yet. The chain itself is only weeks old and runs from a ' +
    'single site, which means a deep reorganisation is a real possibility rather than a ' +
    'theoretical one and an outage has nothing to fail over to. The test network is a separate ' +
    `chain — id ${fact('chainIdTestnet')} rather than ${fact('chainIdMainnet')} — and the EMBER ` +
    'the faucet gives away on it is worthless by design.',
}

/* ══════════════════════════════ home ══════════════════════════════ */

export const HOME = {
  eyebrow: 'Forge Network',
  title: 'A coin you can mine on the computer you already own',
  /**
   * The search-result and link-preview description. Separate from the standfirst on purpose: a
   * standfirst is read under a headline that is already on screen, a description is read with no
   * headline and inside a length budget.
   */
  blurb:
    'Mine EMBER with an ordinary processor, on a chain that runs Ethereum contracts and answers Ethereum wallets. New, unproven, and not yet worth money.',
  standfirst:
    'Hearth is designed so that the computer you are reading this on is the whole rig — no ' +
    'specialist hardware, nothing to buy. Its coin is EMBER. Underneath, it runs Ethereum ' +
    'contracts and answers Ethereum wallets, so the tools you already know work here without ' +
    'being told this chain is new.',

  what: {
    title: 'What it is',
    items: [
      {
        title: 'Mining a laptop can win at',
        body:
          'Most coins are mined by machines built for nothing else, which prices an ordinary ' +
          'computer out on the first day. Hearth is deliberately built the other way round: ' +
          'every attempt has to shuffle a block of memory, and memory is the one thing ' +
          'specialised hardware cannot make much faster. A warehouse of it earns little more ' +
          'per pound than your laptop does.',
      },
      {
        title: 'Your Ethereum tools work here',
        body:
          'Addresses, signatures, gas and the interface a wallet talks to are all the ones ' +
          'Ethereum uses, so MetaMask, ethers, viem, Hardhat and Foundry connect without ' +
          'changes and a contract you already wrote deploys unaltered. The engine underneath ' +
          'was written here rather than borrowed, and it pulls in no third-party code to run.',
      },
      {
        title: 'Nobody was handed a head start',
        body:
          'The first block created no spendable coins for anyone, founders included, so there ' +
          `is no pre-mined pile waiting to be sold into the first buyers. ${fact('commonsShare')} per cent of ` +
          'every reward goes to a shared treasury held on the chain instead of to the miner, ' +
          'and the starting balances are published so you can check that claim yourself in ' +
          'under a minute.',
      },
      {
        title: 'The reward never falls to nothing',
        body:
          `Each block pays ${fact('genesisReward')} EMBER to begin with. That halves every ` +
          `${fact('halfLifeYears')} years and then levels off at ${fact('tailReward')} EMBER a ` +
          'block for good, rather than running down to zero. It means the people keeping the ' +
          'chain honest are always paid something, instead of the chain having to hope ' +
          'transaction fees alone will cover it.',
      },
    ],
  },

  /**
   * The coin, as identity rather than as an asset.
   *
   * Every line here is a constant somebody will need in order to configure a wallet or a node —
   * which is the only reason to publish them — and the last one records a DISAGREEMENT rather than
   * resolving it. `hearth/README.md` states it about itself: the account model specifies 18
   * decimals and the node still defines the retired ledger's 1e8. Picking a side on a marketing
   * page would be inventing a decision the project has not taken.
   */
  coin: {
    title: 'The coin',
    lede:
      'What you would type into a wallet. These are the values the code carries, and the mainnet ' +
      'id below is the one a public endpoint answers with.',
    rows: [
      { field: 'Network and coin', value: 'Hearth, and EMBER' },
      {
        field: 'Chain id',
        // This row said the testnet "has no reachable endpoint" and contradicted the status table
        // three sections below, which records it as published and answering alongside the faucet.
        // The prohibition on unlabelled testnet URLs still holds — hence the word testnet here.
        value: `${fact('chainIdMainnet')} for mainnet and ${fact('chainIdTestnet')} for the testnet. Both are published and both answer`,
      },
      {
        field: 'Block time',
        value:
          `A ${fact('blockSeconds')}-second TARGET, retargeted every block. It is what the ` +
          'difficulty algorithm aims at, not a rate this page has measured — what the chain is ' +
          'actually doing is a runtime figure and belongs on the chain page.',
      },
      {
        field: 'Smallest unit',
        value:
          `${fact('decimals')} decimals under the account model — and the node still defines ` +
          `${fact('sparksPerEmber')} smaller units to one EMBER, which is the retired ledger's. ` +
          'The project records the disagreement rather than hiding it, and so does this page.',
      },
      {
        field: 'Supply',
        value:
          'Uncapped and disinflationary. No hard cap and no fee burn: gas is paid to the miner in ' +
          'the first version.',
      },
      {
        field: 'Credited by CloudsForge after',
        value:
          `${fact('emberConfirmations')} blocks — about ${fact('emberConfirmationMinutes')} minutes ` +
          'at the target block time, and longer whenever the chain is producing slower than that — ' +
          `and a reorg ${fact('emberReorgAlarmDepth')} deep halts crediting entirely. That is this ` +
          "platform's decision about depth, not a rule of the chain.",
      },
    ],
  },

  /**
   * The status table.
   *
   * Reproduced from `hearth/MAP.md`, which is the project's own single status table and which
   * says at `hearth/MAP.md`: "Do not read a status from anywhere else in this repository
   * without checking it here first." This page follows that instruction rather than assembling a
   * more flattering list from the README.
   */
  state: {
    title: 'How far along each part is',
    lede:
      'The engine, the consensus rules and the tooling are finished and tested against ' +
      "Ethereum's own published vectors. The parts still marked in progress are marked that way " +
      'because working is not the same as proven, and you should know which is which before you ' +
      'build on any of it.',
    rows: [
      {
        thing: 'The EVM: interpreter, gas, opcodes, precompiles',
        state: 'built' as const,
        detail: `Merged, and ${grouped('vmTests')} of ${grouped('vmTests')} Ethereum VMTests pass.`,
      },
      {
        thing: 'The state transition',
        state: 'built' as const,
        detail: `Merged, and ${grouped('stateTests')} of ${grouped('stateTests')} GeneralStateTests pass.`,
      },
      {
        thing: 'A real contract stack running on it',
        state: 'built' as const,
        detail: `Uniswap V2 deploys, adds liquidity and swaps on Hearth's own EVM, at ${grouped('swapGas')} gas.`,
      },
      {
        thing: 'Consensus on the account model',
        state: 'built' as const,
        detail: `Blocks are produced, validated and reorged. ${fact('nodes')} nodes run under docker compose on chain id ${fact('chainIdTestnet')}.`,
      },
      {
        thing: 'A public mainnet endpoint',
        state: 'open' as const,
        detail:
          `Published and answering: a JSON-RPC endpoint on the public tunnel returns chain id ` +
          `${fact('chainIdMainnet')} and its height advances between reads. Marked open rather ` +
          'than built because reachable is not established — it is served from one home server ' +
          'with no failover, it has no independent peer, and nothing has audited it.',
      },
      {
        thing: 'A public testnet endpoint',
        state: 'open' as const,
        detail:
          `Published and answering on chain id ${fact('chainIdTestnet')}, alongside the faucet ` +
          'that funds it. In progress rather than finished because a test network is disposable ' +
          'by definition: its EMBER is given away and worth nothing, and nothing here promises ' +
          'that its history outlives the machine it sits on.',
      },
      {
        thing: 'Any deployed contract',
        state: 'absent' as const,
        detail:
          'Nothing is deployed on either chain yet. Contracts you compile for Ethereum will ' +
          'deploy here unaltered; none has been put up as a fixture for you to call.',
      },
      {
        thing: 'The proof of work at the size the documents promised',
        state: 'open' as const,
        detail:
          `Every block ever produced used a ${fact('scratchKib')} KiB pad, and the node refuses to ` +
          `start above ${fact('maxScratchKib')} KiB. A 2 GiB pad was measured at ` +
          `${fact('bigPadSeconds')} seconds per evaluation, and a validator pays one per block ` +
          'received. Closing that is a redesign, not a constant.',
      },
      {
        thing: 'Non-outsourceable mining',
        state: 'open' as const,
        detail:
          'Not achieved. A pool can still hand out work under its own key and sign the blocks ' +
          'itself, and nothing in consensus notices, so mining here is not yet impossible to ' +
          'centralise.',
      },
    ],
  },

  where: {
    title: 'Where to go next',
    lede: 'Everything below is a thing you can actually run today, on your own machine.',
  },
}

/* ══════════════════════════════ the chain ══════════════════════════════ */

export const CHAIN = {
  title: 'The state of the chain',
  blurb:
    'What the CloudsForge chain index has observed of Hearth. Every figure is fetched when you load the page, or it is absent and says so.',
  standfirst:
    'These figures come from the chain index at the moment you loaded this page. None of them is ' +
    'stored in this site, and there is no default: a number that could not be fetched is rendered ' +
    'as the reason it could not be fetched, never as a nought.',

  /**
   * The sentence under the panel, explaining the two heights.
   *
   * This is the same distinction `micro-explorer-web` is built around and it is restated here
   * because a reader of THIS page has probably not read that one.
   */
  heads: {
    title: 'Two heights, and the gap between them',
    body:
      'The walked head is the highest block the chain index has read and would have detected a ' +
      'reorg in. The claimed tip is what a node last told it. They are different facts, and the ' +
      'index reports both rather than picking one — counting depth against a block nobody has ' +
      'looked at over-reports it, and over-reporting depth credits money early.',
  },

  /**
   * What a null means. This is the most important paragraph on the page.
   *
   * `indexer/src/reads.ts` returns `checkpoint?.tipHeight ?? null`, so a deployment that has
   * never followed this chain answers 200 with nulls rather than failing. That is an answer, and it
   * is a different answer from "we could not ask".
   */
  absence: {
    title: 'What an absent figure means here',
    body:
      'The chain index answers with a null rather than a zero when it has never observed a height, ' +
      'and this page keeps that distinction rather than flattening it. "Not observed" means the ' +
      'index answered and had nothing to report. "Could not fetch" means the request did not ' +
      'arrive. Those are not the same, and only one of them is about Hearth.',
  },

  /**
   * Why the fetch is expected to fail today.
   *
   * Written as a note under the panel rather than as the panel's own copy, because it is a fact
   * about this estate's plumbing and not about Hearth — and because the day it stops being true,
   * `test/hosts.test.ts` goes red and this paragraph gets deleted rather than quietly ageing.
   */
  /*
   * THIS USED TO BE AN APOLOGY, AND THE APOLOGY IS NO LONGER TRUE.
   *
   * It read "Why this request is refused today" and named two blockers: micro-indexer sent no
   * cross-origin headers of its own, and this hostname was absent from the gateway's one CORS
   * allowlist. Both were reported and both have since been fixed —
   * `indexer/src/server.ts` sets `access-control-allow-origin` and
   * `deploy/gateway/dynamic/policy.yml` names `https://network.cloudsforge.online`. The two
   * assertions in `test/hosts.test.ts` that required those absences went red on a repository
   * nobody had touched, which is precisely what they were written to do.
   *
   * WHAT REPLACES IT SAYS LESS, ON PURPOSE, AND THAT DECISION HAS NOW PAID FOR ITSELF TWICE.
   *
   * When this was written the estate served no frontend behind the gateway, so the read had never
   * been made from a browser and naming a new cause would have swapped one unverifiable
   * explanation for another. What it says instead is what is true of EVERY failure — which
   * figures are missing, and the request id that finds the attempt.
   *
   * The estate does serve the bundles now, and this panel was then observed rendering exactly
   * this copy against a live chain — because a THIRD cause nobody had named was in play:
   * `explorer.<apex>` had a gateway router for the bundle and none for the chain index, so the
   * request was answered by explorer-web's own nginx. Had this paragraph guessed at a cause, it
   * would have blamed CORS and been wrong, and the panel would have taught a reader to stop
   * looking. It named the missing figures instead, and the request id led to the router.
   *
   * That router now exists (`deploy/gateway/dynamic/estate-web.yml`, `cf-api-explorer`), and this
   * panel has been driven in Chromium against the real gateway with certificate verification on:
   * `ember:testnet` renders a walked head, a claimed tip, chain id 7,412 and a healthy provider,
   * while `ember:mainnet` renders "not observed" for every figure a node has never supplied. Both
   * outcomes are this copy working, which is the point.
   */
  unreachable: {
    title: 'No figures for this scope',
    body:
      'The chain index did not answer, so this panel is showing which figures are missing rather ' +
      'than filling them in. Quote the request id below and the exact attempt can be found across ' +
      'every service at once.',
  },

  explorer: {
    title: 'Looking up a block, a transaction or an address',
    body:
      'That is the block explorer, which is a separate surface and reads the same index record by ' +
      'record. This page deliberately does not reimplement it.',
  },
}

/* ══════════════════════════════ mining ══════════════════════════════ */

export const MINE = {
  title: 'Mining',
  blurb:
    'How Homefire works, what it does and does not guarantee, and how to start. Mining pays a block reward, not an income.',
  standfirst:
    'Homefire is the proof of work Hearth runs. It is designed so that an ordinary processor sits ' +
    'close to the best machine for the job, and so that work handed to you under your own key ' +
    'cannot be taken from you. It is not designed to make anybody money, and this page will not ' +
    'suggest otherwise.',

  how: {
    title: 'What the chain does today',
    lede: 'Everything in this section is implemented and covered by the test suite.',
    items: [
      {
        title: 'Memory-hard, so hardware buys less',
        body:
          `Each attempt derives a seed from the header and the coinbase public key, fills a ` +
          `${fact('scratchKib')} KiB scratchpad by chaining SHA-256, walks it in ` +
          `${fact('walkSteps')} steps that read and rewrite it, and hashes the result against the ` +
          'target. That is thousands of sequential rounds with a data dependency at every step, so ' +
          'memory latency is the limit and a general-purpose CPU is close to optimal.',
      },
      {
        title: 'A winning proof cannot be redirected',
        body:
          'A valid block must be signed by the private key its coinbase pays, so a candidate built ' +
          'for your public key is worth nothing to anybody else. That is a real guarantee about the ' +
          'work you are handed, and it is exactly as much as consensus promises.',
      },
      {
        title: 'Low variance, so far',
        body:
          `A ${fact('blockSeconds')}-second TARGET block time means frequent wins even for a ` +
          'small miner, and the difficulty retargets every block rather than in steps, so it ' +
          'moves smoothly instead of swinging. That is the design; what a young chain with very ' +
          'little hashrate on it actually does is a runtime figure, not this one.',
      },
      {
        title: 'Polite by default, in the browser miner',
        body:
          'The effort slider is a real duty cycle — workers sleep proportionally between batches ' +
          'rather than pinning a core — a hidden tab drops to a trickle, and an unplugged laptop ' +
          'stops entirely where the browser will say so. Two of the three major browsers do not ' +
          'report power state, and the page says which it got rather than promising the feature ' +
          'everywhere.',
      },
    ],
  },

  /**
   * The caveats, given their own section and placed ABOVE "how to start".
   *
   * `hearth/docs/mining.md` is a warning the project wrote about itself: the page "previously
   * mixed" what is shipped with what is designed, "and the mixing is what produced the claim that
   * Homefire is non-outsourceable". Repeating that mixing on a marketing surface would be worse
   * than making it in a technical document, so the caveats come first.
   *
   * ── THE TITLE NO LONGER COUNTS THE ITEMS, AND THAT IS DELIBERATE ─────────────────────────────
   *
   * It read "Three things this is not". Two reasons it does not any more, and the second is the
   * one that matters. First, a spelled-out numeral is the one quantity on this page that the
   * digit scan in `test/content.test.ts` structurally cannot see — that scan extracts runs of
   * DIGITS, so "Three" is an unbacked number wearing a word. Second, and worse, this section's
   * membership is by construction unstable: the lede says these are claims Hearth corrected in
   * its own documents, so an item leaves the moment the underlying limit is closed. One just did
   * — the browser miner's third caveat was a statement about a capability that now works — and a
   * heading bound to a count of things that change is a heading that goes quietly wrong. The
   * count is not a fact about mining; it is a fact about this array, and nothing on a public page
   * needs it.
   */
  caveats: {
    title: 'What this is not',
    lede:
      "Each of these is either a claim made somewhere in Hearth's own documents and since " +
      'corrected there — repeated here because a marketing page is where a corrected claim ' +
      'survives longest — or a limit this page would otherwise leave you to discover on your own.',
    items: [
      {
        title: 'It is not non-outsourceable',
        body:
          'The private key is used after a nonce wins, never inside the hash loop, and only the ' +
          'public key is bound into the seed. So a pool operator can hand out work under its own ' +
          'key, collect nonces from hashers who genuinely cannot steal the reward, and sign the ' +
          'blocks itself. Closing that means committing to the private key inside the loop, which ' +
          'forks the chain. It is deliberately open, not overlooked.',
      },
      {
        title: 'The pad is not the size the documents promised',
        body:
          `Every block ever produced used a ${fact('scratchKib')} KiB pad, and that is what mainnet ` +
          `will launch with. The 2 GiB the documents used to name measures ` +
          `${fact('bigPadSeconds')} seconds per evaluation, and a validator pays one for every ` +
          'block it receives against a target far shorter than that. Making the work meaningfully ' +
          'memory-hard needs an amortised dataset rather than a bigger constant.',
      },
      {
        /*
         * THIS CAVEAT WAS FALSE AND IS REPLACED BY THE ONE THAT IS STILL OWED.
         *
         * It read: "The browser miner cannot yet mine a block this node accepts — the browser half
         * has moved to the account model and the node half has not: the mining template endpoint
         * still requires the old signature scheme, and block validation still verifies proofs with
         * it." Every clause of that is now wrong, and it was printed directly ABOVE the working
         * browser miner this page mounts.
         *
         * Measured 2026-08-08: a key generated by `src/mining/account.js` was passed to
         * `rpc.<apex>/mining/template` and answered HTTP 200 with a template at height 6,777 whose
         * `coinbasePub` is the key that was sent; `hearth/node/src/block.js` verifies `powSig`
         * against that same `coinbasePub`. The halves agree.
         *
         * A caveat is still owed, which is why this is a replacement rather than a deletion: the
         * node ACCEPTING the work is not the same claim as a laptop WINNING with it, and the old
         * sentence was the only thing on this page standing between a reader and that assumption.
         */
        title: 'It is not a promise that your machine wins a block',
        body:
          'The browser half and the node half do agree: the template endpoint issues work to any ' +
          'mining key this page can make, and the node verifies the winning signature against ' +
          'that same key. What no page can tell you is whether YOUR machine wins one. A template ' +
          "goes stale the moment somebody else's block arrives, a nonce is worth nothing unless " +
          'it wins before that happens, and a tab in a browser is competing with machines that do ' +
          'this all day. Running for a long time without a block, or never finding one at all, is ' +
          'an ordinary outcome here and not a sign that anything is broken.',
      },
    ],
  },

  pay: {
    title: 'What mining pays',
    body:
      `The reward is a consensus constant: it starts at ${fact('genesisReward')} EMBER per block, ` +
      `halves every ${fact('halfLifeYears')} years, and settles at ${fact('tailReward')} EMBER per ` +
      `block for ever. ${fact('commonsShare')} per cent of it goes to the Commons rather than to ` +
      'the miner.',
  },

  pools: {
    title: 'Pools',
    body:
      'None exists, and nothing in the protocol prevents one from being built — it would hand out ' +
      'work under its own key and pay hashers off chain. What consensus does guarantee is that work ' +
      'handed to you under YOUR key cannot be taken from you.',
  },

  design: {
    title: 'Written down, but not built',
    lede:
      'None of the following exists in the repository. It is listed because the project lists it, ' +
      'and because a reader is entitled to know which half of a design document they are reading.',
    items: [
      'Warmshares — near-miss blocks referenced later for a fraction of the reward, so honest work that just missed is still paid.',
      'Trustless co-ops — peers sharing variance over a protocol that never takes custody of a key.',
      'Idle detection — not implementable from a web page: the browser API for it means "this tab is quiet", which is always true for a page that only mines.',
      'Thermal back-off — no temperature source is available to either the node or the browser.',
      'A compiled-program proof of work. Not scheduled, and not claimed.',
    ],
  },

  start: {
    title: 'How to start',
    lede:
      'Two ways, both written against a chain on your own machine, which is what the mining ' +
      'document describes. Mainnet is reachable now, and nothing on this page has been measured ' +
      'against it — so nothing here is advice about mining on it.',
    steps: [
      {
        title: 'In the browser',
        body:
          'Open the miner page from a checkout, create or load a key, and press start. The same ' +
          'proof of work the node runs, in a pool of workers, measured at about ' +
          `${fact('hashesPerThread')} hashes per second per thread at the shipped parameters. Your ` +
          'private key never leaves the page.',
      },
      {
        title: 'With the node',
        body:
          'The reference node is a full node, a wallet and a miner in one process, and its mining ' +
          'flag has a duty-cycle throttle. It has no power awareness at all, which the project says ' +
          'plainly rather than implying otherwise.',
      },
    ],
  },
}

/* ══════════════════════════════ running a node ══════════════════════════════ */

export const NODE = {
  title: 'Run a node',
  blurb:
    'Test suites from a clean clone, a local chain in one command, and the RPC surface over a fake chain. Everything below runs on your own machine.',
  /*
   * THIS STANDFIRST SAID THE TESTNET "IS UNREACHABLE FROM OUTSIDE". IT IS NOT, AND THIS FILE
   * ALREADY KNEW: `src/content/facts.ts` has recorded the opposite since 2026-08-05.
   *
   * The old sentence inherited a TLS diagnosis that was correct about a hostname scheme the estate
   * then ABANDONED. Names are no longer two labels deep; an environment is a suffix inside the
   * FIRST label, so the wildcard already in front of the apex covers them.
   *
   * AND THE REPLACEMENT DELIBERATELY ASSERTS NEITHER STATE. Measured 2026-08-08:
   * `rpc-testnet.<apex>` terminates TLS under the wildcard certificate — the scheme argument is
   * dead — but the origin behind it was not answering, and the retired two-label name does not
   * resolve at all. That is exactly why no static sentence here may claim reachability in either
   * direction: a testnet is a disposable thing that is stopped and restarted without notice, and
   * a page rebuilt weeks ago cannot know which side of that it is on. `/chain` asks both scopes
   * and renders what came back, including its absence, which is the only honest place for the
   * answer to live.
   */
  standfirst:
    'Mainnet answers on a public JSON-RPC endpoint, and so does the test network — the same ' +
    'hostnames with -testnet on the end of the first label. Whether either is answering at the ' +
    'moment you read this is not something a written page can know, so it does not say: the chain ' +
    'page asks both and prints what came back. This page still publishes no bootstrap list and no ' +
    'peer to dial, so what follows is what you can actually do on your own machine — in the order ' +
    'the project itself suggests doing it.',

  steps: [
    {
      title: 'Run the test suites',
      body:
        `The whole repository is dependency-free JavaScript, so a clean clone runs ${fact('suites')} ` +
        'suites with no install, no downloaded corpus and no network. That is the fastest way to ' +
        'find out whether any of this is real.',
      command: 'cd node && npm test',
    },
    {
      title: 'Run the conformance gate',
      body:
        "Fetch Ethereum's published vectors and run the EVM against them. This is the check the " +
        'project treats as the definition of done for every component: no part is finished until ' +
        'its vectors pass.',
      command: 'cd node && ./scripts/fetch-vectors.sh',
    },
    {
      title: 'Bring up a local chain',
      body:
        `The compose file starts ${fact('nodes')} containers — one non-mining seed and two miners — ` +
        `all on the same isolated network, with the seed's RPC on port ${fact('seedRpcPort')}. Each ` +
        'container keeps its own volume, so the chain survives a restart and not a teardown.',
      command: 'docker compose -f docker-compose.testnet.yml up --build',
    },
    {
      title: 'Point your tooling at something',
      body:
        'The developer kit serves the real JSON-RPC method surface over a fake chain, so standard ' +
        'Ethereum tooling gets correct encodings and correct errors without a chain behind it. A ' +
        `node started with the account model serves the same surface on port ` +
        `${fact('evmRpcPort')} instead. Mainnet is reachable over the public endpoint as well, ` +
        'and pointing a wallet at a chain whose EMBER cannot be sold is a decision for you rather ' +
        'than a step in a walkthrough.',
      command: `node tools/rpc-probe/stub.js --port ${fact('probePort')}`,
    },
  ],

  /**
   * The genesis check.
   *
   * `hearth/TESTNET.md` is the table and the two traps under it. Worth putting on a public
   * page because both traps produce a silent split rather than an error, which is the class of
   * failure a reader cannot diagnose without being told it exists.
   */
  sameChain: {
    title: 'Checking two nodes are on the same chain',
    body:
      'The handshake compares the network name, the genesis hash, the chain id and the Commons ' +
      'address, and drops a peer that disagrees on any of them. Two of those are worth knowing ' +
      'before you meet them: the genesis hash does not cover the chain id or the Commons address, ' +
      'so changing either leaves the hash byte-identical while the chain forks at the first block ' +
      'anybody mines — and the genesis file is pinned to a data directory the first time a node ' +
      'starts, so a volume that was not wiped after a consensus change keeps the old one.',
    command: `curl -s localhost:${fact('seedRpcPort')}/info`,
  },

  /*
   * THE HOSTNAME ITEM IS CLOSED AND IS NOT AN OPEN CONTRIBUTION ANY MORE.
   *
   * This paragraph offered "publish the testnet" as work somebody could pick up, and gave a reason
   * that has been dead since the estate moved the environment into the first label as a suffix:
   * the names are one label deep and the wildcard covers them. Leaving it here pointed a
   * contributor at a solved problem and, worse, republished the retired `<surface>.testnet.<apex>`
   * scheme as though it were the current one — a string this estate keeps retyping from old
   * documents, which is why `test/content.test.ts` now forbids its shape outright.
   */
  contribute: {
    title: 'Contributing',
    body:
      'Hearth is the one public repository behind this platform: MIT licensed, open to outside ' +
      'contributors, and every claim in its inventory cites a path and a line or a command that ' +
      'was run. Both networks are published — the test network under the same hostnames with ' +
      '-testnet on the end of the first label — so getting an endpoint onto the internet is no ' +
      'longer the work. The work is finding a proof of work that is memory-hard without costing a ' +
      'validator more than a block interval to check, and it is the highest-leverage thing left.',
  },
}

/* ══════════════════════════════ the faucet ══════════════════════════════ */

export const FAUCET = {
  title: 'Testnet faucet',
  blurb:
    'Testnet EMBER, rate limited, with no value. The faucet publishes its own drip, cooldowns and remaining budget; this page prints what it says and nothing else.',
  standfirst:
    'Ask for testnet EMBER at an address. The amount is a server-side constant and there is no ' +
    'field for one on this form — every faucet that has ever been drained let the caller influence ' +
    'the amount.',

  /**
   * The one thing a reader must understand before using the form.
   *
   * THIS COMMENT USED TO SAY THE TESTNET CHAIN "IS NOT PUBLISHED", so a drip that succeeded funded
   * an address on a chain the reader could not reach unless they were running it themselves. That
   * stopped being true when the environment moved into the first label as a suffix: the testnet
   * JSON-RPC hostname is one label deep, the wildcard covers it, and it is published.
   *
   * The block below survives the correction unchanged, because reachability was never its subject.
   * Its subject is that this coin is given away on request and is therefore worth nothing by
   * construction — which is true whether or not the chain happens to be answering today, and is
   * the one thing a reader must not carry away from a faucet in the wrong direction.
   */
  reach: {
    title: 'This is testnet EMBER, and testnet EMBER is worth nothing',
    body:
      `The faucet dispenses on chain id ${fact('chainIdTestnet')} and on nothing else. That is a ` +
      `different chain from mainnet, which is ${fact('chainIdMainnet')}: the two ids are ` +
      'deliberately distinct, so a transaction signed on one cannot be replayed on the other. ' +
      'Coin from this form is given away on request, so it is worth nothing by construction — it ' +
      'is for testing, and the chain it lives on may be restarted from genesis without notice. ' +
      'Nothing anywhere gives away mainnet EMBER, and a page that offers to is not this one.',
  },

  /**
   * Shown INSTEAD of the terms and the form when this page is served from a mainnet origin.
   *
   * See the header of `src/lib/hosts.ts` for why an origin check exists at all: no mainnet faucet
   * can dispense — four independent locks, one of them a compile error — but a faucet page on a
   * mainnet hostname still teaches a reader to go looking for free mainnet coin.
   */
  wrongNetwork: {
    title: 'You are on mainnet. There is no faucet here.',
    body:
      'This page is the TESTNET faucet, and you have reached it on a mainnet address. Mainnet ' +
      'EMBER is mined and never given away, so no form on this site will ever hand you any — ' +
      'and no mainnet faucet exists to be found elsewhere, on this estate or off it. The testnet ' +
      'faucet is the same page on the testnet host, linked below.',
    action: 'Go to the testnet faucet',
    fallback:
      'The testnet host is this same name with -testnet on the end of its first label, ' +
      'and the faucet is at /faucet on it.',
  },

  form: {
    label: 'Address',
    placeholder: '0x…',
    hint:
      'A hex address. A mixed-case address is claiming a checksum and is held to it; an ' +
      'all-one-case address is not claiming one and is accepted. An old-style Hearth address is ' +
      'refused, because the faucet dispenses on the account model.',
    submit: 'Request testnet EMBER',
  },

  /**
   * How a refusal is worded — which is to say, it is not worded here at all.
   *
   * `faucet/src/server.ts`: the limiter's message "names a rule and a number, never a
   * balance, an address the caller did not send, or anything about the funding key". This page
   * shows that message verbatim. A second wording would be a second thing to keep true.
   */
  refusal: {
    title: 'If it refuses',
    body:
      'A refusal is the rate limiter working rather than a fault, and the sentence you get is the ' +
      "limiter's own. There are four limits: one drip per address per cooldown, a cap per " +
      'requester per window, a balance ceiling on the recipient, and a rolling budget that bounds ' +
      'the total. The last is the one that means anything; the other three exist so that an honest ' +
      'user is never the one who trips it.',
  },

  poll: {
    title: 'What happens next',
    body:
      'The request is queued, not sent: nothing has been signed and no nonce has been read. The ' +
      'transaction is signed by the custody service, its bytes are committed before it is ' +
      'broadcast, and it is followed to a pinned confirmation depth. This page polls until it ' +
      'settles, and every state it passes through is a state the service actually records.',
  },

  /** Shown when the terms could not be fetched. Never a default set of numbers. */
  unavailable: {
    title: 'The faucet did not answer',
    body:
      'Its drip, its cooldowns and its remaining budget are its own to publish and this page holds ' +
      'no copy of them, so there is nothing to show. The form is disabled rather than left ' +
      'clickable: a request sent into an unreachable service would fail in a way that looks like a ' +
      'refusal.',
  },
}

/* ══════════════════════════════ not found ══════════════════════════════ */

export const NOT_FOUND = {
  title: 'No such page',
  body:
    'This address is not one this site serves, and the server said so with a real 404 rather than ' +
    'quietly returning this page as a success. If you followed a link from somewhere in ' +
    'CloudsForge, the link is wrong.',
}
