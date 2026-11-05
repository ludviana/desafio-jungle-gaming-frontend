import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMarketplace } from '../../shared/useMarketplace';
import { getToken, messageFromError } from '../../shared/site';
import { ErrorState, LoadingState, RedirectMessage } from '../../shared/feedback';
import { ProfileLayout } from './ProfileLayout';

export function ProfilePage() {
  const marketplace = useMarketplace();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: marketplace.profile.get,
    enabled: Boolean(getToken()),
    retry: false,
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [message, setMessage] = useState('');
  const updateMutation = useMutation({
    mutationFn: marketplace.profile.update,
    onSuccess: async (profile) => {
      queryClient.setQueryData(['profile'], profile);
      setMessage('Perfil atualizado.');
    },
  });
  const passwordMutation = useMutation({
    mutationFn: () =>
      marketplace.profile.changePassword(passwords.currentPassword, passwords.newPassword),
    onSuccess: () => {
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      setMessage('Senha alterada.');
    },
  });
  if (!getToken())
    return (
      <RedirectMessage title="Entre para acessar seu perfil" action="/login" returnTo="/profile" />
    );
  if (profileQuery.isPending) return <LoadingState />;
  if (profileQuery.isError) return <ErrorState error={profileQuery.error} />;
  const profile = profileQuery.data;
  return (
    <ProfileLayout active="Dados do perfil">
      <form
        className="profile-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          updateMutation.mutate({
            name: String(data.get('name')),
            username: String(data.get('username')),
            email: String(data.get('email')),
            ensName: String(data.get('ensName')),
            avatar: String(data.get('avatar')),
          });
        }}
      >
        <div className="profile-form-grid">
          <label>
            Nome de exibição *<input name="name" defaultValue={profile.name} required />
          </label>
          <label>
            Nome de usuário *<input name="username" defaultValue={profile.username} required />
          </label>
          <label>
            E-mail *<input name="email" type="email" defaultValue={profile.email} required />
          </label>
          <label>
            Nome ENS *<input name="ensName" defaultValue={profile.ensName} />
          </label>
        </div>
        <label>
          Avatar
          <input
            name="avatar"
            type="url"
            defaultValue={profile.avatar}
            placeholder="URL do avatar"
          />
        </label>
        <h2>Alterar senha</h2>
        <div className="password-fields">
          <label>
            Senha atual
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            />
          </label>
          <label>
            Nova senha
            <input
              type="password"
              minLength={8}
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            />
          </label>
          <label>
            Confirmar nova senha
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </label>
        </div>
        {message && (
          <p className="form-success" role="status">
            {message}
          </p>
        )}
        {(updateMutation.isError || passwordMutation.isError) && (
          <p className="form-error" role="alert">
            {messageFromError(updateMutation.error ?? passwordMutation.error)}
          </p>
        )}
        <div className="button-row">
          <button className="button">Salvar perfil</button>
          <button
            type="button"
            className="button button-outline"
            disabled={
              !passwords.currentPassword ||
              !passwords.newPassword ||
              passwords.newPassword !== passwords.confirm
            }
            onClick={() => passwordMutation.mutate()}
          >
            Alterar senha
          </button>
        </div>
      </form>
    </ProfileLayout>
  );
}
