/**
 * The state of the chain — the one page in this bundle whose figures come from a service.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * EVERY NUMBER HERE IS FETCHED AT RENDER TIME OR IS ABSENT. THERE IS NO THIRD OPTION.
 *
 * The panel is built from a `ChainStatus` (`GET /v1/chains/:chain/:network/status`,
 * `indexer/src/server.ts`) and every height on that shape is nullable. A deployment that has
 * never followed `ember:testnet` has no checkpoint row, so the service answers **200** with
 * `tipHeight: null`, `indexedHeight: null` and `lagBlocks: null`
 * (`indexer/src/reads.ts`). That is an ANSWER — "I have observed nothing" — and
 * it is a different fact from "I could not be asked".
 *
 * So a figure reaches the screen through `<Figure>` and nowhere else, carrying one of four states
 * (`Figure` in `src/lib/chainstatus.ts`). Three of the four hold no value at all, so there is no
 * code path from an absence to a digit. `test/render.test.ts` asserts that this file contains no
 * `?? 0`, no `|| 0` and no arithmetic on a possibly-null height.
 *
 * `micro-status-web` established the pattern: `status-web/src/lib/degrade.ts` records that no
 * branch of its failure reducer can produce `operational`, "which is the property that makes
 * green-on-unknown structurally unreachable rather than merely unlikely". This is the same property
 * applied to a number rather than to a verdict.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *
 * ── Two scopes, fetched independently ─────────────────────────────────────────────────────────
 *
 * `ember:testnet` and `ember:mainnet` are separate requests and separate panels, because they are
 * separate questions and one of them failing tells you nothing about the other. `useResource` is
 * used per panel for the same reason: a single combined resource would make one unreachable scope
 * blank the whole page, which is the "one dead upstream costs one tile" rule
 * (`hub-api`'s own description) applied to a browser.
 */
import { hosts, siteUrlOn } from '../lib/hosts.ts'
import { EXPLORER_SURFACE } from '../lib/routes.ts'
import { CHAIN } from '../content/copy.ts'
import {
  HEARTH_SCOPES,
  PENDING,
  figureOf,
  getChainStatus,
  unfetched,
  type ChainStatus,
  type Scope,
} from '../lib/chainstatus.ts'
import { TWO_HEIGHTS, providerTone, when } from '../lib/format.ts'
import { useResource } from '../lib/resource.ts'
import { Failed, Loading } from '../components/states.tsx'
import {
  Claim,
  Detail,
  Figure,
  Hex,
  Note,
  Page,
  PageHead,
  Section,
  StateBadge,
} from '../components/parts.tsx'

export function ChainPage() {
  return (
    <Page>
      <PageHead title={CHAIN.title} standfirst={CHAIN.standfirst} />

      {HEARTH_SCOPES.map((scope) => (
        <ScopePanel key={`${scope.chain}:${scope.network}`} scope={scope} />
      ))}

      {/* `TWO_HEIGHTS` is the definition and leads, `CHAIN.heads.body` is the argument and
          follows. They used to be the other way round and the definition was said twice — see the
          comment on `heads.body` in `src/content/copy.ts`. */}
      <Note tone="accent" title={CHAIN.heads.title}>
        <p>{TWO_HEIGHTS}</p>
        <p className="ns-note__aside">{CHAIN.heads.body}</p>
      </Note>

      <Note title={CHAIN.absence.title}>
        <p>{CHAIN.absence.body}</p>
      </Note>

      <Section kindling="One record at a time" title={CHAIN.explorer.title}>
        <p className="ns-prose">{CHAIN.explorer.body}</p>
        <div className="ns-page__acts">
          <a className="cf-btn" href={hosts()[EXPLORER_SURFACE]}>
            Open the block explorer
          </a>
        </div>
      </Section>
    </Page>
  )
}

/**
 * One `(chain, network)` panel.
 *
 * The scope is passed as an object and the request path writes both segments out — see `seg` in
 * `src/lib/chainstatus.ts` and the reason recorded at `market/src/indexerclient.test.ts`.
 */
