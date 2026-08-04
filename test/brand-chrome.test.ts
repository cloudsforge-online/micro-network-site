/**
 * THE BRAND CHROME IS MICRO-BRAND'S, BYTE FOR BYTE, AND THE DESCRIPTION STILL SAYS THE TRUTH.
 *
 * Two halves, and the second one is specific to this surface.
 *
 * **1. The bytes.** `public/` holds copies of `brand/assets/network/`, and they are compared rather
 * than merely named: a file with the right name and the wrong contents passes a naming check and
 * ships the wrong icon. `network` is entitled to the FULL set of eight (`brand/README.md:36`), and
 * four of them are browser chrome that a hostname cannot inherit — that is what is shipped. The
 * other four are consumed by things that are not a browser.
 *
 * **2. The description.** This is the one string a search engine and a link preview show WITHOUT
 * the page around it, which makes it the easiest place on this surface to imply a traded currency
 * by omission. Mainnet is reachable now, so the fact it must not leave out is no longer "there is
 * no mainnet" — it is that EMBER has no monetary value and that no public testnet endpoint exists.
 * Both the `description` and the `og:description` are required to carry both clauses.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const at = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))
const html = readFileSync(at('index.html'), 'utf8')

/** The four assets a browser asks for, and the only ones this bundle ships. */
const SHIPPED = [
  'favicon-32x32.png',
  'favicon-192x192.png',
  'favicon-512x512.png',
  'og-1200x630.png',
] as const

describe('the shipped chrome', () => {
  it('is exactly the four a browser asks for', () => {
    const present = readdirSync(at('public')).sort()
    assert.deepEqual(present, [...SHIPPED].sort())
  })

  it('is linked from index.html', () => {
    for (const asset of SHIPPED) {
      assert.ok(html.includes(`/${asset}`), `index.html does not reference /${asset}`)
    }
  })

  it('is copied into the image, which is the line the template once did not have', () => {
    // Vite copies publicDir into dist at build time, so the assets only reach the image if they are
    // in the build context. The web template's Dockerfile used to copy tsconfig, vite.config,
    // index.html and src — and not public — so four frontends shipped an image with no favicon in
    // it while their own brand test went on passing, because it reads the SOURCE tree.
    assert.match(readFileSync(at('Dockerfile'), 'utf8'), /^COPY public \.\/public$/m)
  })
})

describe('the bytes are micro-brand’s', () => {
  const brand = at('../brand/assets/network')

  it('reports honestly when micro-brand is not checked out', () => {
    if (!existsSync(brand)) console.log('UNCHECKED: the brand bytes — micro-brand is not checked out')
    assert.ok(true)
  })

  it('every shipped asset is byte-identical to the source set', () => {
    if (!existsSync(brand)) return
    for (const asset of SHIPPED) {
      const mine = readFileSync(at(`public/${asset}`))
      const theirs = readFileSync(`${brand}/${asset}`)
      assert.ok(mine.equals(theirs), `public/${asset} differs from brand/assets/network/${asset}`)
    }
  })

  it('and `network` really is entitled to the full set, which is what makes the mark legitimate', () => {
    if (!existsSync(brand)) return
    // Unlike `explorer` and `status`, which carry markId: null deliberately (`brand/README.md:62-67`)
    // and whose repositories assert the ABSENCE of a mark. This surface is the one they belong to,
    // so the assertion here is the opposite one.
    const source = readdirSync(brand).sort()
    for (const kind of ['mark-1024x1024.png', 'wordmark-1024x384.png', 'social-1280x640.png']) {
      assert.ok(source.includes(kind), `brand/assets/network/${kind} is missing from the full set`)
    }
    const readme = at('../brand/README.md')
    if (!existsSync(readme)) return
    assert.match(
      readFileSync(readme, 'utf8'),
      /\| `network` \| Forge Network \| `#d6412f` molten \| full \| 8 \|/,
      'brand/README.md no longer gives `network` the full set',
    )
  })

  it('but the mark itself is NOT shipped as a PNG, because the design system draws it', () => {
    // `<Mark surface="network">` renders SVG that reads `--cf-accent`
    // (`ui/packages/ui/src/index.tsx:453`, drawing at `:330`), so it wears this surface's molten
    // without a second copy of the colour and costs no request. A PNG in public/ would be a second
    // copy that ages.
    assert.equal(
      readdirSync(at('public')).some((f) => /mark|wordmark|social/.test(f)),
      false,
      'a mark is being shipped as a raster; the design system draws it',
    )
    assert.match(readFileSync(at('src/components/shell.tsx'), 'utf8'), /<Mark surface=\{PRODUCT\}/)
  })
})

