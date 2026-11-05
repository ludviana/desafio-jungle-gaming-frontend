import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { failure, getScenario } from '../helpers';

export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as {
      username: string;
      email: string;
      password: string;
      name?: string;
    };
    if (getScenario(request) === 'register-conflict')
      return failure('E-mail ou nome de usuário já cadastrado.', 409, 'ACCOUNT_CONFLICT');
    if (
      !body.username?.trim() ||
      !body.email?.trim() ||
      !body.password ||
      body.password.length < 8
    ) {
      return failure('Preencha os campos obrigatórios. A senha deve ter ao menos 8 caracteres.');
    }
    if (db.hasAccount(body.email, body.username)) {
      return failure('E-mail ou nome de usuário já cadastrado.', 409, 'ACCOUNT_CONFLICT');
    }
    const user = {
      id: `user-${crypto.randomUUID()}`,
      name: body.name?.trim() || body.username.trim(),
      username: body.username.trim(),
      email: body.email.trim().toLowerCase(),
      avatar: '',
      ensName: '',
    };
    await db.addUser(user, body.password);
    return HttpResponse.json(db.createSession(user), { status: 201 });
  }),
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = await db.verifyCredentials(body.email, body.password);
    if (!user) return failure('E-mail ou senha incorretos.', 401, 'INVALID_CREDENTIALS');
    return HttpResponse.json(db.createSession(user));
  }),
  http.get('/api/auth/session', ({ request }) => {
    if (getScenario(request) === 'session-expired')
      return failure('Sessão expirada ou inválida.', 401, 'SESSION_EXPIRED');
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    const session = db.getSession(token);
    return session
      ? HttpResponse.json(session)
      : failure('Sessão expirada ou inválida.', 401, 'SESSION_EXPIRED');
  }),
  http.post('/api/auth/logout', ({ request }) => {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    db.deleteSession(token);
    return new HttpResponse(null, { status: 204 });
  }),
];
