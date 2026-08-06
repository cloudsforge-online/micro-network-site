/**
 * The pieces every page is built from, including the one that carries this surface's whole rule.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `<Figure>` IS THE ONLY WAY A NUMBER ABOUT THE NETWORK REACHES THE SCREEN.
 *
 * `micro-status-web` made green-on-unknown structurally unreachable rather than merely unlikely:
 * `status-web/src/lib/degrade.ts` records that **no branch of its failure reducer can produce
 * `operational`**, so the only route to that word runs through a complete document. The equivalent
 * here is that no branch of this component can produce a digit from an absence — the `Figure` union
 * (`src/lib/chainstatus.ts`) has four cases and three of them carry no value at all, so there is
 * nothing to render but a sentence.
 *
 * `test/render.test.ts` asserts that no page formats a height any other way, and that this file
 * contains no `?? 0`, no `|| 0` and no `Number(` against a possibly-absent field. A rule that lives
 * only in a reviewer's attention is a rule this estate has already broken.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */
import type { ReactNode } from 'react'
import type { Figure as FigureState } from '../lib/chainstatus.ts'
import { count, type Tone } from '../lib/format.ts'

/* ══════════════════════════════ the figure ══════════════════════════════ */

/**
 * A number about the network, or the reason there is not one.
 *
 * `unit` is appended to a KNOWN value only. An absence has no unit, because "blocks" after "not
 * observed" reads as a quantity of nothing rather than as an absence.
 */
export function Figure({ value, unit }: { value: FigureState; unit?: string | undefined }) {
  switch (value.state) {
    case 'known':
      return (
        <span className="ns-figure">
          <span className="cf-num ns-figure__n">{count(value.value)}</span>
          {unit && <span className="ns-figure__unit">{unit}</span>}
        </span>
      )
    case 'unobserved':
      return (
        <span className="ns-absent" title="The chain index answered, and had nothing to report">
          not observed
        </span>
      )
    case 'unfetched':
      return (
        <span className="ns-absent" title={value.why}>
          could not be fetched
        </span>
      )
    case 'pending':
      return (
        <span className="ns-absent" aria-live="polite">
          asking…
        </span>
      )
    default: {
      // Exhaustive. A fifth state added upstream must not fall through to something that looks like
      // a rendered value; it fails to compile instead.
      const unreachable: never = value
      throw new Error(`unhandled figure state: ${JSON.stringify(unreachable)}`)
    }
  }
}

/**
 * A yes/no about the network, with the same four states.
 *
 * `halted` is a boolean upstream (`indexer/src/reads.ts`) and cannot be null, but the panel it
 * sits in can still be pending or unfetched — and rendering "not halted" for a panel that never
 * answered would be the boolean version of the defect `Figure` exists to stop.
 */
export function Claim({
  known,
  value,
  yes,
  no,
  why,
}: {
  known: boolean
  value: boolean
  yes: string
  no: string
  why?: string | undefined
}) {
  if (!known) {
    return (
      <span className="ns-absent" title={why ?? 'not established'}>
        could not be established
      </span>
    )
  }
  return <span>{value ? yes : no}</span>
}

/* ══════════════════════════════ layout ══════════════════════════════ */

export function Page({ children }: { children: ReactNode }) {
  return <div className="ns-page">{children}</div>
}

export function PageHead({
  eyebrow,
  title,
  standfirst,
}: {
  eyebrow?: string | undefined
  title: string
  standfirst?: string | undefined
}) {
  return (
    <header className="ns-page__head">
      {eyebrow && <p className="ns-eyebrow">{eyebrow}</p>}
      <h1 className="ns-page__title">{title}</h1>
      {standfirst && <p className="ns-page__standfirst">{standfirst}</p>}
    </header>
  )
}

export function Section({
  title,
  lede,
  id,
  children,
}: {
  title: string
  lede?: string | undefined
  id?: string | undefined
  children: ReactNode
}) {
  return (
    <section className="ns-section" {...(id ? { id, 'aria-labelledby': `${id}-t` } : {})}>
      <h2 className="ns-section__title" {...(id ? { id: `${id}-t` } : {})}>
        {title}
      </h2>
      {lede && <p className="ns-section__lede">{lede}</p>}
      {children}
    </section>
  )
}

/** A label and its value, as a definition pair. The value may be a node — a figure, a badge. */
export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ns-detail">
      <dt className="ns-detail__label">{label}</dt>
      <dd className="ns-detail__value">{children}</dd>
    </div>
  )
}

/**
 * A citation, rendered.
 *
 * ON SCREEN, not only in a comment. This surface asks a reader to believe things about a chain
 * they cannot run and a repository they have not read, and the README template states the standard
 * in one line (`org/templates/README.template.md`): "A claim nobody can check is worse than no
 * claim, because it is believed." Every block of copy on this site carries the path and line it
 * came from, in the smallest type on the page, and `test/citations.test.ts` checks that each one
 * names a line that exists.
 */
export function Cite({ source }: { source: string }) {
  return (
    <p className="ns-cite">
      <span className="ns-cite__label">Source</span>{' '}
      <code className="cf-num ns-cite__path">{source}</code>
    </p>
  )
}

/** A plain advisory panel. `warn` for something the reader must weigh; never for an error. */
export function Note({
  tone = 'plain',
  title,
  children,
}: {
  tone?: 'plain' | 'warn' | 'accent'
  title?: string | undefined
  children: ReactNode
}) {
  return (
    <aside className={`ns-note ns-note--${tone}`}>
      <span className="ns-note__icon" aria-hidden="true">
        {tone === 'warn' ? '▲' : tone === 'accent' ? '◐' : '·'}
      </span>
      <div className="ns-note__body">
        {title && <p className="ns-note__title">{title}</p>}
        {children}
      </div>
    </aside>
  )
}

/** A state, as a word, a glyph and a tone — in that order of importance. See `format.ts`. */
export function StateBadge({ tone, title }: { tone: Tone; title?: string | undefined }) {
  return (
    <span className={`ns-badge ns-badge--${tone.tone}`} title={title ?? tone.meaning}>
      <span className="ns-badge__glyph" aria-hidden="true">
        {tone.glyph}
      </span>
      <span className="ns-badge__word">{tone.word}</span>
    </span>
  )
}

/**
 * A hex string: monospace, selectable whole, and never truncated in the DOM.
 *
 * Truncation is the enemy on this surface for the same reason it is on the explorer: the reason
 * somebody is looking at an address is to compare it with one they hold, and `0x1234…abcd` cannot
 * be compared.
 */
export function Hex({ value }: { value: string }) {
  return (
    <code className="cf-num ns-hex" title={value}>
      {value}
    </code>
  )
}

/** A command a reader will copy. Selectable in one gesture, and never wrapped mid-token. */
export function Command({ children }: { children: string }) {
  return (
    <pre className="ns-cmd">
      <code className="cf-num">{children}</code>
    </pre>
  )
}
