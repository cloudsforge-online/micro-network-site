/**
 * Types for the recovered miner.
 *
 * The implementation is JavaScript on purpose and stays that way: it is a restored, byte-for-byte
 * port of the node's proof-of-work. Rewriting it in TypeScript would mean re-deriving the hash, and
 * a digest that differs from the node's in one bit is work the chain refuses while the page looks
 * busy. So the algorithm is left exactly as it was and only its shape is declared here.
 *
 * WHERE THE PORT IS COMPARED AGAINST THE CHAIN. `test/browser-pow.test.ts`, in this repository, in
 * this repository's CI. It loads `hearth/node/src/pow.js` from the checkout `.github/workflows/ci.yml`
 * makes and compares digest for digest, then drives the node's own template flow with
 * `proofSignature` and requires a block out of it. hearth carries the mirror of that comparison
 * (`node/test/browser-pow.js`, `node/test/browser-proof.js`), which imports these files from a
 * checkout of this repository — but that gate runs on another repository's schedule, so it cannot be
 * what stands between an edit here and a deploy.
 *
 * This header used to state the comparison as a fact while nothing in this repository performed it;
 * the sentence had been true of the file's ancestor in hearth and travelled with the code when the
 * miner was restored here on 2026-08-06. micro-org#298.
 *
 * The declarations below cover what is imported from TypeScript: the two entry points `/mine` uses
 * and the two modules the cross-check drives. `keccak.js`, `secp256k1.js`, `wallet-sha256.js` and
 * `worker.js` are reached only from other JavaScript in this directory and need none.
 */

declare module '*/mining/sha256.js' {
  /** Synchronous, allocation-free SHA-256. Reused across millions of hashes, so `reset()` matters. */
  export class Sha256 {
    reset(): this
    update(bytes: Uint8Array): this
    /** Writes 32 bytes into `out` and returns it, so the hot path allocates nothing. */
    digestInto(out: Uint8Array): Uint8Array
    digest(): Uint8Array
  }
  export function sha256(...parts: Uint8Array[]): Uint8Array
  export function sha256Into(out: Uint8Array, ...parts: Uint8Array[]): Uint8Array
  export function toHex(bytes: Uint8Array): string
  export function utf8(str: string): Uint8Array
}

declare module '*/mining/homefire.js' {
  import type { Sha256 } from '*/mining/sha256.js'
  export class Homefire {
    /** Both parameters come from the node's template, never from a constant here. */
    constructor(scratchKiB: number, walkSteps: number)
    /** The 32-byte digest. The buffer is REUSED on the next call; copy it to keep it. */
    hash(seed: Uint8Array): Uint8Array
  }
  export function powSeed(h: Sha256, coreHashHex: string, nonce: number, coinbasePubHex: string): Uint8Array
  export function meetsTarget(digest: Uint8Array, targetBytes: Uint8Array): boolean
  export function hexToBytes(hex: string): Uint8Array
  export function toHex(bytes: Uint8Array): string
}

declare module '*/mining/account.js' {
  export interface MiningKey {
    readonly priv: Uint8Array
    readonly pubHex: string
    readonly address: string
    readonly privHex: string
  }
  /** A fresh key from the platform CSPRNG. */
  export function generateKey(): MiningKey
  /** A key a reader pastes back, so a machine can point at an address it already owns. */
  export function keyFromHex(text: string): MiningKey
  export function addressFor(priv: Uint8Array): string
  export function publicKeyHex(priv: Uint8Array): string
  export function toChecksumAddress(addr: string): string
}

declare module '*/mining/miner.js' {
  export interface MinerOptions {
    readonly rpc: string
    readonly key: { readonly priv: Uint8Array; readonly pubHex: string }
    readonly workers?: number
    readonly duty?: number
    readonly pauseOnBattery?: boolean
  }
  /**
   * Emits: `state` {running}, `hashrate` {hashrate,total}, `template` {height,…},
   * `accepted` {height,id,reward}, `stale` {templateId}, `rejected` {err}, `error` {message},
   * `power` {onPower,known}, `duty` {…}.
   */
  export class Miner extends EventTarget {
    constructor(options: MinerOptions)
    start(): Promise<void>
    stop(): void
    readonly running: boolean
    readonly hashrate: number
    readonly accepted: number
    /** Writable: the duty calculation reads it live, so it can be changed on a running pool. */
    pauseOnBattery: boolean
    /** Recomputes duty and pushes it to every worker. Call after changing `pauseOnBattery`. */
    _applyDuty(): void
  }
  export const POW_SIG_FORM: string
  export function proofSignature(digestHex: string, priv: Uint8Array): string
}
