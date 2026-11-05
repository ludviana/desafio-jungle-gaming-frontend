import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { INITIAL_FILTERS, messageFromError } from './site';

export function RedirectMessage({
  title,
  action,
  returnTo,
}: {
  title: string;
  action: '/login' | '/cart';
  returnTo?: string;
}) {
  return (
    <div className="page-width state-card">
      <h1>{title}</h1>
      <Link
        className="button"
        to={action}
        onClick={() => {
          if (returnTo) sessionStorage.setItem('kurio_return_to', returnTo);
        }}
      >
        {action === '/login' ? 'Entrar' : 'Ir ao carrinho'}
      </Link>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="page-width loading-grid" aria-label="Carregando">
      <div className="nft-skeleton">
        <div />
        <span />
        <span />
      </div>
      <div className="nft-skeleton">
        <div />
        <span />
        <span />
      </div>
      <div className="nft-skeleton">
        <div />
        <span />
        <span />
      </div>
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="page-width state-card">
      <h1>Não foi possível carregar</h1>
      <p>{messageFromError(error)}</p>
      <button className="button" onClick={() => window.location.reload()}>
        Tentar novamente
      </button>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="page-width state-card">
      <h1>Página não encontrada</h1>
      <p>O endereço acessado não corresponde a uma tela da Kurio.</p>
      <Link to="/" search={{ ...INITIAL_FILTERS }} className="button">
        <ArrowLeft /> Voltar ao início
      </Link>
    </div>
  );
}
