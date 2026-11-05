import { toSocketIo } from '@mswjs/socket.io-binding';
import { ws } from 'msw';
import type {
  NFT,
  OrderReceipt,
  RealtimeNFTUpdate,
  RealtimeOrderUpdate,
} from '../../domain/entities';
import { db } from './db';

const socketProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
export const socketEndpoint = `${socketProtocol}//${location.host}/socket.io/`;
const socket = ws.link(socketEndpoint);
const PENDING_CONFIRMATION_DELAY_MS = 1200;

interface MockSocketClient {
  channel: ReturnType<typeof toSocketIo>;
  nfts: Set<string>;
  orders: Set<string>;
  close: () => void;
}

interface MockSocketEvent {
  event: 'nft.updated' | 'order.updated';
  resourceId: string;
}

const clients = new Set<MockSocketClient>();
const pendingOrderTimers = new Map<string, ReturnType<typeof setTimeout>>();
const publishedEvents: MockSocketEvent[] = [];
let connectionCount = 0;

function emitNftUpdate(client: MockSocketClient, nft: NFT): void {
  const update: RealtimeNFTUpdate = {
    eventId: `nft-${nft.id}-${nft.version}`,
    nftId: nft.id,
    priceEth: nft.priceEth,
    availableQuantity: nft.availableQuantity,
    version: nft.version,
  };
  client.channel.client.emit('nft.updated', update);
  publishedEvents.push({ event: 'nft.updated', resourceId: nft.id });
}

function emitOrderUpdate(client: MockSocketClient, receipt: OrderReceipt): void {
  const update: RealtimeOrderUpdate = {
    eventId: `order-${receipt.orderId}-${receipt.status}`,
    orderId: receipt.orderId,
    status: receipt.status === 'failed' ? 'failed' : 'confirmed',
    version: receipt.status === 'pending' ? 1 : 2,
  };
  client.channel.client.emit('order.updated', update);
  publishedEvents.push({ event: 'order.updated', resourceId: receipt.orderId });
}

function publishNftUpdate(nft: NFT): void {
  for (const client of clients) {
    if (client.nfts.has(nft.id)) emitNftUpdate(client, nft);
  }
}

function publishOrderUpdate(receipt: OrderReceipt): void {
  for (const client of clients) {
    if (client.orders.has(receipt.orderId)) emitOrderUpdate(client, receipt);
  }
}

function scheduleOrderConfirmation(orderId: string): void {
  if (pendingOrderTimers.has(orderId)) return;
  const timer = setTimeout(() => {
    pendingOrderTimers.delete(orderId);
    const receipt = db.finalizeOrder(orderId);
    if (!receipt || receipt.status === 'pending') return;
    publishOrderUpdate(receipt);
    for (const item of receipt.items) {
      const nft = db.getNFTById(item.nft.id);
      if (nft) publishNftUpdate(nft);
    }
  }, PENDING_CONFIRMATION_DELAY_MS);
  pendingOrderTimers.set(orderId, timer);
}

export function publishMockNftUpdate(nft: NFT): void {
  publishNftUpdate(nft);
}

export function publishMockOrderUpdate(receipt: OrderReceipt): void {
  publishOrderUpdate(receipt);
}

export function disconnectMockSockets(): void {
  for (const client of clients) client.close();
}

export function getMockSocketObservations() {
  return {
    connections: connectionCount,
    nftSubscriptions: Array.from(
      new Set(Array.from(clients).flatMap((client) => [...client.nfts])),
    ),
    orderSubscriptions: Array.from(
      new Set(Array.from(clients).flatMap((client) => [...client.orders])),
    ),
    publishedEvents: [...publishedEvents],
  };
}

export function resetRealtimeMock(): void {
  for (const timer of pendingOrderTimers.values()) clearTimeout(timer);
  pendingOrderTimers.clear();
  for (const client of clients) client.close();
  clients.clear();
  connectionCount = 0;
  publishedEvents.length = 0;
}

export const socketHandlers = [
  socket.addEventListener('connection', (connection) => {
    connectionCount += 1;
    const channel = toSocketIo(connection);
    const client: MockSocketClient = {
      channel,
      nfts: new Set(),
      orders: new Set(),
      close: () => connection.client.close(),
    };
    clients.add(client);

    channel.client.on('subscribe:nft', (_event, nftId: string) => {
      client.nfts.add(nftId);
      const nft = db.getNFTById(nftId);
      if (nft && nft.version > 1) emitNftUpdate(client, nft);
    });
    channel.client.on('unsubscribe:nft', (_event, nftId: string) => {
      client.nfts.delete(nftId);
    });
    channel.client.on('subscribe:order', (_event, orderId: string, token: string) => {
      const user = db.getSession(token)?.user;
      const receipt = user ? db.getOrderById(orderId, user.id) : undefined;
      if (!user || !receipt) return;

      client.orders.add(orderId);
      if (receipt.status === 'pending') scheduleOrderConfirmation(orderId);
      else emitOrderUpdate(client, receipt);
    });
    channel.client.on('unsubscribe:order', (_event, orderId: string) => {
      client.orders.delete(orderId);
    });
    connection.client.addEventListener('close', () => {
      clients.delete(client);
    });
  }),
];
