# Kurio — NFT Marketplace

The frontend application for the challenge, featuring responsive screens, an MSW-mocked API, and catalog, account, cart, and checkout flows.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open the URL displayed by Vite (usually `http://localhost:5173`). Mocks are enabled by default; no backend or `.env` file is required.

Additional commands:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run format:check
npm.cmd run preview
npm.cmd run typecheck:test
npm.cmd run test:unit
npm.cmd run test:e2e
```

For the first E2E run, install Chromium with
`npx.cmd playwright install chromium`. Playwright starts Vite with MSW, and tests
reset mock data before each scenario. HTML reports, traces, and failure
screenshots are saved in Git-ignored directories.

Unit tests cover ETH arithmetic, mocks, REST handlers, Axios adapters, use
cases, and presentation utilities. E2E tests are organized by user journey in
`tests/e2e/`; visual baselines cover the home page, NFT details, cart, and
checkout on desktop and mobile. Realtime scenarios cover price and
availability changes, checkout quote updates, duplicate and stale events, and
the resumption of a pending order after disconnection.

## Architecture and styles

- `src/domain/`: entities, domain contracts, and pure rules such as ETH arithmetic.
- `src/application/`: repository ports and transport-independent use cases.
- `src/infrastructure/`: Axios adapter, MSW/Socket.IO mocks, and demo persistence.
- `src/app/`: dependency composition and routes.
- `src/presentation/features/`: pages and components organized by flow and screen.
- Each presentation feature keeps its CSS styles in a `presentation-*-styles`
  folder alongside its pages and components. Global styles are in
  `src/presentation/presentation-global-styles/`.
- `components.json` records the shadcn/ui aliases for UI components adapted to
  the theme. The project uses Radix primitives, CVA, and Tailwind Merge.
- Unit tests are kept close to the code they test, in `*-tests` folders specific
  to each layer or feature. `tests/e2e/` separates flows by journey
  (`account/`, `authentication/`, `cart/`, `catalog/`, `checkout/`, `favorites/`,
  and `realtime/`); `visual/` contains visual scenarios and
  `visual-baselines/` contains their desktop and mobile references.
- Presentation components import stylesheets from their own feature's styles
  folder. Tailwind remains available for utility classes and components.
- `scripts/check-line-length.mjs` makes `lint` fail if a code line exceeds 100
  characters. `npm.cmd run format` applies Prettier; `npm.cmd run format:check`
  checks formatting without changing files.

Dependency flow: presentation → use cases/ports → domain. Infrastructure
adapters implement the ports and are connected in the composition root at
`src/app/container.ts`; the domain does not import React, Axios, or MSW.

## Demo credentials

- `lucas@kurio.test` / `Kurio123!`
- `aether@kurio.test` / `Kurio123!`

## Continuous integration

The `.github/workflows/ci.yml` workflow runs lint, formatting, type checking,
unit tests, build, and E2E journeys on pushes and pull requests. Playwright and
unit tests can also be run locally using the commands above. Install Chromium
for the first E2E run with `npx.cmd playwright install chromium`.

## Lighthouse audit

After installing Chromium and dependencies, run:

```powershell
npm.cmd run audit:lighthouse
```

The command creates a production build, starts the local preview, and collects
three mobile and desktop measurements for the home page and NFT details. HTML
and JSON reports, along with medians (including LCP, CLS, and TBT), are saved in
`lighthouse-reports/`. The measurements still need to be run and reviewed
before delivery.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for REST contracts, session handling,
cache, Socket.IO, and simulation decisions and limitations.
