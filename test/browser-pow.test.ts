/**
 * THE BROWSER MINER, COMPARED AGAINST THE CHAIN IT GRINDS AGAINST.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WHY THIS FILE IS IN *THIS* REPOSITORY.
 *
 * `/mine` is a public page. A visitor who opens it puts their own CPU to work against the live
 * Hearth chain. `src/mining/{sha256,homefire,miner,worker}.js` are a second implementation of
 * Homefire AND of the proof signature — ported from the node so they can run synchronously in a
 * Worker, because `crypto.subtle` is async and one Homefire attempt is ~8,450 hashes.
 *
 * A digest that differs from the node's in one bit is a share the chain refuses. The failure is not
 * a red build: it is a stranger's laptop at full fan speed producing work that will never be
 * accepted, and from their side that is indistinguishable from "mining is slow". Nobody here would
 * see it either, because a rejected share and an unlucky one look the same in the counters.
 *
 * hearth carries the mirror of this comparison (`node/test/browser-pow.js`,
 * `node/test/browser-proof.js`) and it imports these very files. That gate is real and it is worth
 * having — but it runs in ANOTHER repository, on another schedule. An edit to `src/mining/*` goes
 * green here and turns hearth red later, most likely after this bundle has already been built,
 * published and deployed. The check has to exist where the code is changed, so it exists here too.
 *
 * ── WHAT IT COMPARES AGAINST, AND WHAT IT DELIBERATELY DOES NOT ────────────────────────────────
 *
 * hearth's PRODUCTION source only: `node/src/pow.js`, `node/src/params.js`,
 * `node/src/chain/header.js` and `node/src/evmnode.js`. Never hearth's `node/test/` directory.
 * Those two things differ in kind. `pow.js` is the consensus rule this port has to agree with, so
 * depending on it is the point; hearth's test files are that repository's own scaffolding, and
 * building this repository's gate on top of them would make an edit to somebody else's test suite
 * able to turn this repository red for a change it did not make. The estate has been bitten by
 * exactly that shape before — see the header of the "Every route this client calls names the file
 * that serves it" step in `.github/workflows/ci.yml`, which stopped counting positions in files
 * micro-indexer and micro-faucet own.
 *
 * ── IT FAILS. IT DOES NOT SKIP. ────────────────────────────────────────────────────────────────
 *
 * `test/chainstatus.test.ts`, `test/faucet.test.ts` and `test/tokens.test.ts` all SKIP their
 * cross-repository half when the sibling is missing, and CI turns absence into a failure
 * separately. That bargain is bought by those siblings being PRIVATE repositories: somebody who has
 * cloned only this one genuinely cannot obtain micro-indexer, micro-faucet or micro-ui.
 *
 * `cloudsforge-online/hearth` is PUBLIC and unauthenticated. Anybody can clone it, so there is no
 * contributor for whose sake this check would have to be softened — and the defect being guarded
 * against is precisely a green run that verified nothing. "skipped: no hearth checkout" scrolls
 * past exactly like a pass. So resolution throws, loudly, naming every path that was tried and how
 * to fix it. This is the same call hearth's own `node/test/browser-mining-src.js` makes in the
 * other direction, and the same one micro-hearth-wallet-core makes about its node oracle.
 *
 * ── THE REF IS NOT PINNED, AND THAT IS DELIBERATE ──────────────────────────────────────────────
 *
 * CI compares against hearth's default branch (`.github/workflows/ci.yml` checks the repository out
 * with no `ref:`), and the workflow records the commit it resolved to in the step log so a run is
 * still reproducible after the fact. Pinning would be the reflex, and here it would defeat the
 * check: half of what this file exists to catch is hearth RETUNING CONSENSUS underneath a port that
 * did not follow. Against a pinned ref that divergence is invisible, and the first person to learn
 * of it is a visitor whose browser is hashing for nothing. A pinned oracle can only catch edits
 * made here; an unpinned one catches both directions, which is the pair of failures that actually
 * reaches the public page.
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 */
import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { generateKey } from '../src/mining/account.js'
import { Sha256, sha256, toHex } from '../src/mining/sha256.js'
import { Homefire, hexToBytes, meetsTarget, powSeed } from '../src/mining/homefire.js'
import { POW_SIG_FORM, proofSignature } from '../src/mining/miner.js'

