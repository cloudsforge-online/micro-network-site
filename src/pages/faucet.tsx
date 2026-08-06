/**
 * The testnet faucet.
 *
 * This route exists because the surface registry says it does: `faucet` is a surface with
 * `subdomain: 'network'` and `basePath: '/faucet'` (`ui/packages/ui/src/surfaces.ts:365-380`), so
 * every link to the faucet anywhere in the estate resolves to this path on this host. See the
 * header of `src/lib/routes.ts`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * EVERY NUMBER ON THIS PAGE IS THE FAUCET'S, FETCHED AT RENDER TIME.
 *
 * The drip, the cooldown, the per-requester limit, the window and the remaining budget all come
 * from `GET /v1/faucet` (`faucet/src/server.ts:348`). **There is no fallback set of numbers in this
 * repository** — `test/content.test.ts` checks the register and the register has no faucet entry —
 * so when that call fails the panel says the faucet did not answer and the form is DISABLED rather
 * than left clickable. A request posted into an unreachable service fails in a way that looks like
 * a refusal, and a reader would read it as one.
 *
 * ── What this form may not send ───────────────────────────────────────────────────────────────
 *
 * **No amount.** There is no field for one and no parameter that would carry one. The handler reads
 * `address` and `idempotencyKey` and nothing else (`faucet/src/server.ts:379-380`), and
 * `faucet/src/requests.ts:126-131` states the rule in the frozen service's words: "every faucet
 * that has ever been drained let the caller influence the amount".
 *
 * **No wording of its own on a refusal.** The message shown is the limiter's, verbatim, because
 * `faucet/src/server.ts:253-255` says what that message is engineered to be: "it names a rule and a
 * number, never a balance, an address the caller did not send, or anything about the funding key."
 * A second wording here would be a second thing to keep true, and the softer of the two is the one
 * a reader would quote.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { FAUCET } from '../content/copy.ts'
import { noticeFor, type ErrorNotice } from '../lib/api.ts'
import {
  getDrip,
  getFaucetTerms,
  isRefusal,
  requestDrip,
  type DripView,
  type FaucetTerms,
} from '../lib/faucet.ts'
import { dripTone, duration, weiToEmber, when } from '../lib/format.ts'
import { currentNetwork, testnetFaucetUrl } from '../lib/hosts.ts'
import { fact } from '../content/facts.ts'
import { useResource } from '../lib/resource.ts'
import { Failed, Loading } from '../components/states.tsx'
import {
  Cite,
  Detail,
  Hex,
  Note,
  Page,
  PageHead,
  Section,
  StateBadge,
} from '../components/parts.tsx'

export function FaucetPage() {
  // Read BEFORE the resource is declared, and acted on before anything is fetched: on mainnet
  // this page asks the faucet nothing at all. See `pageNetwork` in src/lib/hosts.ts.
  const network = currentNetwork()
  const terms = useResource<FaucetTerms>(
    (signal) => getFaucetTerms(signal),
    // A terms document is never empty: it always carries the chain id and the drip. Returning 1
    // makes this a three-state resource, because an "empty" 200 here would be a lie.
    () => 1,
    'The faucet did not answer.',
    [],
  )

  // ── MAINNET: REFUSE, AND SAY WHERE THE FAUCET IS ───────────────────────────────────────────
  //
  // Returned before the form, the terms panel and the refusal/poll sections, so there is no
  // shape on this page that a reader could mistake for a mainnet drip being available. The
  // `reach` note is deliberately NOT rendered here: it explains what testnet EMBER is worth to
  // somebody who is about to request some, and nobody on this branch is.
  if (network === 'mainnet') {
    const url = testnetFaucetUrl()
    return (
      <Page>
        <PageHead title={FAUCET.title} standfirst={FAUCET.standfirst} />
        <Note tone="warn" title={FAUCET.wrongNetwork.title}>
          <p>{FAUCET.wrongNetwork.body}</p>
          {url ? (
            <p className="ns-prose">
              <a href={url}>{FAUCET.wrongNetwork.action}</a>
            </p>
          ) : (
            <p className="ns-prose">{FAUCET.wrongNetwork.fallback}</p>
          )}
          <Cite source={FAUCET.wrongNetwork.source} />
        </Note>
      </Page>
    )
  }

  return (
    <Page>
      <PageHead title={FAUCET.title} standfirst={FAUCET.standfirst} />

      {/*
        The reach caveat is ABOVE the form. A reader who pastes an address without reading the rest
        of the page has still been told that the chain this funds is not one they can reach.
      */}
      <Note tone="warn" title={FAUCET.reach.title}>
        <p>{FAUCET.reach.body}</p>
        <Cite source={FAUCET.reach.source} />
      </Note>

      {terms.state === 'loading' && <Loading label="Asking the faucet what it will do" />}

      {terms.state === 'failed' && terms.error && (
        <>
          <Failed
            notice={terms.error}
            onRetry={terms.reload}
            title={FAUCET.unavailable.title}
          >
            <p>{FAUCET.unavailable.body}</p>
          </Failed>
          {/* The form, disabled, with nothing filled in. Rendering it at all keeps the page's shape
              stable so a reader can see what WOULD be asked for; rendering it enabled would invite
              a request that cannot succeed. */}
          <DripForm terms={null} />
        </>
      )}

      {terms.state === 'ok' && terms.data && (
        <>
          <Terms terms={terms.data} />
          <DripForm terms={terms.data} />
        </>
      )}

      <Section title={FAUCET.refusal.title}>
        <p className="ns-prose">{FAUCET.refusal.body}</p>
        <Cite source={FAUCET.refusal.source} />
      </Section>

      <Section title={FAUCET.poll.title}>
        <p className="ns-prose">{FAUCET.poll.body}</p>
        <Cite source={FAUCET.poll.source} />
      </Section>
    </Page>
  )
}