function ScopePanel({ scope }: { scope: Scope }) {
  const status = useResource<ChainStatus>(
    (signal) => getChainStatus(scope, signal),
    // `count` decides EMPTY, and a status document is never empty: it always carries the chain's
    // depth policy even when it has observed nothing. So this returns 1 unconditionally and the
    // panel has three states rather than four. An "empty" status would be a lie about a 200.
    () => 1,
    'The chain index did not answer.',
    [scope.chain, scope.network],
  )

  /*
   * THE HEADING IS THE ENGLISH ONE, AND THE SCOPE IS THE LABEL ABOVE IT.
   *
   * Both panels were headed `ember:mainnet` and `ember:testnet` — the scope identifier, printed
   * raw. It is the correct string to send to a service and it is not a heading: a reader who has
   * just been told this is a new network has no way to know which of the two is the one their
   * mined EMBER is on, and "mainnet" is a word this surface should be explaining rather than
   * assuming. So the heading says which network it is, and the identifier moves to the kindling
   * label above it, where the rest of this surface puts the thing that names the section.
   *
   * The identifier is still on screen for the reader who wanted it, and is still exact — nothing
   * here composes it from a template a network added upstream would not appear in.
   */
  const title = NETWORK_TITLE[scope.network] ?? `${scope.chain}:${scope.network}`
  const id = `${scope.chain}:${scope.network}`

  if (status.state === 'loading') {
    return (
      <Section kindling={id} title={title}>
        <Loading label={`Asking the chain index about ${id}`} />
      </Section>
    )
  }

  if (status.state === 'failed' && status.error) {
    return (
      <Section kindling={id} title={title}>
        <Failed
          notice={status.error}
          onRetry={status.reload}
          title={`No figures for ${title}`}
        >
          {/*
            No CAUSE is named. This paragraph used to name two — micro-indexer sending no CORS
            headers, and this hostname being absent from the gateway allowlist — and
            `test/hosts.test.ts` was written to go red the day either was fixed. Both have been,
            and it did. Nothing here can establish what the new cause is: no compose profile in
            this estate serves a frontend behind the gateway, so the request has never been made
            from a browser against the real plumbing. A replacement explanation would be a second
            unverifiable claim on a public page.
          */}
          <p>{CHAIN.unreachable.body}</p>
        </Failed>
        {/* Every figure the panel would have carried, rendered as unfetched rather than omitted:
            a reader must be able to see WHICH facts are missing, not merely that some are. */}
        <Figures
          walked={unfetched(CHAIN.unreachable.title)}
          claimed={unfetched(CHAIN.unreachable.title)}
          lag={unfetched(CHAIN.unreachable.title)}
          chainId={unfetched(CHAIN.unreachable.title)}
          depth={unfetched(CHAIN.unreachable.title)}
          alarm={unfetched(CHAIN.unreachable.title)}
          known={false}
          halted={false}
          seenAt={null}
          hash={null}
        />
      </Section>
    )
  }

  const doc = status.data
  if (!doc) {
    // Unreachable through `useResource`, which is `ok` only with data. Rendered as pending rather
    // than as zeroes, because the alternative to a state that cannot happen must never be a number.
    return (
      <Section kindling={id} title={title}>
        <Figures
          walked={PENDING}
          claimed={PENDING}
          lag={PENDING}
          chainId={PENDING}
          depth={PENDING}
          alarm={PENDING}
          known={false}
          halted={false}
          seenAt={null}
          hash={null}
        />
      </Section>
    )
  }

  // `followed === false` is a statement; `undefined` is an index that predates the field and is
  // read as the answer it used to give. Only the explicit false suppresses the halt alarm.
  const notFollowed = doc.followed === false
  const elsewhere = siteUrlOn(scope.network === 'testnet' ? 'testnet' : 'mainnet', '/chain')

  return (
    <Section kindling={id} title={title} lede={`${doc.asset} on the ${doc.family} family.`}>
      <Figures
        walked={figureOf(doc.indexedHeight)}
        claimed={figureOf(doc.tipHeight)}
        lag={figureOf(doc.lagBlocks)}
        chainId={figureOf(doc.chainId)}
        depth={figureOf(doc.requiredConfirmations)}
        alarm={figureOf(doc.reorgAlarmDepth)}
        known
        halted={!notFollowed && doc.halted}
        // The heights, the hash and `tipSeenAt` are left exactly as the document reports them even
        // when the scope is unfollowed: they are a dated record of what this index once walked,
        // and "Tip last seen" carries the date that makes them readable as one. Only the VERDICT
        // is withheld, because a verdict has no date on it.
        haltedKnown={!notFollowed}
        haltedWhy={CHAIN.notFollowed.title}
        seenAt={doc.tipSeenAt}
        hash={doc.indexedHash}
      />
      {notFollowed && (
        <Note title={CHAIN.notFollowed.title}>
          <p>{CHAIN.notFollowed.body}</p>
          {elsewhere !== null && (
            <p className="ns-page__acts">
              <a className="cf-btn" href={elsewhere}>
                {CHAIN.notFollowed.link}
              </a>
            </p>
          )}
        </Note>
      )}
      {/* Gated on `notFollowed` as well as on the flag: a halt is a claim in the present tense,
          and an index that is not walking this chain is not making it. Upstream now gates the
          field itself (`indexer/src/reads.ts`), and this bundle may be talking to one that does
          not — which is exactly what it was doing on mainnet on 2026-08-10, rendering an
          `ember:testnet` halt recorded on 2026-08-04 by a provider removed six days earlier. */}
      {!notFollowed && doc.halted && doc.haltReason && (
        <Note tone="warn" title="This chain is halted">
          <p>
            The chain index has stopped vouching for this chain: {doc.haltReason}. A reorg at or
            past the alarm depth means the assumption the credit depth encodes has failed.
          </p>
        </Note>
      )}
      <Providers status={doc} />
      <Reorgs status={doc} />
    </Section>
  )
}

