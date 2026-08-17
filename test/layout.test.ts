/**
 * THE TWO GRID DEFECTS THIS BUNDLE SHIPPED, AND WHY A SOURCE SCAN IS THE RIGHT GUARD FOR BOTH.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * **1. A ROW OF ONE, ON EVERY DESKTOP THERE IS.**
 *
 * The home page opens with four things a reader who has never heard of Hearth needs, in a grid
 * that carried plain `.ns-cards` — `repeat(auto-fill, minmax(20rem, 1fr))`. `.ns-main` is
 * `min(100vw − 2 × --cf-space-xl, --cf-max-w)`, so the widest that grid is ever offered is 1200px,
 * and three 320px tracks plus two 12px gaps is 984px while four is 1316px. Three columns was
 * therefore not the answer at one unlucky window size; it was the answer at 1024px and at every
 * width above it, for ever. Four tiles in three columns is three and then one — "The reward never
 * falls to nothing" alone underneath — and a row of one reads as a tile that failed to load.
 *
 * Measured in headless Chrome against the built stylesheet, before the fix: rows `[3, 1]` at
 * viewports 1024, 1100, 1200, 1280, 1440 and 1920. After it: `[1,1,1,1]` to 480, `[2,2]` from 600
 * to 1024, `[4]` from 1100 up, and no width in the sweep produces a row of one.
 *
 * **No `minmax()` floor could have fixed it, and that is arithmetic rather than taste.** With four
 * items the orphan-free column counts are 1, 2 and 4. `auto-fit` and `auto-fill` produce a
 * MONOTONE count — as the container grows it goes 1, 2, 3, 4 — and three columns fit strictly more
 * easily than four, so no floor value admits four while skipping three. Every possible
 * `repeat(auto-fill, minmax(<n>rem, 1fr))` has a band of widths that orphans; the only thing the
 * floor chooses is which band, and with the measure capped at 1168px the band that matters is the
 * whole desktop. So `.ns-cards--four` names the counts — 1 → 2 → 4 — and a container query says
 * when. `foresight-web/test/layout.test.ts` states the same rule for the same grid shape; this
 * page was asked to match it.
 *
 * **2. A 320px FLOOR IN A 288px PAGE.**
 *
 * `minmax(20rem, 1fr)` and `minmax(22rem, 1fr)` are floors the track keeps even when the container
 * is narrower than the floor. At a 320px viewport `.ns-page` is 288px wide, and both grids laid
 * out tracks wider than that, pushing the page's own content past the window on the narrowest
 * phones still sold. `min(100%, 20rem)` states the floor as an intent rather than as a promise the
 * box cannot keep, and the tiles now measure 288px in a 288px page.
 *
 * The document still scrolls sideways at 320px, and it is worth saying that this is NOT it: the
 * remaining 30px is the shared bar's "Sign in" button in `@cloudsforge/ui` (`.cf-bar__inner`),
 * which overflows on every surface in the estate and is not this bundle's to fix. The grids below
 * are inside the page at every width measured.
 *
 * ── WHY THIS FILE SCANS THE SOURCE ────────────────────────────────────────────────────────────
 *
 * Neither defect is reachable from this suite by rendering, and this bundle does not render at all
 * (`render.test.ts` says why). The facts that decide both are STATIC and they live in three
 * places: how many tiles the content module holds, which class the page puts them in, and what the
 * column tracks are. So the invariant is asserted where it lives, and the rendered result was
 * checked in a real engine at 320, 390, 480, 600, 768, 820, 900, 1024, 1100, 1200, 1280 and 1440
 * CSS px.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { HOME, MINE } from '../src/content/copy.ts'

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
const home = readFileSync(new URL('../src/pages/home.tsx', import.meta.url), 'utf8')

/**
 * The stylesheet with its comments stripped. The prose in `styles.css` quotes the declarations it
 * is explaining — including the `minmax(20rem, 1fr)` it replaced — so a scan over the raw text
 * matches the explanation and not the code.
 */
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '')

/** The page with its `{/* … *\/}` comments stripped, same reason. */
const markup = home.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

/** The column counts `.ns-cards--four` steps through. Every one of them must divide the tiles. */
const STEPS = [1, 2, 4]

