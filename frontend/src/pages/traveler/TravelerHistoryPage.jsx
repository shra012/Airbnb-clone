import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import TravelerPropertyCard from '../../components/TravelerPropertyCard';
import { useTravelerHistory, useTravelerFavorites, useToggleFavorite } from '../../hooks/useTravelerData';

function HistoryCard({ booking, onToggleFavorite, isFavorite }) {
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="card-surface overflow-hidden">
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <TravelerPropertyCard
          property={booking.property}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
        <div className="flex flex-col justify-between border-t md:border-l md:border-t-0 border-base-200 p-4 text-sm text-airbnb-charcoal/70">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-airbnb-charcoal/80">Stay</span>
              <span>
                {new Date(booking.startDate).toLocaleDateString()} →{' '}
                {new Date(booking.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-airbnb-charcoal/80">Guests</span>
              <span>{booking.guests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-airbnb-charcoal/80">Nights</span>
              <span>{nights}</span>
            </div>
          </div>
          <div className="text-xs text-airbnb-charcoal/50">
            Completed stay booked on {new Date(booking.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TravelerHistoryPage() {
  const { data, isLoading, isError, error, refetch } = useTravelerHistory();
  const { data: favorites } = useTravelerFavorites();
  const toggleFavorite = useToggleFavorite();
  const favoriteIds = new Set((favorites || []).map((fav) => fav.property.id));

  if (isLoading) {
    return <LoadingScreen message="Loading past stays" />;
  }

  if (isError) {
    return <ErrorState message={error.message} retry={refetch} />;
  }

  if (!data?.length) {
    return (
      <div className="dashed-shell text-sm">
        No past trips yet. Once you complete a stay it will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-airbnb-charcoal">Past trips</h1>
        <p className="text-sm text-airbnb-charcoal/60">
          Review the places you&apos;ve stayed and keep your favourites handy.
        </p>
      </header>

      <div className="space-y-5">
        {data.map((booking) => (
          <HistoryCard
            key={booking.id}
            booking={booking}
            isFavorite={favoriteIds.has(booking.property.id)}
            onToggleFavorite={() =>
              toggleFavorite.mutate({
                propertyId: booking.property.id,
                isFavorite: favoriteIds.has(booking.property.id),
                property: booking.property,
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
