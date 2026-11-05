import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Minus, Trash2 } from 'lucide-react';
import { useMarketplace } from '../../shared/useMarketplace';
import type { CartItem } from '../../../domain/entities';
import { multiplyEth } from '../../../domain/value-objects/eth';
import { RelatedNFTs } from '../catalog/RelatedNFTs';
import { getToken, INITIAL_FILTERS, messageFromError, useCart } from '../../shared/site';
import { ErrorState, LoadingState } from '../../shared/feedback';
import './presentation-features-cart-styles/cart.css';
import './presentation-features-cart-styles/cart-responsive.css';

export function CartPage() {
  const marketplace = useMarketplace();
  const queryClient = useQueryClient();
  const cartQuery = useCart();
  const cart = cartQuery.data ?? [];
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const quoteQuery = useQuery({
    queryKey: ['quote', cart],
    queryFn: () => marketplace.cart.quote(cart),
    enabled: cart.length > 0,
  });
  const setQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      marketplace.cart.setQuantity(id, quantity),
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previous = queryClient.getQueryData<CartItem[]>(['cart']);
      queryClient.setQueryData<CartItem[]>(['cart'], (items = []) =>
        items.map((item) => (item.nft.id === id ? { ...item, quantity } : item)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(['cart'], context?.previous),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      void queryClient.invalidateQueries({ queryKey: ['quote'] });
    },
  });
  const removeMutation = useMutation({
    mutationFn: marketplace.cart.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
  const couponMutation = useMutation({
    mutationFn: marketplace.cart.applyCoupon,
    onSuccess: async (result) => {
      setCouponMessage(`Cupom ${result.couponCode} aplicado.`);
      setCouponInput(result.couponCode);
      await queryClient.invalidateQueries({ queryKey: ['quote'] });
    },
    onError: (error) => setCouponMessage(messageFromError(error)),
  });
  const removeCoupon = useMutation({
    mutationFn: marketplace.cart.removeCoupon,
    onSuccess: () => {
      setCouponInput('');
      setCouponMessage('Cupom removido.');
      void queryClient.invalidateQueries({ queryKey: ['quote'] });
    },
  });
  const quote = quoteQuery.data;

  if (cartQuery.isPending) return <LoadingState />;
  if (cartQuery.isError) return <ErrorState error={cartQuery.error} />;
  return (
    <div className="page-width cart-page">
      <p className="breadcrumb">
        <Link to="/" search={{ ...INITIAL_FILTERS }}>
          Início
        </Link>{' '}
        / Mercado / Carrinho
      </p>
      <div className="cart-layout">
        <section className="cart-items">
          <div className="cart-table-head">
            <span>NFTs</span>
            <span>Preço</span>
            <span>Edições</span>
            <span>Total</span>
          </div>
          {cart.length ? (
            cart.map((item) => (
              <article className="cart-row" key={item.nft.id}>
                <Link className="cart-product" to="/nft/$nftId" params={{ nftId: item.nft.id }}>
                  <img src={item.nft.image} alt="" />
                  <span>
                    <strong>{item.nft.name}</strong>
                    <small>ID do token: {item.nft.tokenId}</small>
                  </span>
                </Link>
                <strong>{item.nft.priceEth} ETH</strong>
                <div className="quantity-control">
                  <button
                    aria-label={`Diminuir ${item.nft.name}`}
                    disabled={item.quantity <= 1}
                    onClick={() =>
                      setQuantityMutation.mutate({ id: item.nft.id, quantity: item.quantity - 1 })
                    }
                  >
                    <Minus />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    aria-label={`Aumentar ${item.nft.name}`}
                    disabled={item.quantity >= item.nft.availableQuantity}
                    onClick={() =>
                      setQuantityMutation.mutate({ id: item.nft.id, quantity: item.quantity + 1 })
                    }
                  >
                    <ArrowRight />
                  </button>
                </div>
                <strong className="eth-price">
                  {multiplyEth(item.nft.priceEth, item.quantity)} ETH
                </strong>
                <button
                  className="icon-button remove-button"
                  aria-label={`Remover ${item.nft.name}`}
                  onClick={() => removeMutation.mutate(item.nft.id)}
                >
                  <Trash2 />
                </button>
              </article>
            ))
          ) : (
            <div className="state-card">
              <h2>Seu carrinho está vazio</h2>
              <p>Explore o mercado e encontre seu próximo NFT.</p>
              <Link className="button" to="/" search={{ ...INITIAL_FILTERS }}>
                Continuar explorando
              </Link>
            </div>
          )}
        </section>
        <aside className="cart-summary">
          <h2>Resumo da carteira</h2>
          <label className="coupon-label">
            Código promocional
            <div className="coupon-input">
              <input
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                placeholder="Digite o código promocional..."
              />
              <button
                className="button"
                onClick={() =>
                  couponInput ? couponMutation.mutate(couponInput) : removeCoupon.mutate()
                }
              >
                {quote?.appliedCoupon ? 'Remover' : 'Aplicar'}
              </button>
            </div>
          </label>
          {couponMessage && (
            <p className={couponMutation.isError ? 'form-error' : 'form-success'} role="status">
              {couponMessage}
            </p>
          )}
          {quoteQuery.isError && (
            <p className="form-error" role="alert">
              {messageFromError(quoteQuery.error)}
            </p>
          )}
          <PriceSummary quote={quote} />
          {cart.length > 0 && (
            <Link
              className="button checkout-button"
              to={getToken() ? '/payment' : '/login'}
              onClick={() => {
                if (!getToken()) sessionStorage.setItem('kurio_return_to', '/payment');
              }}
            >
              Conectar e finalizar
            </Link>
          )}
          <Link className="continue-link" to="/" search={{ ...INITIAL_FILTERS }}>
            Continuar explorando
          </Link>
        </aside>
      </div>
      <RelatedNFTs currentId="" />
    </div>
  );
}

export function PriceSummary({
  quote,
}: {
  quote?: { subtotalEth: string; discountEth: string; networkFeeEth: string; totalEth: string };
}) {
  return (
    <div className="price-summary">
      <div>
        <span>Subtotal</span>
        <strong>{quote?.subtotalEth ?? '0.00'} ETH</strong>
      </div>
      <div>
        <span>Desconto do lançamento</span>
        <strong>(−) {quote?.discountEth ?? '0.00'} ETH</strong>
      </div>
      <div>
        <span>Taxa de rede</span>
        <strong>{quote?.networkFeeEth ?? '0.000'} ETH</strong>
      </div>
      <small>Taxa estimada</small>
      <div className="total-line">
        <strong>Total</strong>
        <strong className="eth-price">{quote?.totalEth ?? '0.00'} ETH</strong>
      </div>
    </div>
  );
}
