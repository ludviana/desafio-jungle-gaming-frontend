import type { Network } from './catalog';
import type { CartItem } from './cart';

export interface CreateOrderPayload {
  items: Array<{ nftId: string; quantity: number }>;
  walletAddress: string;
  network: Network;
  couponCode?: string;
  quoteVersion: string;
}

export interface OrderReceipt {
  orderId: string;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  items: CartItem[];
  subtotalEth: string;
  discountEth: string;
  networkFeeEth: string;
  totalEth: string;
  walletAddress: string;
  network: Network;
  createdAt: string;
  idempotencyKey: string;
}