describe('the four tiles under "What it is"', () => {
  it('are in the named-count grid, not the intrinsic one', () => {
    assert.match(
      markup,
      /className="ns-cards ns-cards--four"/,
      'the "what it is" tiles must carry `ns-cards--four`; plain `.ns-cards` is the auto-fill grid ' +
        'the rest of this bundle uses, and four items in it lay out three-then-one at every width ' +
        'from 1024px up',
    )
  })

  it('are a count every column step divides', () => {
    const tiles = HOME.what.items.length
    assert.ok(tiles > 0, 'HOME.what.items is empty — this test is looking in the wrong place')
    for (const columns of STEPS) {
      assert.equal(
        tiles % columns,
        0,
        `${tiles} tiles do not fill ${columns} columns, so the last row is short. The grid steps ` +
          `${STEPS.join(' → ')}; either write the new tile as a PAIR, or move the steps in ` +
          `styles.css with it.`,
      )
    }
  })

  it('step 1 → 2 → 4 and never 3', () => {
    // Bounded at the next rule, not at the end of the file: `.ns-details` below is legitimately an
    // `auto-fill` grid — it is a definition list of one-line values, where three columns and a
    // short last row is the right answer — and a scan that ran past this block would read its
    // track listing as this one's.
    const start = declarations.indexOf('.ns-cards--four')
    assert.notEqual(start, -1, 'the four-tile grid is gone from the stylesheet')
    const end = declarations.indexOf('.ns-card {', start)
    assert.notEqual(end, -1, '`.ns-card` no longer follows the grid — this scan has lost its bound')
    const rule = declarations.slice(start, end)
    assert.match(rule, /\.ns-cards--four\s*\{\s*grid-template-columns:\s*1fr;/)
    assert.match(rule, /@container ns-page \(min-width: 34rem\)[\s\S]*?repeat\(2, 1fr\)/)
    assert.match(rule, /@container ns-page \(min-width: 64rem\)[\s\S]*?repeat\(4, 1fr\)/)
    assert.doesNotMatch(
      rule,
      /repeat\(3, 1fr\)|repeat\(auto-f(it|ill)/,
      'three columns orphans the fourth tile, and an intrinsic track listing cannot avoid three ' +
        'while allowing four — see the header of this file',
    )
  })

  it('ask the page for its width rather than the window', () => {
    assert.match(
      declarations,
      /\.ns-page\s*\{[^}]*container-type:\s*inline-size/,
      '`@container ns-page` needs a container to ask; without `container-type` on `.ns-page` the ' +
        'queries never match and the tiles are one column at every width',
    )
    assert.match(
      declarations,
      /\.ns-page\s*\{[^}]*container-name:\s*ns-page/,
      'the queries name `ns-page`; an unnamed container is not the one they asked for',
    )
  })
})

/**
 * AND THE SAME DEFECT SHIPPED A SECOND TIME, ON A PAGE THIS FILE WAS NOT READING.
 *
 * The rule above was written for the home page and asserted against the home page, so `/mine`
 * carried four tiles under "What the chain does today" in plain `.ns-cards` for as long as the
 * modifier had existed — three and then one, at every desktop width, exactly the row of one the
 * header calls "a tile that failed to load". It was found in a screenshot rather than by this
 * suite, which is the definition of a guard scoped too narrowly.
 *
 * So the scan is now over EVERY four-item grid this bundle renders, keyed on the content array
 * rather than on the page: a fifth tile added to either section fails the count case below, and a
 * new four-item section in plain `.ns-cards` fails the class case. Both are the same one-line fix.
 */
describe('every four-tile grid, not merely the first one that shipped the defect', () => {
  const FOURS = [
    { what: 'HOME.what.items', tiles: HOME.what.items.length, file: home },
    {
      what: 'MINE.how.items',
      tiles: MINE.how.items.length,
      file: readFileSync(new URL('../src/pages/mine.tsx', import.meta.url), 'utf8'),
    },
  ] as const

  for (const grid of FOURS) {
    it(`${grid.what} holds a count the steps divide`, () => {
      assert.ok(grid.tiles > 0, `${grid.what} is empty — this test is looking in the wrong place`)
      for (const columns of STEPS) {
        assert.equal(
          grid.tiles % columns,
          0,
          `${grid.tiles} tiles do not fill ${columns} columns, so the last row is short. The grid ` +
            `steps ${STEPS.join(' → ')}; either write the new tile as a PAIR, or move the steps ` +
            `in styles.css with it.`,
        )
      }
    })

    it(`${grid.what} is rendered in the named-count grid`, () => {
      const markup = grid.file.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      assert.match(
        markup,
        /className="ns-cards ns-cards--four"/,
        `${grid.what} has four tiles, and plain \`.ns-cards\` lays four out as three-then-one at ` +
          'every width from 1024px up',
      )
    })
  }
})

describe('every intrinsic grid', () => {
  /**
   * A bare length floor in `minmax()` is a MINIMUM the track keeps even when the grid is narrower
   * than it. `min(100%, <n>rem)` is the same intent expressed as a ceiling on the floor, and it is
   * the difference between a 288px page and a sideways scrollbar.
   */
  it('has a floor that collapses when the container is narrower than it', () => {
    const floors = [...declarations.matchAll(/minmax\(\s*([^,]+?)\s*,/g)].map((m) => m[1] ?? '')
    assert.ok(floors.length > 0, 'no minmax() tracks found — this test is looking in the wrong file')
    /** The narrowest `.ns-page` this bundle is laid out in: a 320px viewport less `.ns-main`'s gutters. */
    const NARROWEST_PAGE_PX = 320 - 2 * 16

    for (const floor of floors) {
      const bare = /^(\d+(?:\.\d+)?)(px|rem)$/.exec(floor)
      if (!bare) continue // a var(), a min(), an auto — already relative, or not a length
      const px = Number.parseFloat(bare[1] ?? '0') * (bare[2] === 'rem' ? 16 : 1)
      assert.ok(
        px <= NARROWEST_PAGE_PX,
        `\`minmax(${floor}, …)\` is a floor the track keeps even when the grid is narrower than ` +
          `it, and ${px}px does not fit the ${NARROWEST_PAGE_PX}px this page gets at a 320px ` +
          `viewport — the whole document scrolls sideways. Write it as \`min(100%, ${floor})\`.`,
      )
    }
  })
})
