/**
 * WHAT THE PAGES ARE ALLOWED TO PUT ON SCREEN.
 *
 * There is no DOM in this suite on purpose: jsdom is a second browser implementation to keep
 * current, it disagrees with real ones in exactly the places that matter, and a test that renders a
 * component in it proves the component renders in jsdom. What IS checked here is the SHAPE of the
 * page modules — which is where every rule this surface is held to can actually be broken.
 *
 * The three rules, each of which this estate has broken somewhere:
 *
 *   1. **A figure about the network reaches the screen through `<Figure>` and nowhere else.** Three
 *      of its four states carry no value, so there is no path from an absence to a digit — unless a
 *      page formats a nullable height itself, which is what is grepped for.
 *   2. **The disclaimers exist once.** The faucet's terms string is the service's
 *      (`faucet/src/server.ts:358-360`) and is rendered verbatim; a second wording here would be a
 *      second thing to keep true, and the softer of the two is the one a reader would quote.
 *   3. **Every claim carries its source, on screen.** `org/templates/README.template.md:18` — "A
 *      claim nobody can check is worse than no claim, because it is believed."
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const at = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))
const read = (p: string) => readFileSync(at(p), 'utf8')

const PAGES = readdirSync(at('src/pages')).filter((f) => f.endsWith('.tsx'))

/** A page with its comments stripped. Every rule below is about CODE, not about the prose. */
function code(file: string): string {
  return readFileSync(join(at('src/pages'), file), 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n')
}

describe('the pages are the five routes and nothing else', () => {
  it('finds them, so this cannot pass on an empty directory', () => {
    assert.equal(PAGES.length, 6, `expected five pages and a 404, found ${PAGES.join(', ')}`)
  })
})

describe('no page renders a height except through Figure', () => {
  it('no page coalesces a null to a number', () => {
    // The one way to break the union. `?? 0` in a page would turn "not observed" into a confident
    // nought, which is the exact defect the whole four-state type exists to prevent.
    for (const file of PAGES) {
      const source = code(file)
      assert.doesNotMatch(source, /\?\?\s*0\b/, `src/pages/${file} coalesces to zero`)
      assert.doesNotMatch(source, /\|\|\s*0\b/, `src/pages/${file} coalesces to zero`)
    }
  })

  it('no page does arithmetic on a height', () => {
    // `tipHeight - indexedHeight` would recompute the lag rather than reading `lagBlocks`, and on a
    // pair of nulls it produces NaN — which formats as a word rather than as an absence.
    for (const file of PAGES) {
      assert.doesNotMatch(
        code(file),
        /(tipHeight|indexedHeight|lagBlocks)\s*[-+*/]/,
        `src/pages/${file} does arithmetic on a height instead of reading the one the service sent`,
      )
    }
  })

  it('the chain page renders every height through Figure', () => {
    const chain = code('chain.tsx')
    for (const field of ['indexedHeight', 'tipHeight', 'lagBlocks', 'chainId']) {
      assert.match(
        chain,
        new RegExp(`figureOf\\(doc\\.${field}\\)`),
        `src/pages/chain.tsx renders ${field} without going through figureOf`,
      )
    }
    // …and it renders the FAILED panel with figures too, so a reader sees WHICH facts are missing
    // rather than merely that some are.
    assert.match(chain, /unfetched\(CHAIN\.crossOrigin\.title\)/)
  })

  it('and it never prints a raw height', () => {
    // `{doc.tipHeight}` in JSX would render `null` as nothing at all — an empty cell, which reads
    // as a rendering bug rather than as an answer.
    assert.doesNotMatch(code('chain.tsx'), /\{doc\.(tipHeight|indexedHeight|lagBlocks)\}/)
  })
})

describe('the disclaimers exist once', () => {
  it('the faucet page renders the service’s own terms string and writes no second one', () => {
    const faucet = code('faucet.tsx')
    assert.match(faucet, /\{terms\.terms\}/, 'the service-supplied terms are no longer rendered')
    // No local paraphrase. The three phrases the service's string carries must not be re-typed.
    for (const phrase of ['has no value', 'not tradeable', 'reset without notice']) {
      assert.doesNotMatch(
        faucet,
        new RegExp(phrase, 'i'),
        `src/pages/faucet.tsx writes its own '${phrase}' beside the one the service serves`,
      )
    }
  })

  it('the income caveat is one exported string, not six paraphrases', () => {
    const format = read('src/lib/format.ts')
    assert.match(format, /export const NOT_AN_INCOME/)
    // The page that mentions mining renders it and does not restate it.
    assert.match(code('mine.tsx'), /\{NOT_AN_INCOME\}/)
    const others = PAGES.filter((f) => f !== 'mine.tsx')
    for (const file of others) {
      assert.doesNotMatch(code(file), /\bincome\b/i, `src/pages/${file} has its own income wording`)
    }
  })

  it('every page that mentions mining carries the caveat ABOVE the reward', () => {
    // Order matters more than presence: `hearth/docs/mining.md:5-9` records that mixing what is
    // shipped with what is designed "is what produced the claim that Homefire is
    // non-outsourceable". A caveat under a reward is a caveat nobody reads.
    const mine = code('mine.tsx')
    const caveat = mine.indexOf('NOT_AN_INCOME')
    const reward = mine.indexOf('MINE.how')
    assert.ok(caveat > 0 && reward > 0)
    assert.ok(caveat < reward, 'the income caveat is rendered after the description of the reward')
  })
})

describe('every claim on screen carries its source', () => {
  it('each page renders at least one Cite', () => {
    for (const file of PAGES) {
      if (file === 'not-found.tsx') continue // nothing on it is a claim about the world
      assert.match(code(file), /<Cite source=/, `src/pages/${file} makes claims and cites nothing`)
    }
  })

  it('the standing state notice is in the shell, so it is on every route', () => {
    // Not on the home page only. A reader arriving on /mine from a search result has not read the
    // home page and would otherwise spend their whole visit believing there is a network.
    const shell = read('src/components/shell.tsx')
    assert.match(shell, /STANDING_STATE\.headline/)
    assert.match(shell, /STANDING_STATE\.body/)
    assert.match(shell, /<Cite source=\{STANDING_STATE\.source\}/)
  })
})

describe('the home page makes no request', () => {
  it('imports neither client', () => {
    // Not because a request would be refused — the chain read is anonymous — but because there is
    // no question on this page that a service answers, and a page that renders a spinner over a
    // paragraph of prose has made the prose wait for a service.
    const home = read('src/pages/home.tsx')
    assert.doesNotMatch(home, /from '\.\.\/lib\/chainstatus\.ts'/)
    assert.doesNotMatch(home, /from '\.\.\/lib\/faucet\.ts'/)
    assert.doesNotMatch(home, /useResource/)
  })
})

describe('the 404 page tells the reader the server agreed', () => {
  it('names the status, because that is what makes a broken link diagnosable', () => {
    const page = read('src/pages/not-found.tsx')
    assert.match(page, /fact\('httpNotFound'\)/)
    assert.match(page, /The server answered/)
  })
})

describe('the failed state on the chain page explains itself with citations', () => {
  it('renders the cross-origin note and its source inside Failed', () => {
    // A generic failure sentence plus a specific, CITED explanation is strictly better than either
    // alone — and strictly better than a specific explanation invented in the error handler, which
    // is how this estate keeps shipping confident wrong diagnoses.
    const chain = code('chain.tsx')
    assert.match(chain, /<Failed[\s\S]*?CHAIN\.crossOrigin\.body[\s\S]*?CHAIN\.crossOrigin\.source/)
  })

  it('and offers a retry, because the reason may stop being true without a reload', () => {
    assert.match(code('chain.tsx'), /onRetry=\{status\.reload\}/)
  })
})
