import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Outlet } from '@tanstack/react-router';
import {
  Heart,
  Home as HomeIcon,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react';
import { useMarketplace } from '../shared/useMarketplace';
import type { NFT, RealtimeNFTUpdate, RealtimeOrderUpdate } from '../../domain/entities';
import { getRealtimeSocket } from '../../infrastructure/realtime/socket';
import { INITIAL_FILTERS, TOKEN_KEY, useCart, useSession } from '../shared/site';
import { shouldApplyRealtimeEvent } from '../shared/realtime-events';
import { SiteFooter } from './SiteFooter';
import './presentation-layout-styles/layout.css';
import './presentation-layout-styles/layout-responsive.css';

export function RootLayout() {
  const marketplace = useMarketplace();
  const queryClient = useQueryClient();
  const sessionQuery = useSession();
  const cartQuery = useCart();
  const session = sessionQuery.data;
  const cartCount = Array.isArray(cartQuery.data)
    ? cartQuery.data.reduce((sum, item) => sum + item.quantity, 0)
    : 0;
  const [mobileOpen, setMobileOpen] = useState(false);
  const seenEvents = useRef(new Set<string>());
  const nftVersions = useRef(new Map<string, number>());
  const orderVersions = useRef(new Map<string, number>());
  const [scenario, setScenario] = useState(
    localStorage.getItem('kurio_mock_scenario') ?? 'default',
  );

  const logoutMutation = useMutation({
    mutationFn: marketplace.auth.logout,
    onSuccess: async () => {
      localStorage.removeItem(TOKEN_KEY);
      await queryClient.clear();
      window.location.assign('/');
    },
  });

  useEffect(() => {
    if (sessionQuery.isError) {
      localStorage.removeItem(TOKEN_KEY);
      queryClient.removeQueries();
    }
  }, [sessionQuery.isError, queryClient]);

  useEffect(() => {
    const onSessionExpired = () => {
      const returnPath = `${window.location.pathname}${window.location.search}`;
      if (!['/login', '/register'].includes(window.location.pathname)) {
        sessionStorage.setItem('kurio_return_to', returnPath);
      }
      localStorage.removeItem(TOKEN_KEY);
      void queryClient.clear();
      if (!['/login', '/register'].includes(window.location.pathname))
        window.location.assign('/login');
    };
    window.addEventListener('kurio:session-expired', onSessionExpired);
    return () => window.removeEventListener('kurio:session-expired', onSessionExpired);
  }, [queryClient]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const nftIds = [
      'emerald-ape-042',
      'sage-nomad-009',
      'neon-vessel-552',
      'cosmic-bloom-118',
      'violet-nomad-314',
      'ivory-baron-088',
      'golden-beat-207',
      'golden-frequency-071',
      'golden-signal-160',
      'sunset-relay-101',
      'silver-signal-207',
      'digital-wave-330',
    ];
    const subscribe = () => nftIds.forEach((id) => socket.emit('subscribe:nft', id));
    const onNftUpdated = (update: RealtimeNFTUpdate) => {
      if (
        !shouldApplyRealtimeEvent(
          update.eventId,
          update.nftId,
          update.version,
          seenEvents.current,
          nftVersions.current,
        )
      )
        return;
      queryClient.setQueriesData<{ data: NFT[] }>(
        { queryKey: ['nfts'] },
        (current) =>
          current && {
            ...current,
            data: current.data.map((nft) =>
              nft.id === update.nftId && nft.version < update.version
                ? {
                    ...nft,
                    priceEth: update.priceEth,
                    availableQuantity: update.availableQuantity,
                    version: update.version,
                  }
                : nft,
            ),
          },
      );
      queryClient.setQueryData<NFT>(['nft', update.nftId], (current) =>
        current && current.version < update.version
          ? {
              ...current,
              priceEth: update.priceEth,
              availableQuantity: update.availableQuantity,
              version: update.version,
            }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      void queryClient.invalidateQueries({ queryKey: ['quote'] });
    };
    const onOrderUpdated = (update: RealtimeOrderUpdate) => {
      if (
        !shouldApplyRealtimeEvent(
          update.eventId,
          update.orderId,
          update.version,
          seenEvents.current,
          orderVersions.current,
        )
      )
        return;
      void queryClient.invalidateQueries({ queryKey: ['order', update.orderId] });
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      void queryClient.invalidateQueries({ queryKey: ['quote'] });
    };
    socket.on('connect', subscribe);
    socket.on('nft.updated', onNftUpdated);
    socket.on('order.updated', onOrderUpdated);
    socket.connect();
    return () => {
      socket.off('connect', subscribe);
      socket.off('nft.updated', onNftUpdated);
      socket.off('order.updated', onOrderUpdated);
      socket.disconnect();
    };
  }, [queryClient, session?.user.id]);

  const changeScenario = async (value: string) => {
    setScenario(value);
    localStorage.setItem('kurio_mock_scenario', value);
    await fetch('/api/mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: value }),
    });
  };

  return (
    <div className="app-shell">
      <header className="site-header page-width">
        <Link
          to="/"
          search={{ ...INITIAL_FILTERS }}
          className="wordmark"
          aria-label="Kurio - início"
        >
          KURIO
        </Link>
        <button
          className="icon-button mobile-menu"
          aria-label="Abrir navegação"
          aria-expanded={mobileOpen}
          aria-controls="primary-navigation"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
        <nav
          id="primary-navigation"
          className={`main-nav ${mobileOpen ? 'is-open' : ''}`}
          aria-label="Navegação principal"
        >
          <Link
            to="/"
            search={{ ...INITIAL_FILTERS }}
            activeOptions={{ exact: true, includeHash: true }}
            activeProps={{ className: 'active' }}
          >
            Início
          </Link>
          <Link
            to="/"
            hash="catalogo"
            search={{ ...INITIAL_FILTERS }}
            activeOptions={{ exact: true, includeHash: true }}
            activeProps={{ className: 'active' }}
          >
            Mercado
          </Link>
          <a href="#criadores">Criadores</a>
          <a href="#rodape">Aprenda</a>
        </nav>
        <div className="header-actions">
          <Link
            className="icon-button"
            to="/"
            search={{ ...INITIAL_FILTERS }}
            aria-label="Buscar NFTs"
          >
            <Search />
          </Link>
          <Link
            className="icon-button cart-shortcut"
            to="/cart"
            aria-label={`Carrinho, ${cartCount} itens`}
          >
            <ShoppingCart />
            <span className="count-badge">{cartCount}</span>
          </Link>
          {session ? (
            <div className="account-actions">
              <Link className="profile-link" to="/profile">
                <UserRound /> <span>{session.user.username}</span>
              </Link>
              <button
                className="button button-small button-outline"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut /> Sair
              </button>
            </div>
          ) : (
            <Link className="button button-small" to="/login">
              <LogIn /> Entrar
            </Link>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <SiteFooter />
      <nav className="mobile-bottom-nav" aria-label="Navegação inferior">
        <Link to="/" search={{ ...INITIAL_FILTERS }} aria-label="Início">
          <HomeIcon />
        </Link>
        <Link to="/profile" aria-label="Favoritos">
          <Heart fill="currentColor" />
        </Link>
        <Link to="/cart" className="mobile-nav-center" aria-label="Ação principal">
          <Search />
        </Link>
        <Link to="/cart" aria-label="Carrinho">
          <ShoppingCart />
        </Link>
        <Link to={session ? '/profile' : '/login'} aria-label="Perfil">
          <UserRound />
        </Link>
      </nav>
      {import.meta.env.DEV && (
        <label className="scenario-control">
          Cenário mock
          <select value={scenario} onChange={(event) => void changeScenario(event.target.value)}>
            <option value="default">Padrão</option>
            <option value="slow">Rede lenta</option>
            <option value="variable-latency">Latência variável</option>
            <option value="offline">Sem conexão</option>
            <option value="server-error">Erro 503</option>
            <option value="empty">Catálogo vazio</option>
            <option value="session-expired">Sessão expirada</option>
            <option value="register-conflict">Conflito de cadastro</option>
            <option value="price-change">Mudança de preço</option>
            <option value="payment-refused">Pagamento recusado</option>
            <option value="pending-payment">Pedido pendente</option>
            <option value="timeout-after-order">Timeout após pedido</option>
          </select>
        </label>
      )}
    </div>
  );
}
