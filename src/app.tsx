/**
 * The route table.
 *
 * Two facts about it are enforced elsewhere and must stay in agreement with it: `ROUTES` in
 * `lib/routes.ts` is the declaration the navigation is derived from, and `nginx.conf` enumerates
 * the same paths so that an address which is NOT here answers 404 rather than 200.
 *
 * ── Nothing here is gated, and that is read off the SERVICES rather than chosen ────────────────
 *
 * There is no `ProtectedRoute` in this repository, and there must not be one. The chain read is
 * anonymous (`authoriseRead` returns `null` for a caller with no token and lets the handler run,
 * `indexer/src/server.ts`) and the three faucet routes are unauthenticated by that
 * service's own decision (`faucet/src/server.ts`). A gate here would demand a
 * session for facts anyone can read off a public chain and a faucet anyone may use —
 * `docs/ecosystem/15-monetisation-model.md` settles the neighbouring case: "A public chain whose
 * explorer is paywalled is not a public chain."
 *
 * `test/routes.test.ts` asserts the absence, so restoring the estate's usual shape is a decision
 * somebody has to argue for rather than a reflex.
 *
 * ── No route takes a parameter, and that is unusual enough to say why ─────────────────────────
 *
 * Every other reading surface in this estate has a `:id` somewhere. This one has none: the chain
 * page asks about two fixed scopes (`HEARTH_SCOPES` in `src/lib/chainstatus.ts`), and looking up a
 * particular block, transaction or address is the block explorer's job, on its own hostname. A
 * `/blocks/:height` here would be a second explorer, competing with a tested one for the same
 * questions. `src/lib/chainstatus.ts` declines those six routes by name and says so.
 */
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/scroll-to-top.tsx'
import { AppShell } from './components/shell.tsx'
import { AuthProvider } from './lib/auth.tsx'
import { placementIsKnown } from './lib/hosts.ts'
import { ChainPage } from './pages/chain.tsx'
import { FaucetPage } from './pages/faucet.tsx'
import { HomePage } from './pages/home.tsx'
import { MinePage } from './pages/mine.tsx'
import { NodePage } from './pages/node.tsx'
import { NotFoundPage } from './pages/not-found.tsx'

export function App() {
  const unregistered = !placementIsKnown()

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route element={<AppShell unregistered={unregistered} />}>
            <Route index element={<HomePage />} />
            <Route path="chain" element={<ChainPage />} />
            <Route path="mine" element={<MinePage />} />
            <Route path="node" element={<NodePage />} />
            {/* The registry's `faucet` basePath. See the header of src/lib/routes.ts. */}
            <Route path="faucet" element={<FaucetPage />} />
            {/* Unknown paths render inside the shell, so the reader keeps the navigation they need
                to get back out — under a real 404, which nginx.conf preserves. */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
