import { useQuery } from '@tanstack/react-query';
import type { NFTFilters } from '../../domain/entities';
import { useMarketplace } from './useMarketplace';

export const TOKEN_KEY = 'kurio_session_token';
export const CATEGORIES = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
];
export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const;
export type CatalogSearch = {
  search: string;
  category: string;
  network: string;
  minPrice: string;
  maxPrice: string;
  sortBy: NonNullable<NFTFilters['sortBy']>;
  page: number;
  limit: number;
};
export const INITIAL_FILTERS: CatalogSearch = {
  search: '',
  category: '',
  network: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'recent',
  page: 1,
  limit: 9,
};

export function messageFromError(error: unknown): string {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : 'Ocorreu um erro. Tente novamente.';
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function getSafeReturnPath(): string {
  const path = sessionStorage.getItem('kurio_return_to') ?? '/';
  const pathname = path.split('?')[0];
  if (
    !path.startsWith('//') &&
    (['/', '/payment', '/profile', '/wallets', '/cart'].includes(pathname) ||
      /^\/orders\/[\w-]+$/.test(pathname) ||
      /^\/nft\/[\w-]+$/.test(pathname))
  )
    return path;
  return '/';
}

export function useSession() {
  const marketplace = useMarketplace();
  return useQuery({
    queryKey: ['session'],
    queryFn: marketplace.auth.session,
    enabled: Boolean(getToken()),
    retry: false,
    staleTime: 30_000,
  });
}

export function useCart() {
  const marketplace = useMarketplace();
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const cart = await marketplace.cart.list();
      if (!Array.isArray(cart)) {
        throw new Error('A API retornou o carrinho em um formato inv?lido.');
      }
      return cart;
    },
  });
}
