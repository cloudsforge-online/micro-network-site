/**
 * EVERY CITATION IN THIS REPOSITORY NAMES A FILE THAT EXISTS, AND NONE OF THEM NAMES A LINE.
 *
 * `test/chainstatus.test.ts` and `test/faucet.test.ts` prove the ROUTE citations exactly — they
 * FIND each route in the service's own table, follow it to the handler the service wires it to, and
 * check the gate that handler opens with. That is the strong check, and it covers ten indexer
 * routes and seven faucet ones. This repository carries hundreds of other citations: into
 * `hearth/`, `indexer/src/reads.ts`, `faucet/src/requests.ts`, `identity`,
 * `ui/packages/ui/src/surfaces.ts`, `brand/README.md`, `deploy/gateway/dynamic/policy.yml` and
 * `market/src/indexerclient.test.ts`.
 *
 * ── THIS FILE USED TO REQUIRE A LINE NUMBER. IT NOW FORBIDS ONE ───────────────────────────────
 *
 * It checked that every `path:line` named a line inside the file, and it did that correctly. The
 * trouble is what it was protecting. A line number names a position in a file a DIFFERENT
 * repository owns and is free to edit: `micro-faucet` changed its requester hashing, every route
 * below line 69 moved by seven, and all sixty-five citations into it broke at once — while nothing
 * in this repository was wrong. Nothing runs this suite when a service changes, so it surfaced
 * during a release. Seven of one day's nineteen CI failures across the estate were that one shape.
 *
 * So the rule is inverted rather than relaxed, and what replaces it is stronger. Checking every
 * cited FILE catches a failure the old sweep never could: it only ever looked at citations carrying
 * a line, so a citation naming a file that had been deleted was invisible to it.
 *
 * ── HEARTH IS THE ONE THAT MATTERS MOST HERE ─────────────────────────────────────────────────
 *
 * `cloudsforge-online/hearth` is PUBLIC. A reader can follow every citation into it, which makes a
 * citation that has rotted a broken promise to somebody outside this organisation rather than an
 * internal inconsistency. It is checked out in CI with no token for exactly that reason.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const here = fileURLToPath(new URL('..', import.meta.url))

/**
 * Every sibling repository a citation in this repository reaches into.
 *
 * Enumerated rather than globbed, because a citation into a repository nobody listed here would
 * otherwise be silently treated as "not checked out" and never verified at all — the exact shape of
 * failure this file exists to catch.
 *
 * The estate checks each `micro-<name>` out as `<name>`; both spellings resolve to the same
 * directory. See `org/tools/registry.ts`, which applies that substitution once for the whole
 * programme. `hearth` has no prefix and is checked out under its own name.
 */
const SIBLINGS: readonly string[] = [
  // The subject of this entire surface, and the one repository a reader of this site can open.
  'hearth',
  // The two services this bundle is a client of.
  'indexer',
  'faucet',
  'ui',
  'brand',
  // The gateway CORS allowlist, which is one of the two reasons the chain read is refused today.
  'deploy',
  'identity',
  'contracts',
  // The corrected shape guard the route checkers copy `matches` from, and the measurement of the
  // collapsed-scope defect.
  'market',
  // Cited for the `Idempotency-Key` HEADER that micro-faucet does not read.
  'trade',
  'docs',
  'web-template',
  'org',
  // The surface whose green-on-unknown property this repository copied, the one whose stale devPort
  // prose is reported in the README, and the one whose numbers register this adopted.
  'status-web',
  'explorer-web',
  'site',
  // Cited once, for the OTHER settled answer about a Vite port: micro-worlds-web binds the
  // registry's own number rather than a 517x one, and this repository had to choose between the two.
  'worlds-web',
  // The browser telemetry sink. `src/lib/obs.ts` cites its record shape — `fromWire`, `RUM_KINDS`
  // and the migration's CHECK constraint — because that contract is the reason every event this
  // bundle sent was silently discarded, and a contract quoted from memory is how it went wrong.
  'lantern',
]

// NOTE: `mint-web` is named in prose throughout this repository — the ten invented tokens — and is
// deliberately NOT listed above, because nothing here cites a FILE in it. Listing a repository that
// carries no citation would put it in the UNCHECKED notice for ever, which trains a reader to skim
// that notice — and the whole point of printing it is that somebody reads it.

/** Where a sibling is checked out. `micro-indexer` and `indexer` are the same directory. */
function siblingRoot(name: string): string | undefined {
  const bare = name.startsWith('micro-') ? name.slice('micro-'.length) : name
  if (!SIBLINGS.includes(bare)) return undefined
  if (bare === 'indexer') return process.env['CLOUDSFORGE_INDEXER_DIR'] ?? join(here, '../indexer')
  if (bare === 'faucet') return process.env['CLOUDSFORGE_FAUCET_DIR'] ?? join(here, '../faucet')
  return join(here, `../${bare}`)
}

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.md', '.yml', '.html'])

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...sourceFiles(full))
    else if (SOURCE_EXTENSIONS.has(extname(entry.name))) out.push(full)
  }
  return out
}

/**
 * A citation: a repository-relative path to a file. NO LINE NUMBER.
 *
 * It used to require one, and requiring one is what this file is now the record of. See the header.
 */
