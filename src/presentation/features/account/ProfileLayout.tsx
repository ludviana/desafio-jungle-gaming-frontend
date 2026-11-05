import type { ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Heart, LogOut, ShoppingBag, UserRound, Wallet as WalletIcon } from 'lucide-react';
import { useMarketplace } from '../../shared/useMarketplace';
import { messageFromError, TOKEN_KEY } from '../../shared/site';
import './presentation-features-account-styles/account.css';
import './presentation-features-account-styles/account-responsive.css';

export function ProfileLayout({ active, children }: { active: string; children: ReactNode }) {
  const marketplace = useMarketplace();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: marketplace.auth.logout,
    onSuccess: async () => {
      localStorage.removeItem(TOKEN_KEY);
      await queryClient.clear();
      window.location.assign('/');
    },
  });
  return (
    <div className="profile-layout page-width">
      <aside className="profile-sidebar">
        <h2>Meu perfil</h2>
        <Link className={active === 'Dados do perfil' ? 'active' : ''} to="/profile">
          <UserRound />
          Dados do perfil
        </Link>
        <Link className={active === 'Carteiras' ? 'active' : ''} to="/wallets">
          <WalletIcon />
          Carteiras
        </Link>
        <a href="#pedidos">
          <ShoppingBag />
          Atividade
        </a>
        <a href="#favoritos">
          <Heart />
          Lista de interesse
        </a>
        <button disabled={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>
          <LogOut />
          Sair
        </button>
        {logoutMutation.isError && (
          <p className="form-error" role="alert">
            {messageFromError(logoutMutation.error)}
          </p>
        )}
      </aside>
      <section className="profile-content">{children}</section>
    </div>
  );
}