const here = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))

/**
 * Where a hearth checkout is, in the order CI and a developer's machine put it.
 *
 * `../hearth` is what `.github/workflows/ci.yml` produces — actions/checkout cannot write above the
 * workspace, so the sibling lands beside `network-site/` — and it is also the estate's layout on
 * disk. `.hearth` is the nested form somebody gets from cloning it inside this repository.
 */
const HEARTH_CANDIDATES = [here('../hearth'), here('.hearth')]

/** Everything either half of this file loads. A partial match is the wrong tree, not this one. */
const REQUIRED = ['node/src/pow.js', 'node/src/params.js', 'node/src/chain/header.js', 'node/src/evmnode.js']

const isHearth = (dir: string): boolean => REQUIRED.every((f) => existsSync(join(dir, f)))

/**
 * The hearth checkout, or a thrown error naming everywhere that was looked.
 *
 * Never returns null: see the header. The throw happens at module load, so the whole file is
 * reported as failed rather than as a green run of nothing.
 */
function resolveHearth(): string {
  /*
   * An explicit path is obeyed EXACTLY. A wrong one is an error and not a reason to go looking:
   * falling back would let a typo in a CI step resolve to a stale sibling checkout and report a
   * pass about a tree nobody meant to compare against, which is the same class of defect as
   * skipping. hearth's own `node/test/browser-mining-src.js` makes the same call.
   */
  const explicit = process.env['CLOUDSFORGE_HEARTH_DIR']
  if (explicit) {
    if (isHearth(explicit)) return explicit
    throw new Error(
      `CLOUDSFORGE_HEARTH_DIR is set to ${explicit}, which does not contain ${REQUIRED.join(', ')}.\n`
        + 'Refusing to look elsewhere: an explicit path that resolves to a different tree would '
        + 'report a pass about code nobody meant to compare against.',
    )
  }
  const root = HEARTH_CANDIDATES.find(isHearth)
  if (root) return root
  throw new Error(
    'the hearth reference implementation was not found, so this suite verified NOTHING and is '
      + 'failing rather than skipping.\n\n'
      + 'src/mining/ is a second implementation of this chain\'s proof-of-work, served to the '
      + 'public at /mine. It is only as good as the comparison against the node.\n\n'
      + 'cloudsforge-online/hearth is PUBLIC. Clone it beside this repository, or set '
      + 'CLOUDSFORGE_HEARTH_DIR to a checkout containing:\n'
      + REQUIRED.map((f) => `  ${f}`).join('\n')
      + '\n\nLooked in:\n'
      + HEARTH_CANDIDATES.map((d) => `  ${d}`).join('\n'),
  )
}

const hearthRoot = resolveHearth()
const requireHearth = createRequire(join(hearthRoot, 'node', 'src') + '/')

/** The consensus parameters this port must read from the template rather than bake in. */
interface HearthParams {
  readonly POW_SCRATCH_KIB: number
  readonly POW_WALK_STEPS: number
  readonly GENESIS_TARGET: string
  readonly MAX_TARGET: string
}

/** hearth/node/src/pow.js — the implementation `src/mining/homefire.js` is a port of. */
interface HearthPow {
  homefireHash(seed: Buffer, scratchKiB?: number, walkSteps?: number): Buffer
  powSeed(coreHash: string, nonce: number, coinbasePubHex: string): Buffer
  meetsTarget(digestHex: string, targetHex: string): boolean
}

/** hearth/node/src/chain/header.js — `signProof` is the mirror of `proofSignature`. */
interface HearthHeader {
  signProof(digestHex: string, privateKey: Buffer): string
}

interface HearthWork {
  readonly templateId: string
  readonly coreHash: string
  readonly target: string
  readonly scratchKiB: number
  readonly walkSteps: number
}

interface HearthSubmission {
  readonly ok: boolean
  readonly err?: string
}