//
// The lookbehind refuses a path that is the TAIL of a longer one: a template literal joining a
// checkout root to a file inside it is not a citation to a file in THIS repository, and reporting
// it as a broken one would be the confident wrong diagnosis this whole programme exists to remove.
const CITATION = /(?<![/\w])((?:[a-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.(?:ts|tsx|css|yml|js|sol|md))\b/g

/** The same shape WITH a line, which is what the last check in this file refuses. */
const CITATION_WITH_LINE =
  /\b((?:[a-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.(?:ts|tsx|css|yml|js|sol|md)):(\d+)/g

interface Citation {
  readonly from: string
  readonly path: string
}

/**
 * Directories inside THIS repository that a citation may be rooted at.
 *
 * Without this the sweep matches every relative import (`lib/api.ts`), every package specifier
 * (`@cloudsforge/ui/tokens.css`) and every URL that happens to end in a source extension, and then
 * reports all of them as citations to files that do not exist. A citation is rooted either at a
 * sibling repository or at the top of this one; anything else is a module reference, which
 * TypeScript already resolves and does not need a second, worse checker.
 */
const LOCAL_ROOTS: readonly string[] = ['src', 'test', 'public', 'scripts', '.github']

/**
 * `docs/` is the ESTATE's, not this repository's. The ecosystem documents live one level up beside
 * every repository, so a citation to `docs/ecosystem/…` resolves there or nowhere.
 */
const ESTATE_ROOTS: readonly string[] = ['docs']

function collect(): Citation[] {
  const out: Citation[] = []
  for (const file of sourceFiles(here)) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(CITATION)) {
      const path = m[1] ?? ''
      // `hearthFile('docs/…')` takes a HEARTH-relative path, not one rooted here or at the estate.
      // Those arguments have their own check — 'every hearth file this site links to exists' in
      // `test/content.test.ts` resolves each against the hearth checkout — and claiming them here
      // as well would report a correct link as a broken citation.
      if (text.slice(Math.max(0, (m.index ?? 0) - 12), m.index).includes("hearthFile('")) continue
      const head = path.split('/')[0] ?? ''
      if (
        siblingRoot(head) === undefined &&
        !LOCAL_ROOTS.includes(head) &&
        !ESTATE_ROOTS.includes(head)
      )
        continue
      out.push({ from: relative(here, file), path })
    }
  }
  return out
}

/** Resolve a citation's path to a file on disk, or null when its repository is not checked out. */
function resolve(path: string): string | null {
  const [head, ...rest] = path.split('/')
  const root = siblingRoot(head ?? '')
  if (root === undefined) {
    if (ESTATE_ROOTS.includes(head ?? '')) {
      const estate = join(here, '..', path)
      return existsSync(estate) ? estate : null
    }
    // Not a sibling: a path inside THIS repository.
    const local = join(here, path)
    return existsSync(local) ? local : null
  }
  if (!existsSync(root)) return null
  const full = join(root, rest.join('/'))
  return existsSync(full) ? full : null
}

const CITATIONS = collect()

describe('every citation names a file that exists, and names no line in it', () => {
  it('finds citations at all, so this cannot pass on an empty sweep', () => {
    // A regex that stopped matching would make this whole file a no-op that reads as a guarantee.
    assert.ok(CITATIONS.length >= 150, `found only ${CITATIONS.length} citations`)
  })

  it('cites more than one repository, because a client that only cites itself proves nothing', () => {
    const repos = new Set(CITATIONS.map((c) => c.path.split('/')[0]))
    assert.ok(repos.size >= 5, `citations reach only ${[...repos].join(', ')}`)
  })

  it('cites hearth, which is the repository this surface is about', () => {
    const hearth = CITATIONS.filter((c) => c.path.startsWith('hearth/'))
    assert.ok(hearth.length >= 15, `only ${hearth.length} citations reach into hearth`)
  })

  it('names a file that exists, wherever the repository is checked out', () => {
    const missing = CITATIONS.filter((c) => {
      const root = siblingRoot(c.path.split('/')[0] ?? '')
      // A sibling that is not checked out is UNCHECKED, not broken. Reported below.
      if (root !== undefined && !existsSync(root)) return false
      return resolve(c.path) === null
    })
    assert.deepEqual(
      missing.map((c) => `${c.from} cites ${c.path}, which does not exist`),
      [],
    )
  })

  it('carries no line numbers, because a line in another repository cannot be kept true here', () => {
    // The rule, enforced rather than described. This check used to be its exact opposite: it
    // required the cited line to be inside the file, which is a fact about a repository this one
    // neither owns nor watches. Cite the file and, if a reader needs the exact place, name the
    // symbol — `authoriseRead`, `chainStatus`, `DOMAIN` — which moves with the code.
    const withLines: string[] = []
    for (const file of sourceFiles(here)) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(CITATION_WITH_LINE)) {
        withLines.push(`${relative(here, file)} cites ${m[1]}:${m[2]} — cite the file or the symbol`)
      }
    }
    assert.deepEqual(withLines, [])
  })

  it('reports which repositories were NOT available, rather than passing quietly', () => {
    // Not a failure: `pnpm test` has to work for somebody who cloned only this repository. But an
    // unmeasured citation must never look like a verified one, so the absence is printed and the
    // CI job that has every sibling checked out is where it becomes fatal.
    const absent = SIBLINGS.filter((name) => {
      const root = siblingRoot(name)
      return root === undefined || !existsSync(root)
    })
    if (absent.length > 0) {
      console.log(
        `UNCHECKED: citations into ${absent.join(', ')} — those repositories are not checked out`,
      )
    }
    assert.ok(true)
  })
})