/**
 * What the faucet says it will do.
 *
 * The terms STRING is rendered verbatim rather than paraphrased. `faucet/src/server.ts:365-367`
 * serves "Testnet EMBER. It has no value, it is not tradeable, and the chain it funds may be reset
 * without notice." — which is the disclaimer, written once, by the service that has to honour it.
 * `test/render.test.ts` asserts this page carries no second wording of it.
 */
function Terms({ terms }: { terms: FaucetTerms }) {
  return (
    <Section title="What this faucet will do">
      <dl className="ns-details">
        <Detail label="Network">
          <span className="cf-num">{terms.network}</span>
        </Detail>
        <Detail label="Chain id">
          <span className="cf-num">{terms.chainId}</span>
        </Detail>
        <Detail label="Asset">
          <span className="cf-num">{terms.asset}</span>
        </Detail>
        <Detail label="Drip">
          {/*
            `fact('decimals')` rather than a literal 18, and the exponent is NAMED on screen. EMBER's
            exponent is 18 under the account model and the retired ledger's node still defines 1e8
            (`hearth/README.md:76`), so a figure with no exponent beside it is ambiguous by exactly
            eight orders of magnitude on a page about that very chain.
          */}
          <span className="cf-num">
            {weiToEmber(terms.dripWei, Number(fact('decimals')))} {terms.asset}
          </span>
          <span className="ns-detail__aside">
            {terms.dripWei} wei, at 10^{fact('decimals')} wei to one {terms.asset}
          </span>
        </Detail>
        <Detail label="One drip per address per">
          <span className="cf-num">{duration(terms.addressCooldownSeconds)}</span>
        </Detail>
        <Detail label="Per requester">
          <span className="cf-num">
            {terms.requesterLimit} per {duration(terms.requesterWindowSeconds)}
          </span>
        </Detail>
        <Detail label="Budget left in this window">
          <span className="cf-num">
            {weiToEmber(terms.budgetRemainingWei, Number(fact('decimals')))} {terms.asset}
          </span>
          <span className="ns-detail__aside">
            the window is {duration(terms.budgetWindowSeconds)}
          </span>
        </Detail>
        <Detail label="Funding address">
          <Hex value={terms.fundingAddress} />
        </Detail>
      </dl>
      <Note tone="warn" title="The faucet's own terms">
        <p>{terms.terms}</p>
        <Cite source="faucet/src/server.ts:365-367" />
      </Note>
    </Section>
  )
}

/* ══════════════════════════════ the form ══════════════════════════════ */

type Submission =
  | { readonly state: 'idle' }
  | { readonly state: 'sending' }
  | { readonly state: 'refused'; readonly notice: ErrorNotice }
  | { readonly state: 'accepted'; readonly id: string; readonly duplicate: boolean }

/**
 * Ask for a drip, then watch it.
 *
 * `terms === null` means the faucet did not answer, and the form is disabled. That is a decision
 * about honesty rather than about convenience: a POST into a service whose GET just failed would
 * produce a network error the reader would read as a refusal.
 */
