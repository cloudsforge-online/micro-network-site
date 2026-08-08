/**
 * EVERY DIGIT IN THIS SITE'S COPY IS IN THE REGISTER, AND THE COPY CLAIMS NOTHING IT CANNOT.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WHY A FRONTEND NEEDS A TEST THAT READS ITS OWN PROSE
 *
 * `docs/ecosystem/01-product-vision.md` is principle 5, "Honest copy". Every surface in this
 * estate is nominally held to it and this is the one most able to break it, because it is about a
 * currency: a fabricated hashrate, block height, supply or yield is a false statement about money,
 * published under the company's own name, and it stays true-looking long after the person who typed
 * it has forgotten they guessed.
 *
 * `micro-site` built the mechanism first (`site/src/content/claims.ts`) and this is it, adopted
 * rather than reinvented. Two rules, both mechanical:
 *
 *   1. A run of digits in `src/content` must be the `rendered` form of an entry in `FACTS`.
 *   2. No sentence may claim finality, a price, a yield, or a network that is running.
 *
 * ── WHAT IS STRIPPED BEFORE THE DIGIT SCAN, AND WHY EACH IS LEGITIMATE ────────────────────────
 *
 * **Citations.** `hearth/MAP.md` is rendered on screen, deliberately — the standard is
 * `org/templates/README.template.md`, "A claim nobody can check is worse than no claim, because
 * it is believed" — and the `39` is a line number, not a measurement. Stripped by shape.
 *
 * **Identifiers.** `SHA-256` is the name of a hash and `secp256k1` is the name of a curve. A name
 * cannot be wrong about the world in the way a figure can, and registering `256` as a "fact" would
 * make the register meaningless. The list is short, is enumerated below rather than pattern-matched,
 * and is asserted to contain no bare number — because "just add it to the identifier list" is
 * exactly how this check would be neutered.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { FACTS, fact, grouped, type FactKey } from '../src/content/facts.ts'
import * as COPY from '../src/content/copy.ts'

const at = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))

/**
 * Names, not measurements.
 *
 * Each entry is a whole token that is stripped before digits are extracted. Kept as short as it can
 * be, and every addition has to be a name of a THING rather than a quantity of one.
 */
const IDENTIFIERS: readonly string[] = [
  'SHA-256',
  'Keccak-256',
  'secp256k1',
  'Ed25519',
  'EIP-155',
  'EIP-55',
  'uint256',
  'bn128',
  'blake2f',
  'Uniswap V2',
  '127.0.0.1',
  '0x',
  '10^',
  'V2',
  'P2P',
]

/** Everything exported from the content module, walked as strings. */
function strings(value: unknown, path: string, out: Array<{ path: string; text: string }>): void {
  if (typeof value === 'string') {
    out.push({ path, text: value })
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => strings(item, `${path}[${i}]`, out))
    return
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) strings(item, `${path}.${key}`, out)
  }
}

const COPY_STRINGS: Array<{ path: string; text: string }> = []
strings(COPY, 'copy', COPY_STRINGS)

/** A `path:line` or `path:line-line` citation. Its digits are line numbers, not claims. */
const CITATION = /\b[A-Za-z0-9_.\-/]+\.(?:md|ts|tsx|js|css|yml|json):\d+(?:-\d+)?/g

function scannable(text: string): string {
  let stripped = text.replace(CITATION, ' ')
  for (const name of IDENTIFIERS) stripped = stripped.split(name).join(' ')
  return stripped
}

/** Every digit run in a string, after the two strips. */
function digitRuns(text: string): string[] {
  return [...scannable(text).matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0])
}

/** Every spelling a registered fact may appear as: bare, and grouped. */
const ALLOWED_DIGITS = new Set<string>()
for (const key of Object.keys(FACTS) as FactKey[]) {
  ALLOWED_DIGITS.add(fact(key))
  ALLOWED_DIGITS.add(grouped(key))
  // The grouped form contains commas, and a digit run is extracted with its separators, so both
  // spellings are registered rather than the scan being taught to normalise one into the other.
}

