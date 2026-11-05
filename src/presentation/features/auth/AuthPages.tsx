import { useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { useMarketplace } from '../../shared/useMarketplace';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../shared/components/ui/dialog';
import { getSafeReturnPath, INITIAL_FILTERS, messageFromError, TOKEN_KEY } from '../../shared/site';
import gorillaImage from '../../../assets/nfts/gorilla.png';
import './presentation-features-auth-styles/auth.css';
import './presentation-features-auth-styles/auth-responsive.css';

export function LoginPage() {
  const marketplace = useMarketplace();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => marketplace.auth.login(email, password),
    onSuccess: (session) => {
      localStorage.setItem(TOKEN_KEY, session.token);
      window.location.assign(getSafeReturnPath());
    },
  });
  return (
    <AuthPanel
      title="Entrar"
      subtitle="Entre para gerenciar sua carteira, coleção e perfil de criador."
    >
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <label>
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="contato@email.com"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
          />
        </label>
        <a className="forgot-link" href="#login">
          Esqueceu a senha?
        </a>
        {mutation.isError && (
          <p className="form-error" role="alert">
            {messageFromError(mutation.error)}
          </p>
        )}
        <button className="button button-wide" disabled={mutation.isPending}>
          {mutation.isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <SocialAuth />
      <p className="auth-switch">
        Novo na Kurio? <Link to="/register">Crie uma conta</Link>
      </p>
      <p className="test-credentials">Demo: lucas@kurio.test / Kurio123!</p>
    </AuthPanel>
  );
}

export function RegisterPage() {
  const marketplace = useMarketplace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const mutation = useMutation({
    mutationFn: () => marketplace.auth.register(username, email, password),
    onSuccess: async (session) => {
      localStorage.setItem(TOKEN_KEY, session.token);
      queryClient.clear();
      queryClient.setQueryData(['session'], session);
      await queryClient.invalidateQueries();
      void navigate({ to: '/', search: { ...INITIAL_FILTERS } });
    },
  });
  return (
    <AuthPanel
      title="Criar perfil de colecionador"
      subtitle="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
    >
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (password !== confirmPassword) {
            setValidationError('As senhas não conferem.');
            return;
          }
          setValidationError('');
          mutation.mutate();
        }}
      >
        <label>
          Nome de usuário
          <input
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          E-mail
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Senha
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirmar senha
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        {(validationError || mutation.isError) && (
          <p className="form-error" role="alert">
            {validationError || messageFromError(mutation.error)}
          </p>
        )}
        <button className="button button-wide" disabled={mutation.isPending}>
          {mutation.isPending ? 'Criando…' : 'Criar perfil'}
        </button>
      </form>
      <SocialAuth />
      <p className="auth-switch">
        Já tem uma conta? <Link to="/login">Entre</Link>
      </p>
    </AuthPanel>
  );
}

export function AuthPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <section className="auth-page page-width">
      <div className="auth-decoration">
        <h1>
          SEJA DONO DO FUTURO
          <br />
          DA ARTE DIGITAL
        </h1>
        <p>Descubra NFTs selecionados de criadores do mundo todo.</p>
        <img src={gorillaImage} alt="" />
      </div>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) void navigate({ to: '/', search: { ...INITIAL_FILTERS } });
        }}
      >
        <DialogContent className="auth-panel">
          <DialogClose className="auth-close" aria-label="Fechar">
            <X />
          </DialogClose>
          <div className="auth-tabs">
            <span className={title === 'Entrar' ? 'active' : ''}>
              <Link to="/login">Entrar</Link>
            </span>
            <span className={title !== 'Entrar' ? 'active' : ''}>
              <Link to="/register">Criar conta</Link>
            </span>
          </div>
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="auth-description">{subtitle}</DialogDescription>
          {children}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function SocialAuth() {
  return (
    <div className="social-auth">
      <div>
        <span />
        Ou continue com
        <span />
      </div>
      <button type="button" className="button button-outline">
        🌐　Continuar com Google
      </button>
      <button type="button" className="button button-outline">
        f　Continuar com Facebook
      </button>
      <small>Provedores sociais são apenas elementos visuais nesta simulação.</small>
    </div>
  );
}
