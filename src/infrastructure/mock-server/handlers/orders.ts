import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { failure, formatEth, getAuthorizedUser, getScenario, parseEth, quote } from '../helpers';
import type { CartItem, CreateOrderPayload, OrderReceipt } from '../../../domain/entities';
import { publishMockNftUpdate, publishMockOrderUpdate } from '../socket';

const PENDING_CONFIRMATION_DELAY_MS = 1200;

export const ordersHandlers = [
  http.post('/api/orders', async ({ request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return failure('Autenticação necessária.', 401);
    const key = request.headers.get('X-Idempotency-Key');
    if (!key) return failure('X-Idempotency-Key é obrigatório.', 400, 'IDEMPOTENCY_KEY_REQUIRED');
    const body = (await request.json()) as CreateOrderPayload;
    const previous = db.getOrder(key, user.id);
    if (previous) {
      if (JSON.stringify(previous.payload) !== JSON.stringify(body))
        return failure(
          'Chave de idempotência reutilizada com conteúdo diferente.',
          409,
          'IDEMPOTENCY_CONFLICT',
        );
      return HttpResponse.json(previous.receipt);
    }
    if (!body.items.length || !body.walletAddress || !body.quoteVersion)
      return failure('Dados do pedido incompletos.');
    const items: CartItem[] = [];
    for (const requested of body.items) {
      const nft = db.getNFTById(requested.nftId);
      if (!nft || requested.quantity < 1 || requested.quantity > nft.availableQuantity)
        return failure('Preço ou disponibilidade mudou. Revise o carrinho.', 409, 'QUOTE_STALE');
      items.push({ nft, quantity: requested.quantity });
    }
    const currentQuote = quote(items, body.couponCode);
    if (body.quoteVersion !== currentQuote.quoteVersion)
      return failure('A cotação mudou. Revise antes de confirmar.', 409, 'QUOTE_STALE');
    if (getScenario(request) === 'price-change') {
      const nft = items[0]?.nft;
      if (nft) {
        const updated = db.updateNFT(nft.id, {
          priceEth: formatEth(parseEth(nft.priceEth) + 10_000n),
        });
        if (updated) publishMockNftUpdate(updated);
      }
      return failure('Preço alterado durante a compra. Revise a nova cotação.', 409, 'QUOTE_STALE');
    }

    const refused = getScenario(request) === 'payment-refused';
    const pending = getScenario(request) === 'pending-payment';
    const receipt: OrderReceipt = {
      orderId: `ord-${crypto.randomUUID()}`,
      transactionHash: `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join('')}`,
      status: refused ? 'failed' : pending ? 'pending' : 'confirmed',
      items,
      subtotalEth: currentQuote.subtotalEth,
      discountEth: currentQuote.discountEth,
      networkFeeEth: currentQuote.networkFeeEth,
      totalEth: currentQuote.totalEth,
      walletAddress: body.walletAddress,
      network: body.network,
      createdAt: new Date().toISOString(),
      idempotencyKey: key,
    };
    db.createOrder(key, body, receipt, user.id);
    if (!refused && !pending) {
      for (const item of items) {
        const current = db.getNFTById(item.nft.id);
        if (current) {
          const updated = db.updateNFT(current.id, {
            availableQuantity: current.availableQuantity - item.quantity,
          });
          if (updated) publishMockNftUpdate(updated);
        }
      }
      const cart = db.getCart(user.id);
      const bought = new Map(items.map((item) => [item.nft.id, item.quantity]));
      db.saveCart(
        user.id,
        cart.flatMap((item) => {
          const remaining = item.quantity - (bought.get(item.nft.id) ?? 0);
          return remaining > 0 ? [{ ...item, quantity: remaining }] : [];
        }),
      );
    }
    if (getScenario(request) === 'timeout-after-order') return HttpResponse.error();
    return HttpResponse.json(receipt, { status: 201 });
  }),
  http.get('/api/orders/:orderId', ({ request, params }) => {
    const user = getAuthorizedUser(request);
    if (!user) return failure('Autenticação necessária.', 401);
    const orderId = String(params.orderId);
    const currentReceipt = db.getOrderById(orderId, user.id);
    const isReadyToConfirm =
      currentReceipt?.status === 'pending' &&
      Date.now() - Date.parse(currentReceipt.createdAt) >= PENDING_CONFIRMATION_DELAY_MS;
    const receipt = isReadyToConfirm ? db.finalizeOrder(orderId) : currentReceipt;
    if (isReadyToConfirm && receipt) {
      publishMockOrderUpdate(receipt);
      for (const item of receipt.items) {
        const nft = db.getNFTById(item.nft.id);
        if (nft) publishMockNftUpdate(nft);
      }
    }
    return receipt ? HttpResponse.json(receipt) : failure('Pedido não encontrado.', 404);
  }),
];
