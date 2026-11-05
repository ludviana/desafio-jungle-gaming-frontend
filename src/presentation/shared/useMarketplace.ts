import { useContext } from 'react';
import { MarketplaceContext } from './marketplace-context';

export function useMarketplace() {
  const marketplace = useContext(MarketplaceContext);
  if (!marketplace) {
    throw new Error('MarketplaceProvider must wrap the application.');
  }
  return marketplace;
}
