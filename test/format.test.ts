/**
 * FORMATTING, WITH THE THREE RULES THAT MAKE IT HONEST.
 *
 *   1. Nothing converts an amount with `Number`. `weiToEmber` is driven below with a value a double
 *      cannot represent, and compared digit for digit.
 *   2. Nothing absent formats as a number.
 *   3. The word "final" and any yield are absent from the exported strings.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import {
  NOT_AN_INCOME,
  TWO_HEIGHTS,
  count,
  dripTone,
  duration,
  providerTone,
  weiToEmber,
  when,
} from '../src/lib/format.ts'

const at = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))

describe('wei to EMBER, with BigInt only', () => {
  it('survives a value a double cannot represent', () => {
    // 12,345,678,901,234,567,890,123 wei. `Number` would round it and silently lose the low digits,
    // which is the defect `indexer/src/reads.ts:8-10` and `faucet/src/server.ts:350-351` both put
    // decimal strings on the wire to avoid.
    const wei = '12345678901234567890123'
    assert.equal(weiToEmber(wei, 18), '12,345.678901234567890123')
    // The control: a double really would have got it wrong.
    assert.notEqual(String(Number(wei) / 1e18), '12345.678901234567890123')
  })

  it('trims trailing zeros and keeps a whole number whole', () => {
    assert.equal(weiToEmber('1000000000000000000', 18), '1')
    assert.equal(weiToEmber('1500000000000000000', 18), '1.5')
    assert.equal(weiToEmber('0', 18), '0')
  })

  it('groups the whole part, because a drip of a thousand EMBER is unreadable ungrouped', () => {
    assert.equal(weiToEmber('1234000000000000000000', 18), '1,234')
  })

  it('takes the exponent as a PARAMETER, because EMBER’s is disputed upstream', () => {
    // 18 under the account model (`contracts/packages/chain/src/index.ts:53`), and the node still
    // defines 1e8 (`hearth/node/src/params.js:6`). A default here would pick a side in a
    // discrepancy the project has not resolved.
    assert.equal(weiToEmber('100000000', 8), '1')
    assert.equal(weiToEmber('100000000', 18), '0.0000000001')
  })

  it('returns a sentence rather than NaN for a value it cannot read', () => {
    // Rule 2, applied to a malformed answer: a service that sent something this client does not
    // understand must not produce a number-shaped nothing.
    assert.equal(weiToEmber('not a number', 18), 'not a number')
    assert.equal(weiToEmber('', 18), 'not a number')
  })

  it('handles a negative, which should never arrive but must not render as garbage', () => {
    assert.equal(weiToEmber('-1500000000000000000', 18), '-1.5')
  })
})

describe('durations', () => {
  it('uses the largest whole unit and nothing smaller', () => {
    assert.equal(duration(30), '30 seconds')
    assert.equal(duration(1), '1 second')
    assert.equal(duration(90), '2 minutes')
    assert.equal(duration(3600), '1 hour')
    assert.equal(duration(86_400), '1 day')
    assert.equal(duration(172_800), '2 days')
  })

  it('refuses to invent one for a value it cannot read', () => {
    assert.equal(duration(Number.NaN), 'an unstated period')
    assert.equal(duration(-1), 'an unstated period')
  })
})

describe('timestamps', () => {
  it('renders UTC, and says so', () => {
    assert.equal(when('2026-08-01T12:34:56.000Z'), '2026-08-01 12:34:56 UTC')
  })

  it('returns null rather than a placeholder for an absent or unreadable one', () => {
    // Rule 2 again. A caller must be able to tell "no timestamp" from "a timestamp", and a string
    // like "—" cannot be distinguished from one.
    assert.equal(when(null), null)
    assert.equal(when('not a date'), null)
  })
})

describe('counts', () => {
  it('groups, in en-GB explicitly', () => {
    // Explicitly rather than by the browser's locale: a block height is a string a reader compares
    // against one they hold, and rendering `1.481.920` to one reader and `1,481,920` to another
    // makes that comparison harder for no gain.
    assert.equal(count(1_481_920), '1,481,920')
    assert.equal(count(0), '0')
  })
})

describe('tones', () => {
  it('gives every dispense status a word and a glyph, not only a colour', () => {
    for (const status of ['queued', 'signing', 'signed', 'broadcast', 'confirmed', 'failed']) {
      const tone = dripTone(status)
      assert.ok(tone.word.length > 0, `${status} has no word`)
      assert.ok(tone.glyph.length > 0, `${status} has no glyph`)
      assert.ok(tone.meaning.length > 0, `${status} has no meaning`)
    }
  })

  it('treats waiting as idle rather than as a warning', () => {
    // `micro-market` reported "the on-chain escrow is not confirmed yet" as a FAILURE for every
    // activation. Waiting is the normal condition of a young dispense.
    for (const status of ['queued', 'signing', 'signed', 'broadcast']) {
      assert.equal(dripTone(status).tone, 'idle', `${status} is painted as something other than idle`)
    }
    assert.equal(dripTone('confirmed').tone, 'good')
    assert.equal(dripTone('failed').tone, 'bad')
  })

  it('reports an unknown status as itself rather than mapping it to the nearest word', () => {
    // A client that describes a service it no longer understands is worse than one that says so.
    assert.equal(dripTone('teleported').word, 'teleported')
    assert.match(dripTone('teleported').meaning, /does not know/)
  })

  it('gives the three provider states the same treatment', () => {
    assert.equal(providerTone('healthy').tone, 'good')
    assert.equal(providerTone('degraded').tone, 'warn')
    assert.equal(providerTone('down').tone, 'bad')
    assert.equal(providerTone('mystery').word, 'mystery')
  })
})

describe('the exported sentences', () => {
  it('the income caveat says what mining pays and what it does not', () => {
    assert.match(NOT_AN_INCOME, /block reward, not an income/)
    assert.match(NOT_AN_INCOME, /difficulty/)
    assert.match(NOT_AN_INCOME, /no market/)
  })

  it('the two-heights sentence names both heads', () => {
    assert.match(TWO_HEIGHTS, /walked head/)
    assert.match(TWO_HEIGHTS, /claimed tip/)
    assert.match(TWO_HEIGHTS, /lag/)
  })

  it('and no exported string claims finality or a yield', () => {
    // Asserted on the VALUES rather than on the source, because the file's own header quotes the
    // words it forbids in order to explain the rule — a scan over the raw text would match the
    // explanation and fail a correct file. Six guards in this estate have done exactly that.
    for (const text of [NOT_AN_INCOME, TWO_HEIGHTS]) {
      assert.doesNotMatch(text, /\bfinal\b/i)
      assert.doesNotMatch(text, /\bAPY\b|\bprofit\b|\byield\b/i)
    }
  })

  it('the caveat is written once, not once per page', () => {
    const format = readFileSync(at('src/lib/format.ts'), 'utf8')
    assert.equal([...format.matchAll(/export const NOT_AN_INCOME/g)].length, 1)
  })
})