interface HearthNode {
  readonly chain: { readonly height: number }
  readonly templates: {
    issue(coinbasePubHex: string): HearthWork
    submit(s: { templateId: string; nonce: number; powDigest: string; powSig: string }): HearthSubmission
  }
  close(): void
}

const P = requireHearth('./params.js') as HearthParams
const POW = requireHearth('./pow.js') as HearthPow
const HDR = requireHearth('./chain/header.js') as HearthHeader
const { EvmNode } = requireHearth('./evmnode.js') as {
  EvmNode: new (opts: { dataDir: string; quiet: boolean; genesis: { target: string } }) => HearthNode
}

const nodeSha = (b: Buffer): string => createHash('sha256').update(b).digest('hex')

describe('the browser SHA-256 agrees with the node it is standing in for', () => {
  it('matches node crypto on the empty input, the 55/56/64-byte padding edges and 64 KiB', () => {
    // The padding boundary is where a hand-written SHA-256 goes wrong: at 56 bytes the length
    // field no longer fits in the block and a second compression is forced. The node reaches it
    // through OpenSSL and never thinks about it; this port has to get it right by hand.
    const cases = [
      Buffer.alloc(0),
      Buffer.from('abc'),
      Buffer.from('a'.repeat(55)),
      Buffer.from('a'.repeat(56)),
      Buffer.from('a'.repeat(64)),
      Buffer.from('a'.repeat(1000)),
      randomBytes(65_536),
    ]
    for (const c of cases) {
      assert.equal(toHex(sha256(new Uint8Array(c))), nodeSha(c), `${c.length}-byte input`)
    }
  })

  it('streaming in 7-byte chunks equals one shot', () => {
    const data = randomBytes(5000)
    const h = new Sha256()
    for (let i = 0; i < data.length; i += 7) h.update(new Uint8Array(data.subarray(i, i + 7)))
    assert.equal(toHex(h.digest()), nodeSha(data))
  })

  it('a reused instance resets cleanly, which the hot path depends on', () => {
    // The miner reuses one instance for millions of hashes rather than allocating. A reset that
    // left state behind would corrupt every digest after the first — a defect that only appears
    // under load, which is to say only in a visitor's browser.
    const reused = new Sha256()
    reused.update(new Uint8Array(Buffer.from('first'))).digest()
    const again = reused.reset().update(new Uint8Array(Buffer.from('abc'))).digest()
    assert.equal(toHex(again), nodeSha(Buffer.from('abc')))
  })
})

describe('powSeed agrees with hearth/node/src/pow.js', () => {
  it('hashes the hex strings as TEXT and the nonce as decimal, exactly as the node does', () => {
    // The node passes the hex STRINGS to createHash, not the bytes they encode, and the nonce as
    // decimal text. Hashing the decoded bytes is the more obvious reading of the same function and
    // would never mine anything.
    const h = new Sha256()
    const cases: Array<[string, number, string]> = [
      ['00'.repeat(32), 0, '04' + 'ab'.repeat(64)],
      ['ff'.repeat(32), 1, '04' + 'cd'.repeat(64)],
      [randomBytes(32).toString('hex'), 987_654_321, '04' + randomBytes(64).toString('hex')],
    ]
    for (const [core, nonce, pub] of cases) {
      assert.equal(toHex(powSeed(h, core, nonce, pub)), POW.powSeed(core, nonce, pub).toString('hex'),
        `nonce ${nonce}`)
    }
  })
})

