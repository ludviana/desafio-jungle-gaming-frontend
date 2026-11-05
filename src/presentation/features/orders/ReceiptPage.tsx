import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { Check, X } from 'lucide-react';
import { useMarketplace } from '../../shared/useMarketplace';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../shared/components/ui/dialog';
import { getRealtimeSocket } from '../../../infrastructure/realtime/socket';
import { multiplyEth } from '../../../domain/value-objects/eth';
import { PriceSummary } from '../cart/CartPage';
import { getToken, INITIAL_FILTERS } from '../../shared/site';
import { LoadingState, RedirectMessage } from '../../shared/feedback';
import './presentation-features-orders-styles/orders.css';
import './presentation-features-orders-styles/orders-responsive.css';

export function ReceiptPage() {
  const marketplace = useMarketplace();
  const { orderId } = useParams({ from: '/orders/$orderId' });
  const [explorerOpen, setExplorerOpen] = useState(false);
  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => marketplace.orders.get(orderId),
    enabled: Boolean(getToken()),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 2000 : false),
  });
  useEffect(() => {
    const socket = getRealtimeSocket();
    const token = getToken();
    const subscribe = () => socket.emit('subscribe:order', orderId, token);
    socket.on('connect', subscribe);
    if (socket.connected) subscribe();
    return () => {
      socket.off('connect', subscribe);
      if (socket.connected) socket.emit('unsubscribe:order', orderId);
    };
  }, [orderId]);
  if (!getToken())
    return (
      <RedirectMessage
        title="Entre para consultar o pedido"
        action="/login"
        returnTo={`/orders/${orderId}`}
      />
    );
  if (orderQuery.isPending) return <LoadingState />;
  if (orderQuery.isError || !orderQuery.data)
    return (
      <div className="page-width state-card">
        <h1>Pedido não encontrado</h1>
        <p>Não foi possível recuperar esse recibo.</p>
        <Link className="button" to="/" search={{ ...INITIAL_FILTERS }}>
          Voltar ao início
        </Link>
      </div>
    );
  const order = orderQuery.data;
  if (order.status === 'pending')
    return (
      <div className="page-width state-card">
        <h1>Pagamento pendente</h1>
        <p>
          Estamos aguardando a confirmação da transação. Esta página será atualizada
          automaticamente; o carrinho permanece intacto até a confirmação.
        </p>
        <Link className="button" to="/cart">
          Voltar ao carrinho
        </Link>
      </div>
    );
  if (order.status === 'failed')
    return (
      <div className="page-width state-card">
        <h1>Pagamento recusado</h1>
        <p>A transação não foi concluída e seu carrinho foi preservado.</p>
        <Link className="button" to="/cart">
          Voltar ao carrinho
        </Link>
      </div>
    );
  return (
    <div className="receipt-page page-width">
      <article className="receipt-card">
        <div className="receipt-icon">
          <Check />
        </div>
        <h1>Seus NFTs agora estão na sua carteira</h1>
        <div className="receipt-metadata">
          <div>
            <small>ID da transação</small>
            <strong>
              {order.transactionHash.slice(0, 8)}…{order.transactionHash.slice(-4)}
            </strong>
          </div>
          <div>
            <small>Data</small>
            <strong>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</strong>
          </div>
          <div>
            <small>Total</small>
            <strong>{order.totalEth} ETH</strong>
          </div>
          <div>
            <small>Carteira</small>
            <strong>{order.walletAddress}</strong>
          </div>
        </div>
        <h2>Detalhes da transação</h2>
        <div className="receipt-items">
          {order.items.map((item) => (
            <div className="receipt-item" key={item.nft.id}>
              <img src={item.nft.image} alt="" />
              <span>
                <strong>{item.nft.name}</strong>
                <small>ID do token: {item.nft.tokenId}</small>
              </span>
              <span>(x {item.quantity})</span>
              <strong>{multiplyEth(item.nft.priceEth, item.quantity)} ETH</strong>
            </div>
          ))}
        </div>
        <PriceSummary quote={order} />
        <p className="receipt-confirmation">
          Transação confirmada na {order.network}. A propriedade foi transferida para sua carteira
          conectada e registrada na rede.
        </p>
        <button className="button" type="button" onClick={() => setExplorerOpen(true)}>
          Ver no Etherscan
        </button>
      </article>
      <Dialog open={explorerOpen} onOpenChange={setExplorerOpen}>
        <DialogContent className="receipt-explorer-dialog">
          <DialogClose className="auth-close" aria-label="Fechar">
            <X />
          </DialogClose>
          <DialogTitle>Explorador simulado</DialogTitle>
          <DialogDescription>
            Referência de transação simulada para esta demonstração.
          </DialogDescription>
          <dl className="nft-meta">
            <dt>Rede</dt>
            <dd>{order.network}</dd>
            <dt>Hash</dt>
            <dd>{order.transactionHash}</dd>
          </dl>
        </DialogContent>
      </Dialog>
    </div>
  );
}
