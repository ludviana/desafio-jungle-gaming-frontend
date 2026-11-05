import { http, HttpResponse } from 'msw';
import { db } from '../db';
import { failure, getAuthorizedUser, maybeSimulateFailure } from '../helpers';

export const favoritesHandlers = [
  http.get('/api/favorites', ({ request }) => {
    const simulated = maybeSimulateFailure(request);
    if (simulated) return simulated;
    const user = getAuthorizedUser(request);
    return user
      ? HttpResponse.json(db.getFavorites(user.id))
      : failure('Autenticação necessária.', 401);
  }),
  http.put('/api/favorites/:nftId', ({ request, params }) => {
    const simulated = maybeSimulateFailure(request);
    if (simulated) return simulated;
    const user = getAuthorizedUser(request);
    if (!user) return failure('Autenticação necessária.', 401);
    if (!db.getNFTById(String(params.nftId))) return failure('NFT não encontrado.', 404);
    const isFavorite = db.toggleFavorite(user.id, String(params.nftId));
    return HttpResponse.json({ nftId: params.nftId, isFavorite });
  }),
];
