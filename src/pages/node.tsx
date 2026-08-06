/**
 * Running a node.
 *
 * Everything on this page runs on one machine, and the page says so at the top rather than at the
 * bottom. The testnet "runs on `127.0.0.1` and nothing routes it" (`hearth/MAP.md`) and is not
 * reachable from outside at all — `deploy/gateway/dynamic/tls.yml` records why: Universal SSL
 * is one label deep, so every two-label name under the testnet apex fails its TLS handshake.
 *
 * MAINNET IS A DIFFERENT MATTER NOW, and the standfirst was rewritten rather than left to age. A
 * public JSON-RPC endpoint is published on the tunnel
 * (`deploy/cloudflared/config.mainnet.public.yml`) and answers from off the estate, so "no
 * endpoint to configure" is false. What has NOT changed is that this page publishes no bootstrap
 * list and no peer to dial, and that the four steps below are all local — so it still offers no
 * "connect to the network" step, because it would be a step nobody here has run.
 *
 * The four steps are Hearth's own, in Hearth's own order (`hearth/README.md`, "Try it now"),
 * because that order was chosen by somebody who had run them. Each carries the command as text a
 * reader copies rather than as a screenshot, and each cites the line it came from.
 */
import { NODE } from '../content/copy.ts'
import { HEARTH_REPO, hearthFile } from '../lib/routes.ts'
import { Cite, Command, Note, Page, PageHead, Section } from '../components/parts.tsx'

export function NodePage() {
  return (
    <Page>
      <PageHead title={NODE.title} standfirst={NODE.standfirst} />

      <Section title="Four things you can run today" id="steps">
        <ol className="ns-steps">
          {NODE.steps.map((step) => (
            <li className="ns-step" key={step.title}>
              <h3 className="ns-step__title">{step.title}</h3>
              <p className="ns-step__body">{step.body}</p>
              <Command>{step.command}</Command>
              <Cite source={step.source} />
            </li>
          ))}
        </ol>
      </Section>

      {/*
        The genesis check.

        On a public page because both traps under it produce a SILENT split rather than an error:
        the genesis hash does not cover the chain id or the Commons address, and the genesis file is
        pinned to a data directory on first start. A reader cannot diagnose either without being
        told they exist.
      */}
      <Section title={NODE.sameChain.title} id="same-chain">
        <p className="ns-prose">{NODE.sameChain.body}</p>
        <Command>{NODE.sameChain.command}</Command>
        <Cite source={NODE.sameChain.source} />
      </Section>

      <Note tone="accent" title={NODE.contribute.title}>
        <p>{NODE.contribute.body}</p>
        <p className="ns-note__aside">
          <a href={HEARTH_REPO}>The repository</a> ·{' '}
          <a href={hearthFile('CONTRIBUTING.md')}>How to contribute</a> ·{' '}
          <a href={hearthFile('MAP.md')}>The verified inventory</a> ·{' '}
          <a href={hearthFile('SECURITY.md')}>Reporting a vulnerability</a>
        </p>
        <Cite source={NODE.contribute.source} />
      </Note>
    </Page>
  )
}
