/**
 * Turning a value into a string, in one place, with the rules that make it honest.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * THREE RULES, EACH OF WHICH THIS ESTATE HAS BROKEN SOMEWHERE.
 *
 * **1. Nothing here converts an amount with `Number`.** `indexer/src/reads.ts:8-10` and
 * `faucet/src/server.ts:350-351` both put amounts on the wire as decimal strings for the same
 * reason: `JSON.stringify` cannot serialise a `bigint`, and `Number("1e19 wei")` silently loses the
 * low digits of any 18-decimal value above about 9 EMBER. `weiToEmber` below is `BigInt` division
 * and string padding, start to finish. `test/format.test.ts` drives it with a value that a double
 * cannot represent and compares digit for digit.
 *
 * **2. There is no absent value that formats as a number.** Every function here that can be handed
 * nothing returns a SENTENCE, never `0` and never `—`. `indexer/src/reads.ts:87` states the rule
 * for the one field that carries it upstream — "Null when no tip has ever been observed; a lag of
 * zero would be a lie, not a default" — and it is applied to all of them. The type system carries
 * it too: heights reach the page as a `Figure` (`src/lib/chainstatus.ts`), which has no branch from
 * an absence to a digit.
 *
 * **3. THE WORD "FINAL" DOES NOT APPEAR ON THIS SURFACE, AND NEITHER DOES A YIELD.** A confirmation
 * depth is a probability, not a settlement. And a block reward is a consensus constant while an
 * INCOME is a share of it — `hearth/docs/mining.md:69-72` is the whole of what the chain
 * guarantees a small miner (frequent wins at a 15-second block time, smooth LWMA retargeting) and
 * it guarantees nothing about what that is worth. `NOT_AN_INCOME` below is the one sentence this
 * surface says about that, exported so it cannot drift into six softer paraphrases, and the `rules`
 * job greps for the words it forbids.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * The sentence every page that mentions mining has to carry.
 *
 * One string, one wording. Compare `micro-explorer-web/src/lib/format.ts`, which does the same for
 * the finality claim, and for the same reason: a caveat that exists in six places is a caveat that
 * will disagree with itself, and the softest copy is the one a reader quotes back.
 */
export const NOT_AN_INCOME =
  'Mining pays a block reward, not an income. What a machine earns is its share of total hashrate ' +
  'against a difficulty that moves every block, and EMBER has no market to price it in.'

/**
 * The sentence every page that prints a height has to carry.
 *
 * `indexer/src/reads.ts:18-30` scopes the two heights: `indexedHeight` is what this service has
 * WALKED, `tipHeight` is what a provider last CLAIMED, and counting against the second
 * "over-reports depth". Both are rendered on this surface, always, and never one without the other.
 */
export const TWO_HEIGHTS =
  'Two heights, and they are different facts: the walked head is what the chain index has read ' +
  'block by block, and the claimed tip is what a node last told it. The gap between them is the lag.'

/* ══════════════════════════════ numbers ══════════════════════════════ */

/**
 * A count, grouped.
 *
 * `en-GB` explicitly rather than the browser's locale: a block height is a string a reader compares
 * against one they hold, and a page that renders `1.481.920` to one reader and `1,481,920` to
 * another has made that comparison harder for no gain.
 */
export function count(value: number): string {
  return value.toLocaleString('en-GB')
}

/**
 * Wei to whole EMBER, with `BigInt` only.
 *
 * `decimals` is a PARAMETER rather than a constant, and it defaults to nothing: the caller must say
 * which exponent it means. That is not ceremony. EMBER's exponent is **18**
 * (`contracts/packages/chain/src/index.ts:53`), which is what `micro-faucet` computes with
 * (`faucet/src/env.ts:180-184`, `DECIMALS = CHAINS.EMBER.decimals`) — and Hearth's own node still
 * defines `SPARKS_PER_EMBER = 100_000_000` at `hearth/node/src/params.js:6`, which is 1e8. That is
 * the retired UTXO ledger's unit and `hearth/README.md:98` records the disagreement in the project's
 * own words at `hearth/README.md:76`: "Decimals: 18 — specified; params.js still defines 1e8 and
 * has not moved yet". A default of 18 in this file would quietly pick a side in a discrepancy that
 * is open upstream.
 *
 * Trailing zeros are trimmed, and an exact whole number keeps no point. Nothing is rounded: the
 * fraction is the remainder, padded to `decimals` and then cut from the right, so no digit is
 * invented and none is lost to a double.
 */