describe('the page names the right accent block', () => {
  it('sets data-cf-product="network", which tokens.css declares', () => {
    assert.match(html, /data-cf-product="network"/)
    const tokens = at('../ui/packages/ui/src/tokens.css')
    if (!existsSync(tokens)) {
      console.log('UNCHECKED: the accent selector — micro-ui is not checked out')
      return
    }
    // The check that catches a silent fall-through to the company ember, which is what
    // platform/apps/admin/index.html did for as long as nobody looked.
    assert.match(readFileSync(tokens, 'utf8'), /\[data-cf-product='network'\]\s*\{/)
  })

  it('and the warm substrate every product frontend uses', () => {
    assert.match(html, /data-cf-substrate="warm"/)
  })
})

describe('the description says what the network is not', () => {
  /*
   * BOTH OF THESE USED TO REQUIRE "no mainnet", AND THAT SENTENCE IS NOW FALSE.
   *
   * Mainnet is published on the public tunnel (`deploy/cloudflared/config.mainnet.public.yml:123`)
   * and answers `eth_chainId` from off the estate, so a guard requiring a description to say there
   * is no mainnet could only be satisfied by lying in the one string a search engine shows.
   *
   * Flipped to the two clauses that did NOT change, and that a link preview is the likeliest place
   * to blur: EMBER has no monetary value, and there is no reachable public testnet.
   */
  it('the meta description does', () => {
    const m = /<meta\s+name="description"\s+content="([^"]*)"/.exec(html)
    assert.ok(m, 'index.html has no description')
    assert.match(m[1] ?? '', /no EMBER of any monetary value/i)
    assert.match(m[1] ?? '', /no public testnet/i)
  })

  it('and so does the og:description, which is read entirely on its own', () => {
    const m = /<meta\s+property="og:description"\s+content="([^"]*)"/.exec(html)
    assert.ok(m, 'index.html has no og:description')
    assert.match(m[1] ?? '', /no EMBER of any monetary value/i)
    assert.match(m[1] ?? '', /no public testnet/i)
  })

  it('neither claims a price or a running chain', () => {
    // THE COMMENTS ARE STRIPPED FIRST, and this file learned that the hard way rather than by
    // being careful: index.html's own comments explain WHY the description must not imply a live
    // network, so they contain the words this check forbids. Six guards in this estate have failed
    // a build by matching the sentence explaining the rule, and a rule that can only be satisfied
    // by deleting its explanation is a rule that gets deleted. Only the two `content` attributes
    // are scanned, because they are the only strings a reader ever sees.
    const shown = [...html.matchAll(/<meta\s+(?:name|property)="(?:description|og:description|og:title)"\s+content="([^"]*)"/g)]
      .map((m) => m[1] ?? '')
      .join(' ')
    assert.ok(shown.length > 100, 'no description was found, so this check measured nothing')
    for (const banned of [/\bprice\b/i, /\blive\b/i, /\blaunched\b/i, /\$\d/]) {
      assert.doesNotMatch(shown, banned, `a description claims ${banned}`)
    }
  })
})

describe('there is ONE og block, not two', () => {
  it('declares each property exactly once', () => {
    // foresight-web/index.html declares og:type, og:title and og:description twice — the second set
    // silently wins in every crawler and the first is dead text nobody edits. Reported there;
    // counted here.
    for (const property of ['og:type', 'og:title', 'og:description', 'og:image']) {
      const count = [...html.matchAll(new RegExp(`property="${property}"`, 'g'))].length
      assert.equal(count, 1, `og block declares ${property} ${count} times`)
    }
  })

  it('and the card image is a RELATIVE path, so it resolves against whichever origin served it', () => {
    assert.match(html, /property="og:image" content="\/og-1200x630\.png"/)
  })
})
