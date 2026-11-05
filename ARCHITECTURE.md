# Architecture and integration decisions

## Scope and runtime

Kurio is a frontend-only NFT marketplace demonstration. Authentication, catalog,
wallets, quotes, and orders are simulated; no real blockchain, wallet extension,
payment gateway, or private backend is used. The production build still includes
MSW because the public challenge deployment must remain self-contained.

The composition root in `src/app/container.ts` constructs use cases from the
Axios-backed repository. TanStack Router owns navigation and URL search state;
TanStack Query owns asynchronous server state and cache invalidation.

## Dependency boundaries

- `src/domain/` contains entities, transport-independent contracts, and pure
  value calculations. ETH amounts are decimal strings at the boundary and
  integer arithmetic is used for calculations.
- `src/application/` contains repository ports and use-case composition.
- `src/infrastructure/http/` implements the ports with Axios.
- `src/infrastructure/mock-server/` provides browser MSW handlers, seeded
  fixtures, persistence, reproducible scenarios, and the Socket.IO mock.
- `src/infrastructure/realtime/` creates the Socket.IO client.
- `src/presentation/` contains routes' screens and components. Feature CSS is
  kept in adjacent `presentation-*-styles` folders; unit tests live beside the
  source in `*-tests` folders.
- `tests/e2e/` groups Playwright scenarios by user journey. Visual baselines
  live in `tests/e2e/visual-baselines/`.

Presentation depends on application use cases and ports; the domain does not
depend on React, Axios, MSW, or Socket.IO.

## REST contracts

Requests use `/api` as the base URL. The Axios interceptor attaches the current
Bearer token and the selected `X-Mock-Scenario` header.

