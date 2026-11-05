import { Link } from '@tanstack/react-router';
import { Heart } from 'lucide-react';
import type { NFT } from '../../../../domain/entities';

export function NFTCard({
  nft,
  isFavorite,
  onFavorite,
}: {
  nft: NFT;
  isFavorite: boolean;
  onFavorite: () => void;
}) {
  return (
    <article className="nft-card">
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="nft-image">
        <img src={nft.image} alt={nft.name} loading="lazy" />
      </Link>
      <button
        className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
        aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
        onClick={onFavorite}
      >
        <Heart fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="nft-title">
        {nft.name}
      </Link>
      <strong className="eth-price">{nft.priceEth} ETH</strong>
    </article>
  );
}
