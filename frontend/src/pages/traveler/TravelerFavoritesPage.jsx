import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import TravelerPropertyCard from '../../components/TravelerPropertyCard';
import { useTravelerFavorites, useToggleFavorite } from '../../hooks/useTravelerData';

export default function TravelerFavoritesPage() {
  const { data, isLoading, isError, error, refetch } = useTravelerFavorites();
  const toggleFavorite = useToggleFavorite();

  if (isLoading) {
    return <LoadingScreen message="Loading favourites" />;
  }

  if (isError) {
    return <ErrorState message={error.message} retry={refetch} />;
  }

  if (!data?.length) {
    return (
      <div className="dashed-shell text-sm">
        You haven&apos;t saved any stays yet. Tap the heart on properties you love to remember them later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-airbnb-charcoal">Saved stays</h1>
        <p className="text-sm text-airbnb-charcoal/60">
          Quick access to the homes and experiences you&apos;re keeping an eye on.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {data.map((favorite) => (
          <TravelerPropertyCard
            key={favorite.id}
            property={favorite.property}
            isFavorite
            linkState={{ from: 'favorites' }}
            onToggleFavorite={() =>
              toggleFavorite.mutate({
                propertyId: favorite.property.id,
                isFavorite: true,
                property: favorite.property,
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
