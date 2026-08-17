/**
 * `prefers-reduced-motion: reduce` IS ANSWERED FOR EVERY MOVING THING, NOT FOR THE ONE WE RECALL.
 *
 * The estate has shipped this defect once already. `ui/packages/ui/src/ui.css` carried a hand-kept
 * list of selectors inside its reduced-motion block; three controls — `.cf-foot__sociallink`,
 * `.cf-input`, `.cf-select` — were added to the stylesheet afterwards and went on animating for
 * readers who had asked the whole platform to stop moving. Nobody saw it, because the block LOOKED
 * thorough. micro-ui#23 fixed it by deriving the list from the stylesheet instead of remembering
 * it, and this file is that check pointed at this surface's own CSS.
 *
 * The property being animated does not get a vote. A 120ms colour fade is not a carousel, but the
 * media query is a request, not a severity threshold, and a rule that admits exceptions is a rule
 * that is one commit from admitting the carousel.
 *
 * ── The one deliberate exception, and why it is not `none` ────────────────────────────────────
 *
 * `.wt-spinner` is SLOWED rather than stopped. A spinner frozen mid-turn is a page that looks
 * crashed, which is a worse answer to "please reduce motion" than a slow rotation. So this file
 * accepts any declaration that changes the animation — `none` or a longer duration — and requires
 * only that the selector be answered at all.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const CSS = readFileSync(fileURLToPath(new URL('../src/styles.css', import.meta.url)), 'utf8')
  // Comments first, and for the usual reason: the block above quotes `transition` in prose while
  // explaining the rule, and a scan over raw text would collect the sentence as a selector.
  .replace(/\/\*[\s\S]*?\*\//g, '')

/** A block, as a scanner sees it: the text before the `{`, and the text between the braces. */
type Block = { readonly prelude: string; readonly body: string; readonly at: number }

/**
 * Top-level blocks of `css`, brace-balanced.
 *
 * A regexp cannot do this: `@media (…) { .a { … } }` nests, and the lazy match that reads
 * correctly stops at the FIRST `}` — which is the inner rule's, so the media query appears to
 * contain nothing and every selector inside it is invisible to the check.
 */
function blocks(css: string): Block[] {
  const found: Block[] = []
  let depth = 0
  let start = 0
  let open = -1
  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i]
    if (ch === '{') {
      if (depth === 0) open = i
      depth += 1
    } else if (ch === '}') {
      depth -= 1
      if (depth === 0 && open >= 0) {
        found.push({
          prelude: css.slice(start, open).trim(),
          body: css.slice(open + 1, i),
          at: css.slice(0, open).split('\n').length,
        })
        start = i + 1
        open = -1
      }
    }
  }
  return found
}

const top = blocks(CSS)

const REDUCE = /@media\s*\(prefers-reduced-motion:\s*reduce\)/

/** Every selector answered inside a reduced-motion block, however many blocks there are. */
function answered(): Set<string> {
  const out = new Set<string>()
  for (const block of top.filter((b) => REDUCE.test(b.prelude))) {
    for (const rule of blocks(block.body)) {
      if (!/\b(transition|animation)(-[a-z]+)?\s*:/.test(rule.body)) continue
      for (const sel of rule.prelude.split(',')) out.add(sel.trim())
    }
  }
  return out
}

/** Every selector that MOVES: declares a transition or an animation, outside a reduce block. */
function moving(): { sel: string; line: number }[] {
  const out: { sel: string; line: number }[] = []
  const collect = (rule: Block): void => {
    // `animation-duration` alone is how the spinner is answered, not how something starts moving;
    // a rule that only slows an animation it does not declare is not a new mover.
    if (!/\b(transition|animation)\s*:/.test(rule.body)) return
    if (/\b(transition|animation)\s*:\s*none\b/.test(rule.body)) return
    for (const sel of rule.prelude.split(',')) out.push({ sel: sel.trim(), line: rule.at })
  }
  for (const block of top) {
    if (REDUCE.test(block.prelude)) continue
    if (block.prelude.startsWith('@keyframes')) continue
    // `@media`, `@supports` and `@container` hold rules; everything else IS one.
    if (block.prelude.startsWith('@')) for (const rule of blocks(block.body)) collect(rule)
    else collect(block)
  }
  return out
}

describe('the reduced-motion answer is derived from the stylesheet, not remembered', () => {
  it('finds motion at all, so this cannot pass by matching nothing', () => {
    assert.ok(moving().length >= 3, `found ${moving().length} moving selectors`)
    assert.ok(answered().size >= 3, `found ${answered().size} answered selectors`)
  })

  it('answers every selector that transitions or animates', () => {
    const ans = answered()
    const unanswered = moving().filter((m) => !ans.has(m.sel))
    assert.deepEqual(
      unanswered.map((m) => `${m.sel} (src/styles.css:${m.line})`),
      [],
      'these move under `prefers-reduced-motion: reduce`. Add them to a reduced-motion block; ' +
        'the one under the hearth rule is where the transitions live.',
    )
  })

  it('answers nothing that does not move, because a stale name reads as coverage', () => {
    // The other half of the same failure. A selector listed in the reduce block after the rule it
    // referred to was renamed makes the block look longer and cover less.
    const move = new Set(moving().map((m) => m.sel))
    // The spinner declares its animation and is answered by a slower duration rather than by
    // `none`, so it is a mover; everything else in a reduce block must be one too.
    const stale = [...answered()].filter((sel) => !move.has(sel))
    assert.deepEqual(stale, [], 'these are answered under reduce but nothing by that name moves')
  })

  it('the spinner is slowed rather than stopped', () => {
    // Pinned because the obvious "fix" for the test above is `animation: none`, and a frozen
    // spinner tells a reader the page has crashed.
    const block = top.find((b) => REDUCE.test(b.prelude) && b.body.includes('.wt-spinner'))
    assert.ok(block, 'the spinner is no longer answered under reduced motion')
    assert.match(block.body, /\.wt-spinner\s*\{[^}]*animation-duration:/)
    assert.doesNotMatch(block.body, /\.wt-spinner\s*\{[^}]*animation:\s*none/)
  })
})