export function weiToEmber(wei: string, decimals: number): string {
  // SHAPE-CHECKED BEFORE `BigInt`, and that is not belt and braces.
  //
  // `BigInt('')` is **0n**, not a throw. So an empty string — which is what an absent field
  // stringifies to, and what a service answering `{}` would produce — would have rendered as a
  // confident `0`: the exact plausible-default this whole surface exists to refuse, arriving
  // through a parser rather than through a `?? 0`. Found by driving this function with `''`.
  if (!/^-?\d+$/.test(wei.trim())) return 'not a number'
  let value: bigint
  try {
    value = BigInt(wei.trim())
  } catch {
    // Unreachable given the test above, and kept because the alternative to a branch that cannot
    // be taken must never be a number.
    return 'not a number'
  }
  const negative = value < 0n
  const magnitude = negative ? -value : value
  const unit = 10n ** BigInt(decimals)
  const whole = magnitude / unit
  const fraction = (magnitude % unit).toString().padStart(decimals, '0').replace(/0+$/, '')
  const sign = negative ? '-' : ''
  return fraction.length === 0
    ? `${sign}${whole.toLocaleString('en-GB')}`
    : `${sign}${whole.toLocaleString('en-GB')}.${fraction}`
}

/**
 * A duration in seconds, said the way a person would.
 *
 * The faucet's cooldowns and windows arrive as seconds (`faucet/src/server.ts:353-357`) and "86400"
 * is not a thing anybody reads. The largest whole unit only — "1 day", not "1 day 0 hours" — because
 * a cooldown is a rule of thumb and a second unit implies a precision the limiter does not promise.
 */
export function duration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return 'an unstated period'
  if (seconds < 60) return plural(Math.round(seconds), 'second')
  if (seconds < 3600) return plural(Math.round(seconds / 60), 'minute')
  if (seconds < 86_400) return plural(Math.round(seconds / 3600), 'hour')
  return plural(Math.round(seconds / 86_400), 'day')
}

function plural(n: number, unit: string): string {
  return `${count(n)} ${unit}${n === 1 ? '' : 's'}`
}

/**
 * An ISO timestamp, as a date and a time in UTC.
 *
 * UTC, and labelled, rather than the reader's zone. Every timestamp on this surface came from a
 * service log or a chain, both of which are UTC, and a page that silently shifts them makes a
 * reader comparing this screen against a log line do arithmetic they did not know they were doing.
 */
export function when(iso: string | null): string | null {
  if (iso === null) return null
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return null
  return `${at.toISOString().slice(0, 19).replace('T', ' ')} UTC`
}

/* ══════════════════════════════ tone ══════════════════════════════ */

/**
 * A state, as a word, a glyph and a tone — in that order of importance.
 *
 * The word is never optional and the glyph is never the only non-colour channel. The estate's
 * reserved status hues sit ΔE 4.6 apart under protanopia, measured in micro-ui, which is why
 * status-web encodes every day three times. A badge that said what it meant only by being amber
 * would say nothing at all to a reader who cannot separate it from the green one.
 */
export interface Tone {
  readonly tone: 'good' | 'warn' | 'bad' | 'idle'
  readonly word: string
  readonly glyph: string
  readonly meaning: string
}

/**
 * What a dispense's status means to somebody watching a drip.
 *
 * The six are the service's (`faucet/src/server.ts:458`). `confirmed` is the only `good`, and
 * everything before it is `idle` rather than `warn`: **waiting is the normal condition of a young
 * dispense**, and painting it amber would make it look like something had gone wrong — which is the
 * exact misreading that made a marketplace tell every seller their escrow had failed
 * (`indexer/src/server.ts:468-478`).
 */
export function dripTone(status: string): Tone {
  switch (status) {
    case 'confirmed':
      return { tone: 'good', word: 'Confirmed', glyph: '●', meaning: 'mined to the pinned depth' }
    case 'failed':
      return { tone: 'bad', word: 'Failed', glyph: '■', meaning: 'terminal; the reason is beside it' }
    case 'broadcast':
      return { tone: 'idle', word: 'Broadcast', glyph: '◐', meaning: 'handed to a node, not yet deep enough' }
    case 'signed':
      return { tone: 'idle', word: 'Signed', glyph: '◑', meaning: 'bytes committed, not yet broadcast' }
    case 'signing':
      return { tone: 'idle', word: 'Signing', glyph: '◒', meaning: 'with custody' }
    case 'queued':
      return { tone: 'idle', word: 'Queued', glyph: '○', meaning: 'accepted; nothing signed yet' }
    default:
      // A status this bundle has never seen is reported as exactly that. Mapping it onto the
      // nearest known word is how a client starts describing a service it no longer understands.
      return { tone: 'idle', word: status, glyph: '·', meaning: 'a status this page does not know' }
  }
}

/**
 * What a chain index provider's health means.
 *
 * The three states are `micro-indexer`'s (`indexer/src/reads.ts:63`).
 */
export function providerTone(state: string): Tone {
  switch (state) {
    case 'healthy':
      return { tone: 'good', word: 'Healthy', glyph: '●', meaning: 'answering' }
    case 'degraded':
      return { tone: 'warn', word: 'Degraded', glyph: '◐', meaning: 'answering, with failures' }
    case 'down':
      return { tone: 'bad', word: 'Down', glyph: '○', meaning: 'not answering' }
    default:
      return { tone: 'idle', word: state, glyph: '·', meaning: 'a state this page does not know' }
  }
}
