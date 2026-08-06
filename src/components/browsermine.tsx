/**
 * Mining, in this tab, paid to an address you hold the key to.
 *
 * ── Why this exists at all ───────────────────────────────────────────────────────────────────────
 *
 * The node has been ready for a browser miner the whole time: `/mining/template` issues work to any
 * 65-byte secp256k1 public key, and the gateway already returns an `access-control-allow-origin`
 * for this surface. What was missing was the browser half, which was deleted along with the
 * pre-migration front ends. The proof-of-work here is the same code, restored, and it is checked
 * against the node's own implementation rather than assumed to match: a digest that differs from
 * the node's in one bit is work the chain refuses, and the page would look busy while producing
 * nothing.
 *
 * ── The key never leaves this tab ────────────────────────────────────────────────────────────────
 *
 * It is generated here, held in memory, and used only to sign a proof once a nonce has already won.
 * It is not sent to CloudsForge and nothing stores it. If the tab closes without it being saved,
 * the address and anything paid to it are unreachable — which is why the warning below is placed
 * before the start button rather than after it.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Note } from './parts.tsx'

interface MiningKey {
  readonly priv: Uint8Array
  readonly pubHex: string
  readonly address: string
  readonly privHex: string
}

interface Found {
  readonly height: number
  readonly reward?: string
}

/** Hashes per second, in the unit a reader can hold in their head. */
function rate(hashes: number): string {
  if (hashes >= 1_000_000) return `${(hashes / 1_000_000).toFixed(2)} MH/s`
  if (hashes >= 1_000) return `${(hashes / 1_000).toFixed(1)} kH/s`
  return `${Math.round(hashes)} H/s`
}

export function BrowserMine({ rpc }: { rpc: string }) {
  const [key, setKey] = useState<MiningKey | null>(null)
  const [saved, setSaved] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [running, setRunning] = useState(false)
  const [hashrate, setHashrate] = useState(0)
  const [height, setHeight] = useState<number | null>(null)
  const [found, setFound] = useState<readonly Found[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [paste, setPaste] = useState('')
  // Polite by default: on battery the miner runs at zero duty so it does not flatten someone's
  // laptop. That is the right default and it was also invisible — you pressed Start, nine workers
  // span up, and the rate sat at zero with nothing on screen to say why.
  const [onBattery, setOnBattery] = useState(false)
  const [mineOnBattery, setMineOnBattery] = useState(false)
  const miner = useRef<{ start: () => Promise<void>; stop: () => void } | null>(null)

  // Stop mining if the reader navigates away. A worker pool left running in a detached component
  // keeps every core busy and there is no longer anything on screen to turn it off.
  useEffect(() => () => miner.current?.stop(), [])

  const makeKey = useCallback(async (from?: string) => {
    setNotice(null)
    try {
      const account = await import('../mining/account.js')
      setKey(from ? account.keyFromHex(from) : account.generateKey())
      setSaved(false)
      setRevealed(false)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'that key could not be read')
    }
  }, [])

  const toggle = useCallback(async () => {
    if (running) {
      miner.current?.stop()
      return
    }
    if (!key) return
    setNotice(null)
    try {
      const { Miner } = await import('../mining/miner.js')
      const m = new Miner({ rpc, key, pauseOnBattery: !mineOnBattery })
      miner.current = m
      m.addEventListener('state', (e) => setRunning(Boolean((e as CustomEvent).detail.running)))
      m.addEventListener('hashrate', (e) => setHashrate((e as CustomEvent).detail.hashrate))
      m.addEventListener('template', (e) => setHeight((e as CustomEvent).detail.height))
      m.addEventListener('duty', (e) => {
        const d = (e as CustomEvent).detail as { effective: number; onPower: boolean; powerKnown: boolean }
        setOnBattery(d.powerKnown && !d.onPower && d.effective === 0)
      })
      m.addEventListener('accepted', (e) => {
        const d = (e as CustomEvent).detail as Found
        setFound((prev) => [d, ...prev].slice(0, 8))
      })
      m.addEventListener('rejected', (e) =>
        setNotice(`the node refused a block: ${(e as CustomEvent).detail.err}`),
      )
      m.addEventListener('error', (e) => setNotice((e as CustomEvent).detail.message))
      await m.start()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'mining could not start')
    }
  }, [running, key, rpc, mineOnBattery])

  return (
    <section className="ns-mine">
      <h3>Mine in this tab</h3>
      <p className="ns-prose">
        Your browser does the same proof-of-work the node does, and the block reward is paid to an
        address only you hold the key to. Nothing is installed and nothing is sent to us.
      </p>

      {notice && (
        <Note tone="warn" title="That did not work">
          <p>{notice}</p>
        </Note>
      )}

      {key === null ? (
        <div className="ns-mine__setup">
          <button type="button" className="cf-btn cf-btn--ember" onClick={() => void makeKey()}>
            Create a mining address
          </button>
          <details className="ns-mine__import">
            <summary>I already have a key</summary>
            <label className="ns-field">
              <span>Private key</span>
              <input
                className="cf-input"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder="64 hex characters"
              />
            </label>
            <button type="button" className="cf-btn" onClick={() => void makeKey(paste)}>
              Use this key
            </button>
          </details>
        </div>
      ) : (
        <>
          <dl className="ns-facts">
            <dt>Paid to</dt>
            <dd>
              <code className="cf-num">{key.address}</code>
            </dd>
          </dl>

          <Note tone="warn" title="Save the key before you start">
            <p>
              This key exists only in this tab. Close it without saving and the address, and
              anything mined to it, cannot be recovered by us or by anyone else.
            </p>
            {revealed ? (
              <p>
                <code className="cf-num ns-mine__key">{key.privHex}</code>
              </p>
            ) : (
              <button type="button" className="cf-btn" onClick={() => setRevealed(true)}>
                Show the key
              </button>
            )}
            <label className="ns-mine__ack">
              <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
              <span>I have saved it somewhere safe</span>
            </label>
          </Note>

          <div className="ns-mine__controls">
            <button
              type="button"
              className={running ? 'cf-btn' : 'cf-btn cf-btn--ember'}
              disabled={!saved && !running}
              onClick={() => void toggle()}
            >
              {running ? 'Stop mining' : 'Start mining'}
            </button>
            {running && !onBattery && <span className="ns-mine__rate cf-num">{rate(hashrate)}</span>}
            {height !== null && (
              <span className="ns-mine__height">working on block {height.toLocaleString()}</span>
            )}
          </div>

          {running && onBattery && (
            <Note tone="warn" title="Paused — this machine is on battery">
              <p>
                Mining is held at zero while you are unplugged, so it cannot flatten your battery
                without asking. Plug in and it starts on its own.
              </p>
              <label className="ns-mine__ack">
                <input
                  type="checkbox"
                  checked={mineOnBattery}
                  onChange={(e) => setMineOnBattery(e.target.checked)}
                />
                <span>Mine on battery anyway</span>
              </label>
            </Note>
          )}

          {found.length > 0 && (
            <div className="ns-mine__found">
              <h4>Blocks you found</h4>
              <ul>
                {found.map((f) => (
                  <li key={f.height}>
                    <span className="cf-num">#{f.height.toLocaleString()}</span> accepted
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
