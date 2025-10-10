import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import FirebaseImage from '../../components/FirebaseImage';
import { useTravelerDashboard } from '../../hooks/useTravelerData';

const summaryMap = [
  {
    key: 'pendingRequests',
    label: 'Pending requests',
    accent: 'bg-airbnb-primary/10 text-airbnb-primary',
    iconPath: '/dashboard/quick-pannel/pending-requests.png',
  },
  {
    key: 'upcomingTrips',
    label: 'Upcoming trips',
    accent: 'bg-airbnb-secondary/10 text-airbnb-secondary',
    iconPath: '/dashboard/quick-pannel/upcoming-stays.png',
  },
  {
    key: 'pastTrips',
    label: 'Past trips',
    accent: 'bg-base-200 text-airbnb-charcoal',
    iconPath: '/dashboard/quick-pannel/total-bookings.png',
  },
  {
    key: 'favorites',
    label: 'Saved stays',
    accent: 'bg-airbnb-cream text-airbnb-primary',
    iconPath: '/dashboard/quick-pannel/properties.png',
    navigateTo: '/traveler/favorites',
  },
];

function SummaryCard({ title, value, accent, iconPath, onClick }) {
  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`card-surface flex items-center gap-4 p-6 ${onClick ? 'cursor-pointer text-left transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-airbnb-primary/40' : ''}`}
    >
      <div className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl ${accent}`}>
        <FirebaseImage path={iconPath} alt={title} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-1">
        <span className="block text-xs uppercase tracking-[0.2em] text-airbnb-charcoal/60">{title}</span>
        <span className="block text-2xl font-semibold text-airbnb-charcoal">{value}</span>
      </div>
    </CardComponent>
  );
}

function SummaryGrid({ summary }) {
  const navigate = useNavigate();

  const cards = useMemo(
    () =>
      summaryMap.map(({ key, label, accent, iconPath, navigateTo }) => ({
        key,
        label,
        accent,
        iconPath,
        onClick: navigateTo
          ? () => {
              navigate(navigateTo);
            }
          : undefined,
      })),
    [navigate]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, label, accent, iconPath, onClick }) => (
        <SummaryCard key={key} title={label} value={summary[key] ?? 0} accent={accent} iconPath={iconPath} onClick={onClick} />
      ))}
    </div>
  );
}

function BookingList({ bookings, emptyMessage = 'No trips yet.' }) {
  if (!bookings?.length) {
    return <div className="dashed-shell text-sm">{emptyMessage}</div>;
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
        <BookingList bookings={data.upcomingBookings} emptyMessage="No upcoming trips just yet." />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-airbnb-charcoal">Past trips</h2>
          <span className="badge rounded-full border-none bg-base-200 text-airbnb-charcoal/70">
            {data.pastBookings?.length ?? 0}
          </span>
        </div>
        <BookingList
          bookings={data.pastBookings}
          emptyMessage="Your past stays will appear here once you complete a trip."
        />
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