function DripForm({ terms }: { terms: FaucetTerms | null }) {
  const [address, setAddress] = useState('')
  const [submission, setSubmission] = useState<Submission>({ state: 'idle' })
  const disabled = terms === null

  /**
   * One idempotency key per submission, generated when the request is sent.
   *
   * The service derives one from the recipient and the cooldown window when the field is absent
   * (`faucet/src/requests.ts:135-138`), which already makes two clicks inside one cooldown a single
   * request. This page sends its own anyway, because the derived key CHANGES when the window rolls:
   * a retry that straddles a roll would be recognised as a new request and would be a second drip.
   *
   * `randomUUID` is not available in every context — it needs a secure one, which localhost counts
   * as — so the fallback builds an equivalent from random bytes rather than from a counter or a
   * timestamp. A key that two tabs could generate identically is worse than no key.
   */
  const newKey = useCallback((): string => {
    const c = globalThis.crypto
    if (c && typeof c.randomUUID === 'function') return c.randomUUID()
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  }, [])

  const submit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      if (disabled) return
      setSubmission({ state: 'sending' })
      requestDrip({ address: address.trim(), idempotencyKey: newKey() })
        .then((accepted) =>
          setSubmission({ state: 'accepted', id: accepted.id, duplicate: accepted.duplicate }),
        )
        .catch((err: unknown) =>
          setSubmission({
            state: 'refused',
            // The fallback is used only when the error is NOT an ApiError, which means this bundle
            // threw rather than the service answering. Every refusal the faucet issues carries its
            // own message and that message is what is shown.
            notice: noticeFor(err, 'The faucet could not be reached.'),
          }),
        )
    },
    [address, disabled, newKey],
  )

  return (
    <Section title="Ask for testnet EMBER">
      <form className="ns-form" onSubmit={submit}>
        <div className="ns-field">
          <label className="ns-field__label" htmlFor="drip-address">
            {FAUCET.form.label}
          </label>
          {/*
            `.cf-input` with the `--mono` modifier, both from the design system
            (`ui/packages/ui/src/ui.css:174-192`). A hex address is compared character by character,
            which is what the modifier exists for — `ui/packages/ui/src/ui.css:168-172` names this
            surface class of app as the reason the font family is `inherit` with a modifier rather
            than fixed. There is no local `.ns-input`, and `test/tokens.test.ts` asserts its absence.
          */}
          <input
            id="drip-address"
            className="cf-input cf-input--mono"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={FAUCET.form.placeholder}
            value={address}
            disabled={disabled}
            onChange={(e) => setAddress(e.target.value)}
            aria-describedby="drip-hint"
          />
          <p className="ns-field__hint" id="drip-hint">
            {FAUCET.form.hint}
          </p>
        </div>
        {/*
          `.cf-btn--ember` is the design system's ONE solid call to action
          (`ui/packages/ui/src/ui.css:216-226`). There is no `.cf-btn--primary` and there must not
          be: a second name for one thing is how a design system starts to drift, and
          `test/tokens.test.ts` asserts it stays absent upstream.
        */}
        <button
          className="cf-btn cf-btn--ember"
          type="submit"
          disabled={disabled || submission.state === 'sending' || address.trim().length === 0}
        >
          {submission.state === 'sending' ? 'Asking…' : FAUCET.form.submit}
        </button>
      </form>
      <Cite source={FAUCET.form.source} />

      {submission.state === 'refused' && <Refused notice={submission.notice} />}
      {submission.state === 'accepted' && (
        <DripProgress id={submission.id} duplicate={submission.duplicate} />
      )}
    </Section>
  )
}

/**
 * A refusal, in the service's own words.
 *
 * A refusal is the limiter WORKING (`faucet/src/server.ts:253-255` logs it at INFO and says so), so
 * it is not painted in the danger colour unless it is genuinely a fault. `isRefusal` distinguishes
 * the five limiter codes from everything else; anything not in that set — a 500, a network error,
 * an auth status that should be impossible on an unauthenticated route — is a fault and is shown as
 * one.
 */
