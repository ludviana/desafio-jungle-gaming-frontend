import { http, HttpResponse } from 'msw';
import { db } from '../db';
import {
  failure,
  getScenario,
  maybeSimulateFailure,
  parseEth,
  simulateCatalogLatency,
} from '../helpers';

export const catalogHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    const simulated = maybeSimulateFailure(request);
    if (simulated) return simulated;
    await simulateCatalogLatency(request);
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
    const category = url.searchParams.get('category');
    const network = url.searchParams.get('network');
    const minPriceParam = url.searchParams.get('minPrice');
    const maxPriceParam = url.searchParams.get('maxPrice');
    const minPrice = minPriceParam ? parseEth(minPriceParam) : 0n;
    const maxPrice = maxPriceParam ? parseEth(maxPriceParam) : null;
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 9)));
    const sortBy = url.searchParams.get('sortBy');
    let list = [...db.getNFTs()];

    if (search) {
      list = list.filter((nft) =>
        `${nft.name} ${nft.description} ${nft.category} ${nft.collection}`
          .toLowerCase()
          .includes(search),
      );
    }
    if (category && category !== 'Todos') {
      list = list.filter((nft) => nft.category.toLowerCase() === category.toLowerCase());
    }
    if (network) {
      list = list.filter((nft) => nft.network === network.toLowerCase());
    }
    list = list.filter((nft) => {
      const price = parseEth(nft.priceEth);
      return price >= minPrice && (maxPrice === null || price <= maxPrice);
    });

    if (sortBy === 'price_asc')
      list.sort((a, b) => {
        const left = parseEth(a.priceEth);
        const right = parseEth(b.priceEth);
        return left < right ? -1 : left > right ? 1 : 0;
      });
    if (sortBy === 'price_desc')
      list.sort((a, b) => {
        const left = parseEth(b.priceEth);
        const right = parseEth(a.priceEth);
        return left < right ? -1 : left > right ? 1 : 0;
      });
    if (sortBy === 'trending') list.sort((a, b) => b.reviewCount - a.reviewCount);
    if (getScenario(request) === 'empty') list = [];

    const total = list.length;
    const totalPages = Math.ceil(total / limit);
    return HttpResponse.json({
      data: list.slice((page - 1) * limit, page * limit),
      total,
      page,
      totalPages,
    });
  }),
  http.get('/api/nfts/:id', async ({ request, params }) => {
    const simulated = maybeSimulateFailure(request);
    if (simulated) return simulated;
    await simulateCatalogLatency(request);
    const nft = db.getNFTById(String(params.id));
    return nft ? HttpResponse.json(nft) : failure('NFT não encontrado.', 404, 'NOT_FOUND');
  }),
];
