import type { Network } from './catalog';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  ensName: string;
}

export interface Wallet {
  id: string;
  label: string;
  address: string;
  ensName?: string;
  network: Network;
  provider: 'MetaMask' | 'WalletConnect' | 'Coinbase Wallet';
  isPrimary: boolean;
}

export interface Session {
  user: UserProfile;
  token: string;
  expiresAt: number;
}
