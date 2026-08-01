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
 */
import { Link } from 'react-router-dom'
import { NOT_FOUND } from '../content/copy.ts'
import { fact } from '../content/facts.ts'
import { NAV } from '../lib/routes.ts'
import { Page, PageHead } from '../components/parts.tsx'

export function NotFoundPage() {
  return (
    <Page>
      <PageHead title={NOT_FOUND.title} />
      <p className="ns-prose">
        {NOT_FOUND.body} The server answered <code className="cf-num ns-code">{fact('httpNotFound')}</code>,
        so a link checker and a search engine were told the same thing you were.
      </p>
      <ul className="ns-list">
        {NAV.map((item) => (
          <li key={item.to}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </Page>
  )
}
