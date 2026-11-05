import type {
  CartItem,
  CartQuote,
  CreateOrderPayload,
  NFT,
  NFTFilters,
  OrderReceipt,
  PaginatedNFTResponse,
  Session,
  UserProfile,
  Wallet,
} from '../../domain/entities';
import type { MarketplaceRepositories } from '../../application/ports/marketplace-repositories';
import { apiClient } from './axios-client';

export const axiosMarketplaceRepository: MarketplaceRepositories = {
  catalog: {
    list: async (filters: NFTFilters) =>
      (await apiClient.get<PaginatedNFTResponse>('/nfts', { params: filters })).data,
    detail: async (id: string) => (await apiClient.get<NFT>(`/nfts/${id}`)).data,
  },
  auth: {
    login: async (email: string, password: string) =>
      (await apiClient.post<Session>('/auth/login', { email, password })).data,
    register: async (username: string, email: string, password: string) =>
      (
        await apiClient.post<Session>('/auth/register', {
          username,
          email,
          password,
        })
      ).data,
    session: async () => (await apiClient.get<Session>('/auth/session')).data,
    logout: async () => apiClient.post('/auth/logout'),
  },
  favorites: {
    list: async () => (await apiClient.get<string[]>('/favorites')).data,
    toggle: async (nftId: string) =>
      (await apiClient.put<{ nftId: string; isFavorite: boolean }>(`/favorites/${nftId}`)).data,
  },
  cart: {
    list: async () => (await apiClient.get<CartItem[]>('/cart')).data,
    add: async (nftId: string, quantity: number) =>
      (await apiClient.post<CartItem[]>('/cart/items', { nftId, quantity })).data,
    setQuantity: async (nftId: string, quantity: number) =>
      (
        await apiClient.patch<CartItem[]>(`/cart/items/${nftId}`, {
          quantity,
        })
      ).data,
    remove: async (nftId: string) =>
      (await apiClient.delete<CartItem[]>(`/cart/items/${nftId}`)).data,
    applyCoupon: async (couponCode: string) =>
      (
        await apiClient.post<{ couponCode: string }>('/cart/coupon', {
          couponCode,
        })
      ).data,
    removeCoupon: async () => apiClient.delete('/cart/coupon'),
    quote: async (items?: CartItem[]) =>
      (await apiClient.post<CartQuote>('/cart/quote', { items })).data,
  },
  profile: {
    get: async () => (await apiClient.get<UserProfile>('/profile')).data,
    update: async (profile: Partial<UserProfile>) =>
      (await apiClient.put<UserProfile>('/profile', profile)).data,
    changePassword: async (currentPassword: string, newPassword: string) =>
      apiClient.put('/profile/password', { currentPassword, newPassword }),
  },
  wallets: {
    list: async () => (await apiClient.get<Wallet[]>('/wallets')).data,
    save: async (wallet: Omit<Wallet, 'id'> & { id?: string }) =>
      (await apiClient.post<Wallet>('/wallets', wallet)).data,
    update: async (walletId: string, wallet: Wallet) =>
      (await apiClient.put<Wallet>(`/wallets/${walletId}`, wallet)).data,
    setPrimary: async (walletId: string) =>
      (await apiClient.put<Wallet[]>(`/wallets/${walletId}/primary`)).data,
  },
  orders: {
    create: async (payload: CreateOrderPayload, idempotencyKey: string) =>
      (
        await apiClient.post<OrderReceipt>('/orders', payload, {
          headers: { 'X-Idempotency-Key': idempotencyKey },
        })
      ).data,
    get: async (orderId: string) => (await apiClient.get<OrderReceipt>(`/orders/${orderId}`)).data,
  },
};
