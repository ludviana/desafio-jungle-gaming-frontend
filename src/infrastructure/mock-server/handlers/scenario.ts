import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { failure, formatEth, parseEth } from '../helpers';
import {
  disconnectMockSockets,
  getMockSocketObservations,
  publishMockNftUpdate,
  resetRealtimeMock,
} from '../socket';

export const scenarioHandlers = [
  http.get('/api/mock/socket/observations', () => HttpResponse.json(getMockSocketObservations())),
  http.get('/api/mock/scenario', () => HttpResponse.json({ scenario: 'default' })),
  http.put('/api/mock/scenario', async ({ request }) => {
    const body = (await request.json()) as { scenario: string };
    if (
      ![
        'default',
        'slow',
        'variable-latency',
        'offline',
        'server-error',
        'empty',
        'session-expired',
        'register-conflict',
        'price-change',
        'payment-refused',
        'pending-payment',
        'timeout-after-order',
      ].includes(body.scenario)
    ) {
      return failure('Cenário não reconhecido.');
    }
    return HttpResponse.json({ scenario: body.scenario });
  }),
  http.post('/api/mock/reset', () => {
    db.reset();
    resetRealtimeMock();
    return HttpResponse.json({ reset: true });
  }),
  http.post('/api/mock/events/nft/:nftId', ({ params }) => {
    const nftId = String(params.nftId);
    const current = db.getNFTById(nftId);
    if (!current) return failure('NFT não encontrado.', 404, 'NOT_FOUND');
    const updated = db.updateNFT(nftId, {
      priceEth: formatEth(parseEth(current.priceEth) + 10_000n),
    });
    if (!updated) return failure('NFT não encontrado.', 404, 'NOT_FOUND');
    publishMockNftUpdate(updated);
    return HttpResponse.json(updated);
  }),
  http.post('/api/mock/events/nft/:nftId/replay', ({ params }) => {
    const nftId = String(params.nftId);
    const current = db.getNFTById(nftId);
    if (!current) return failure('NFT não encontrado.', 404, 'NOT_FOUND');
    const updated = db.updateNFT(nftId, {
      priceEth: formatEth(parseEth(current.priceEth) + 10_000n),
    });
    if (!updated) return failure('NFT não encontrado.', 404, 'NOT_FOUND');
    publishMockNftUpdate(updated);
    publishMockNftUpdate(updated);
    publishMockNftUpdate(current);
    return HttpResponse.json({ updated: true });
  }),
  http.post('/api/mock/events/nft/:nftId/unavailable', ({ params }) => {
    const nftId = String(params.nftId);
    const updated = db.updateNFT(nftId, { availableQuantity: 0 });
    if (!updated) return failure('NFT não encontrado.', 404, 'NOT_FOUND');
    publishMockNftUpdate(updated);
    return HttpResponse.json({ updated: true });
  }),
  http.post('/api/mock/events/socket/disconnect', () => {
    disconnectMockSockets();
    return HttpResponse.json({ disconnected: true });
  }),
];
