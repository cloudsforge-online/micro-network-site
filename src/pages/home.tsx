/**
 * The front door.
 *
 * Four blocks, in the order a reader who has never heard of Hearth actually needs them: what it is,
 * its own status table, where the rest of it is, and how to get involved. The status table is the
 * SECOND block rather than a footnote, because a reader who finds out at the bottom of the page
 * that none of this is running has been misled by everything above it.
 *
 * **This page makes no request.** Not because one would be refused — the chain status read is
 * anonymous (`indexer/src/server.ts`) — but because there is no question on this page that
 * a service answers. The state of the chain has its own route, and a home page that renders a
 * spinner over a paragraph of prose has made the prose wait for a service that is not needed to
 * display it. `test/render.test.ts` asserts this file imports neither client.
 */
import { Link } from 'react-router-dom'
import { hosts } from '../lib/hosts.ts'
import { EXPLORER_SURFACE, HEARTH_REPO } from '../lib/routes.ts'
import { HOME } from '../content/copy.ts'
import { Detail, Page, PageHead, Section } from '../components/parts.tsx'

export function HomePage() {
  return (
    <Page>
      <PageHead eyebrow={HOME.eyebrow} title={HOME.title} standfirst={HOME.standfirst} />

      <Section title={HOME.what.title} id="what">
        {/*
          `ns-cards--four` IS LOAD-BEARING, AND THE COUNT IS WHY. Plain `.ns-cards` is the
          intrinsic grid the rest of this bundle uses, and four items in it lay out three and then
          one — the fourth alone on its own row — at every width from 1024px up. The modifier names
          the column counts instead: 1 → 2 → 4, never 3. Adding a fifth tile here without moving
          the steps in `styles.css` re-opens the orphan; `test/layout.test.ts` fails if you do.
        */}
        <div className="ns-cards ns-cards--four">
          {HOME.what.items.map((item) => (
            <article className="ns-card" key={item.title}>
              <h3 className="ns-card__title">{item.title}</h3>
              <p className="ns-card__body">{item.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/*
        The coin. A definition list rather than cards: these are values somebody copies, and a card
        grid invites a reader to compare them against each other, which is not what they are for.
      */}
      <Section title={HOME.coin.title} lede={HOME.coin.lede} id="coin">
        <dl className="ns-details">
          {HOME.coin.rows.map((row) => (
            <Detail label={row.field} key={row.field}>
              {row.value}
            </Detail>
          ))}
        </dl>
      </Section>

      {/*
        The status table.

        Three states, and the WORD carries the meaning — colour is the third channel, exactly as it
        is on every badge in this bundle. A reader who cannot separate the two greens still reads
        "Not built".
      */}
      <Section title={HOME.state.title} lede={HOME.state.lede} id="state">
        <div className="ns-tablewrap">
          <table className="ns-table">
            <thead>
              <tr>
                <th scope="col">Part</th>
                <th scope="col">State</th>
                <th scope="col">What that means</th>
              </tr>
            </thead>
            <tbody>
              {HOME.state.rows.map((row) => (
                <tr key={row.thing}>
                  <th scope="row">{row.thing}</th>
                  <td>
                    <span className={`ns-badge ns-badge--${TONE_OF[row.state]}`}>
                      <span className="ns-badge__glyph" aria-hidden="true">
                        {GLYPH_OF[row.state]}
                      </span>
                      <span className="ns-badge__word">{WORD_OF[row.state]}</span>
                    </span>
                  </td>
                  <td>{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={HOME.where.title} lede={HOME.where.lede} id="where">
        <div className="ns-cards">
          <article className="ns-card">
            <h3 className="ns-card__title">The state of the chain</h3>
            <p className="ns-card__body">
              What the CloudsForge chain index has observed, fetched when you open the page.
            </p>
            <Link className="cf-btn ns-card__go" to="/chain">
              Open
            </Link>
          </article>
          <article className="ns-card">
            <h3 className="ns-card__title">Mining</h3>
            <p className="ns-card__body">
              How the proof of work is built, the three things it is not, and how to start.
            </p>
            <Link className="cf-btn ns-card__go" to="/mine">
              Open
            </Link>
          </article>
          <article className="ns-card">
            <h3 className="ns-card__title">Run a node</h3>
            <p className="ns-card__body">
              The test suites, the conformance gate, a local chain in one command.
            </p>
            <Link className="cf-btn ns-card__go" to="/node">
              Open
            </Link>
          </article>
          <article className="ns-card">
            <h3 className="ns-card__title">Testnet faucet</h3>
            <p className="ns-card__body">
              Testnet EMBER at an address. Rate limited, and worth nothing.
            </p>
            <Link className="cf-btn ns-card__go" to="/faucet">
              Open
            </Link>
          </article>
          <article className="ns-card">
            <h3 className="ns-card__title">Block explorer</h3>
            <p className="ns-card__body">
              Blocks, transactions and addresses, read record by record. A separate surface, and the
              one that owns those questions.
            </p>
            {/*
              The hostname comes from the registry at runtime, never from a literal: the `rules` job
              greps `src` for `cloudsforge.online` and fails on one. `EXPLORER_SURFACE` is the key.
            */}
            <a className="cf-btn ns-card__go" href={hosts()[EXPLORER_SURFACE]}>
              Open
            </a>
          </article>
          <article className="ns-card">
            <h3 className="ns-card__title">The source</h3>
            <p className="ns-card__body">
              Hearth is public and MIT licensed. The node, the mining algorithm and the virtual
              machine are all there to read, run and check for yourself.
            </p>
            <a className="cf-btn cf-btn--ember ns-card__go" href={HEARTH_REPO}>
              Read the repository
            </a>
          </article>
        </div>
      </Section>

    </Page>
  )
}

/**
 * The three states, as tone, glyph and word.
 *
 * Held here rather than in the content module because they are presentation, and because
 * `test/content.test.ts` walks the content module for digits and prose — a lookup table of glyphs
 * in it would be noise in that scan.
 */
const TONE_OF = { built: 'good', absent: 'bad', open: 'warn' } as const
const GLYPH_OF = { built: '●', absent: '○', open: '◐' } as const
const WORD_OF = { built: 'Built', absent: 'Not built', open: 'In progress' } as const