/**
 * What each network is called in a sentence.
 *
 * Keyed on the network rather than composed, and falling back to the scope identifier: a third
 * network added to `HEARTH_SCOPES` upstream gets its raw identifier as a heading, which is ugly and
 * true, rather than a name invented here for a network nobody has described yet.
 */
const NETWORK_TITLE: Record<string, string> = {
  mainnet: 'The main network',
  testnet: 'The test network',
}

/** The figures, in one shape so that the failed panel and the answered panel cannot diverge. */
function Figures(props: {
  walked: ReturnType<typeof figureOf>
  claimed: ReturnType<typeof figureOf>
  lag: ReturnType<typeof figureOf>
  chainId: ReturnType<typeof figureOf>
  depth: ReturnType<typeof figureOf>
  alarm: ReturnType<typeof figureOf>
  known: boolean
  halted: boolean
  /** Defaults to `known`. False withholds the halt VERDICT while the figures still answer. */
  haltedKnown?: boolean
  haltedWhy?: string
  seenAt: string | null
  hash: string | null
}) {
  const seen = when(props.seenAt)
  return (
    <dl className="ns-details">
      {/*
        A LABEL LABELS. The first two used to carry their own gloss in the label itself — "Walked
        head — blocks the index has read" — which made the label a sentence and made every label in
        the column a different length. The gloss belongs under the value, where `.ns-detail__aside`
        already puts the wei-per-EMBER note on the faucet page, and where it does not have to be
        read before the number it explains.
      */}
      <Detail label="Walked head">
        <Figure value={props.walked} />
        <span className="ns-detail__aside">blocks this index has read</span>
      </Detail>
      <Detail label="Claimed tip">
        <Figure value={props.claimed} />
        <span className="ns-detail__aside">what a node last said</span>
      </Detail>
      <Detail label="Lag between them">
        <Figure value={props.lag} unit="blocks" />
      </Detail>
      <Detail label="Chain id">
        <Figure value={props.chainId} />
      </Detail>
      <Detail label="Blocks before a deposit is credited">
        <Figure value={props.depth} unit="blocks" />
        <span className="ns-detail__aside">CloudsForge&rsquo;s rule, not the chain&rsquo;s</span>
      </Detail>
      <Detail label="Reorg depth that halts crediting">
        <Figure value={props.alarm} unit="blocks" />
      </Detail>
      <Detail label="Crediting halted?">
        <Claim
          known={props.haltedKnown ?? props.known}
          value={props.halted}
          yes="Yes — the index has stopped vouching for this chain"
          no="No"
          why={props.haltedWhy ?? 'the chain index did not answer'}
        />
      </Detail>
      <Detail label="Tip last seen">
        {seen === null ? (
          <span className="ns-absent">
            {props.known ? 'never — no tip has been observed' : 'could not be fetched'}
          </span>
        ) : (
          <span className="cf-num">{seen}</span>
        )}
      </Detail>
      <Detail label="Hash at the walked head">
        {props.hash === null ? (
          <span className="ns-absent">
            {props.known ? 'no block has been walked' : 'could not be fetched'}
          </span>
        ) : (
          <Hex value={props.hash} />
        )}
      </Detail>
    </dl>
  )
}

