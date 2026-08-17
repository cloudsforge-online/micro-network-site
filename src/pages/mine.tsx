/**
 * Mining.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * THE CAVEATS COME BEFORE THE INSTRUCTIONS, AND THAT ORDER IS THE POINT.
 *
 * `hearth/docs/mining.md` is a warning the project wrote about its own document: it "previously
 * mixed" what is shipped with what is designed, "and the mixing is what produced the claim that
 * Homefire is non-outsourceable". A marketing surface is where a corrected claim survives longest,
 * because nobody re-reads it — so what Homefire is NOT is its own section, above "how to start",
 * rather than a footnote under it.
 *
 * **Nothing on this page states or implies a yield.** `NOT_AN_INCOME` in `src/lib/format.ts` is the
 * one sentence this surface says about that, and the `rules` job in CI greps every page for the
 * words that would break it — "profit", "earn per", "APY", "return on" and the rest. A block reward
 * is a consensus constant and is stated as one; what a machine earns is its share of that against a
 * difficulty that moves every block, and there is no market to price it in.
 *
 * ── THE ORDER CHANGED IN micro-org#484, WITHIN THE TWO CONSTRAINTS ABOVE ──────────────────────
 *
 * It ran: caveat, how it works, what it is not, pools, what is not built, how to start. The one
 * thing a reader can DO on this page — the browser miner, which needs nothing installed — was the
 * sixth thing they met, behind two sections of protocol design and a list of unbuilt features.
 * It now runs: caveat, what it is not, how to start, how it works, pools, what is not built.
 *
 * Both pinned orders survive, and they are pinned for a reason rather than by accident:
 *   * `NOT_AN_INCOME` before `MINE.how.title` — BJ-NET-04, and the header above.
 *   * `MINE.caveats.title` before `MINE.start.title` — BJ-NET-04. The caveats moved UP, not down.
 * The reader now meets what this is not, and then what they can do about it, with nothing between.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */
import { MINE } from '../content/copy.ts'
import { NOT_AN_INCOME } from '../lib/format.ts'
import { hosts } from '../lib/hosts.ts'
import { hearthFile } from '../lib/routes.ts'
import { BrowserMine } from '../components/browsermine.tsx'
import { Command, Note, Page, PageHead, Section } from '../components/parts.tsx'

export function MinePage() {
  return (
    <Page>
      <PageHead title={MINE.title} standfirst={MINE.standfirst} />

      {/*
        The income caveat is FIRST, before anything that describes a reward. A reader who scrolls
        no further has still read the only sentence on this page that could mislead them.
      */}
      <Note tone="warn" title="What mining pays, before anything else">
        <p>{NOT_AN_INCOME}</p>
        <p className="ns-note__aside">{MINE.pay.body}</p>
      </Note>

      <Section kindling="The limits" title={MINE.caveats.title} lede={MINE.caveats.lede} id="caveats">
        <div className="ns-cards">
          {MINE.caveats.items.map((item) => (
            <article className="ns-card ns-card--warn" key={item.title}>
              <h3 className="ns-card__title">{item.title}</h3>
              <p className="ns-card__body">{item.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section kindling="Two ways" title={MINE.start.title} lede={MINE.start.lede} id="start">
        {/*
          The browser miner comes FIRST, ahead of the clone-and-build path. It is the only way to
          start mining without installing anything, and leaving it below a git command is how a
          reader concludes this chain wants a toolchain before it will pay them.
        */}
        <BrowserMine rpc={hosts().rpc} />
        <ol className="ns-steps">
          {MINE.start.steps.map((step) => (
            <li className="ns-step" key={step.title}>
              <h3 className="ns-step__title">{step.title}</h3>
              <p className="ns-step__body">{step.body}</p>
            </li>
          ))}
        </ol>
        {/*
          One command, and it is a CLONE rather than a download of a binary. There is no release to
          point at: `hearth/MAP.md` records that nothing is published, and a page offering an
          installer for software that ships no artefact would be inventing a distribution channel.
        */}
        <Command>git clone https://github.com/cloudsforge-online/hearth</Command>
      </Section>

      <Section kindling="How it works" title={MINE.how.title} lede={MINE.how.lede} id="how">
        <div className="ns-cards">
          {MINE.how.items.map((item) => (
            <article className="ns-card" key={item.title}>
              <h3 className="ns-card__title">{item.title}</h3>
              <p className="ns-card__body">{item.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section kindling="Sharing the work" title={MINE.pools.title} id="pools">
        <p className="ns-prose">{MINE.pools.body}</p>
        {/*
          THE ONE LINK ON THIS SITE TO THE POOL, AND IT IS HERE BECAUSE THE FOOTER CANNOT SAY THIS.

          The footer does carry `pool.<apex>` now (micro-org#489) and it carries it as a bare
          surface name in a column of ten. What it cannot carry is the sentence in front of it. The
          note comes BEFORE the reader can act on the link, in the same paragraph, because the rule
          in this file's header is that nothing here may imply a yield — and what keeps that true is
          not the absence of a link, it is that the sentence introducing it says the pool settles
          nothing. `BJ-NET-POOL` asserts that order rather than the link.

          Resolved through `hosts()`, so this is the registry's address and not one typed here.
        */}
        <p className="ns-prose">
          {MINE.pools.elsewhere.note}{' '}
          <a href={hosts()[MINE.pools.elsewhere.to]}>{MINE.pools.elsewhere.label}</a>
        </p>
      </Section>

      <Section kindling="Not built" title={MINE.design.title} lede={MINE.design.lede} id="design">
        <ul className="ns-list">
          {MINE.design.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="ns-prose">
          The mining document is <a href={hearthFile('docs/mining.md')}>hearth/docs/mining.md</a>,
          and it is the source for every sentence on this page.
        </p>
      </Section>
    </Page>
  )
}
