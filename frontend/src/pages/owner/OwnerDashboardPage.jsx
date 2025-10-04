import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';

function SummaryCard({ title, value, icon, accent }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${accent}`}>
          <span>{icon}</span>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-airbnb-charcoal/50">{title}</p>
          <p className="text-3xl font-semibold text-airbnb-charcoal">{value}</p>
        </div>
      </div>
    </div>
  );
}

function BookingList({ title, bookings }) {
  if (!bookings?.length) {
    return <div className="dashed-shell">No {title.toLowerCase()} yet.</div>;
  }

  return (
    <div className="table-shell">
      <table className="table w-full">
        <thead>
          <tr className="bg-base-200 text-xs uppercase text-base-content/70">
            <th>Property</th>
            <th>Traveler</th>
            <th>Dates</th>
            <th>Guests</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>
                <div>
                  <p className="font-medium">{booking.property.title}</p>
                  <p className="text-xs text-airbnb-charcoal/50">
                    {booking.property.city}, {booking.property.country}
                  </p>
                </div>
              </td>
              <td>
                <div>
                  <p className="font-medium">{booking.traveler?.name ?? '—'}</p>
                  <p className="text-xs text-airbnb-charcoal/50">{booking.traveler?.email ?? '—'}</p>
                </div>
              </td>
              <td>
                <p className="text-sm">
                  {new Date(booking.startDate).toLocaleDateString()} →{' '}
                  {new Date(booking.endDate).toLocaleDateString()}
                </p>
              </td>
              <td>{booking.guests}</td>
              <td>
                <span className="badge badge-lg rounded-full border-none bg-airbnb-primary/15 text-airbnb-primary">
                  {booking.status.toLowerCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PropertyList({ properties }) {
  if (!properties?.length) {
    return <div className="dashed-shell">You haven&apos;t posted any properties yet.</div>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {properties.map((property) => (
        <div key={property.id} className="card-surface transition hover:-translate-y-1">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-airbnb-charcoal">{property.title}</h3>
            <p className="text-sm text-airbnb-charcoal/60">
              {property.city}, {property.state} • Guests {property.maxGuests}
            </p>
            <p className="text-lg font-semibold text-airbnb-charcoal">
              ${Number(property.pricePerNight).toLocaleString()}{' '}
              <span className="text-sm text-airbnb-charcoal/60">/ night</span>
            </p>
            <p className="text-xs text-airbnb-charcoal/50">
              Updated {new Date(property.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OwnerDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useOwnerDashboard();

  if (isLoading) {
    return <LoadingScreen message="Loading dashboard" />;
  }

  if (isError) {
    return <ErrorState message={error.message} retry={refetch} />;
  }

  const summary = [
    {
      title: 'Total properties',
      value: data.summary.totalProperties,
      icon: '🏠',
      accent: 'bg-airbnb-primary/15 text-airbnb-primary',
    },
    {
      title: 'Total bookings',
      value: data.summary.totalBookings,
      icon: '📘',
      accent: 'bg-airbnb-secondary/15 text-airbnb-secondary',
    },
    {
      title: 'Pending requests',
      value: data.summary.pendingRequests,
      icon: '⏳',
      accent: 'bg-airbnb-primary/10 text-airbnb-primary',
    },
    {
      title: 'Upcoming stays',
      value: data.summary.upcomingBookings,
      icon: '🧳',
      accent: 'bg-airbnb-secondary/10 text-airbnb-secondary',
    },
  ];

  return (
    <div className="space-y-10">
      <section className="section-shell space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-airbnb-charcoal">Welcome back, host</h2>
            <p className="text-sm text-airbnb-charcoal/60">
              Keep an eye on bookings and performance at a glance.
            </p>
          </div>
          <button type="button" className="btn btn-primary rounded-full border-none px-6 text-white">
            Create new listing
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <SummaryCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="section-shell space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-airbnb-charcoal">Recent requests</h2>
          <span className="badge rounded-full border-none bg-airbnb-primary/10 text-xs tracking-[0.2em] text-airbnb-primary">
            Last 5
          </span>
        </div>
        <BookingList title="pending requests" bookings={data.recentRequests} />
      </section>

      <section className="section-shell space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-airbnb-charcoal">Recent bookings</h2>
          <span className="badge rounded-full border-none bg-airbnb-secondary/10 text-xs tracking-[0.2em] text-airbnb-secondary">
            Last 5
          </span>
        </div>
        <BookingList title="recent bookings" bookings={data.recentBookings} />
      </section>

      <section className="section-shell space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-airbnb-charcoal">Your properties</h2>
          <span className="badge rounded-full border-none bg-airbnb-primary/10 text-xs tracking-[0.2em] text-airbnb-primary">
            {data.properties.length} listed
          </span>
        </div>
        <PropertyList properties={data.properties} />
      </section>
    </div>
  );
}
