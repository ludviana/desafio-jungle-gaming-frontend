import { http, HttpResponse } from 'msw';
import { db, getUserIdFromToken } from '../db';
import { COUPONS, failure, quote } from '../helpers';
import type { CartItem } from '../../../domain/entities';

export const cartHandlers = [
  http.get('/api/cart', ({ request }) =>
    HttpResponse.json(
      db.getCart(
        getUserIdFromToken(
          request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null,
        ),
      ),
    ),
  ),
  http.post('/api/cart/items', async ({ request }) => {
    const userId = getUserIdFromToken(
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null,
    );
    const body = (await request.json()) as { nftId: string; quantity: number };
    const nft = db.getNFTById(body.nftId);
    if (!nft) return failure('NFT não encontrado.', 404);
    if (
      !Number.isInteger(body.quantity) ||
      body.quantity < 1 ||
      body.quantity > nft.availableQuantity
    )
      return failure('Quantidade indisponível.', 409);
    const cart = db.getCart(userId);
    const existing = cart.find((item) => item.nft.id === nft.id);
    const next = existing
      ? cart.map((item) =>
          item.nft.id === nft.id
            ? {
                ...item,
                nft,
                quantity: Math.min(nft.availableQuantity, item.quantity + body.quantity),
              }
            : item,
        )
      : [...cart, { nft, quantity: body.quantity }];
    db.saveCart(userId, next);
    return HttpResponse.json(next, { status: 201 });
  }),
  http.patch('/api/cart/items/:nftId', async ({ request, params }) => {
    const userId = getUserIdFromToken(
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null,
    );
    const body = (await request.json()) as { quantity: number };
    const nft = db.getNFTById(String(params.nftId));
    if (!nft) return failure('NFT não encontrado.', 404);
    if (
      !Number.isInteger(body.quantity) ||
      body.quantity < 1 ||
      body.quantity > nft.availableQuantity
    )
      return failure('Quantidade indisponível.', 409);
    const cart = db
      .getCart(userId)
      .map((item) => (item.nft.id === nft.id ? { ...item, nft, quantity: body.quantity } : item));
    db.saveCart(userId, cart);
    return HttpResponse.json(cart);
  }),
  http.delete('/api/cart/items/:nftId', ({ request, params }) => {
    const userId = getUserIdFromToken(
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null,
    );
    const cart = db.getCart(userId).filter((item) => item.nft.id !== String(params.nftId));
    db.saveCart(userId, cart);
    return HttpResponse.json(cart);
  }),
  http.post('/api/cart/coupon', async ({ request }) => {
    const userId = getUserIdFromToken(
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null,
    );
    const body = (await request.json()) as { couponCode: string };
    const couponCode = body.couponCode?.trim().toUpperCase();
    const coupon = couponCode ? COUPONS[couponCode] : undefined;
    if (!coupon || (coupon.expiresAt !== undefined && coupon.expiresAt < Date.now())) {
      return failure('Cupom inválido ou expirado.', 400, 'INVALID_COUPON');
    }
    db.setCoupon(userId, couponCode);
    return HttpResponse.json({ couponCode });
  }),
  http.delete('/api/cart/coupon', ({ request }) => {
    const userId = getUserIdFromToken(
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null,
    );
    db.setCoupon(userId, undefined);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post('/api/cart/quote', async ({ request }) => {
    const userId = getUserIdFromToken(
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null,
    );
    const body = (await request.json()) as { items?: CartItem[]; couponCode?: string };
    const currentCart = db.getCart(userId);
    const items = (body.items ?? currentCart).flatMap((item) => {
      const nft = db.getNFTById(item.nft.id);
      if (!nft) return [];
      return [{ nft, quantity: item.quantity }];
    });
    const couponCode = body.couponCode ?? db.getCoupon(userId);
    if (couponCode) {
      const coupon = COUPONS[couponCode.toUpperCase()];
      if (!coupon || (coupon.expiresAt !== undefined && coupon.expiresAt < Date.now())) {
        return failure('Cupom inválido ou expirado.', 400, 'INVALID_COUPON');
      }
    }
    return HttpResponse.json(quote(items, couponCode));
  }),
];
