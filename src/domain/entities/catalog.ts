export type Network = 'ethereum' | 'polygon' | 'solana' | 'sepolia';

export interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  gallery: string[];
  priceEth: string;
  creator: { id: string; name: string; avatar: string };
  owner: { id: string; name: string; avatar: string };
  category: string;
  network: Network;
  tokenId: string;
  collection: string;
  attributes: Array<{ trait_type: string; value: string }>;
  availableQuantity: number;
  rating: string;
  reviewCount: number;
  version: number;
  isFavorite?: boolean;
}

export interface NFTFilters {
  search?: string;
  category?: string;
  network?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: 'recent' | 'price_asc' | 'price_desc' | 'trending';
  page?: number;
  limit?: number;
}

export interface PaginatedNFTResponse {
  data: NFT[];
  total: number;
  page: number;
  totalPages: number;
}