/**
 * The providers the index is reading this chain through.
 *
 * An EMPTY list is a real answer and is worded as one. `listProviderHealth` returns the rows this
 * deployment has (`indexer/src/reads.ts`), so no rows means no provider has been configured for
 * this scope — which, for a chain with no published endpoint, is exactly what one would expect.
 */
function Providers({ status }: { status: ChainStatus }) {
  if (status.providers.length === 0) {
    return (
      <p className="ns-prose ns-absent">
        The index reports no provider for this chain. It is not reading it from anywhere.
      </p>
    )
  }
  return (
    <div className="ns-tablewrap">
      <table className="ns-table">
        <thead>
          <tr>
            <th scope="col">Provider</th>
            <th scope="col">Host</th>
            <th scope="col">State</th>
            <th scope="col">Last answered</th>
          </tr>
        </thead>
        <tbody>
          {status.providers.map((p) => (
            <tr key={`${p.provider}:${p.host}`}>
              <th scope="row">{p.provider}</th>
              <td>{p.host}</td>
              <td>
                <StateBadge tone={providerTone(p.state)} />
              </td>
              <td>
                {when(p.lastOkAt) === null ? (
                  <span className="ns-absent">never</span>
                ) : (
                  <span className="cf-num">{when(p.lastOkAt)}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Recent reorgs.
 *
 * An empty list here is GOOD NEWS and is worded as good news rather than as an absence, because
 * unlike every other empty on this page it is not a gap in what we know: `recentReorgs(exec, scope, 5)`
 * (`indexer/src/reads.ts`) returns what the index recorded, and nothing recorded means nothing
 * happened as far as it walked. That is the one place on this surface where "none" is a finding.
 *
 * ── EXCEPT WHEN IT HAS WALKED NOWHERE, WHICH IS WHY THE SENTENCE BRANCHES ─────────────────────
 *
 * "Nothing happened as far as it walked" is worth nothing if it walked no blocks, and this page
 * used to say so IN EVERY CASE — one sentence carrying the caveat permanently, because until
 * 2026-08-16 one of the two panels was always the un-walked one (see `HEARTH_SCOPES`). Both panels
 * are read from the index that follows them now, so the un-walked panel is the exception it was
 * always meant to be, and a caveat that applies to nothing on screen is the "useless text" this
 * surface has been cut of twice. It is kept, and shown only when it is about something.
 */
function Reorgs({ status }: { status: ChainStatus }) {
  if (status.recentReorgs.length === 0) {
    return status.indexedHeight === null ? (
      <p className="ns-prose">
        No reorg has been recorded, as far as this index has walked — which, with no walked head
        observed at all, is as far as nowhere.
      </p>
    ) : (
      <p className="ns-prose">No reorg has been recorded, as far as this index has walked.</p>
    )
  }
  return (
    <div className="ns-tablewrap">
      <table className="ns-table">
        <thead>
          <tr>
            <th scope="col">Detected</th>
            <th scope="col">Depth</th>
            <th scope="col">Past the alarm?</th>
            <th scope="col">Orphaned blocks</th>
          </tr>
        </thead>
        <tbody>
          {status.recentReorgs.map((r) => (
            <tr key={r.id}>
              <th scope="row">
                <span className="cf-num">{when(r.detectedAt) ?? r.detectedAt}</span>
              </th>
              <td>
                <Figure value={figureOf(r.depth)} unit="blocks" />
              </td>
              <td>{r.alarming ? 'Yes' : 'No'}</td>
              <td>
                <Figure value={figureOf(r.orphanedBlocks)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
