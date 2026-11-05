import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMarketplace } from '../../shared/useMarketplace';
import type { Wallet } from '../../../domain/entities';
import { getToken, messageFromError } from '../../shared/site';
import { ErrorState, LoadingState, RedirectMessage } from '../../shared/feedback';
import { ProfileLayout } from './ProfileLayout';

export function WalletsPage() {
  const marketplace = useMarketplace();
  const queryClient = useQueryClient();
  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: marketplace.wallets.list,
    enabled: Boolean(getToken()),
    retry: false,
  });
  const [notice, setNotice] = useState('');
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const saveMutation = useMutation({
    mutationFn: (wallet: Omit<Wallet, 'id'> & { id?: string }) => {
      if (wallet.id) return marketplace.wallets.update(wallet.id, { ...wallet, id: wallet.id });
      return marketplace.wallets.save(wallet);
    },
    onSuccess: async () => {
      setNotice('Carteira salva.');
      setEditingWallet(null);
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
  const primaryMutation = useMutation({
    mutationFn: marketplace.wallets.setPrimary,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
  if (!getToken())
    return (
      <RedirectMessage
        title="Entre para gerenciar suas carteiras"
        action="/login"
        returnTo="/wallets"
      />
    );
  if (walletsQuery.isPending) return <LoadingState />;
  if (walletsQuery.isError) return <ErrorState error={walletsQuery.error} />;
  return (
    <ProfileLayout active="Carteiras">
      <div className="wallets-page">
        <div className="wallets-title">
          <div>
            <h1>Carteira principal</h1>
            <p>Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
          </div>
          <button
            className="text-button"
            onClick={() =>
              document.getElementById('wallet-form')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Adicionar
          </button>
        </div>
        <div className="wallet-card-list">
          {walletsQuery.data.map((wallet) => (
            <div className="wallet-card-row" key={wallet.id}>
              <label className="wallet-option">
                <input
                  type="radio"
                  name="primaryWallet"
                  checked={wallet.isPrimary}
                  onChange={() => primaryMutation.mutate(wallet.id)}
                />
                <span>
                  <strong>{wallet.label}</strong>
                  <small>
                    {wallet.ensName || wallet.address} · Rede {wallet.network}
                  </small>
                </span>
                <span>{wallet.provider}</span>
              </label>
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setEditingWallet(wallet);
                  document.getElementById('wallet-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Editar
              </button>
            </div>
          ))}
        </div>
        <form
          id="wallet-form"
          key={editingWallet?.id ?? 'new'}
          className="wallet-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            saveMutation.mutate({
              id: editingWallet?.id,
              label: String(data.get('label')),
              address: String(data.get('address')),
              ensName: String(data.get('ensName')) || undefined,
              network: String(data.get('network')) as Wallet['network'],
              provider: String(data.get('provider')) as Wallet['provider'],
              isPrimary: editingWallet?.isPrimary ?? false,
            });
            event.currentTarget.reset();
          }}
        >
          <h2>{editingWallet ? 'Editar carteira' : 'Adicionar carteira'}</h2>
          <div className="profile-form-grid">
            <label>
              Nome de exibição *<input name="label" defaultValue={editingWallet?.label} required />
            </label>
            <label>
              Apelido da carteira
              <input name="ensName" defaultValue={editingWallet?.ensName} />
            </label>
            <label>
              Rede *
              <select name="network" defaultValue={editingWallet?.network ?? 'ethereum'}>
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="solana">Solana</option>
              </select>
            </label>
            <label>
              Nome do perfil
              <input name="profile" />
            </label>
            <label>
              Endereço da carteira *
              <input
                name="address"
                defaultValue={editingWallet?.address}
                required
                placeholder="Endereço 0x da carteira"
              />
            </label>
            <label>
              Tipo de carteira *
              <select name="provider" defaultValue={editingWallet?.provider ?? 'MetaMask'}>
                <option>MetaMask</option>
                <option>WalletConnect</option>
                <option>Coinbase Wallet</option>
              </select>
            </label>
          </div>
          {notice && (
            <p className="form-success" role="status">
              {notice}
            </p>
          )}
          {saveMutation.isError && (
            <p className="form-error" role="alert">
              {messageFromError(saveMutation.error)}
            </p>
          )}
          <div className="button-row">
            <button className="button">
              {editingWallet ? 'Atualizar carteira' : 'Salvar carteira'}
            </button>
            {editingWallet && (
              <button
                className="button button-outline"
                type="button"
                onClick={() => setEditingWallet(null)}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </ProfileLayout>
  );
}
