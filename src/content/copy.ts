/**
 * The words on this site, as data.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * 2026-08-17: THIS FILE WAS CUT ROUGHLY IN HALF, AND WHAT WENT IS NAMED HERE — micro-org#484.
 *
 *     "remove useless text and keep only human easy-to-understand info, and warning"
 *
 * Nothing was cut for being FALSE. Every claim below is the claim that was here before it, and the
 * measurements that back each one are unchanged and still recorded in the comments. What was cut is
 * the second and third sentence of things that only needed a first.
 *
 * Four patterns went, and they are worth naming because each one grew here honestly:
 *
 *   1. THE CLAIM, THEN THE DEFENCE OF THE CLAIM. "A 15-second TARGET, retargeted every block. It is
 *      what the difficulty algorithm aims at, not a rate this page has measured — what the chain is
 *      actually doing is a runtime figure and belongs on the chain page." The second sentence is an
 *      argument with a reviewer, published to a reader who was not in it. The word "target" already
 *      does that work; the rest is now one clause.
 *   2. THE SAME FACT TWICE, IN TWO REGISTERS. The status table's mainnet row and the coin's chain-id
 *      row both explained what "published and answering" means. A reader meets it once.
 *   3. THE SELF-DESCRIPTION. "The project records the disagreement rather than hiding it, and so
 *      does this page." A page that narrates its own honesty is spending a reader's attention on
 *      itself. Say the disagreement; the reader can see it is not hidden.
 *   4. THE INTERNAL AUDIENCE. Sentences addressed to whoever edits this file next — why a section
 *      exists, what it used to say, which rule it is obeying. Those belong in comments, which is
 *      where they now are, and comments do not render.
 *
 * WHAT WAS NOT CUT, AND WILL NOT BE:
 *
 *   * `STANDING_STATE`. It is the warning, it is on every route above everything, and the brief
 *     that asked for this cut asked for it to be KEPT and made legible. It got shorter. It did not
 *     lose a single clause: `test/content.test.ts` pins eleven separate phrases in it, one per
 *     limit, precisely so that a rewrite cannot drop one while keeping the rest.
 *   * Any number. `./facts.ts` still registers every digit that appears here and
 *     `test/content.test.ts` still fails on an unregistered one — and on a REGISTERED one that
 *     nothing renders, which is what stops a cut from quietly abandoning a measurement.
 *   * Any caveat. The three things Homefire is not, the receipt with nothing behind it, the pad
 *     that is not the promised size, the pool that settles nothing: all present, all shorter.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *
 * Copy lives here rather than inside components for the reason `micro-site` gives: a string inside
 * JSX cannot be walked by a test, and the two rules this surface is held to are both rules about
 * strings.
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
 * Mainnet is reachable. `deploy/cloudflared/config.mainnet.public.yml` publishes `rpc.<apex>` on
 * the public tunnel, and a POST to it from off the estate answers `eth_chainId` with `0x1cf3` —
 * 7411, the id this file already carried as merely allocated. Blocks advance between reads. So the
 * old headline, "there is no public Hearth network yet", is a false statement about a currency and
 * had to go.
 *
 * EVERYTHING ELSE THE OLD WORDING PROTECTED AGAINST IS STILL TRUE, AND IS WORDED MORE CAREFULLY
 * BECAUSE IT NOW HAS TO SURVIVE NEXT TO GOOD NEWS:
 *
 *   * **EMBER has no market, no listing and no liquidity, and it DOES have a price.** This bullet
 *     used to end "no price" and that clause is now false. On 2026-08-10 at 19:13:30Z the operator
 *     set an administered rate for EMBER through `PUT /admin/prices/:asset`; measured 2026-08-11,
 *     `GET /rates` answers EMBER with `source: "administered"`, `usable: true` and `sourceCount: 0`
 *     against `market`, while eleven other assets carry a median of four real venues. So a figure
 *     is now shown wherever this estate shows a value, and a reader told here that there is no
 *     price concludes the estate is careless rather than that the figure is ours.
 *
 *     **The rule is "name the price, then say whose it is" — never "there is no price", and never
 *     a price with no owner beside it.** A chain being reachable is still not a chain being traded,
 *     and a figure we set ourselves is still not a figure anybody has paid.
 *   * **The chain is new and short.** "Live" here means reachable, not established. Nothing on this
 *     surface may state a height, an age or a block time it OBSERVED — the /chain page fetches
 *     those or renders their absence.
 *   * **The testnet IS publicly reachable, as of 2026-08-05, and this bullet used to say the
 *     opposite.** It blamed a TLS scheme that was then ABANDONED: an environment is now a suffix
 *     inside the FIRST label (`<surface>-testnet.<apex>`), so every testnet name is one label deep
 *     and the existing certificate covers it. Testnet URLs may be published here, and the faucet is
 *     one of them. What replaces the prohibition is narrower and survives the good news: **a
 *     testnet URL must never be published without the word testnet next to it.** Free coin and
 *     mined coin must not be made to look alike.
 *   * **The whole estate is one home server behind a Cloudflare Tunnel.** No second machine, no
 *     failover.
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
 *
 * ── IT IS SHORTER AND IT LOST NOTHING, WHICH IS THE ONLY ACCEPTABLE WAY TO SHORTEN IT ─────────
 *
 * `test/content.test.ts` pins eleven phrases in this one paragraph — cannot be bought or sold, no
 * market, no listing, a price, whose the price is, the testnet, given away, worthless, a single
 * site, nothing to fail over to, and reorg — each asserted separately so an edit cannot drop one
 * while keeping the others. Every one of them is still here. What went was the connective tissue
 * between them: "so nothing you mine here is money YET", "which means a deep reorganisation is a
 * real possibility rather than a theoretical one". The hedges made the sentence longer without
 * making the warning stronger, and this is the paragraph most likely to be read by somebody who
 * reads nothing else on the site.
 *
 * ── THE PRICE CLAUSE IS THE ONE THAT MOVED, AND IT MOVED IN THE UNFLATTERING DIRECTION ────────
 *
 * This read "no market for it, no listing and no price". The last third stopped being true on
 * 2026-08-10 and the sentence stayed up: EMBER now has an administered rate and hub prints a dollar
 * figure against an EMBER balance. A reader who mines here on the strength of this paragraph and
 * then meets that figure has been told two incompatible things by the same company on the same
 * visit, and the one they will believe is the number. So the clause is not deleted — deleting it
 * leaves the reader with a figure and no account of it, which is the whole defect (micro-org#365).
 * It is REPLACED by the pair: the price exists, and it is ours.
 */
