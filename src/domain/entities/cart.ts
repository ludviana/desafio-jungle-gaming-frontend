import type { NFT } from './catalog';

export interface CartItem {
  nft: NFT;
  quantity: number;
}

export interface CartQuote {
  items: CartItem[];
  subtotalEth: string;
  discountEth: string;
  networkFeeEth: string;
  totalEth: string;
  appliedCoupon?: string;
  quoteVersion: string;
}
