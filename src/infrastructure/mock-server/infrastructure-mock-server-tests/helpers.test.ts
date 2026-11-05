import { describe, expect, it } from 'vitest';
import type { CartItem, NFT } from '../../../domain/entities';
import { formatEth, parseEth, quote } from '../helpers';

const nft: NFT = {
  id: 'test-nft',
  name: 'Test NFT',
  description: 'Unit-test fixture',
  image: '/test.png',
  gallery: ['/test.png'],
  priceEth: '1.19',
  creator: { id: 'creator', name: 'Creator', avatar: '' },
  owner: { id: 'owner', name: 'Owner', avatar: '' },
  category: 'Arte digital',
  network: 'ethereum',
  tokenId: '#1',
  collection: 'Test collection',
  attributes: [],
  availableQuantity: 3,
  rating: '5',
  reviewCount: 1,
  version: 4,
};

describe('ETH mock helpers', () => {
  it('parses and formats values as six-decimal integer units', () => {
    expect(parseEth('1.000001')).toBe(1_000_001n);
    expect(formatEth(1_200_000n)).toBe('1.2');
    expect(formatEth(0n)).toBe('0');
  });

  it('quotes subtotal, discount, fee, and quote version consistently', () => {
    const items: CartItem[] = [{ nft, quantity: 2 }];

    expect(quote(items, 'KURIO10')).toMatchObject({
      subtotalEth: '2.38',
      discountEth: '0.238',
      networkFeeEth: '0.016',
      totalEth: '2.158',
      appliedCoupon: 'KURIO10',
      quoteVersion: 'test-nft:4',
    });
  });

  it('does not charge a network fee for an empty cart', () => {
    expect(quote([])).toMatchObject({
      subtotalEth: '0',
      discountEth: '0',
      networkFeeEth: '0',
      totalEth: '0',
      quoteVersion: '',
    });
  });
});
