import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { failure, getAuthorizedUser } from '../helpers';
import type { UserProfile } from '../../../domain/entities';

export const profileHandlers = [
  http.get('/api/profile', ({ request }) => {
    const user = getAuthorizedUser(request);
    return user ? HttpResponse.json(user) : failure('Autenticação necessária.', 401);
  }),
  http.put('/api/profile', async ({ request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return failure('Autenticação necessária.', 401);
    const body = (await request.json()) as Partial<UserProfile>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const avatar = typeof body.avatar === 'string' ? body.avatar.trim() : '';
    if (!name || !username || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return failure('Informe nome, usuário e um e-mail válido.', 400, 'INVALID_PROFILE');
    if (db.hasOtherAccount(user.id, email, username))
      return failure('E-mail ou nome de usuário já cadastrado.', 409, 'ACCOUNT_CONFLICT');
    if (avatar) {
      try {
        const url = new URL(avatar);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
      } catch {
        return failure('Informe uma URL válida para o avatar.', 400, 'INVALID_AVATAR');
      }
    }
    const updated = {
      ...user,
      ...body,
      name,
      username,
      email,
      avatar,
      id: user.id,
    };
    db.saveProfile(updated);
    return HttpResponse.json(updated);
  }),
  http.put('/api/profile/password', async ({ request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return failure('Autenticação necessária.', 401);
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (!body.currentPassword || !body.newPassword || body.newPassword.length < 8)
      return failure('Informe a senha atual e uma nova senha com ao menos 8 caracteres.');
    if (body.currentPassword === body.newPassword)
      return failure('A nova senha deve ser diferente da senha atual.');
    if (!(await db.changePassword(user.id, body.currentPassword, body.newPassword)))
      return failure('Senha atual incorreta.', 400, 'INVALID_PASSWORD');
    return HttpResponse.json({ updated: true });
  }),
];