function Refused({ notice }: { notice: ErrorNotice }) {
  const limiter = isRefusal(notice.code)
  return (
    <Note tone={limiter ? 'plain' : 'warn'} title={limiter ? 'Not this time' : 'That did not work'}>
      <p>{notice.message}</p>
      {notice.code && (
        <p className="ns-note__aside">
          The faucet answered <code className="cf-num ns-code">{notice.code}</code>
          {notice.requestId && (
            <>
              {' '}
              · request <code className="cf-num wt-reqid">{notice.requestId}</code>
            </>
          )}
        </p>
      )}
      {limiter && (
        <p className="ns-note__aside">
          That is the rate limiter, not a fault. The faucet is not out of EMBER unless it says it is.
        </p>
      )}
    </Note>
  )
}

/** How many times to poll before stopping and telling the reader to look it up themselves. */
const MAX_POLLS = 40
/** How long between polls. The block time, because a dispense cannot settle faster than one. */
const POLL_MS = 5_000

/**
 * Follow one dispense to a terminal state.
 *
 * Bounded, and it says so when it gives up. An unbounded poll is a page that keeps a tab awake for
 * ever against a service that may never answer differently, and a reader who has left is a reader
 * who will not see the answer anyway. When the bound is reached the id is still on screen, and the
 * id is the whole of what is needed to ask again.
 *
 * `setTimeout` rather than `setInterval`, and rescheduled after each answer rather than on a fixed
 * cadence: an interval that fires faster than the request completes queues requests behind each
 * other, which turns a slow service into a hammered one.
 */
function DripProgress({ id, duplicate }: { id: string; duplicate: boolean }) {
  const [view, setView] = useState<DripView | null>(null)
  const [error, setError] = useState<ErrorNotice | null>(null)
  const [gaveUp, setGaveUp] = useState(false)
  const polls = useRef(0)

  useEffect(() => {
    let live = true
    let timer: ReturnType<typeof setTimeout> | null = null

    const settled = (status: string) => status === 'confirmed' || status === 'failed'

    const tick = () => {
      getDrip(id)
        .then((next) => {
          if (!live) return
          setView(next)
          setError(null)
          if (settled(next.status)) return
          polls.current += 1
          if (polls.current >= MAX_POLLS) {
            setGaveUp(true)
            return
          }
          timer = setTimeout(tick, POLL_MS)
        })
        .catch((err: unknown) => {
          if (!live) return
          // A failed poll is not a failed dispense, and it must not be rendered as one. The
          // dispense is a row in a database that is still there; this page simply stopped being
          // able to read it.
          setError(noticeFor(err, 'The faucet stopped answering while this was being followed.'))
        })
    }

    tick()
    return () => {
      live = false
      if (timer !== null) clearTimeout(timer)
    }
  }, [id])

  const tone = view ? dripTone(view.status) : null

  return (
    <div className="ns-drip">
      <p className="ns-drip__head">
        {duplicate
          ? 'The faucet already had this request and answered with the original dispense.'
          : 'Queued. Nothing has been signed yet.'}
      </p>
      <dl className="ns-details">
        <Detail label="Dispense">
          <Hex value={id} />
        </Detail>
        <Detail label="State">
          {tone === null ? (
            <span className="ns-absent">asking…</span>
          ) : (
            <StateBadge tone={tone} />
          )}
        </Detail>
        <Detail label="Transaction">
          {view?.txHash ? (
            <Hex value={view.txHash} />
          ) : (
            <span className="ns-absent">
              {view === null ? 'asking…' : 'nothing has been broadcast yet'}
            </span>
          )}
        </Detail>
        <Detail label="Confirmations">
          {view === null ? (
            <span className="ns-absent">asking…</span>
          ) : (
            <span className="cf-num">{view.confirmations}</span>
          )}
        </Detail>
        <Detail label="Settled">
          {view === null || when(view.settledAt) === null ? (
            <span className="ns-absent">not yet</span>
          ) : (
            <span className="cf-num">{when(view.settledAt)}</span>
          )}
        </Detail>
      </dl>
      {view?.failureReason && (
        <Note tone="warn" title="It failed">
          <p>{view.failureReason}</p>
        </Note>
      )}
      {error && (
        <Note tone="warn" title="This page stopped being able to follow it">
          <p>{error.message}</p>
          <p className="ns-note__aside">
            The dispense itself is unaffected — it is a row in the faucet&rsquo;s own database and
            the identifier above is how to ask about it again.
          </p>
        </Note>
      )}
      {gaveUp && (
        <Note title="No longer watching">
          <p>
            This page has stopped polling. The dispense has not reached a terminal state, which is
            not the same as having failed; the identifier above is what to quote.
          </p>
        </Note>
      )}
    </div>
  )
}
