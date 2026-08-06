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
    const { headline, body, source } = COPY.STANDING_STATE

    // Reachable is not established, and the headline has to say the second half itself — it is
    // read on its own above the navigation on every route.
    assert.match(headline, /not an established network/i)

    // EMBER has no monetary value. This is the claim that must survive every edit for ever.
    assert.match(body, /no price/i)
    assert.match(body, /no market/i)
    assert.match(body, /no listing/i)
    assert.match(body, /no liquidity/i)

    // INVERTED. This used to require "no public testnet", and the testnet is now public — so the
    // notice may not quietly START saying so again. What replaces it is the claim that actually
    // protects a reader now that a testnet URL may be published: the standing notice has to say
    // that testnet EMBER is given away and worth nothing, or a reader has two live networks in
    // front of them and no stated difference between their coins.
    assert.doesNotMatch(body, /no public testnet/i)
    assert.match(body, /testnet/i)
    assert.match(body, /given away/i)
    assert.match(body, /worthless/i)

    // One home server, no failover. The fact a reader deciding whether to trust this needs.
    assert.match(body, /one home server/i)
    assert.match(body, /no failover/i)

    // A reorg on a short chain is a live risk, not a footnote.
    assert.match(body, /reorg/i)

    // And it is still cited. Into micro-deploy now rather than into hearth: the hostname list and
    // the TLS note are what actually decide what a stranger can reach, and they are in this
    // estate's own repository rather than in the chain's.
    //
    // THE FILE, NOT A LINE IN IT. This required `deploy/….yml:<line>`, which made a line number a
    // condition of the copy passing — a position in a repository this one does not own and does not
    // watch. micro-deploy edits that file whenever a hostname moves, and nothing runs this suite
    // when it does.
    assert.match(source, /deploy\/[A-Za-z0-9_.\-/]+\.yml\b/)
    assert.doesNotMatch(source, /\.yml:\d+/, 'the standing notice cites a LINE in micro-deploy')
  })

  it('every block of copy that makes a claim carries a source', () => {
    // Counted rather than spot-checked: a section added without one would otherwise be invisible.
    const sources = COPY_STRINGS.filter((s) => s.path.endsWith('.source'))
    assert.ok(sources.length >= 20, `only ${sources.length} sourced blocks; copy has grown uncited`)
    for (const { path, text } of sources) {
      assert.match(text, /[A-Za-z0-9_.\-/]+\.[a-z]+/, `${path} is not a path`)
    }
  })

  it('cites Hearth itself more than anything else, because that is what it is describing', () => {
    const sources = COPY_STRINGS.filter((s) => s.path.endsWith('.source')).map((s) => s.text)
    const hearth = sources.filter((s) => s.includes('hearth/')).length
    assert.ok(hearth >= 15, `only ${hearth} sources reach into hearth/`)
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
