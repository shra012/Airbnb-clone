import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import { useTravelerFavorites } from '../../hooks/useTravelerData';

export default function TravelerFavoritesPage() {
  const { data, isLoading, isError, error, refetch } = useTravelerFavorites();

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
          <div key={favorite.id} className="card-surface overflow-hidden">
            {favorite.property.coverPhoto && (
              <img
                src={favorite.property.coverPhoto.url}
                alt={favorite.property.title}
                className="h-48 w-full object-cover"
              />
            )}
            <div className="space-y-2 p-5">
              <h3 className="text-lg font-semibold text-airbnb-charcoal">{favorite.property.title}</h3>
              <p className="text-sm text-airbnb-charcoal/60">
                {favorite.property.city}, {favorite.property.country}
              </p>
              <p className="text-sm text-airbnb-charcoal/70">
                ${Number(favorite.property.pricePerNight).toLocaleString()} / night · Sleeps {favorite.property.maxGuests}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