describe('Homefire digests agree with hearth/node/src/pow.js', () => {
  it('agrees on eight random seeds at the live consensus parameters', () => {
    const hf = new Homefire(P.POW_SCRATCH_KIB, P.POW_WALK_STEPS)
    for (let i = 0; i < 8; i += 1) {
      const seed = randomBytes(32)
      assert.equal(toHex(hf.hash(new Uint8Array(seed))), POW.homefireHash(seed).toString('hex'),
        `seed ${seed.toString('hex').slice(0, 16)}…`)
    }
  })

  it('reuses one scratchpad without bleeding state into the next digest', () => {
    // The one deliberate divergence between the two implementations: the node allocates 64 KiB per
    // hash and the browser allocates it once per Miner, because at browser hash rates the
    // allocation is the dominant cost. This is the check that keeps that divergence unobservable.
    const hf = new Homefire(P.POW_SCRATCH_KIB, P.POW_WALK_STEPS)
    const seed = randomBytes(32)
    const first = toHex(hf.hash(new Uint8Array(seed)))
    hf.hash(new Uint8Array(randomBytes(32)))
    assert.equal(toHex(hf.hash(new Uint8Array(seed))), first)
  })

  it('agrees at retuned parameters, which the template carries and neither side hard-codes', () => {
    // A stale miner must STOP producing work rather than quietly produce invalid work, so the pad
    // size and the walk length travel with the template. Evaluating both sides away from the
    // configured values is the only way to prove the browser reads them instead of baking them in.
    for (const [kib, steps] of [
      [P.POW_SCRATCH_KIB * 2, P.POW_WALK_STEPS],
      [P.POW_SCRATCH_KIB, P.POW_WALK_STEPS * 3],
    ] as Array<[number, number]>) {
      const seed = randomBytes(32)
      const mine = toHex(new Homefire(kib, steps).hash(new Uint8Array(seed)))
      assert.equal(mine, POW.homefireHash(seed, kib, steps).toString('hex'), `${kib} KiB / ${steps} steps`)
      // …and the retuned digest must genuinely differ from the configured one, or the equality
      // above would also hold for a browser that ignored both arguments.
      assert.notEqual(mine, POW.homefireHash(seed).toString('hex'), 'the retune changed the digest')
    }
  })
})

describe('the target comparison agrees with hearth/node/src/pow.js', () => {
  it('agrees on 200 random digests plus the equal, minimum and maximum boundaries', () => {
    // Equality is the boundary that matters. The node compares `<=`, so a browser using `<` would
    // throw away a valid block roughly never and be impossible to notice from the outside.
    const target = P.GENESIS_TARGET
    const bytes = hexToBytes(target)
    const sample = Array.from({ length: 200 }, () => randomBytes(32).toString('hex'))
    for (const digest of [...sample, target, '00'.repeat(32), 'ff'.repeat(32)]) {
      assert.equal(meetsTarget(hexToBytes(digest), bytes), POW.meetsTarget(digest, target),
        `digest ${digest.slice(0, 16)}…`)
    }
  })
})

describe('a digest the browser calls a win is a digest the node calls a win', () => {
  // Nothing above proves the four pieces agree when COMPOSED. A port that hashed correctly and
  // seeded from the wrong nonce would pass every check so far and mine nothing.
  const hf = new Homefire(P.POW_SCRATCH_KIB, P.POW_WALK_STEPS)
  const h = new Sha256()
  const target = P.MAX_TARGET
  const bytes = hexToBytes(target)
  const core = randomBytes(32).toString('hex')
  const pub = '04' + randomBytes(64).toString('hex')

  let nonce = 0
  let digestHex: string | null = null
  for (; nonce < 200_000; nonce += 1) {
    const d = hf.hash(powSeed(h, core, nonce, pub))
    if (meetsTarget(d, bytes)) { digestHex = toHex(d); break }
  }

  it('the browser finds a nonce with its own loop, and the node recomputes the identical digest', () => {
    assert.notEqual(digestHex, null, 'the browser implementation found no nonce in 200,000 tries')
    assert.equal(POW.homefireHash(POW.powSeed(core, nonce, pub)).toString('hex'), digestHex)
  })

  it('and the node agrees that digest meets the target', () => {
    assert.ok(digestHex !== null)
    assert.equal(POW.meetsTarget(digestHex, target), true)
  })
})

