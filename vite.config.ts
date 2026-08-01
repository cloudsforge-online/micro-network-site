import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * There is deliberately no `define`, no `envPrefix` and no `.env` file in this repository.
 *
 * A build-time constant is an environment baked into an image, and an image with an environment
 * baked into it has to be rebuilt to be promoted — which means the artefact that reaches
 * production is not the artefact that passed CI. Every host this app talks to is resolved at
 * RUNTIME from `window.location.hostname` by `cloudsforgeHosts()`, so one image serves localhost,
 * staging, a preview deployment and production. `test/no-build-time-config.test.ts` fails the
 * build if `import.meta.env.VITE_` ever reappears, and the `rules` job in CI greps for it again
 * so deleting the test does not delete the rule.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // @cloudsforge/ui is a `link:` dependency, so its own node_modules holds a second copy of
    // React. Two copies means two dispatchers, and the shared bar would throw on its first
    // useState.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // The linked package is shipped as TypeScript source until it is published; pre-bundling it
    // would freeze a stale copy of a package that is edited in the same working tree.
    exclude: ['@cloudsforge/ui'],
  },
  build: {
    // Named chunks and a real manifest of hashes: the assets are immutable-cached by nginx, and
    // that is only safe when every rebuild produces a new filename.
    sourcemap: true,
  },
  // ════════════════════════════════════════════════════════════════════════════════════════════
  // 5190 IS A VITE PORT. THE REGISTRY'S NUMBER FOR THIS SURFACE IS 3003, AND THEY ARE DIFFERENT
  // ON PURPOSE — WITH A COST THAT IS WRITTEN DOWN RATHER THAN HIDDEN.
  //
  // `ui/packages/ui/src/surfaces.ts:193` gives `network` devPort **3003**, and
  // `ui/packages/ui/src/surfaces.ts:373` gives `faucet` the same 3003 with `basePath: '/faucet'`
  // — the faucet is a ROUTE on this site rather than a host of its own, and
  // `ui/packages/ui/src/surfaces.test.ts:329` names the pair `faucet+network` in `CO_HOSTED` so
  // the collision guard treats it as deliberate. That is correct and this repository does not
  // "fix" it.
  //
  // The estate has two settled answers for a Vite port and this file takes the second:
  //
  //   * micro-worlds-web binds the registry's own number (`worlds-web/vite.config.ts:53`, 3001),
  //     because `worlds` devPort names where that bundle is SERVED.
  //   * micro-site binds 5170 (`site/vite.config.ts:43`) while its registry devPort is 3000, and
  //     its comment gives the reason: a Vite port is a developer convenience, "not the port the
  //     site is served on in production, and nothing in the bundle knows about it".
  //
  // Nothing in THIS bundle knows about it either. The faucet is reached with a router `<Link>`
  // rather than through `cloudsforgeHosts().faucet`, because it is a page in this app — see
  // src/lib/routes.ts. So no link here is broken by the difference.
  //
  // WHAT IS BROKEN BY IT IS SOMEBODY ELSE'S LINK. A sibling frontend resolving
  // `cloudsforgeHosts().network` or `cloudsforgeHosts().faucet` under `pnpm dev` gets
  // `http://localhost:3003`, and this bundle answers on 5190. `pnpm dev --port 3003` is the one
  // line that makes the registry true locally, and the README says so next to the citation.
  // `test/hosts.test.ts` pins BOTH numbers, so whichever moves first fails and names the other.
  //
  // 5190 was chosen by reading every sibling rather than by guessing: 5170 site, 5180 hub-web,
  // 5182 foresight-web, 5183 admin-web, 5184 mint-web, 5185 foresight-admin-web, 5186 trade-web,
  // 5187 market-web, 5188 status-web, 5189 explorer-web, 5192 devportal-web, 5195 emberkin-web,
  // 5199 web-template. `test/hosts.test.ts` re-reads them from the sibling checkouts in CI, so a
  // collision introduced later is a red run rather than two dev servers fighting over a socket.
  // ════════════════════════════════════════════════════════════════════════════════════════════
  server: { port: 5190 },
  preview: { port: 5190 },
})
