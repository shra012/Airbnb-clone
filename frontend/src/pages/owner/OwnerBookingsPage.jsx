import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';

function BookingGroup({ title, bookings, tone }) {
  return (
    <section className="section-shell space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-airbnb-charcoal">{title}</h3>
        <span className={`badge rounded-full border-none ${tone.badge}`}>{bookings.length} stays</span>
      </div>
      {bookings.length ? (
        <div className="table-shell">
          <table className="table w-full">
            <thead className={`text-xs uppercase tracking-[0.2em] ${tone.header}`}>
              <tr>
                <th>Property</th>
                <th>Traveler</th>
                <th>Check-in / out</th>
                <th>Guests</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="font-medium text-airbnb-charcoal">{booking.property.title}</td>
                  <td>
                    <div>
                      <p className="font-medium text-airbnb-charcoal">{booking.traveler?.name ?? '—'}</p>
                      <p className="text-xs text-airbnb-charcoal/60">{booking.traveler?.email ?? '—'}</p>
                    </div>
                  </td>
                  <td className="text-sm text-airbnb-charcoal">
                    {new Date(booking.startDate).toLocaleDateString()} →{' '}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </td>
                  <td className="text-airbnb-charcoal">{booking.guests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashed-shell">No bookings in this category.</div>
      )}
    </section>
  );
}

export default function OwnerBookingsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ownerBookings'],
    queryFn: async () => {
      const { data: response } = await apiClient.get('/owner/bookings');
      return response.data;
    },
  });

  if (isLoading) {
    return <LoadingScreen message="Loading bookings" fullScreen />;
  }

  if (isError) {
    return <ErrorState message={error.message} retry={refetch} />;
  }

  const tones = {
    pending: {
      header: 'bg-airbnb-primary/10 text-airbnb-primary',
      badge: 'bg-airbnb-primary/10 text-airbnb-primary',
    },
    accepted: {
      header: 'bg-airbnb-secondary/10 text-airbnb-secondary',
      badge: 'bg-airbnb-secondary/10 text-airbnb-secondary',
    },
    cancelled: {
      header: 'bg-error/10 text-error',
      badge: 'bg-error/10 text-error',
    },
  };

  return (
    <div className="space-y-8">
      <section className="section-shell space-y-2">
        <h2 className="text-3xl font-semibold text-airbnb-charcoal">Bookings overview</h2>
        <p className="text-sm text-airbnb-charcoal/60">
          Track every stay at a glance—from new requests to trusted repeat guests.
        </p>
      </section>
      <BookingGroup title="Pending confirmation" bookings={data.bookings.pending} tone={tones.pending} />
      <BookingGroup title="Upcoming & accepted" bookings={data.bookings.accepted} tone={tones.accepted} />
      <BookingGroup title="Cancelled" bookings={data.bookings.cancelled} tone={tones.cancelled} />
    </div>
  );
}