export const STANDING_STATE = {
  headline: 'Hearth is a new network. Read this before you rely on it.',
  body:
    'EMBER cannot be bought or sold. There is no market for it and no listing, so nothing you ' +
    'mine here is money. It does carry a price on CloudsForge screens, and that is a price we ' +
    'set ourselves rather than one anybody has paid. The chain is weeks old and runs from a ' +
    'single site: a deep reorg is a real possibility, and an outage has nothing to fail over to. ' +
    'The test network is a separate chain, and the EMBER given away on it is worthless by design.',
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
    'Hearth is built so the computer you are reading this on is the whole rig — no specialist ' +
    'hardware, nothing to buy. Its coin is EMBER, and underneath it runs Ethereum contracts and ' +
    'answers Ethereum wallets.',

  what: {
    title: 'What it is',
    /**
     * FOUR ITEMS, AND THE COUNT IS LOAD-BEARING. `.ns-cards--four` steps 1 → 2 → 4 columns and
     * never 3, because four tiles in an intrinsic grid lay out three and then one at every desktop
     * width. `test/layout.test.ts` fails if a fifth is added without moving the steps.
     */
    items: [
      {
        title: 'Mining a laptop can win at',
        body:
          'Most coins are mined by machines built for nothing else, which prices an ordinary ' +
          'computer out on day one. Here, every attempt has to shuffle a block of memory — and ' +
          'memory is the one thing specialised hardware cannot make much faster.',
      },
      {
        title: 'Your Ethereum tools work here',
        body:
          'Addresses, signatures, gas and the interface a wallet talks to are the ones Ethereum ' +
          'uses, so MetaMask, ethers, viem, Hardhat and Foundry connect without changes and a ' +
          'contract you already wrote deploys unaltered.',
      },
      {
        title: 'Nobody was handed a head start',
        body:
          'The first block created no spendable coins for anyone, founders included, so there is ' +
          `no pre-mined pile waiting to be sold. ${fact('commonsShare')} per cent of every reward ` +
          'goes to a shared treasury on the chain, and the starting balances are published.',
      },
      {
        title: 'The reward never falls to nothing',
        body:
          `Each block pays ${fact('genesisReward')} EMBER. That halves every ` +
          `${fact('halfLifeYears')} years and then levels off at ${fact('tailReward')} EMBER a ` +
          'block for good, so the people keeping the chain honest are always paid something.',
      },
    ],
  },

  /**
   * The coin, as identity rather than as an asset.
   *
   * Every line here is a constant somebody needs in order to configure a wallet or a node, which is
   * the only reason to publish them. The smallest-unit row records a DISAGREEMENT rather than
   * resolving it: `hearth/README.md` states it about itself — the account model specifies 18
   * decimals and the node still defines the retired ledger's 1e8. Picking a side on a marketing
   * page would be inventing a decision the project has not taken.
   */
  coin: {
    title: 'The coin',
    lede: 'What you would type into a wallet.',
    rows: [
      { field: 'Network and coin', value: 'Hearth, and EMBER' },
      {
        field: 'Chain id',
        // The word "testnet" is mandatory beside a testnet id: the prohibition on unlabelled
        // testnet URLs was replaced by a labelling rule, not lifted. See the file header.
        value: `${fact('chainIdMainnet')} for mainnet, ${fact('chainIdTestnet')} for the testnet. Both answer.`,
      },
      {
        field: 'Block time',
        // "TARGET" in capitals does the work the deleted second sentence used to do. What the chain
        // is actually producing is a runtime figure and lives on /chain, which is a click away.
        value: `A ${fact('blockSeconds')}-second TARGET, retargeted every block.`,
      },
      {
        field: 'Smallest unit',
        value:
          `${fact('decimals')} decimals under the account model. The node still defines ` +
          `${fact('sparksPerEmber')} smaller units to one EMBER, which is the retired ledger's.`,
      },
      {
        field: 'Supply',
        value: 'Uncapped and disinflationary. No hard cap and no fee burn: gas is paid to the miner.',
      },
      {
        field: 'Credited by CloudsForge after',
        value:
          `${fact('emberConfirmations')} blocks, about ${fact('emberConfirmationMinutes')} minutes ` +
          `at the target. A reorg ${fact('emberReorgAlarmDepth')} deep halts crediting. That is ` +
          "this platform's rule, not the chain's.",
      },
    ],
  },

  /**
   * The status table.
   *
   * Reproduced from `hearth/MAP.md`, which is the project's own single status table and which says:
   * "Do not read a status from anywhere else in this repository without checking it here first."
   * This page follows that instruction rather than assembling a more flattering list.
   *
   * ── EVERY DETAIL IS ONE SENTENCE NOW, AND THE TABLE IS THE REASON ──────────────────────────────
   *
   * This is the one thing on this site a reader SCANS instead of reading, and it carried eleven
   * paragraph-length cells. A paragraph in a scanned table is a paragraph nobody reads, so the
   * badge was doing all the work and the caveats beside it were decoration. Each cell is now the
   * narrowest true statement of what the row's badge means, and nothing that was a caveat became a
   * boast: "one home server, no failover, no independent peer, no audit" is still on the mainnet
   * row, in four words each.
   *
   * ── THE BADGE IS THE PART A READER TAKES AWAY, AND IT HAS BEEN WRONG IN BOTH DIRECTIONS ────────
   *
   * `src/pages/home.tsx` renders the word from the state alone, so a detail sentence beginning
   * "Published and answering" was once printed underneath a badge saying "Not built". The badge
   * wins that argument every time. Measured 2026-08-11 from off the estate: mainnet answers
   * `eth_chainId` 0x1cf3 and its height moved 0x37ad → 0x37b1 in forty-five seconds; the testnet
   * answers 0x1cf4 and moved 0x1fbf → 0x1fc0; every block of both chains was walked, nine contract
   * creations on each, every receipt `status: 0x1`, runtime code at all eighteen addresses.
   *
   * A false "not done" is a false statement about this company published under its own name, and it
   * is not the safe direction to err in. **A status is a measurement, and a row nobody has measured
   * recently is a row nobody should trust.** micro-org#412.
   */
  state: {
    title: 'How far along each part is',
    /*
     * THIS LEDE HAS OUTLIVED ITS TABLE TWICE, SO IT NO LONGER DESCRIBES THE TABLE'S CONTENTS.
     *
     * Version one said the in-progress rows were "working but not proven", which stopped being true
     * when those rows became built. Version two said what was left was "two gaps in the proof of
     * work", which stopped being true the day the receipt row landed. Both were accurate when
     * written and both were quietly false within a fortnight, because a lede that enumerates is a
     * lede bound to a count that changes.
     *
     * What is left is the distinction that does NOT change: an in-progress row here is never
     * half-finished work waiting for time to pass. It needs a design nobody has found, or it needs
     * something behind it. A reader deciding what to build on needs to tell those apart, and they
     * fail in completely different ways.
     */
    lede:
      'What is marked in progress will not finish by being left alone. It needs a design nobody ' +
      'has found yet, or it needs something behind it.',
    rows: [
      {
        thing: 'The EVM: interpreter, gas, opcodes, precompiles',
        state: 'built' as const,
        detail: `All ${grouped('vmTests')} of Ethereum's own VMTests pass.`,
      },
      {
        thing: 'The state transition',
        state: 'built' as const,
        detail: `All ${grouped('stateTests')} of Ethereum's own GeneralStateTests pass.`,
      },
      {
        thing: 'A real contract stack running on it',
        state: 'built' as const,
        detail: `Uniswap V2 deploys, adds liquidity and swaps here, at ${grouped('swapGas')} gas.`,
      },
      {
        thing: 'Consensus on the account model',
        state: 'built' as const,
        detail: `Blocks are produced, validated and reorged. ${fact('nodes')} nodes run under docker compose on chain id ${fact('chainIdTestnet')}.`,
      },
      {
        thing: 'A public mainnet endpoint',
        state: 'built' as const,
        detail:
          `Answers chain id ${fact('chainIdMainnet')}, and its height advances between reads. ` +
          'One home server: no failover, no independent peer, no audit.',
      },
      {
        thing: 'A public testnet endpoint',
        state: 'built' as const,
        detail:
          `Answers chain id ${fact('chainIdTestnet')}, with the faucet beside it. Its EMBER is ` +
          'given away, and nothing promises its history outlives the machine it sits on.',
      },
      {
        thing: 'A deployed contract',
        state: 'built' as const,
        detail:
          'The prediction markets this platform runs are Solidity, compiled for Ethereum and ' +
          'deployed unaltered here — our own code, not a fixture to practise against.',
      },
      /*
       * THE EXCHANGE AND THE RECEIPT ARE TWO ROWS BECAUSE THEY ARE TWO CLAIMS.
       *
       * They shipped together and they are one product, and one row would force a single badge over
       * a sentence needing two. The exchange IS built on both networks. The receipt is deployed on
       * one and backed on neither, which is `open` and would have dragged the exchange's badge down
       * — or, worse, hidden under it. A row earns exactly one badge, and the badge is about that
       * row's own words.
       */
      {
        thing: 'An exchange running on it',
        state: 'built' as const,
        detail:
          'Forge Exchange is deployed on both networks and seeded with liquidity: pools you trade ' +
          'against from your own wallet, with no account and no order book.',
      },
      {
        thing: 'A coin from another chain, standing on this one',
        state: 'open' as const,
        detail:
          'A Forge Receipt is a token here standing for a Litecoin held elsewhere — a promise ' +
          'rather than a contract holding both sides. It is deployed and exercised on the test ' +
          'network. On mainnet the backing counted zero, so the deployment refused itself.',
      },
      {
        thing: 'The proof of work at the size the documents promised',
        state: 'open' as const,
        detail:
          `Every block ever produced used a ${fact('scratchKib')} KiB pad, and the node refuses to ` +
          `start above ${fact('maxScratchKib')} KiB. A 2 GiB pad measures ` +
          `${fact('bigPadSeconds')} seconds per evaluation, and a validator pays one per block ` +
          'received. Closing that is a redesign, not a constant.',
      },
      {
        thing: 'Non-outsourceable mining',
        state: 'open' as const,
        detail:
          'A pool can still hand out work under its own key and sign the blocks itself, and ' +
          'nothing in consensus notices.',
      },
    ],
  },

  where: {
    title: 'Where to go next',
    lede: 'Everything here opens something that exists today.',
  },
}