describe('the register is well formed', () => {
  it('has entries, so this cannot pass on an empty object', () => {
    assert.ok(Object.keys(FACTS).length >= 15, `${Object.keys(FACTS).length} facts is too few`)
  })

  it('every entry has a rendered form, a meaning and a source', () => {
    for (const [key, entry] of Object.entries(FACTS)) {
      assert.match(entry.rendered, /^[\d.]+$/, `${key}.rendered is not a number`)
      assert.ok(entry.meaning.length > 20, `${key} has no real meaning`)
      // A source is a PATH TO A FILE, asserted as a shape so an entry cannot be added with a
      // hand-wave in the field. The length floor that used to stand here was ten characters, which
      // `nginx.conf` fails by one — a filename is short, and shortness was never the property.
      assert.match(entry.source, /[A-Za-z0-9_.\-/]+\.[a-z]+/, `${key}.source names no file`)
      // AND NO LINE NUMBER. `test/citations.test.ts` used to check that a cited line existed; it
      // now forbids one, because a line names a position in a file another repository owns and is
      // free to edit — micro-faucet moving its requester hashing broke sixty-five citations here
      // in one commit, while nothing in this repository had changed.
      assert.doesNotMatch(
        entry.source,
        /[A-Za-z0-9_.\-/]+\.[a-z]+:\d+/,
        `${key}.source names a line. Cite the file and name the constant or the sentence.`,
      )
    }
  })

  it('names no runtime measurement, which is the one thing a register must never hold', () => {
    // A hashrate, a height, a supply or a difficulty is a fact about a RUNNING network and belongs
    // to the chain index at runtime or nowhere. An entry describing one would be a hard-coded
    // network figure wearing a citation, which is the exact defect the register exists to stop.
    for (const [key, entry] of Object.entries(FACTS)) {
      for (const banned of ['hashrate', 'difficulty', 'total supply', 'circulating', 'market cap', 'price']) {
        assert.ok(
          !entry.meaning.toLowerCase().includes(banned),
          `${key} describes '${banned}', which is a runtime measurement and must be fetched`,
        )
      }
    }
  })

  it('is fully used — an unused entry is a number nobody checked', () => {
    const all = COPY_STRINGS.map((s) => s.text).join('\n')
    const unused = (Object.keys(FACTS) as FactKey[]).filter(
      (key) => !all.includes(fact(key)) && !all.includes(grouped(key)),
    )
    assert.deepEqual(unused, [], `these facts are registered and never rendered: ${unused.join(', ')}`)
  })
})

