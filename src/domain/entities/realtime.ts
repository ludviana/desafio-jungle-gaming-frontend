export interface RealtimeNFTUpdate {
  eventId: string;
  nftId: string;
  priceEth: string;
  availableQuantity: number;
  version: number;
}

export interface RealtimeOrderUpdate {
  eventId: string;
  orderId: string;
  status: 'confirmed' | 'failed';
  version: number;
}
