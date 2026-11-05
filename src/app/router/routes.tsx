import { createRootRoute, createRoute, stripSearchParams } from '@tanstack/react-router';
import { INITIAL_FILTERS, type CatalogSearch } from '../../presentation/shared/site';
import { RootLayout } from '../../presentation/layout/RootLayout';
import { HomePage } from '../../presentation/features/catalog/HomePage';
import { NFTDetailPage } from '../../presentation/features/catalog/NFTDetailPage';
import { CartPage } from '../../presentation/features/cart/CartPage';
import { LoginPage, RegisterPage } from '../../presentation/features/auth/AuthPages';
import { PaymentPage } from '../../presentation/features/checkout/PaymentPage';
import { ReceiptPage } from '../../presentation/features/orders/ReceiptPage';
import { ProfilePage } from '../../presentation/features/account/ProfilePage';
import { WalletsPage } from '../../presentation/features/account/WalletsPage';
import { NotFoundPage } from '../../presentation/shared/feedback';

const rootRoute = createRootRoute({ component: RootLayout, notFoundComponent: NotFoundPage });
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => ({
    search: typeof search.search === 'string' ? search.search : '',
    category: typeof search.category === 'string' ? search.category : '',
    network: typeof search.network === 'string' ? search.network : '',
    minPrice: typeof search.minPrice === 'string' ? search.minPrice : '',
    maxPrice: typeof search.maxPrice === 'string' ? search.maxPrice : '',
    sortBy: ['recent', 'price_asc', 'price_desc', 'trending'].includes(String(search.sortBy))
      ? (String(search.sortBy) as CatalogSearch['sortBy'])
      : 'recent',
    page: Math.max(1, Number(search.page) || 1),
    limit: 9,
  }),
  search: { middlewares: [stripSearchParams(INITIAL_FILTERS)] },
  component: HomePage,
});
const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  component: NFTDetailPage,
});
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});
const paymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment',
  component: PaymentPage,
});
const receiptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  component: ReceiptPage,
});
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});
const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  component: WalletsPage,
});

export const routeTree = rootRoute.addChildren([
  homeRoute,
  nftRoute,
  cartRoute,
  loginRoute,
  registerRoute,
  paymentRoute,
  receiptRoute,
  profileRoute,
  walletsRoute,
]);