/* ══════════════════════════════ the chain ══════════════════════════════ */

export const CHAIN = {
  title: 'The state of the chain',
  blurb:
    'What the CloudsForge chain index has observed of Hearth. Every figure is fetched when you load the page, or it is absent and says so.',
  standfirst:
    'These figures are fetched when you load this page. There is no default and no stored copy: a ' +
    'number that could not be fetched is shown as the reason, never as a nought.',

  /**
   * The sentence under the panel, explaining the two heights.
   *
   * THE DEFINITIONS ARE NOT HERE, AND THAT IS THE CORRECTION RATHER THAN AN OMISSION. This used to
   * define the walked head and the claimed tip, and `src/pages/chain.tsx` renders `TWO_HEIGHTS` in
   * the very next paragraph, defining the same two terms in the same note. A reader got both, one
   * after the other, and read the second as a second point being made. `TWO_HEIGHTS` is the
   * estate's one wording for the distinction (`src/lib/format.ts`) and every surface that prints a
   * height carries it, so the definition belongs there and only there. What is left here is the
   * part that sentence does not say: WHY the index refuses to pick one.
   */
  heads: {
    title: 'Two heights, and the gap between them',
    body:
      'The index reports both rather than picking one, because counting depth against a block ' +
      'nobody has looked at over-reports it — and over-reported depth credits money early.',
  },

  /**
   * A chain this deployment does not follow.
   *
   * Each estate's chain index follows exactly one EMBER network — `deploy/compose/env/
   * chain.mainnet.env` opens with "exactly one of this file and `chain.testnet.env` is ever read,
   * and no deploy can have half of each" — so this panel is the permanent state of the network this
   * page is NOT served from, rather than an error. It is a panel and not a deletion because the
   * reader's question is "is there a testnet", and the answer is yes, over there.
   */
  notFollowed: {
    title: 'This chain index does not follow this chain',
    body:
      'Each estate runs its own chain index, and each follows exactly one EMBER network. The ' +
      'figures above are absences, not zeroes, and no claim is being made about that chain.',
    link: 'Open the Network site for that chain',
  },

  /**
   * What a null means. This is the most important paragraph on the page.
   *
   * `indexer/src/reads.ts` returns `checkpoint?.tipHeight ?? null`, so a deployment that has never
   * followed this chain answers 200 with nulls rather than failing. That is an answer, and it is a
   * different answer from "we could not ask".
   */
  absence: {
    title: 'What an absent figure means here',
    body:
      '"Not observed" means the index answered and had nothing to report. "Could not fetch" means ' +
      'the request did not arrive. Only one of those is about Hearth.',
  },

  /*
   * THIS USED TO BE AN APOLOGY, AND THE APOLOGY IS NO LONGER TRUE.
   *
   * It read "Why this request is refused today" and named two blockers, both since fixed. What
   * replaced it says LESS on purpose, and that decision has now paid for itself twice: when it was
   * written the estate served no frontend behind the gateway, so naming a new cause would have
   * swapped one unverifiable explanation for another. It names the missing figures and the request
   * id instead — which is what is true of EVERY failure.
   *
   * The estate does serve the bundles now, and this panel was then observed rendering against a
   * live chain, because a THIRD cause nobody had named was in play: `explorer.<apex>` had a gateway
   * router for the bundle and none for the chain index. Had this paragraph guessed at a cause it
   * would have blamed CORS and been wrong, and the panel would have taught a reader to stop
   * looking. It named the missing figures instead, and the request id led to the router.
   */
  unreachable: {
    title: 'No figures for this scope',
    body:
      'The chain index did not answer, so this panel shows which figures are missing rather than ' +
      'filling them in. Quote the request id below to find the exact attempt.',
  },

  explorer: {
    title: 'Looking up a block, a transaction or an address',
    body: 'That is the block explorer — a separate surface, reading the same index record by record.',
  },
}