describe('the proof signature is the one hearth/node/src/chain/header.js verifies', () => {
  // THE ONE DIVERGENCE THAT EVER REACHED PRODUCTION WAS HERE, not in the hash loop. This file used
  // to claim 64 bytes with no recovery id, on the reasoning that the header already carries
  // `coinbasePub`. The node requires 65 and recovers the key from the signature, so every block the
  // browser miner ever found was answered `bad signature` AFTER the work was done. The constant
  // naming the format was faithfully kept in sync with the wrong answer, because a constant that
  // names a format is documentation and documentation cannot be wrong loudly.
  const key = generateKey()
  const digestHex = randomBytes(32).toString('hex')
  const sig = proofSignature(digestHex, key.priv)

  it('is 65 bytes of lowercase hex — r || s || recoveryId', () => {
    assert.match(sig, /^[0-9a-f]{130}$/)
  })

  it('POW_SIG_FORM names the format the node actually requires', () => {
    assert.ok(POW_SIG_FORM.includes('65'), POW_SIG_FORM)
    assert.match(POW_SIG_FORM, /recover/i)
  })

  it('is byte for byte what the node\'s own signProof would have produced', () => {
    assert.equal(sig, HDR.signProof(digestHex, Buffer.from(key.priv)))
  })
})

describe('the node accepts a block this browser mined and signed', () => {
  // The end of the claim. Everything above compares functions; this drives the node's REAL template
  // flow with a key the node never sees, which is the whole point of remote mining and the only
  // form of the assertion that a rewrite of the browser's clients cannot walk around.
  //
  // Measured 2026-08-09 on this machine: the whole describe block takes ~2s at the live parameters
  // (64 KiB / 256 steps) against MAX_TARGET, which lands a nonce within a few dozen attempts.
  const dir = mkdtempSync(join(tmpdir(), 'network-site-browser-proof-'))
  const node = new EvmNode({ dataDir: dir, quiet: true, genesis: { target: P.MAX_TARGET } })

  const key = generateKey()
  const h = new Sha256()

  /** Grind with the BROWSER's own loop — the thing under test — until the target is met. */
  const grind = (work: HearthWork): { nonce: number; digest: string | null } => {
    const hf = new Homefire(work.scratchKiB, work.walkSteps)
    const bytes = hexToBytes(work.target)
    for (let nonce = 0; nonce < 200_000; nonce += 1) {
      const d = hf.hash(powSeed(h, work.coreHash, nonce, key.pubHex))
      if (meetsTarget(d, bytes)) return { nonce, digest: toHex(d) }
    }
    return { nonce: -1, digest: null }
  }

  const work = node.templates.issue(key.pubHex)
  const won = grind(work)
  const heightBefore = node.chain.height
  const accepted = won.digest === null ? null : node.templates.submit({
    templateId: work.templateId,
    nonce: won.nonce,
    powDigest: won.digest,
    powSig: proofSignature(won.digest, key.priv),
  })
  const heightAfterAccept = node.chain.height

  // A second template, won the same way and signed by a key that was never issued the work.
  const work2 = node.templates.issue(key.pubHex)
  const won2 = grind(work2)
  const thief = generateKey()
  const stolen = won2.digest === null ? null : node.templates.submit({
    templateId: work2.templateId,
    nonce: won2.nonce,
    powDigest: won2.digest,
    powSig: proofSignature(won2.digest, thief.priv),
  })
  const heightAfterTheft = node.chain.height

  node.close()
  rmSync(dir, { recursive: true, force: true })

  it('issues work for a key it does not hold, and the PoW parameters travel with it', () => {
    assert.ok(work.templateId && work.coreHash && work.target, 'the node issued no work')
    assert.equal(work.scratchKiB, P.POW_SCRATCH_KIB)
    assert.equal(work.walkSteps, P.POW_WALK_STEPS)
  })

  it('accepts the submission, and the chain grows by the block a browser mined', () => {
    assert.notEqual(won.digest, null, 'the browser found no winning nonce in 200,000 tries')
    assert.equal(accepted?.ok, true, `the node refused it: ${accepted?.err ?? 'no answer'}`)
    assert.equal(heightAfterAccept, heightBefore + 1)
  })

  it('refuses a proof signed by a key the work was not issued to', () => {
    // Without this the 65-byte form would be a 65-byte decoration: a signature nobody checks.
    assert.notEqual(won2.digest, null, 'the browser found no second winning nonce')
    assert.equal(stolen?.ok, false, 'a proof signed by another key was accepted')
    assert.equal(heightAfterTheft, heightAfterAccept, 'the stolen proof added a block')
  })
})
