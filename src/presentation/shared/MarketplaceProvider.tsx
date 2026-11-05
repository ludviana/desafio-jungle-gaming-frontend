import type { ReactNode } from 'react';
import { MarketplaceContext } from './marketplace-context';
import type { MarketplaceUseCases } from '../../application/use-cases/create-marketplace-use-cases';

export function MarketplaceProvider({
  value,
  children,
}: {
  value: MarketplaceUseCases;
  children: ReactNode;
}) {
  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}
