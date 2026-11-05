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

export interface CatalogRepository {
  list(filters: NFTFilters): Promise<PaginatedNFTResponse>;
  detail(id: string): Promise<NFT>;
}

export interface AuthRepository {
  login(email: string, password: string): Promise<Session>;
  register(username: string, email: string, password: string): Promise<Session>;
  session(): Promise<Session>;
  logout(): Promise<unknown>;
}

export interface FavoritesRepository {
  list(): Promise<string[]>;
  toggle(nftId: string): Promise<{ nftId: string; isFavorite: boolean }>;
}

export interface CartRepository {
  list(): Promise<CartItem[]>;
  add(nftId: string, quantity: number): Promise<CartItem[]>;
  setQuantity(nftId: string, quantity: number): Promise<CartItem[]>;
  remove(nftId: string): Promise<CartItem[]>;
  applyCoupon(couponCode: string): Promise<{ couponCode: string }>;
  removeCoupon(): Promise<unknown>;
  quote(items?: CartItem[]): Promise<CartQuote>;
}

export interface ProfileRepository {
  get(): Promise<UserProfile>;
  update(profile: Partial<UserProfile>): Promise<UserProfile>;
  changePassword(currentPassword: string, newPassword: string): Promise<unknown>;
}

export interface WalletRepository {
  list(): Promise<Wallet[]>;
  save(wallet: Omit<Wallet, 'id'> & { id?: string }): Promise<Wallet>;
  update(walletId: string, wallet: Wallet): Promise<Wallet>;
  setPrimary(walletId: string): Promise<Wallet[]>;
}

export interface OrderRepository {
  create(payload: CreateOrderPayload, idempotencyKey: string): Promise<OrderReceipt>;
  get(orderId: string): Promise<OrderReceipt>;
}

export interface MarketplaceRepositories {
  catalog: CatalogRepository;
  auth: AuthRepository;
  favorites: FavoritesRepository;
  cart: CartRepository;
  profile: ProfileRepository;
  wallets: WalletRepository;
  orders: OrderRepository;
}
