/**
 * The page for an address this site does not serve.
 *
 * It renders inside the shell, so a reader keeps the navigation they need to get back out — and it
 * renders under a REAL 404, which `nginx.conf` preserves with `error_page 404 /index.html` rather
 * than handing every address a 200 through `try_files`. The status line and the page agree.
 *
 * `test/render.test.ts` asserts that this component names the status in its copy: a reader who has
 * been sent here by a broken link is entitled to know that the server said so too, because that is
 * the difference between "the link is wrong" and "the page is empty today".
 *
 * ── THE ONE PAGE THAT SPENDS NOTHING (micro-org#484) ──────────────────────────────────────────
 *
 * Every other page on this surface opens with a kindling label and a lit hearth rule. This one gets
 * the rule, because `PageHead` draws it, and then stops. A 404 is a page a reader did not ask for,
 * and dressing it is how a site tells somebody their broken link was an occasion. What it does get
 * is the thing a dead end actually needs: the way out, as the same buttons the rest of the surface
 * uses, sized like an action rather than listed like a sitemap.
 */
import { Link } from 'react-router-dom'
import { NOT_FOUND } from '../content/copy.ts'
import { fact } from '../content/facts.ts'
import { NAV } from '../lib/routes.ts'
import { Page, PageHead } from '../components/parts.tsx'

export function NotFoundPage() {
  return (
    <Page>
      {/*
        The status code IS the eyebrow. It is the one number on this page, it is registered in
        `content/facts.ts` like every other number on this surface, and putting it where the kind
        of section usually goes says what happened before the heading has to.
      */}
      <PageHead
        eyebrow={`HTTP ${fact('httpNotFound')}`}
        title={NOT_FOUND.title}
        standfirst={NOT_FOUND.body}
      />
      <p className="ns-prose">
        The server answered with that status rather than a success, so a link checker and a search
        engine were told the same thing you were.
      </p>
      {/*
        `NAV` rather than a list written here: the routes this surface owns are enumerated once, in
        `lib/routes.ts`, and `test/routes.test.ts` holds nginx to the same enumeration. A page that
        listed them again would be a second list to forget to update.
      */}
      <div className="ns-page__acts">
        {NAV.map((item) => (
          <Link className="cf-btn" key={item.to} to={item.to}>
            {item.label}
          </Link>
        ))}
      </div>
    </Page>
  )
}