/* ══════════════════════════════ mining ══════════════════════════════ */

export const MINE = {
  title: 'Mining',
  blurb:
    'How Homefire works, what it does and does not guarantee, and how to start. Mining pays a block reward, not an income.',
  standfirst:
    'Homefire is the proof of work Hearth runs. It is designed so an ordinary processor sits close ' +
    'to the best machine for the job. It is not designed to make anybody money, and this page will ' +
    'not suggest otherwise.',

  how: {
    title: 'What the chain does today',
    lede: 'All of this is implemented and covered by the test suite.',
    items: [
      {
        title: 'Memory-hard, so hardware buys less',
        body:
          `Each attempt fills a ${fact('scratchKib')} KiB scratchpad, walks it in ` +
          `${fact('walkSteps')} steps that read and rewrite it, and hashes the result against the ` +
          'target. Memory latency is the limit, so a general-purpose CPU is close to optimal.',
      },
      {
        title: 'A winning proof cannot be redirected',
        body:
          'A valid block must be signed by the private key its coinbase pays, so a candidate ' +
          'built for your public key is worth nothing to anybody else.',
      },
      {
        title: 'Low variance, so far',
        body:
          `A ${fact('blockSeconds')}-second TARGET block time means frequent wins even for a small ` +
          'miner, and difficulty retargets every block rather than in steps. That is the design; ' +
          'what a young chain actually does is on the chain page.',
      },
      {
        title: 'Polite by default, in the browser miner',
        body:
          'The effort slider is a real duty cycle, a hidden tab drops to a trickle, and an ' +
          'unplugged laptop stops entirely where the browser will say so. Two of the three major ' +
          'browsers do not report power state, and the panel says which it got.',
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
   * It read "Three things this is not". A spelled-out numeral is the one quantity the digit scan in
   * `test/content.test.ts` structurally cannot see, and this section's membership is unstable by
   * construction — an item leaves the moment the underlying limit is closed, and one just did. A
   * heading bound to a count of things that change is a heading that goes quietly wrong.
   */
  caveats: {
    title: 'What this is not',
    lede: 'Each of these is a limit you would otherwise be left to find on your own.',
    items: [
      {
        title: 'It is not non-outsourceable',
        body:
          'The private key is used after a nonce wins, never inside the hash loop, so a pool can ' +
          'hand out work under its own key and sign the blocks itself. Closing that means putting ' +
          'the private key inside the loop, which forks the chain. It is open on purpose.',
      },
      {
        title: 'The pad is not the size the documents promised',
        body:
          `Every block ever produced used a ${fact('scratchKib')} KiB pad. The 2 GiB the documents ` +
          `used to name measures ${fact('bigPadSeconds')} seconds per evaluation, and a validator ` +
          'pays one for every block it receives.',
      },
      {
        /*
         * THIS CAVEAT WAS FALSE AND IS REPLACED BY THE ONE THAT IS STILL OWED.
         *
         * It read: "The browser miner cannot yet mine a block this node accepts". Measured
         * 2026-08-08: a key generated by `src/mining/account.js` was passed to
         * `rpc.<apex>/mining/template` and answered HTTP 200 with a template at height 6,777 whose
         * `coinbasePub` is the key that was sent, and the node verifies `powSig` against that same
         * key. The halves agree — and that false sentence was printed directly ABOVE the working
         * browser miner this page mounts.
         *
         * A caveat is still owed, which is why this is a replacement rather than a deletion: the
         * node ACCEPTING the work is not a laptop WINNING with it, and the old sentence was the
         * only thing standing between a reader and that assumption.
         */
        title: 'It is not a promise that your machine wins a block',
        body:
          'The node accepts what this page produces. Whether YOUR machine wins is another ' +
          "question: a template goes stale the moment somebody else's block arrives, and a " +
          'browser tab is competing with machines that do this all day. Running a long time ' +
          'without a block is an ordinary outcome here, not a sign that anything is broken.',
      },
    ],
  },

  pay: {
    title: 'What mining pays',
    body:
      `The reward is a consensus constant: ${fact('genesisReward')} EMBER per block, halving every ` +
      `${fact('halfLifeYears')} years, settling at ${fact('tailReward')} EMBER per block for ever. ` +
      `${fact('commonsShare')} per cent of it goes to the Commons rather than to the miner.`,
  },

  /**
   * THIS SECTION SAID "NONE EXISTS" FULL STOP, AND THAT ACQUIRED A WAY OF BEING READ AS FALSE.
   *
   * CloudsForge now runs a mining pool. BOTH SENTENCES ARE TRUE BECAUSE THEY ARE ABOUT DIFFERENT
   * CHAINS: this page is about EMBER, and micro-pool mines Litecoin — it asks a litecoind for a
   * block template and refuses to start when the chain the node reports is not the one it was
   * configured for (`pool/src/template.ts`). It has no EMBER path and none is planned here. So the
   * fix is to say WHICH chain has no pool, not to soften the claim.
   *
   * ── THE LINK EXISTS BECAUSE THE ARGUMENT FOR WITHHOLDING IT WAS IMAGINARY ─────────────────────
   *
   * This comment used to refuse the link on the grounds that "the footer link is enough". There was
   * no footer: this bundle mounted no `CloudsForgeFooter` at all, so `FOOTER_GROUPS` never ran here
   * and `pool.<apex>` had never been on any page of this site. A paragraph of product reasoning had
   * been written against a component nobody had mounted. The footer is mounted now (micro-org#489)
   * and the link stays: a reader on the mining page should not have to find it in the chrome.
   *
   * WHAT DOES NOT CHANGE IS THE INCOME RULE, and it is why the link reads the way it does. Measured
   * 2026-08-10, `GET /v1/pool` answers `ready: true` with `payoutsImplemented: false` — the pool
   * records shares and settles none of them — so the sentence introducing it says so before it says
   * anything else. A link carrying the absence of a payout cannot imply a yield; a link labelled
   * "start earning" would.
   *
   * ── AND THIS PARAGRAPH'S OWN LESSON CAUGHT ONE OF ITS OWN SENTENCES ───────────────────────────
   *
   * The body said flatly that "Dogecoin is merge-mined from the Litecoin work". Measured
   * 2026-08-11, `GET /v1/pool` answers with the Litecoin chain carrying `merged: null` — the code
   * is there, tested, and not switched on. Which chains that pool serves is a live fact this bundle
   * must not hold a copy of, which is why the destination is a console rather than a page here, and
   * why the label below names no chain at all.
   */
  pools: {
    title: 'Pools',
    body:
      'None exists for EMBER. Nothing in the protocol prevents one — it would hand out work under ' +
      'its own key and pay hashers off chain — and what consensus guarantees is only that work ' +
      'handed to you under YOUR key cannot be taken from you. There is a pool elsewhere in the ' +
      'estate and it is for other chains: Litecoin, which a browser tab can hash for, and Bitcoin, ' +
      'which it offers to mining hardware only. Those are different proofs of work from Homefire.',
    /**
     * The one link off this page that is about a pool, and the note that has to travel with it.
     * `to` is a registry key rather than an address; `src/pages/mine.tsx` resolves it through
     * `hosts()` so this file names no hostname, which is the rule everywhere in this bundle.
     */
    elsewhere: {
      to: 'pool' as const,
      /*
       * NOT "The Litecoin pool console", WHICH IS WHAT THIS SAID AND WHAT THE POOL STOPPED BEING.
       * `POOL_CHAINS` was `ltc` alone when that label was written and has been `ltc,btc` since
       * 2026-08-11. A label naming one chain sends a reader with a Bitcoin rig past the one link
       * that would have helped them, and a count would need re-checking every time the set changes.
       * The console reads the real set on every load.
       */
      label: 'The CloudsForge mining pool console',
      note: 'It records shares and pays nothing — there is no payout mechanism in it yet.',
    },
  },

  design: {
    title: 'Written down, but not built',
    lede: 'None of this exists in the repository. It is listed because the project lists it.',
    items: [
      'Warmshares — near-miss blocks referenced later for a fraction of the reward, so honest work that just missed is still paid.',
      'Trustless co-ops — peers sharing variance over a protocol that never takes custody of a key.',
      'Idle detection — not implementable from a web page: the browser API for it means "this tab is quiet", which is always true for a page that only mines.',
      'Thermal back-off — no temperature source is available to either the node or the browser.',
      'A compiled-program proof of work. Not scheduled, and not claimed.',
    ],
  },

  /*
   * ── THIS SECTION SENT A READER TO A CHECKOUT TO USE SOMETHING THIS PAGE ALREADY MOUNTS ────────
   *
   * The lede said both ways were "written against a chain on your own machine"; the first step said
   * "open the miner page from a checkout". `src/pages/mine.tsx` renders `<BrowserMine>` in this very
   * section, above these steps. So the page told a reader to clone a repository in order to reach a
   * button an inch above the sentence.
   *
   * Measured 2026-08-11: the live site serves the miner chunk, and the public mainnet endpoint
   * answers `/mining/template` for a key generated by this bundle's own `src/mining/account.js`
   * with a template naming that key as the coinbase — and it answers with an
   * `access-control-allow-origin` for this site's origin, which is the part that decides whether a
   * browser may make the request at all.
   *
   * WHAT IS NOT CLAIMED: being issued work is not winning a block. The measurement above is a
   * request and a response. Nothing here has watched a tab win.
   */
  start: {
    title: 'How to start',
    lede:
      'Two ways, and neither is advice to mine. What your own machine wins is the question above, ' +
      'and this section does not answer it.',
    steps: [
      {
        title: 'In the browser, on this page',
        body:
          'Create or load a key in the panel above and press start — nothing to install, no ' +
          'checkout. It asks the public endpoint for work under your own key. Measured at about ' +
          `${fact('hashesPerThread')} hashes per second per thread at the shipped parameters, and ` +
          'your private key never leaves the page.',
      },
      {
        title: 'With the node',
        body:
          'The reference node is a full node, a wallet and a miner in one process, and its mining ' +
          'flag has a duty-cycle throttle. It has no power awareness at all.',
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
   * ALREADY KNEW: `src/content/facts.ts` has recorded the opposite since 2026-08-05. The old
   * sentence inherited a TLS diagnosis that was correct about a hostname scheme the estate then
   * ABANDONED.
   *
   * AND THE REPLACEMENT DELIBERATELY ASSERTS NEITHER STATE. Measured 2026-08-08:
   * `rpc-testnet.<apex>` terminates TLS under the wildcard certificate — the scheme argument is
   * dead — but the origin behind it was not answering. A testnet is stopped and restarted without
   * notice, and a page rebuilt weeks ago cannot know which side of that it is on. `/chain` asks
   * both scopes and renders what came back, which is the only honest place for the answer to live.
   */
  standfirst:
    'Mainnet answers on a public JSON-RPC endpoint, and so does the test network. Whether either ' +
    'is answering right now is not something a written page can know — the chain page asks and ' +
    'prints what came back. This page publishes no bootstrap list and no peer to dial, so what ' +
    'follows is what you can run on your own machine, in the order the project suggests.',

  steps: [
    {
      title: 'Run the test suites',
      body:
        `The whole repository is dependency-free JavaScript, so a clean clone runs ${fact('suites')} ` +
        'suites with no install, no downloaded corpus and no network. It is the fastest way to ' +
        'find out whether any of this is real.',
      command: 'cd node && npm test',
    },
    {
      title: 'Run the conformance gate',
      body:
        "Fetch Ethereum's published vectors and run the EVM against them. The project treats this " +
        'as the definition of done: no part is finished until its vectors pass.',
      command: 'cd node && ./scripts/fetch-vectors.sh',
    },
    {
      title: 'Bring up a local chain',
      body:
        `${fact('nodes')} containers — one non-mining seed and two miners — on an isolated ` +
        `network, with the seed's RPC on port ${fact('seedRpcPort')}. Each keeps its own volume, ` +
        'so the chain survives a restart and not a teardown.',
      command: 'docker compose -f docker-compose.testnet.yml up --build',
    },
    {
      title: 'Point your tooling at something',
      body:
        'The developer kit serves the real JSON-RPC method surface over a fake chain, so standard ' +
        'Ethereum tooling gets correct encodings and correct errors with no chain behind it. A ' +
        `node started with the account model serves the same surface on port ${fact('evmRpcPort')}.`,
      command: `node tools/rpc-probe/stub.js --port ${fact('probePort')}`,
    },
  ],

  /**
   * The genesis check.
   *
   * `hearth/TESTNET.md` is the table and the two traps under it. Worth putting on a public page
   * because both traps produce a silent split rather than an error, which is the class of failure a
   * reader cannot diagnose without being told it exists.
   */
  sameChain: {
    title: 'Checking two nodes are on the same chain',
    body:
      'The handshake compares the network name, the genesis hash, the chain id and the Commons ' +
      'address, and drops a peer that disagrees. Two traps are worth knowing first: the genesis ' +
      'hash does not cover the chain id or the Commons address, so changing either leaves the hash ' +
      'identical while the chain forks at the first block anybody mines — and the genesis file is ' +
      'pinned to a data directory on first start, so a volume that was not wiped keeps the old one.',
    command: `curl -s localhost:${fact('seedRpcPort')}/info`,
  },

  /*
   * THE HOSTNAME ITEM IS CLOSED AND IS NOT AN OPEN CONTRIBUTION ANY MORE. This paragraph offered
   * "publish the testnet" as work somebody could pick up, and gave a reason that has been dead
   * since the estate moved the environment into the first label as a suffix. Leaving it here
   * pointed a contributor at a solved problem and republished the retired
   * `<surface>.testnet.<apex>` scheme as though it were current — a string this estate keeps
   * retyping from old documents, which is why `test/content.test.ts` forbids its shape outright.
   */
  contribute: {
    title: 'Contributing',
    body:
      'Hearth is the one public repository behind this platform: MIT licensed, and every claim in ' +
      'its inventory cites a path and a line, or a command that was run. The work left is finding ' +
      'a proof of work that is memory-hard without costing a validator more than a block interval ' +
      'to check, and it is the highest-leverage thing there is.',
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
   * stopped being true when the environment moved into the first label as a suffix.
   *
   * The block below survives the correction unchanged, because reachability was never its subject.
   * Its subject is that this coin is given away on request and is therefore worth nothing by
   * construction — true whether or not the chain happens to be answering today.
   */
  reach: {
    title: 'This is testnet EMBER, and testnet EMBER is worth nothing',
    body:
      `The faucet dispenses on chain id ${fact('chainIdTestnet')} and nothing else — a different ` +
      `chain from mainnet, which is ${fact('chainIdMainnet')}. The two ids are deliberately ` +
      'distinct, so a transaction signed on one cannot be replayed on the other. Coin given away ' +
      'on request is worth nothing by construction, and this chain may be restarted from genesis ' +
      'without notice. Nothing anywhere gives away mainnet EMBER.',
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
      'This is the TESTNET faucet and you have reached it on a mainnet address. Mainnet EMBER is ' +
      'mined and never given away, so no form on this site will hand you any, and no mainnet ' +
      'faucet exists to be found elsewhere.',
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
   * `faucet/src/server.ts`: the limiter's message "names a rule and a number, never a balance, an
   * address the caller did not send, or anything about the funding key". This page shows that
   * message verbatim. A second wording would be a second thing to keep true.
   */
  refusal: {
    title: 'If it refuses',
    body:
      "A refusal is the rate limiter working, and the sentence you get is the limiter's own. " +
      'There are four limits: one drip per address per cooldown, a cap per requester per window, ' +
      'a balance ceiling on the recipient, and a rolling budget. The last is the one that means ' +
      'anything; the other three exist so an honest user is never the one who trips it.',
  },

  poll: {
    title: 'What happens next',
    body:
      'The request is queued, not sent: nothing has been signed and no nonce has been read. The ' +
      'transaction is signed by the custody service, its bytes are committed before it is ' +
      'broadcast, and it is followed to a pinned confirmation depth. This page polls until it ' +
      'settles.',
  },

  /** Shown when the terms could not be fetched. Never a default set of numbers. */
  unavailable: {
    title: 'The faucet did not answer',
    body:
      'Its drip, its cooldowns and its remaining budget are its own to publish and this page ' +
      'holds no copy of them. The form is disabled rather than left clickable: a request sent ' +
      'into an unreachable service would fail in a way that looks like a refusal.',
  },
}

/* ══════════════════════════════ not found ══════════════════════════════ */

export const NOT_FOUND = {
  title: 'No such page',
  body:
    'This address is not one this site serves, and the server said so rather than quietly ' +
    'returning this page as a success. If you followed a link from somewhere in CloudsForge, ' +
    'the link is wrong.',
}