describe('a digit may not appear in copy unless it is registered', () => {
  it('finds strings to scan, so this cannot pass on an empty walk', () => {
    assert.ok(COPY_STRINGS.length >= 40, `walked only ${COPY_STRINGS.length} strings`)
  })

  it('every digit run in every string is a registered value', () => {
    const offenders: string[] = []
    for (const { path, text } of COPY_STRINGS) {
      for (const run of digitRuns(text)) {
        if (!ALLOWED_DIGITS.has(run)) offenders.push(`${path}: "${run}" in "${text.slice(0, 70)}…"`)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `unregistered numbers in copy:\n  ${offenders.join('\n  ')}\nAdd them to src/content/facts.ts with a source, or take them out.`,
    )
  })

  it('and the scan is not vacuous: an unregistered number IS caught', () => {
    // The control. Without it, a strip that had become too greedy would make every assertion above
    // pass while measuring nothing — which is how a guard in this estate went quiet before.
    assert.deepEqual(digitRuns('the network produced 41,204 blocks'), ['41,204'])
    assert.equal(ALLOWED_DIGITS.has('41,204'), false)
  })

  it('…and the citation strip does not swallow a claim next to a citation', () => {
    const text = 'a 2 GiB pad, per hearth/MAP.md'
    assert.deepEqual(digitRuns(text), ['2'])
  })

  it('the identifier list holds only names, never bare numbers', () => {
    // "Just add it to the identifiers" is how this check would be neutered, so the list is bounded
    // and every entry has to be a name rather than a quantity.
    assert.ok(IDENTIFIERS.length <= 20, 'the identifier list is growing; each entry weakens the scan')
    for (const name of IDENTIFIERS) {
      assert.match(name, /[A-Za-z^.]/, `'${name}' is a bare number, not an identifier`)
    }
  })
})

describe('the copy claims nothing it cannot support', () => {
  const all = COPY_STRINGS.map((s) => `${s.path}: ${s.text}`).join('\n')

  it('never says a thing is final', () => {
    // A confirmation depth is a probability. The word belongs to no page in this estate.
    for (const banned of [/\bfinali[sz]ed?\b/i, /\birreversible\b/i, /\bcannot be reversed\b/i]) {
      assert.doesNotMatch(all, banned, `copy claims finality: ${banned}`)
    }
  })

  it('never states or implies an income', () => {
    for (const banned of [
      /\bAPY\b/i,
      /\bROI\b/i,
      /\breturn on invest/i,
      /\bprofit\b/i,
      /\bearn(ing)?s? (you|per|up to)\b/i,
      /\bpassive income\b/i,
      /\bpays? you\b/i,
    ]) {
      assert.doesNotMatch(all, banned, `copy implies an income: ${banned}`)
    }
  })

  it('never states a price or a market', () => {
    for (const banned of [/\bprice of\b/i, /\bmarket cap/i, /\$\d/, /\btrading at\b/i, /\blisted on\b/i]) {
      assert.doesNotMatch(all, banned, `copy states a price: ${banned}`)
    }
  })

  it('never says the network is live', () => {
    for (const banned of [/\bmainnet is live\b/i, /\bnow live\b/i, /\blaunched\b/i, /\bproduction network\b/i]) {
      assert.doesNotMatch(all, banned, `copy claims a running network: ${banned}`)
    }
  })

  it('and the standing notice still names every limit, on every route', () => {
    /*
     * THE INVERSE ASSERTION, AND THE MORE IMPORTANT ONE — a ban list can be satisfied by saying
     * nothing at all, so the standing state must be present and unambiguous.
     *
     * IT USED TO REQUIRE "no public Hearth network" AND "no mainnet". Both became false: mainnet
     * is published on the public tunnel (`deploy/cloudflared/config.mainnet.public.yml`) and
     * answers `eth_chainId` from off the estate. A guard that requires a false sentence is worse
     * than no guard, because the only way to pass it is to lie.
     *
     * What replaces it is every limit that did NOT change, each pinned separately so a copy edit
     * cannot drop one while keeping the others. This is the more useful shape anyway: the old
     * version leaned on one phrase carrying four meanings at once.
     */
    const { headline, body } = COPY.STANDING_STATE

    // The headline has to carry the warning on its own — it is read above the navigation on every
    // route, often by somebody who reads nothing else. It used to require the exact phrase "not an
    // established network", which is a true sentence written for an engineer; "a new network" is
    // the same claim in the words a reader arrives with. The ASSERTION is that the headline says
    // the network is new, not that it says it in one particular way.
    assert.match(headline, /new network/i)

    // EMBER has no monetary value. This is the claim that must survive every edit for ever.
    // "no liquidity" is no longer required as a separate phrase: it is the same fact as "no
    // market" said in trading vocabulary, and a reader deciding whether to mine does not have it.
    assert.match(body, /cannot be bought or sold/i)
    assert.match(body, /no price/i)
    assert.match(body, /no market/i)
    assert.match(body, /no listing/i)

    // INVERTED. This used to require "no public testnet", and the testnet is now public — so the
    // notice may not quietly START saying so again. What replaces it is the claim that actually
    // protects a reader now that a testnet URL may be published: the standing notice has to say
    // that testnet EMBER is given away and worth nothing, or a reader has two live networks in
    // front of them and no stated difference between their coins.
    assert.doesNotMatch(body, /no public testnet/i)
    assert.match(body, /testnet|test network/i)
    assert.match(body, /given away|gives away/i)
    assert.match(body, /worthless/i)

    // One site, nothing to fail over to. The fact a reader deciding whether to trust this needs.
    assert.match(body, /single site|one home server/i)
    assert.match(body, /fail over|failover/i)

    // A reorg on a short chain is a live risk, not a footnote.
    assert.match(body, /reorg/i)
  })

  it('never says the testnet cannot be reached, and never reprints the retired hostname scheme', () => {
    /*
     * TWO SENTENCES THIS SURFACE HAS ALREADY PUBLISHED ONCE AND MUST NOT PUBLISH AGAIN.
     *
     * `/node` said the testnet "is unreachable from outside" and blamed hostnames that were "two
     * labels deep", while `src/content/facts.ts` in this same repository had recorded the opposite
     * since 2026-08-05. The TLS diagnosis was correct about `<surface>.testnet.<apex>` and that
     * scheme was ABANDONED: an environment is now a suffix inside the FIRST label, so a testnet
     * name is one label deep and the existing wildcard covers it.
     *
     * Measured 2026-08-08: `rpc-testnet.cloudsforge.online` presents `*.cloudsforge.online` and
     * terminates TLS, and `rpc.testnet.cloudsforge.online` has no DNS record at all.
     *
     * ── WHY THE REACHABILITY HALF IS SCOPED AND THE HOSTNAME HALF IS NOT ───────────────────────
     *
     * A blanket ban on "unreachable" would be wrong. `CHAIN.unreachable` is an honest empty state
     * — "the chain index did not answer" — and forbidding the word outright would delete the true
     * sentence along with the false one. So the denial scan fires only on strings whose subject is
     * the testnet. The hostname scan needs no scoping, because the retired shape contains the word
     * by construction.
     *
     * WHAT THIS DOES NOT DEFEND: it does not assert that the testnet IS reachable. Nothing static
     * may, in either direction — the testnet is stopped and restarted without notice, and it was
     * not answering when this was written. `/chain` asks and renders what came back.
     */
    const CANNOT_BE_REACHED = [
      /\bunreachable\b/i,
      /\bnot reachable\b/i,
      /\bcannot be reached\b/i,
      /\bno reachable endpoint\b/i,
    ]
    /*
     * `rpc.testnet.cloudsforge.online` and `<surface>.testnet.<apex>`: a label, a dot, `testnet`,
     * a dot, and then either the placeholder or something apex-shaped. The trailing requirement is
     * what keeps `docker compose -f docker-compose.testnet.yml` — a filename this page prints on
     * purpose, and a line meant to be RUN — out of the scan, rather than an exemption that would
     * also excuse a real hostname sitting in the same field.
     */
    const RETIRED_SCHEME = /(?:[a-z0-9*_-]+|<surface>)\.testnet\.(?:<apex>|[a-z0-9-]+\.[a-z]{2,})/i

    for (const { path, text } of COPY_STRINGS) {
      if (/testnet|test network/i.test(text)) {
        for (const denial of CANNOT_BE_REACHED) {
          assert.doesNotMatch(text, denial, `${path} says the testnet cannot be reached from outside`)
        }
      }
      assert.doesNotMatch(text, RETIRED_SCHEME, `${path} prints the retired two-label testnet scheme`)
    }

    // The controls, in the shape the digit scan uses: a regex that had stopped matching would
    // otherwise let every assertion above pass while measuring nothing.
    assert.match('the testnet is unreachable from outside', CANNOT_BE_REACHED[0] as RegExp)
    assert.match('everything under *.testnet.cloudsforge.online fails', RETIRED_SCHEME)
    assert.match('a URL like <surface>.testnet.<apex>', RETIRED_SCHEME)
    assert.doesNotMatch('rpc-testnet.cloudsforge.online answers', RETIRED_SCHEME)
    assert.doesNotMatch('docker compose -f docker-compose.testnet.yml up --build', RETIRED_SCHEME)
    // And the scoping is real rather than an accident of the current copy: the empty state that
    // legitimately uses the word is still here, and still says nothing about the testnet.
    assert.match(COPY.CHAIN.unreachable.body, /did not answer/i)
    assert.doesNotMatch(COPY.CHAIN.unreachable.body, /testnet/i)
  })

  it('prints no repository path anywhere in its copy', () => {
    /*
     * THE RULE THAT REPLACED THE ONE ABOVE IT. This suite used to REQUIRE that at least twenty
     * blocks of copy each carried a `source` naming a file, and the site rendered every one of
     * them under the word "Source" in the smallest type on the page.
     *
     * That was a standard for an engineer reading a claim, applied to a page read by somebody
     * deciding whether to mine a coin. `deploy/cloudflared/config.mainnet.public.yml` under a
     * paragraph tells that reader nothing they can act on, and a public page that reads like a
     * source tree reads as unfinished rather than as honest.
     *
     * The provenance itself is NOT gone — `src/content/facts.ts` still records where every number
     * comes from, and the digit rule above still holds copy to it. What is gone is printing it,
     * and this assertion is what stops it coming back one paragraph at a time.
     */
    for (const { path, text } of COPY_STRINGS) {
      // A `command` is the exception and the only one: `/node` exists to be RUN, and a reader who
      // is there wants `docker compose -f docker-compose.testnet.yml up` in full. A filename is
      // noise under a paragraph and the whole point of the line in a terminal.
      if (path.endsWith('.command')) continue
      assert.doesNotMatch(
        text,
        /\b[a-z0-9_-]+\/[A-Za-z0-9_./-]*\.(ts|tsx|js|md|yml|yaml|json|sql|py)\b/,
        `${path} prints a repository path to the reader`,
      )
    }
  })

})

describe('no caveat denies a capability the same page renders a control for', () => {
  /*
   * ══════════════════════════════════════════════════════════════════════════════════════════════
   * WHAT THIS DEFENDS, EXACTLY
   *
   * `/mine` places its caveats ABOVE the instructions on purpose (`src/pages/mine.tsx`), and the
   * first thing under those instructions is `<BrowserMine>` — a start button that fetches
   * `/mining/template` from the node and posts nonces back to `/mining/submit`. That layout gives
   * this surface one contradiction it is structurally able to publish and no other page is: a
   * caveat, read first, telling the reader that the control below it does not work.
   *
   * It published exactly that. `MINE.caveats` carried "The browser miner cannot yet mine a block
   * this node accepts" while, measured 2026-08-08, a key from `src/mining/account.js` got HTTP 200
   * and a template from `rpc.<apex>/mining/template` carrying that key as its `coinbasePub`, and
   * `hearth/node/src/block.js` verifies `powSig` against that same `coinbasePub`.
   *
   * THE PROPERTY: while `mine.tsx` mounts the browser miner, no string under `MINE` may deny that
   * the browser miner produces work this node accepts.
   *
   * ── WHAT THIS DOES NOT DEFEND, WHICH IS MOST OF WHAT THE NAME SUGGESTS ────────────────────────
   *
   * It is NOT a general "no copy contradicts any control" checker, and cannot be: there is no
   * mechanical link from a sentence to a component, so a scan that tried would either miss
   * everything or flag every warning on the site. This reads ONE mount and ONE denial vocabulary.
   * A denial written in words that are not on the list gets through. It also says nothing about
   * any other page's controls.
   *
   * It is emphatically NOT a rule that `/mine` may not carry a caveat about mining. The opposite:
   * the caveat that REPLACED the false one — that a laptop may never win a block, because a
   * template goes stale when somebody else's arrives — is genuinely owed, and the second half of
   * this suite requires it to be present rather than forbidding it. The distinction the whole
   * thing turns on is between "the node refuses your work" (false, and denied here) and "your work
   * may never win" (true, and required here).
   * ══════════════════════════════════════════════════════════════════════════════════════════════
   */
  const minePage = readFileSync(at('src/pages/mine.tsx'), 'utf8')
  const MINE_STRINGS = COPY_STRINGS.filter((s) => s.path.startsWith('copy.MINE'))
  const caveats = COPY.MINE.caveats.items.map((item) => `${item.title} ${item.body}`).join('\n')

  /** A denial of the browser miner's ability, or of the node accepting what it produces. */
  const DENIES_THE_MINER = [
    /\b(?:browser miner|miner in the browser|browser half)\b[^.]*?\b(?:cannot|can not|can't|is unable to|does not|doesn't|will not|won't)\b/i,
    /\b(?:cannot|can not|can't|is unable to|does not|doesn't|will not|won't)\b[^.]*?\bmine a block\b/i,
    /\bnot yet\b[^.]*?\bmine a block\b/i,
    /\bthis node (?:does not|doesn't|will not|won't) accept\b/i,
  ]

  it('the premise holds: /mine really does mount the browser miner', () => {
    // If this ever goes red the assertion below is measuring nothing, so it is checked rather than
    // assumed. A caveat saying the miner does not work would be honest on a page with no miner.
    assert.match(minePage, /<BrowserMine\b/, 'mine.tsx no longer mounts BrowserMine')
    assert.match(minePage, /MINE\.caveats\.items\.map/, 'mine.tsx no longer renders the caveats')
    assert.ok(MINE_STRINGS.length >= 20, `walked only ${MINE_STRINGS.length} strings under MINE`)
  })

  it('no string on /mine denies that the browser miner produces work this node accepts', () => {
    const offenders: string[] = []
    for (const { path, text } of MINE_STRINGS) {
      for (const denial of DENIES_THE_MINER) {
        if (denial.test(text)) offenders.push(`${path}: "${text.slice(0, 90)}…" matched ${denial}`)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `/mine mounts a working miner and its copy denies it:\n  ${offenders.join('\n  ')}`,
    )
  })

  it('and the scan is not vacuous: the sentence this replaced IS caught', () => {
    const was = 'The browser miner cannot yet mine a block this node accepts'
    assert.ok(
      DENIES_THE_MINER.some((denial) => denial.test(was)),
      'the denial vocabulary no longer catches the exact sentence it was written for',
    )
    // …and does not fire on the honest caveat that replaced it, which is the harder half.
    for (const denial of DENIES_THE_MINER) assert.doesNotMatch(caveats, denial)
  })

  it('the caveat that is genuinely owed is still there, and still promises nothing', () => {
    // The INVERSE assertion, and the one that stops this being satisfied by saying nothing at all.
    // The node accepting the work is not the reader's machine winning with it, and that gap is the
    // only thing standing between an honest page and an implied income.
    assert.match(caveats, /\bwins?\b/i, '/mine no longer says anything about winning a block')
    assert.match(caveats, /\bstale\b/i, '/mine no longer says a template goes stale')
    for (const promise of [
      /\byou will (?:win|mine|find) a block\b/i,
      /\bguarantee/i,
      /\bevery (?:machine|laptop|tab) (?:wins|mines)\b/i,
    ]) {
      assert.doesNotMatch(caveats, promise, `/mine promises a block: ${promise}`)
    }
  })

  it('the caveats heading counts nothing, so closing a caveat cannot leave it wrong', () => {
    // It read "Three things this is not". A spelled-out numeral is the one quantity the digit scan
    // above structurally cannot see, and this section's membership changes whenever a limit is
    // closed — one was closed by the same commit that wrote this test.
    assert.doesNotMatch(
      COPY.MINE.caveats.title,
      /\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b/i,
      'the caveats heading counts its items again, and nothing keeps the count true',
    )
  })
})

describe('every hearth file this site links to exists', () => {
  /**
   * The links are `hearthFile(path)` calls and the citations are `hearth/<path>:<line>` strings.
   * Both name a file in a PUBLIC repository, so a reader will follow them — which makes a renamed
   * document a broken promise rather than an internal inconsistency.
   */
  const hearthRoot = at('../hearth')

  it('reports honestly when hearth is not checked out', () => {
    try {
      readdirSync(hearthRoot)
    } catch {
      console.log('UNCHECKED: the hearth document links — the repository is not checked out')
    }
    assert.ok(true)
  })

  it('names a file that exists, for every link and every citation', () => {
    let entries: string[]
    try {
      entries = readdirSync(hearthRoot)
    } catch {
      return
    }
    assert.ok(entries.length > 0)

    const referenced = new Set<string>()
    // A `hearthFile(...)` call in a page — the argument is hearth-relative, not a path here.
    for (const dir of ['src/pages', 'src/lib', 'src/components']) {
      for (const file of readdirSync(at(dir))) {
        const text = readFileSync(join(at(dir), file), 'utf8')
        for (const m of text.matchAll(/hearthFile\('([^']+)'\)/g)) referenced.add(m[1] ?? '')
      }
    }
    // `hearth/<path>:<line>` in a source field.
    for (const { text } of COPY_STRINGS) {
      for (const m of text.matchAll(/\bhearth\/([A-Za-z0-9_.\-/]+\.[a-z]+)/g)) referenced.add(m[1] ?? '')
    }
    for (const entry of Object.values(FACTS)) {
      for (const m of entry.source.matchAll(/\bhearth\/([A-Za-z0-9_.\-/]+\.[a-z]+)/g)) {
        referenced.add(m[1] ?? '')
      }
    }

    assert.ok(referenced.size >= 5, `only ${referenced.size} hearth files referenced`)
    const missing = [...referenced].filter((p) => {
      try {
        readFileSync(join(hearthRoot, p), 'utf8')
        return false
      } catch {
        return true
      }
    })
    assert.deepEqual(missing, [], `these hearth files do not exist: ${missing.join(', ')}`)
  })
})
