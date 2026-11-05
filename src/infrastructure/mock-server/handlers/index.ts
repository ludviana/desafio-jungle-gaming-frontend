import { scenarioHandlers } from './scenario';
import { catalogHandlers } from './catalog';
import { authHandlers } from './auth';
import { favoritesHandlers } from './favorites';
import { cartHandlers } from './cart';
import { profileHandlers } from './profile';
import { walletsHandlers } from './wallets';
import { ordersHandlers } from './orders';

export const handlers = [
  ...scenarioHandlers,
  ...catalogHandlers,
  ...authHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...profileHandlers,
  ...walletsHandlers,
  ...ordersHandlers,
];
