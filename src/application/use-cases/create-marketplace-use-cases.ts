import type { MarketplaceRepositories } from '../ports/marketplace-repositories';

export function createMarketplaceUseCases(repositories: MarketplaceRepositories) {
  return {
    catalog: {
      list: repositories.catalog.list,
      detail: repositories.catalog.detail,
    },
    auth: {
      login: repositories.auth.login,
      register: repositories.auth.register,
      session: repositories.auth.session,
      logout: repositories.auth.logout,
    },
    favorites: {
      list: repositories.favorites.list,
      toggle: repositories.favorites.toggle,
    },
    cart: {
      list: repositories.cart.list,
      add: repositories.cart.add,
      setQuantity: repositories.cart.setQuantity,
      remove: repositories.cart.remove,
      applyCoupon: repositories.cart.applyCoupon,
      removeCoupon: repositories.cart.removeCoupon,
      quote: repositories.cart.quote,
    },
    profile: {
      get: repositories.profile.get,
      update: repositories.profile.update,
      changePassword: repositories.profile.changePassword,
    },
    wallets: {
      list: repositories.wallets.list,
      save: repositories.wallets.save,
      update: repositories.wallets.update,
      setPrimary: repositories.wallets.setPrimary,
    },
    orders: {
      create: repositories.orders.create,
      get: repositories.orders.get,
    },
  };
}

export type MarketplaceUseCases = ReturnType<typeof createMarketplaceUseCases>;
