import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import type { CreateOrderPayload, Session } from '../../../domain/entities';
import { db } from '../db';
import { handlers } from '../handlers';

const server = setupServer(...handlers);
const api = 'http://localhost:5173/api';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => db.reset());
afterEach(() => server.resetHandlers());

async function postJson<T>(
  path: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; body: T }> {
  const response = await fetch(`${api}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: (await response.json()) as T };
}

async function registerAndGetToken(): Promise<string> {
  const { status, body } = await postJson<Session>('/auth/register', {
    username: 'test-user',
    email: 'test@example.test',
    password: 'KurioTest123!',
  });
  expect(status).toBe(201);
  return body.token;
}

describe('MSW REST handlers', () => {
  it('filters catalog results and applies pagination from request parameters', async () => {
    const response = await fetch(`${api}/nfts?category=Arte%20digital&limit=1&page=2`);
    const result = (await response.json()) as {
      data: Array<{ category: string }>;
      total: number;
      page: number;
      totalPages: number;
    };

    expect(response.status).toBe(200);
    expect(result).toMatchObject({ total: 3, page: 2, totalPages: 3 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.category).toBe('Arte digital');
  });

  it('rejects duplicate registration and protects session resources', async () => {
    await registerAndGetToken();
    const duplicate = await postJson('/auth/register', {
      username: 'test-user',
      email: 'other@example.test',
      password: 'KurioTest123!',
    });
    const session = await fetch(`${api}/auth/session`);

    expect(duplicate.status).toBe(409);
    expect(session.status).toBe(401);
  });

  it('applies deterministic failure, empty catalog, and coupon scenarios', async () => {
    const empty = await fetch(`${api}/nfts`, {
      headers: { 'X-Mock-Scenario': 'empty' },
    });
    const emptyResult = (await empty.json()) as { data: unknown[] };
    const failed = await fetch(`${api}/nfts`, {
      headers: { 'X-Mock-Scenario': 'server-error' },
    });
    const token = await registerAndGetToken();
    const headers = { Authorization: `Bearer ${token}` };
    const validCoupon = await postJson('/cart/coupon', { couponCode: 'kurio10' }, headers);
    const expiredCoupon = await postJson('/cart/coupon', { couponCode: 'EXPIRED' }, headers);

    expect(emptyResult.data).toEqual([]);
    expect(failed.status).toBe(503);
    expect(validCoupon.status).toBe(200);
    expect(expiredCoupon.status).toBe(400);
  });

  it('rejects invalid cart quantities without changing the cart', async () => {
    const invalid = await postJson('/cart/items', { nftId: 'emerald-ape-042', quantity: 1.5 });
    const cart = await fetch(`${api}/cart`);
    const items = (await cart.json()) as unknown[];

    expect(invalid.status).toBe(409);
    expect(items).toEqual([]);
  });

  it('rejects profile conflicts and edits to wallets owned by another user', async () => {
    const token = await registerAndGetToken();
    const authorization = { Authorization: `Bearer ${token}` };
    const profile = await fetch(`${api}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authorization },
      body: JSON.stringify({
        name: 'Test User',
        username: 'test-user',
        email: 'aether@kurio.test',
        avatar: '',
        ensName: '',
      }),
    });
    const wallet = await fetch(`${api}/wallets/wallet-secondary/primary`, {
      method: 'PUT',
      headers: authorization,
    });

    expect(profile.status).toBe(409);
    expect(wallet.status).toBe(404);
  });

  it('preserves order identity for an idempotent retry and rejects payload changes', async () => {
    const token = await registerAndGetToken();
    const authorization = { Authorization: `Bearer ${token}` };
    const nftResponse = await fetch(`${api}/nfts/emerald-ape-042`);
    const nft = (await nftResponse.json()) as { id: string; version: number };
    const payload: CreateOrderPayload = {
      items: [{ nftId: nft.id, quantity: 1 }],
      walletAddress: '0x123',
      network: 'ethereum',
      quoteVersion: `${nft.id}:${nft.version}`,
    };
    const headers = { ...authorization, 'X-Idempotency-Key': 'attempt-1' };
    const first = await postJson<{ orderId: string }>('/orders', payload, headers);
    const retry = await postJson<{ orderId: string }>('/orders', payload, headers);
    const changed = await postJson('/orders', { ...payload, network: 'polygon' }, headers);

    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(retry.body.orderId).toBe(first.body.orderId);
    expect(changed.status).toBe(409);
  });
});
