import { HttpResponse } from 'msw';
import { db } from './db';
import type { CartItem, UserProfile } from '../../domain/entities';

export const COUPONS: Record<string, { discountBps: bigint; expiresAt?: number }> = {
  KURIO10: { discountBps: 1000n },
  WELCOME20: { discountBps: 2000n },
  EXPIRED: { discountBps: 1500n, expiresAt: Date.now() - 1000 },
};

const SCALE = 1_000_000n;
const NETWORK_FEE = 16_000n;

export function parseEth(value: string): bigint {
  const [whole = '0', fraction = ''] = value.split('.');
  return BigInt(whole) * SCALE + BigInt((fraction + '000000').slice(0, 6));
}

export function formatEth(value: bigint): string {
  const whole = value / SCALE;
  const fraction = (value % SCALE).toString().padStart(6, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function failure(message: string, status = 400, code?: string) {
  return HttpResponse.json({ message, code }, { status });
}

export function getAuthorizedUser(request: Request): UserProfile | null {
  if (getScenario(request) === 'session-expired') return null;
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  return db.getSession(token)?.user ?? null;
}

export function getScenario(request: Request): string {
  return request.headers.get('x-mock-scenario') ?? 'default';
}

export async function simulateCatalogLatency(request: Request): Promise<void> {
  const scenario = getScenario(request);
  if (scenario === 'slow') {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return;
  }
  if (scenario !== 'variable-latency') return;

  const key = new URL(request.url).search;
  const hash = Array.from(key).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) % 997,
    7,
  );
  await new Promise((resolve) => setTimeout(resolve, 150 + (hash % 850)));
}

export function maybeSimulateFailure(request: Request) {
  const scenario = getScenario(request);
  if (scenario === 'offline') return HttpResponse.error();
  if (scenario === 'server-error')
    return failure('Falha simulada no serviço.', 503, 'SERVICE_UNAVAILABLE');
  return null;
}

export function quote(items: CartItem[], couponCode?: string) {
  const subtotal = items.reduce(
    (sum, item) => sum + parseEth(item.nft.priceEth) * BigInt(item.quantity),
    0n,
  );
  const coupon = couponCode ? COUPONS[couponCode.toUpperCase()] : undefined;
  const discount = coupon ? (subtotal * coupon.discountBps) / 10_000n : 0n;
  const fee = items.length ? NETWORK_FEE : 0n;
  return {
    items,
    subtotalEth: formatEth(subtotal),
    discountEth: formatEth(discount),
    networkFeeEth: formatEth(fee),
    totalEth: formatEth(subtotal - discount + fee),
    appliedCoupon: coupon ? couponCode?.toUpperCase() : undefined,
    quoteVersion: items.map((item) => `${item.nft.id}:${item.nft.version}`).join('|'),
  };
}
