import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMarketplace } from '../../shared/useMarketplace';
import { multiplyEth } from '../../../domain/value-objects/eth';
import { PriceSummary } from '../cart/CartPage';
import {
  getToken,
  INITIAL_FILTERS,
  messageFromError,
  useCart,
  useSession,
} from '../../shared/site';
import { ErrorState, LoadingState, RedirectMessage } from '../../shared/feedback';
import './presentation-features-checkout-styles/checkout.css';
import './presentation-features-checkout-styles/checkout-responsive.css';

export function PaymentPage() {
  const marketplace = useMarketplace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orderSubmissionStarted = useRef(false);
  const sessionQuery = useSession();
  const cartQuery = useCart();
  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: marketplace.wallets.list,
    enabled: Boolean(getToken()),
    retry: false,
  });
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: marketplace.profile.get,
    enabled: Boolean(getToken()),
    retry: false,
  });
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [network, setNetwork] = useState<'ethereum' | 'polygon' | 'solana'>('ethereum');
  const cart = cartQuery.data ?? [];
  const quoteQuery = useQuery({
    queryKey: ['quote', cart],
    queryFn: () => marketplace.cart.quote(cart),
    enabled: cart.length > 0,
  });
  const selectedWallet =
    walletsQuery.data?.find((wallet) => wallet.id === selectedWalletId) ??
    walletsQuery.data?.find((wallet) => wallet.isPrimary);
  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWallet || !quoteQuery.data || cart.length === 0)
        throw new Error('Selecione uma carteira e confira o carrinho.');
      const payload = {
        items: cart.map((item) => ({ nftId: item.nft.id, quantity: item.quantity })),
        walletAddress: selectedWallet.address,
        network,
        couponCode: quoteQuery.data.appliedCoupon,
        quoteVersion: quoteQuery.data.quoteVersion,
      };
      const signature = JSON.stringify(payload);
      let key = sessionStorage.getItem('kurio_pending_order_key');
      if (sessionStorage.getItem('kurio_pending_order_payload') !== signature || !key) {
        key = crypto.randomUUID();
        sessionStorage.setItem('kurio_pending_order_key', key);
        sessionStorage.setItem('kurio_pending_order_payload', signature);
      }
      return marketplace.orders.create(payload, key);
    },
    onSuccess: async (receipt) => {
      sessionStorage.setItem('kurio_last_order_id', receipt.orderId);
      await queryClient.invalidateQueries();
      void navigate({ to: '/orders/$orderId', params: { orderId: receipt.orderId } });
    },
    onError: () => {
      orderSubmissionStarted.current = false;
    },
  });

  if (!getToken())
    return <RedirectMessage title="Entre para continuar" action="/login" returnTo="/payment" />;
  if (cartQuery.isPending || walletsQuery.isPending || profileQuery.isPending)
    return <LoadingState />;
  if (!cart.length) return <RedirectMessage title="Seu carrinho está vazio" action="/cart" />;
  const user = profileQuery.data ?? sessionQuery.data?.user;
  if (cartQuery.isError || walletsQuery.isError || profileQuery.isError)
    return <ErrorState error={cartQuery.error ?? walletsQuery.error ?? profileQuery.error} />;
  return (
    <div className="page-width payment-page">
      <p className="breadcrumb">
        <Link to="/" search={{ ...INITIAL_FILTERS }}>
          Início
        </Link>{' '}
        / Mercado / Pagamento
      </p>
      <form
        className="payment-layout"
        onSubmit={(event) => {
          event.preventDefault();
          if (!event.currentTarget.reportValidity() || orderSubmissionStarted.current) return;
          orderSubmissionStarted.current = true;
          orderMutation.mutate();
        }}
      >
        <section>
          <h1>Perfil do colecionador</h1>
          <div className="payment-form-grid">
            <label>
              Nome de exibição *<input defaultValue={user?.name} required />
            </label>
            <label>
              Nome de usuário *<input defaultValue={user?.username} required />
            </label>
            <label>
              Rede *
              <select
                value={network}
                onChange={(event) => setNetwork(event.target.value as typeof network)}
              >
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="solana">Solana</option>
              </select>
            </label>
            <label>
              Nome do perfil *<input defaultValue={user?.ensName} required />
            </label>
            <label>
              Endereço da carteira *
              <input
                value={selectedWallet?.address ?? ''}
                readOnly
                required
                placeholder="Endereço 0x da carteira"
              />
            </label>
            <label>
              ENS ou carteira secundária
              <input placeholder="ENS ou carteira secundária (opcional)" />
            </label>
            <label>
              Tipo de carteira *
              <select
                value={selectedWallet?.provider ?? ''}
                onChange={(event) =>
                  setSelectedWalletId(
                    walletsQuery.data?.find((wallet) => wallet.provider === event.target.value)
                      ?.id ?? '',
                  )
                }
                required
              >
                <option value="">Selecione uma carteira</option>
                {walletsQuery.data?.map((wallet) => (
                  <option key={wallet.id} value={wallet.provider}>
                    {wallet.provider}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Código de indicação *<input defaultValue="KURIO" required />
            </label>
            <label>
              E-mail *<input type="email" defaultValue={user?.email} required />
            </label>
            <label>
              Nome ENS *<input defaultValue={user?.ensName} placeholder=".eth" required />
            </label>
          </div>
          <label className="checkbox-line">
            <input type="checkbox" /> Usar outra carteira?
          </label>
          <label>
            Observação do colecionador (opcional)
            <textarea rows={4} />
          </label>
        </section>
        <aside className="payment-summary">
          <h2>Seus NFTs</h2>
          <div className="payment-item-list">
            {cart.map((item) => (
              <div className="payment-item" key={item.nft.id}>
                <img src={item.nft.image} alt="" />
                <span>
                  <strong>{item.nft.name}</strong>
                  <small>
                    ID do token: {item.nft.tokenId}　(x {item.quantity})
                  </small>
                </span>
                <strong>{multiplyEth(item.nft.priceEth, item.quantity)} ETH</strong>
              </div>
            ))}
          </div>
          <p className="coupon-hint">
            Tem um código promocional? <Link to="/cart">Aplique aqui</Link>
          </p>
          <PriceSummary quote={quoteQuery.data} />
          <h2>Carteira e rede</h2>
          {walletsQuery.data?.map((wallet) => (
            <label key={wallet.id} className="wallet-option">
              <input
                type="radio"
                name="wallet"
                checked={(selectedWallet?.id ?? '') === wallet.id}
                onChange={() => {
                  setSelectedWalletId(wallet.id);
                  setNetwork(wallet.network === 'sepolia' ? 'ethereum' : wallet.network);
                }}
              />
              <span>
                <strong>{wallet.label}</strong>
                <small>
                  {wallet.ensName || wallet.address} · {wallet.network}
                </small>
              </span>
              <span>{wallet.provider}</span>
            </label>
          ))}
          {!walletsQuery.data?.length && (
            <Link className="button button-outline button-wide" to="/wallets">
              Cadastrar carteira
            </Link>
          )}
          {orderMutation.isError && (
            <p className="form-error" role="alert">
              {messageFromError(orderMutation.error)} A mesma tentativa pode ser enviada novamente
              com segurança.
            </p>
          )}
          <button
            className="button button-wide"
            type="submit"
            disabled={orderMutation.isPending || !selectedWallet}
          >
            {orderMutation.isPending ? 'Processando…' : 'Confirmar compra'}
          </button>
        </aside>
      </form>
    </div>
  );
}
