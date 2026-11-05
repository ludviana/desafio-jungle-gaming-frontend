import { useQuery } from '@tanstack/react-query';
import { useMarketplace } from '../../shared/useMarketplace';
import { NFTCard } from './components/NFTCard';

export function RelatedNFTs({ currentId }: { currentId: string }) {
  const marketplace = useMarketplace();
  const query = useQuery({
    queryKey: ['nfts', 'related'],
    queryFn: () => marketplace.catalog.list({ page: 1, limit: 5 }),
  });
  return (
    <section className="related-section">
      <h2>Mais desta coleção</h2>
      <div className="related-grid">
        {query.data?.data
          .filter((nft) => nft.id !== currentId)
          .slice(0, 5)
          .map((nft) => (
            <NFTCard key={nft.id} nft={nft} isFavorite={false} onFavorite={() => {}} />
          ))}
      </div>
    </section>
  );
}
