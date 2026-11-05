import { createContext } from 'react';
import type { MarketplaceUseCases } from '../../application/use-cases/create-marketplace-use-cases';

export const MarketplaceContext = createContext<MarketplaceUseCases | null>(null);
