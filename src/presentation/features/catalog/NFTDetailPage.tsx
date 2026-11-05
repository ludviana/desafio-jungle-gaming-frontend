import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowRight, Heart, Minus } from 'lucide-react';
import { useMarketplace } from '../../shared/useMarketplace';
import { getToken, INITIAL_FILTERS, messageFromError } from '../../shared/site';
import { LoadingState } from '../../shared/feedback';
import { RelatedNFTs } from './RelatedNFTs';
import './presentation-features-catalog-styles/detail.css';
import './presentation-features-catalog-styles/detail-responsive.css';

export function NFTDetailPage() {
  const marketplace = useMarketplace();
  const { nftId } = useParams({ from: '/nft/$nftId' });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const nftQuery = useQuery({
    queryKey: ['nft', nftId],
    queryFn: () => marketplace.catalog.detail(nftId),
  });
  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: marketplace.favorites.list,
    enabled: Boolean(getToken()),
    retry: false,
  });
  const favoriteMutation = useMutation({
    mutationFn: marketplace.favorites.toggle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });
  const addMutation = useMutation({
    mutationFn: () => marketplace.cart.add(nftId, quantity),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      void navigate({ to: '/cart' });
    },
  });
  const nft = nftQuery.data;
  if (nftQuery.isPending) return <LoadingState />;
  if (nftQuery.isError || !nft)
    return (
      <div className="page-width state-card">
        <h1>NFT não encontrado</h1>
        <p>{messageFromError(nftQuery.error)}</p>
        <Link className="button" to="/" search={{ ...INITIAL_FILTERS }}>
          Voltar ao mercado
        </Link>
      </div>
    );
  const favorite = favoritesQuery.data?.includes(nft.id) ?? false;
  return (
    <div className="detail-page page-width">
      <p className="breadcrumb">
        <Link to="/" search={{ ...INITIAL_FILTERS }}>
          Início
        </Link>{' '}
        / Mercado / {nft.name}
      </p>
      <section className="detail-grid">
        <div className="gallery-thumbs">
          {nft.gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              className={imageIndex === index ? 'active' : ''}
              onClick={() => setImageIndex(index)}
            >
              <img src={image} alt={`${nft.name} imagem ${index + 1}`} />
            </button>
          ))}
        </div>
        <div className="detail-main-image">
          <img src={nft.gallery[imageIndex] ?? nft.image} alt={nft.name} />
        </div>
        <div className="detail-info">
          <h1>{nft.name}</h1>
          <div className="detail-price-row">
            <strong className="eth-price">{nft.priceEth} ETH</strong>
            <span className="rating">
              ★★★★★ <span>{nft.reviewCount} avaliações de colecionadores</span>
            </span>
          </div>
          <h3>Sobre este NFT:</h3>
          <p>{nft.description}</p>
          <h3>Edição:</h3>
          <div className="edition-pills">
            <span>1/1</span>
            <span>1/10</span>
            <span className="selected">1/50</span>
            <span>ABERTA</span>
          </div>
          <div className="detail-actions">
            <div className="quantity-control">
              <button
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus />
              </button>
              <span>{quantity}</span>
              <button
                aria-label="Aumentar quantidade"
                disabled={quantity >= nft.availableQuantity}
                onClick={() => setQuantity((value) => Math.min(nft.availableQuantity, value + 1))}
              >
                <ArrowRight />
              </button>
            </div>
            <button
              className="button"
              disabled={!nft.availableQuantity || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? 'Adicionando…' : 'Comprar'}
            </button>
            <button
              className={`button button-outline ${favorite ? 'is-favorite' : ''}`}
              onClick={() =>
                getToken() ? favoriteMutation.mutate(nft.id) : void navigate({ to: '/login' })
              }
            >
              <Heart /> Favoritar
            </button>
          </div>
          {addMutation.isError && (
            <p className="form-error" role="alert">
              {messageFromError(addMutation.error)}
            </p>
          )}
          <dl className="nft-meta">
            <dt>ID do token</dt>
            <dd>{nft.tokenId}</dd>
            <dt>Coleção</dt>
            <dd>{nft.collection}</dd>
            <dt>Atributos</dt>
            <dd>{nft.attributes.map((item) => item.value).join(', ')}</dd>
          </dl>
          <p>
            <strong>Compartilhar este NFT:</strong>　in　✉　♥
          </p>
        </div>
      </section>
      <section className="detail-description">
        <div className="catalog-tabs">
          <button className="active">Detalhes do NFT</button>
          <button>Avaliações de colecionadores ({nft.reviewCount})</button>
        </div>
        <p>
          {nft.description} Cada atributo fica armazenado nos metadados do token e verificado na
          rede. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.
        </p>
        <p>
          <strong>Rede:</strong>
          <br />
          Cunhado na {nft.network} com procedência imutável e metadados armazenados no IPFS.
        </p>
        <p>
          <strong>Direitos autorais:</strong>
          <br />
          Os direitos do criador são preservados na simulação do marketplace.
        </p>
      </section>
      <RelatedNFTs currentId={nft.id} />
    </div>
  );
}
