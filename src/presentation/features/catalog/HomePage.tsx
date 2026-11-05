import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useMarketplace } from '../../shared/useMarketplace';
import type { NFTFilters } from '../../../domain/entities';
import { Button } from '../../shared/components/ui/button';
import {
  CATEGORIES,
  getToken,
  INITIAL_FILTERS,
  messageFromError,
  NETWORKS,
  type CatalogSearch,
} from '../../shared/site';
import greenImage from '../../../assets/nfts/green.png';
import gorillaImage from '../../../assets/nfts/gorilla.png';
import { NFTCard } from './components/NFTCard';
import './presentation-features-catalog-styles/catalog.css';
import './presentation-features-catalog-styles/catalog-responsive.css';

export function HomePage() {
  const marketplace = useMarketplace();
  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });
  const searchSnapshot = JSON.stringify([search.search, search.minPrice, search.maxPrice]);
  const [draft, setDraft] = useState(() => ({
    snapshot: searchSnapshot,
    searchValue: search.search ?? '',
    min: search.minPrice ?? '',
    max: search.maxPrice ?? '',
  }));
  const currentDraft =
    draft.snapshot === searchSnapshot
      ? draft
      : {
          snapshot: searchSnapshot,
          searchValue: search.search ?? '',
          min: search.minPrice ?? '',
          max: search.maxPrice ?? '',
        };
  const searchValue = currentDraft.searchValue;
  const min = currentDraft.min;
  const max = currentDraft.max;
  const setSearchValue = (searchValue: string) => setDraft({ ...currentDraft, searchValue });
  const setMin = (min: string) => setDraft({ ...currentDraft, min });
  const setMax = (max: string) => setDraft({ ...currentDraft, max });
  const [filterDrawer, setFilterDrawer] = useState(false);
  const queryClient = useQueryClient();
  const filters = useMemo<NFTFilters>(
    () => ({
      ...search,
      search: search.search || undefined,
      category: search.category || undefined,
      network: search.network || undefined,
      minPrice: search.minPrice || undefined,
      maxPrice: search.maxPrice || undefined,
    }),
    [search],
  );
  const hasActiveFilters = Boolean(
    search.search || search.category || search.network || search.minPrice || search.maxPrice,
  );
  const nftsQuery = useQuery({
    queryKey: ['nfts', filters],
    queryFn: () => marketplace.catalog.list(filters),
    placeholderData: (previous) => previous,
  });
  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: marketplace.favorites.list,
    enabled: Boolean(getToken()),
    retry: false,
  });
  const favoriteMutation = useMutation({
    mutationFn: marketplace.favorites.toggle,
    onMutate: async (nftId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const previous = queryClient.getQueryData<string[]>(['favorites']);
      queryClient.setQueryData<string[]>(['favorites'], (current = []) =>
        current.includes(nftId) ? current.filter((id) => id !== nftId) : [...current, nftId],
      );
      return { previous };
    },
    onError: (_error, _id, context) => queryClient.setQueryData(['favorites'], context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const updateSearch = (patch: Partial<CatalogSearch>) => {
    void navigate({
      search: (previous) => {
        const current = { ...INITIAL_FILTERS, ...previous };
        return {
          search: patch.search ?? current.search,
          category: patch.category ?? current.category,
          network: patch.network ?? current.network,
          minPrice: patch.minPrice ?? current.minPrice,
          maxPrice: patch.maxPrice ?? current.maxPrice,
          sortBy: patch.sortBy ?? current.sortBy,
          page: patch.page ?? 1,
          limit: current.limit,
        };
      },
    });
  };
  const submitPrice = (event: FormEvent) => {
    event.preventDefault();
    updateSearch({ minPrice: min, maxPrice: max });
  };
  const toggleNetwork = (network: string) =>
    updateSearch({ network: search.network === network ? '' : network });

  return (
    <>
      <form
        className="mobile-search page-width"
        onSubmit={(event) => {
          event.preventDefault();
          updateSearch({ search: searchValue });
        }}
      >
        <Search />
        <input
          placeholder="Explorar coleções"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          aria-label="Buscar NFTs"
        />
        <button
          className="icon-button"
          type="button"
          onClick={() => setFilterDrawer(true)}
          aria-label="Abrir filtros"
        >
          <SlidersHorizontal />
        </button>
      </form>
      <section className="hero page-width">
        <div className="hero-copy">
          <p className="eyebrow">Bem-vindo à Kurio</p>
          <h1>
            SEJA DONO DO FUTURO
            <br />
            DA ARTE DIGITAL
          </h1>
          <p>
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
            rara, apoie artistas e tenha uma parte da cultura da internet.
          </p>
          <Button asChild size="sm" className="button">
            <Link to="/" search={{ ...INITIAL_FILTERS }}>
              Explorar
            </Link>
          </Button>
          <span className="hero-dots" aria-label="Slide 1 de 3">
            ● ● ●
          </span>
        </div>
        <div className="hero-art">
          <img src={greenImage} alt="Emerald Ape em destaque" />
        </div>
      </section>
      <section className="catalog-layout page-width" id="catalogo">
        <aside className={`filters ${filterDrawer ? 'filters-open' : ''}`}>
          <div className="filter-heading">
            <h2>Coleções</h2>
            <button
              className="icon-button filter-close"
              onClick={() => setFilterDrawer(false)}
              aria-label="Fechar filtros"
            >
              <X />
            </button>
          </div>
          <div className="category-list">
            {CATEGORIES.map((category, index) => (
              <button
                key={category}
                className={search.category === category ? 'selected' : ''}
                onClick={() =>
                  updateSearch({ category: search.category === category ? '' : category })
                }
              >
                {category}
                <span>({[33, 12, 65, 39, 23, 17, 19, 13, 18][index]})</span>
              </button>
            ))}
          </div>
          <form className="price-filter" onSubmit={submitPrice}>
            <h3>Faixa de preço</h3>
            <div className="price-inputs">
              <label>
                Mínimo
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  aria-label="Preço mínimo em ETH"
                />
              </label>
              <label>
                Máximo
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  aria-label="Preço máximo em ETH"
                />
              </label>
            </div>
            <p>
              Preço: {min || '0,02'} – {max || '12,30'} ETH
            </p>
            <button className="button button-small">Aplicar</button>
          </form>
          <div className="network-filter">
            <h3>Rede</h3>
            {NETWORKS.map((network, index) => (
              <button
                key={network}
                className={search.network === network ? 'selected' : ''}
                onClick={() => toggleNetwork(network)}
              >
                {network[0].toUpperCase() + network.slice(1)}
                <span>({[119, 78, 86][index]})</span>
              </button>
            ))}
          </div>
          <Link to="/nft/$nftId" params={{ nftId: 'sage-nomad-009' }} className="featured-nft">
            <strong>NFT EM DESTAQUE</strong>
            <span>OFERTA LIMITADA</span>
            <img src={nftsQuery.data?.data[1]?.image} alt="NFT Sage Nomad em oferta" />
          </Link>
        </aside>
        <div className="catalog-main">
          <div className="catalog-toolbar">
            <button
              className="button button-small mobile-filter-button"
              onClick={() => setFilterDrawer(true)}
            >
              <SlidersHorizontal /> Filtros
            </button>
            <div className="catalog-tabs">
              <button
                className={!search.sortBy || search.sortBy === 'recent' ? 'active' : ''}
                onClick={() => updateSearch({ sortBy: 'recent' })}
              >
                Todos os NFTs
              </button>
              <button
                className={search.sortBy === 'trending' ? 'active' : ''}
                onClick={() => updateSearch({ sortBy: 'trending' })}
              >
                Novos lançamentos
              </button>
              <button onClick={() => updateSearch({ sortBy: 'trending' })}>Em alta</button>
            </div>
            <label className="sort-select">
              Ordenar por:
              <select
                value={search.sortBy ?? 'recent'}
                onChange={(event) =>
                  updateSearch({ sortBy: event.target.value as NFTFilters['sortBy'] })
                }
              >
                <option value="recent">Listados recentemente</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="trending">Mais populares</option>
              </select>
            </label>
          </div>
          {nftsQuery.isPending ? (
            <div className="nft-grid">
              {Array.from({ length: 6 }, (_, index) => (
                <div className="nft-skeleton" key={index}>
                  <div />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : nftsQuery.isError ? (
            <div className="state-card">
              <h2>Não foi possível carregar o catálogo</h2>
              <p>{messageFromError(nftsQuery.error)}</p>
              <button className="button" onClick={() => void nftsQuery.refetch()}>
                Tentar novamente
              </button>
            </div>
          ) : nftsQuery.data?.data.length ? (
            <div className="nft-grid">
              {nftsQuery.data.data.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  isFavorite={favoritesQuery.data?.includes(nft.id) ?? false}
                  onFavorite={() =>
                    getToken() ? favoriteMutation.mutate(nft.id) : window.location.assign('/login')
                  }
                />
              ))}
            </div>
          ) : (
            <div className="state-card">
              <h2>
                {hasActiveFilters ? 'Nenhum NFT encontrado' : 'Nenhum NFT disponível no momento'}
              </h2>
              <p>
                {hasActiveFilters
                  ? 'Tente remover alguns filtros ou buscar outro termo.'
                  : 'O catálogo está vazio agora. Tente novamente mais tarde.'}
              </p>
              {hasActiveFilters && (
                <button
                  className="button button-outline"
                  onClick={() => void navigate({ search: { ...INITIAL_FILTERS } })}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
          {nftsQuery.data && nftsQuery.data.totalPages > 1 && (
            <div className="pagination" aria-label="Paginação">
              {Array.from({ length: nftsQuery.data.totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={search.page === page ? 'active' : ''}
                    aria-current={search.page === page ? 'page' : undefined}
                    onClick={() => updateSearch({ page })}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                aria-label="Próxima página"
                disabled={(search.page ?? 1) >= nftsQuery.data.totalPages}
                onClick={() => updateSearch({ page: (search.page ?? 1) + 1 })}
              >
                <ArrowRight />
              </button>
            </div>
          )}
        </div>
      </section>
      <section className="promo-grid page-width">
        <article>
          <img src={nftsQuery.data?.data[0]?.image ?? gorillaImage} alt="" />
          <div>
            <h3>Lançamentos gênesis de edição limitada</h3>
            <p>Colecione edições escassas diretamente dos criadores antes da revelação pública.</p>
            <Link className="button button-small" to="/" search={{ ...INITIAL_FILTERS }}>
              Explorar <ArrowRight />
            </Link>
          </div>
        </article>
        <article>
          <img src={nftsQuery.data?.data[2]?.image ?? gorillaImage} alt="" />
          <div>
            <h3>Arte digital selecionada e muito mais</h3>
            <p>
              Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.
            </p>
            <Link className="button button-small" to="/" search={{ ...INITIAL_FILTERS }}>
              Explorar <ArrowRight />
            </Link>
          </div>
        </article>
      </section>
      <section className="journal page-width">
        <h2>Diário da Cunhagem</h2>
        <p>
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
        <div className="journal-grid">
          {(nftsQuery.data?.data ?? []).slice(0, 4).map((nft, index) => (
            <article key={nft.id}>
              <img src={nft.image} alt="" />
              <small>15 de setembro　|　Leitura de {index + 2} min</small>
              <h3>
                {
                  [
                    'Como funciona a propriedade de NFTs',
                    '10 artistas digitais para acompanhar',
                    'Raridade, atributos e procedência',
                    'Como proteger sua carteira',
                  ][index]
                }
              </h3>
              <p>Entenda o universo digital e acompanhe as novidades da comunidade.</p>
              <a href="#rodape">Ler mais →</a>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