| Resource          | Endpoints                                                                                   | Access                 |
| ----------------- | ------------------------------------------------------------------------------------------- | ---------------------- |
| Catalog           | `GET /nfts`, `GET /nfts/:id`                                                                | Public                 |
| Authentication    | `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout`         | Public/session         |
| Favorites         | `GET /favorites`, `PUT /favorites/:nftId`                                                   | Authenticated          |
| Cart              | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:nftId`, `DELETE /cart/items/:nftId`    | Guest or authenticated |
| Coupons and quote | `POST /cart/coupon`, `DELETE /cart/coupon`, `POST /cart/quote`                              | Guest or authenticated |
| Orders            | `POST /orders`, `GET /orders/:orderId`                                                      | Authenticated          |
| Profile           | `GET /profile`, `PUT /profile`, `PUT /profile/password`                                     | Authenticated          |
| Wallets           | `GET /wallets`, `POST /wallets`, `PUT /wallets/:walletId`, `PUT /wallets/:walletId/primary` | Authenticated          |

Order creation requires `X-Idempotency-Key`. The mock scopes the key to the
authenticated user, returns the existing receipt for the same key and payload,
and returns a conflict if the payload differs. The quote version is checked
again at order creation. A rejected or stale order keeps the cart; confirmation
decrements only the purchased quantities. Receipts store an order snapshot.

The mock state is stored in browser `localStorage` under
`kurio_mock_state_v2`. `POST /api/mock/reset` restores the seed state. This is
demo persistence, not a production database or a security boundary. Seed account
passwords are hashed for the demo; SHA-256 without a server-side password KDF
must not be treated as production authentication.

## Query cache and session

Catalog state is encoded in TanStack Router search parameters so that refresh,
direct navigation, and browser history restore the same view. TanStack Query
keys separate catalog lists, details, cart, quote, session, profile, wallets,
favorites, and orders.

The demo session token is held in local storage. Protected requests resolve that
token in the mock. Session expiry stores an allow-listed return path in
`sessionStorage`, clears private query data, and redirects to login. Logout
clears the query client before returning to the public catalog. Cart data is
scoped to guest or user in the mock; login merges guest items into the user's
cart subject to available quantity.

Mutations invalidate the affected queries; favorites also demonstrate optimistic
updates with rollback. Orders preserve their idempotency key and payload in
`sessionStorage` during timeout recovery. The receipt is re-fetched from REST
after navigation or reload.

## Socket.IO protocol and reconciliation

The client uses the Socket.IO WebSocket transport at `/socket.io/`. Browser MSW
matches that exact WebSocket endpoint and adapts Engine.IO/Socket.IO frames with
`@mswjs/socket.io-binding`.

Client subscriptions:

- `subscribe:nft` / `unsubscribe:nft` with an NFT id.
- `subscribe:order` with an order id and the current session token;
  `unsubscribe:order` removes that subscription.

Server events:

| Event           | Payload                                                        | Consumer behavior                                                                |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `nft.updated`   | `eventId`, `nftId`, `priceEth`, `availableQuantity`, `version` | Update catalog/detail cache only for a newer version; invalidate cart and quote. |
| `order.updated` | `eventId`, `orderId`, terminal `status`, `version`             | Invalidate the order, cart, and quote so REST remains authoritative.             |

The mock validates the token and order ownership before subscribing to an order.
On reconnect the client re-subscribes to its active catalog IDs; the mock sends
the current NFT snapshot when its version has advanced. The receipt subscribes
again and receives an already-terminal order state immediately. The client
deduplicates event IDs and rejects stale versions. Query invalidation is the
reconciliation path after a socket update; receipt polling remains a fallback
for an unavailable connection.

Mock events are deterministic: the explicit `/api/mock/events/nft/:nftId`
scenario endpoint and the stale-price checkout scenario publish NFT changes;
pending-order confirmation publishes `order.updated` and inventory updates.
Dedicated mock-only endpoints replay duplicate/stale NFT events, set inventory
to zero, and disconnect active sockets for E2E coverage. Event frames are sent
through the browser-facing side of the MSW Socket.IO binding. There is no
background timer that randomly mutates catalog prices.

## UI, accessibility, and visual decisions

The supplied Figma PNGs and local NFT assets are used as visual references and
runtime assets. CSS is colocated by feature. `components.json` configures the
shadcn/ui component paths; local Button and Dialog components use the same
composable Radix, CVA, and Tailwind-merge pattern and are adapted to the
marketplace theme.

The Figma exports do not include the original design tokens, constraints, or
all interaction states. Exact visual fidelity, color contrast, assistive
technology behavior, zoom, and responsive overflow must still be checked
manually at 390, 768, and 1440 pixels. Playwright screenshot baselines detect
regressions against the current app; they do not prove equivalence to Figma.

## Development scenarios

Select scenarios from the development footer or call the mock scenario API:
`default`, `slow`, `variable-latency`, `offline`, `server-error`, `empty`,
`session-expired`, `register-conflict`, `price-change`, `payment-refused`,
`pending-payment`, and `timeout-after-order`. Variable latency is deterministic
for a given catalog query. `POST /api/mock/reset` clears demo state. The
`/api/mock/events/nft/:nftId` route exists only to trigger a deterministic
realtime change in the MSW-backed demo.

## Verification state and limitations

The GitHub Actions workflow runs formatting, lint, test type-check, unit tests,
build, and Playwright E2E. The latest workflow passed formatting, lint,
type-check, unit tests, and build, but failed in E2E. Its findings included an
ambiguous password locator, a serialized `Response` assertion, mock Socket.IO
events sent on the wrong side of the binding, and a duplicate-submit race.
These have been corrected and coverage added for event replay, inventory
updates, checkout quote refresh, and socket reconnection. The E2E suite was not
run locally; the updated workflow must pass before these flows are considered
verified.

The Lighthouse runner is configured by `lighthouse.config.json`. After installing
dependencies, run `npm run audit:lighthouse`; it builds the app, serves the
production bundle, collects three mobile and desktop runs for home and NFT
detail, and writes HTML/JSON reports and median metrics to
`lighthouse-reports/`. Lighthouse scores and deployment behavior have not been
measured in this task.

The app must be deployed separately. Configure SPA fallback for direct route
loads and refreshes, keep the MSW worker available at the site root, and verify
the built version's mocked REST and Socket.IO flows before sharing a public URL.
