import type {
  CartItem,
  CreateOrderPayload,
  Network,
  NFT,
  OrderReceipt,
  Session,
  UserProfile,
  Wallet,
} from '../../domain/entities';
import { createInitialState, STORAGE_KEY, type MockState, type StoredOrder } from './state';

class MockDatabase {
  private get state(): MockState {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initialState = createInitialState();
      this.state = initialState;
      return initialState;
    }

    try {
      return JSON.parse(stored) as MockState;
    } catch (error) {
      console.error('Mock database state is invalid. Reset the mock scenario.', error);
      throw new Error('Dados simulados corrompidos. Limpe o armazenamento local para reiniciar.');
    }
  }

  private set state(value: MockState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  reset(): void {
    this.state = createInitialState();
  }

  getNFTs(): NFT[] {
    return this.state.nfts;
  }

  getNFTById(id: string): NFT | undefined {
    return this.state.nfts.find((nft) => nft.id === id);
  }

  updateNFT(id: string, updates: Partial<NFT>): NFT | null {
    const state = this.state;
    const index = state.nfts.findIndex((nft) => nft.id === id);
    if (index < 0) return null;
    state.nfts[index] = {
      ...state.nfts[index],
      ...updates,
      version: state.nfts[index].version + 1,
    };
    this.state = state;
    return state.nfts[index];
  }

  getUsers(): UserProfile[] {
    return this.state.users.map(({ passwordHash: _passwordHash, ...user }) => user);
  }

  hasAccount(email: string, username: string): boolean {
    return this.state.users.some(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() ||
        user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  hasOtherAccount(userId: string, email: string, username: string): boolean {
    return this.state.users.some(
      (user) =>
        user.id !== userId &&
        (user.email.toLowerCase() === email.toLowerCase() ||
          user.username.toLowerCase() === username.toLowerCase()),
    );
  }

  async verifyCredentials(email: string, password: string): Promise<UserProfile | undefined> {
    const user = this.state.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!user || user.passwordHash !== (await hashPassword(password))) return undefined;
    const { passwordHash: _passwordHash, ...profile } = user;
    return profile;
  }

  async addUser(user: UserProfile, password: string): Promise<void> {
    const state = this.state;
    state.users.push({ ...user, passwordHash: await hashPassword(password) });
    state.wallets[user.id] = [];
    state.favorites[user.id] = [];
    state.carts[user.id] = [];
    this.state = state;
  }

  createSession(user: UserProfile): Session {
    const state = this.state;
    const session: Session = {
      user,
      token: `kurio-${crypto.randomUUID()}`,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
    state.sessions[session.token] = session;
    const userCart = state.carts[user.id] ?? [];
    const guestCart = state.carts.guest ?? [];
    state.carts[user.id] = guestCart.reduce((cart, guestItem) => {
      const nft = state.nfts.find((item) => item.id === guestItem.nft.id);
      if (!nft || nft.availableQuantity < 1) return cart;
      const existing = cart.find((item) => item.nft.id === nft.id);
      const maxQuantity = Math.min(
        nft.availableQuantity,
        guestItem.quantity + (existing?.quantity ?? 0),
      );
      if (existing)
        return cart.map((item) =>
          item.nft.id === nft.id ? { ...item, nft, quantity: maxQuantity } : item,
        );
      return [...cart, { nft, quantity: Math.min(guestItem.quantity, nft.availableQuantity) }];
    }, userCart);
    state.carts.guest = [];
    this.state = state;
    return session;
  }

  getSession(token: string): Session | undefined {
    const session = this.state.sessions[token];
    if (session && session.expiresAt <= Date.now()) {
      this.deleteSession(token);
      return undefined;
    }
    return session;
  }

  deleteSession(token: string): void {
    const state = this.state;
    delete state.sessions[token];
    this.state = state;
  }

  getFavorites(userId: string): string[] {
    return this.state.favorites[userId] ?? [];
  }

  toggleFavorite(userId: string, nftId: string): boolean {
    const state = this.state;
    const favorites = state.favorites[userId] ?? [];
    const next = favorites.includes(nftId)
      ? favorites.filter((id) => id !== nftId)
      : [...favorites, nftId];
    state.favorites[userId] = next;
    this.state = state;
    return next.includes(nftId);
  }

  getCart(userId: string): CartItem[] {
    const state = this.state;
    return (state.carts[userId] ?? []).flatMap((item) => {
      const currentNFT = state.nfts.find((nft) => nft.id === item.nft.id);
      return currentNFT ? [{ ...item, nft: currentNFT }] : [];
    });
  }

  saveCart(userId: string, cart: CartItem[]): void {
    const state = this.state;
    state.carts[userId] = cart;
    this.state = state;
  }

  getCoupon(userId: string): string | undefined {
    return this.state.coupons[userId];
  }

  setCoupon(userId: string, coupon: string | undefined): void {
    const state = this.state;
    if (coupon) state.coupons[userId] = coupon;
    else delete state.coupons[userId];
    this.state = state;
  }

  getWallets(userId: string): Wallet[] {
    return this.state.wallets[userId] ?? [];
  }

  saveWallet(userId: string, wallet: Wallet): void {
    const state = this.state;
    const wallets = state.wallets[userId] ?? [];
    const nextWallet = wallet.isPrimary
      ? wallets.map((item) => ({ ...item, isPrimary: false }))
      : wallets;
    const index = nextWallet.findIndex((item) => item.id === wallet.id);
    if (index < 0) nextWallet.push(wallet);
    else nextWallet[index] = wallet;
    state.wallets[userId] = nextWallet;
    this.state = state;
  }

  setPrimaryWallet(userId: string, walletId: string): void {
    const state = this.state;
    state.wallets[userId] = (state.wallets[userId] ?? []).map((wallet) => ({
      ...wallet,
      isPrimary: wallet.id === walletId,
    }));
    this.state = state;
  }

  saveProfile(user: UserProfile): void {
    const state = this.state;
    const index = state.users.findIndex((item) => item.id === user.id);
    if (index < 0) throw new Error('Usuário não encontrado');
    state.users[index] = { ...state.users[index], ...user };
    for (const [token, session] of Object.entries(state.sessions)) {
      if (session.user.id === user.id) state.sessions[token] = { ...session, user };
    }
    this.state = state;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const state = this.state;
    const user = state.users.find((item) => item.id === userId);
    if (!user || user.passwordHash !== (await hashPassword(currentPassword))) return false;
    user.passwordHash = await hashPassword(newPassword);
    this.state = state;
    return true;
  }

  createOrder(
    key: string,
    payload: CreateOrderPayload,
    receipt: OrderReceipt,
    userId: string,
  ): void {
    const state = this.state;
    state.orders[`${userId}:${key}`] = { payload, receipt, userId };
    this.state = state;
  }

  getOrder(key: string, userId: string): StoredOrder | undefined {
    const state = this.state;
    return (
      state.orders[`${userId}:${key}`] ??
      Object.values(state.orders).find(
        (order) => order.userId === userId && order.receipt.idempotencyKey === key,
      )
    );
  }

  getOrderById(orderId: string, userId: string): OrderReceipt | undefined {
    return Object.values(this.state.orders).find(
      (item) => item.userId === userId && item.receipt.orderId === orderId,
    )?.receipt;
  }

  finalizeOrder(orderId: string): OrderReceipt | undefined {
    const state = this.state;
    const entry = Object.values(state.orders).find((item) => item.receipt.orderId === orderId);
    if (!entry || entry.receipt.status !== 'pending') return entry?.receipt;
    for (const item of entry.receipt.items) {
      const current = state.nfts.find((nft) => nft.id === item.nft.id);
      if (!current || current.availableQuantity < item.quantity) {
        entry.receipt = { ...entry.receipt, status: 'failed' };
        this.state = state;
        return entry.receipt;
      }
    }
    for (const item of entry.receipt.items) {
      const index = state.nfts.findIndex((nft) => nft.id === item.nft.id);
      const current = state.nfts[index];
      state.nfts[index] = {
        ...current,
        availableQuantity: current.availableQuantity - item.quantity,
        version: current.version + 1,
      };
    }
    const purchased = new Map(entry.receipt.items.map((item) => [item.nft.id, item.quantity]));
    state.carts[entry.userId] = (state.carts[entry.userId] ?? []).flatMap((item) => {
      const remaining = item.quantity - (purchased.get(item.nft.id) ?? 0);
      return remaining > 0 ? [{ ...item, quantity: remaining }] : [];
    });
    entry.receipt = { ...entry.receipt, status: 'confirmed' };
    this.state = state;
    return entry.receipt;
  }
}

async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getUserIdFromToken(token: string | null): string {
  return token ? (db.getSession(token)?.user.id ?? 'guest') : 'guest';
}

export function isSupportedNetwork(network: string): network is Network {
  return ['ethereum', 'polygon', 'solana', 'sepolia'].includes(network);
}

export const db = new MockDatabase();
