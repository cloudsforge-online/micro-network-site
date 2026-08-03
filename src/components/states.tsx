/**
 * The states a panel can be in, as visibly different things.
 *
 * They are separated because collapsing any two of them destroys information the reader needs:
 *
 *   LOADING — we do not know yet. Waiting is the correct action.
 *   EMPTY   — the query answered, with nothing. Nothing is wrong; there is often something to DO.
 *   FAILED  — the query did not answer. Retrying may work. The request id is what support needs.
 *
 * A spinner that never resolves, an empty list that was actually a timeout, and a "no results" that
 * was actually an unreachable service are the three failures this file exists to prevent.
 *
 * **There is no `Refused` here and there must not be one.** Every route this bundle calls is
 * anonymous — the chain read by the service's own decision (`indexer/src/server.ts:792-801`), the
 * three faucet routes by theirs (`faucet/src/server.ts:334-335`, `:407-409`) — and this bundle
 * presents no credential, so nothing it sends can be refused for lacking one. A 401 or a 403
 * arriving anyway means a service re-gated a route or something in front of it injected a
 * credential, and `Failed` is the honest screen for both: a message, an id to quote, and no
 * sentence pretending the reader could have done anything differently.
 */
import type { ReactNode } from 'react'
import type { ErrorNotice } from '../lib/api.ts'

// Every optional prop is spelled `?: T | undefined`. Under `exactOptionalPropertyTypes` those are
// two different types, and only the second one accepts the `value ?? undefined` a caller writes
// when it may or may not have something to pass.
export function Loading({ label = 'Loading' }: { label?: string | undefined }) {
  return (
    <div className="wt-state wt-state--loading" role="status" aria-live="polite">
      <span className="wt-spinner" aria-hidden="true" />
      <p className="wt-state__title">{label}</p>
    </div>
  )
}

export function Empty({
  title,
  hint,
  action,
}: {
  /** Say what was asked and found nothing. "No data" describes the screen, not the answer. */
  title: string
  hint?: string | undefined
  action?: ReactNode | undefined
}) {
  return (
    <div className="wt-state wt-state--empty" role="status">
      <span className="wt-state__icon" aria-hidden="true">
        ◇
      </span>
      <p className="wt-state__title">{title}</p>
      {hint && <p className="wt-state__hint">{hint}</p>}
      {action && <div className="wt-state__action">{action}</div>}
    </div>
  )
}

/**
 * A failure, with the request id on screen.
 *
 * The id is what the reader quotes and what finds their exact request across every service at
 * once. It is rendered in the monospace token and made selectable on its own line, because it is
 * going to be read aloud down a phone line or pasted into a support form.
 *
 * `children` is where a panel puts what it knows about WHY. A generic failure sentence plus a
 * specific, cited explanation is strictly better than either alone — and strictly better than a
 * specific explanation invented in the failure handler, which is how this estate keeps shipping
 * confident wrong diagnoses. Anything passed here must be a fact somebody can check.
 */
export function Failed({
  notice,
  onRetry,
  title = 'That did not load',
  children,
}: {
  notice: ErrorNotice
  onRetry?: (() => void) | undefined
  title?: string | undefined
  children?: ReactNode | undefined
}) {
  return (
    <div className="wt-state wt-state--failed" role="alert">
      <span className="wt-state__icon" aria-hidden="true">
        ■
      </span>
      <p className="wt-state__title">{title}</p>
      <p className="wt-state__hint">{notice.message}</p>
      {notice.code && (
        <p className="wt-state__meta">
          The service answered <code className="cf-num ns-code">{notice.code}</code>
          {notice.requestId && (
            <>
              {' '}
              · request <code className="cf-num wt-reqid">{notice.requestId}</code>
            </>
          )}
        </p>
      )}
      {!notice.code && notice.requestId && (
        <p className="wt-state__meta">
          Quote this to support: <code className="cf-num wt-reqid">{notice.requestId}</code>
        </p>
      )}
      {children && <div className="wt-state__why">{children}</div>}
      {onRetry && (
        <div className="wt-state__action">
          <button type="button" className="cf-btn" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
