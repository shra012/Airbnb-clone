import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import { useTravelerDashboard } from '../../hooks/useTravelerData';

const summaryMap = [
  { key: 'pendingRequests', label: 'Pending requests', accent: 'bg-airbnb-primary/10 text-airbnb-primary' },
  { key: 'upcomingTrips', label: 'Upcoming trips', accent: 'bg-airbnb-secondary/10 text-airbnb-secondary' },
  { key: 'pastTrips', label: 'Past trips', accent: 'bg-base-200 text-airbnb-charcoal' },
  { key: 'favorites', label: 'Saved stays', accent: 'bg-airbnb-cream text-airbnb-primary' },
];

function SummaryGrid({ summary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryMap.map(({ key, label, accent }) => (
        <div key={key} className="card-surface flex flex-col gap-3 p-6">
          <span className="text-xs uppercase tracking-[0.2em] text-airbnb-charcoal/60">{label}</span>
          <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-semibold ${accent}`}>
            {summary[key] ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}

function BookingList({ bookings }) {
  if (!bookings?.length) {
    return <div className="dashed-shell text-sm">No upcoming trips just yet.</div>;
  }
  return (
    <div className="grid gap-4">
      {bookings.map((booking) => (
        <div key={booking.id} className="card-surface flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-airbnb-charcoal">{booking.property.title}</p>
              <p className="text-xs text-airbnb-charcoal/60">
                {booking.property.city}, {booking.property.country}
              </p>
            </div>
            <span className="badge rounded-full border-none bg-airbnb-secondary/10 text-airbnb-secondary">
              {booking.status.toLowerCase()}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-airbnb-charcoal/70">
            <span>
              {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
            </span>
            <span>Guests: {booking.guests}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FavoriteGrid({ favorites }) {
  if (!favorites?.length) {
    return <div className="dashed-shell text-sm">Save properties you love to plan faster next time.</div>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {favorites.map((favorite) => (
        <div key={favorite.id} className="card-surface p-5">
          <h3 className="text-lg font-semibold text-airbnb-charcoal">{favorite.property.title}</h3>
          <p className="text-sm text-airbnb-charcoal/60">
            {favorite.property.city}, {favorite.property.country}
          </p>
          {favorite.property.coverPhoto && (
            <div className="mt-3 overflow-hidden rounded-2xl">
              <img
                src={favorite.property.coverPhoto.url}
                alt={favorite.property.title}
                className="h-40 w-full object-cover"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TravelerDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useTravelerDashboard();

  if (isLoading) {
    return <LoadingScreen message="Loading traveler dashboard" />;
  }

  if (isError) {
    return <ErrorState message={error.message} retry={refetch} />;
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-airbnb-charcoal">Welcome back, {data.profile.name}</h1>
            <p className="text-sm text-airbnb-charcoal/60">
              Track your upcoming getaways, keep tabs on requests, and pick up where you left off.
            </p>
          </div>
        </div>
        <SummaryGrid summary={data.summary} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-airbnb-charcoal">Upcoming trips</h2>
          <span className="badge rounded-full border-none bg-airbnb-secondary/10 text-airbnb-secondary">
            {data.upcomingBookings.length}
          </span>
        </div>
        <BookingList bookings={data.upcomingBookings} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-airbnb-charcoal">Saved favourites</h2>
          <span className="badge rounded-full border-none bg-airbnb-primary/10 text-airbnb-primary">
            {data.favoriteProperties.length}
          </span>
        </div>
        <FavoriteGrid favorites={data.favoriteProperties} />
      </section>
    </div>
  );
}
