import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import { useTravelerBookings } from '../../hooks/useTravelerData';

const bookingSections = [
  { key: 'pending', title: 'Awaiting confirmation', badgeClass: 'bg-airbnb-primary/10 text-airbnb-primary' },
  { key: 'accepted', title: 'Upcoming & confirmed', badgeClass: 'bg-airbnb-secondary/10 text-airbnb-secondary' },
  { key: 'cancelled', title: 'Cancelled plans', badgeClass: 'bg-base-200 text-airbnb-charcoal/70' },
];

function BookingGroup({ title, bookings, badgeClass }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-airbnb-charcoal">{title}</h2>
        <span className={`badge rounded-full border-none ${badgeClass}`}>{bookings.length}</span>
      </div>
      {bookings.length ? (
        <div className="table-shell">
          <table className="table w-full">
            <thead className="bg-base-200 text-xs uppercase tracking-[0.2em] text-airbnb-charcoal/60">
              <tr>
                <th>Stay</th>
                <th>Location</th>
                <th>Check-in / out</th>
                <th>Guests</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="font-medium text-airbnb-charcoal">{booking.property.title}</td>
                  <td className="text-sm text-airbnb-charcoal/70">
                    {booking.property.city}, {booking.property.country}
                  </td>
                  <td className="text-sm text-airbnb-charcoal/70">
                    {new Date(booking.startDate).toLocaleDateString()} →{' '}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </td>
                  <td className="text-sm text-airbnb-charcoal/70">{booking.guests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashed-shell text-sm">No bookings in this category.</div>
      )}
    </section>
  );
}

export default function TravelerBookingsPage() {
  const { data, isLoading, isError, error, refetch } = useTravelerBookings();

  if (isLoading) {
    return <LoadingScreen message="Loading your trips" />;
  }

  if (isError) {
    return <ErrorState message={error.message} retry={refetch} />;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-airbnb-charcoal">Your trips</h1>
        <p className="text-sm text-airbnb-charcoal/60">
          Every stay you&apos;ve planned, confirmed, or cancelled appears here.
        </p>
      </header>
      {bookingSections.map(({ key, title, badgeClass }) => (
        <BookingGroup
          key={key}
          title={title}
          badgeClass={badgeClass}
          bookings={data.bookings[key] ?? []}
        />
      ))}
    </div>
  );
}
