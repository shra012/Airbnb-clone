import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import FirebaseImage from '../../components/FirebaseImage';
import { useAcceptBooking, useCancelBooking } from '../../hooks/useBookings';

function SummaryCard({ title, value, iconPath, accent, onClick }) {
  const CardComponent = onClick ? 'button' : 'div';
  return (
    <CardComponent
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`stat-card w-full ${onClick ? 'cursor-pointer text-left transition hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-airbnb-primary/40' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl ${accent}`}>
          <FirebaseImage
            path={iconPath}
            alt={title}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-airbnb-charcoal/50">{title}</p>
          <p className="text-3xl font-semibold text-airbnb-charcoal">{value}</p>
        </div>
      </div>
    </CardComponent>
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

function RecentRequestsTable({ bookings, onReview }) {
  if (!bookings?.length) {
    return <div className="dashed-shell">No pending requests right now.</div>;
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
            <th className="text-right">Actions</th>
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
              <td className="text-right">
                <button
                  type="button"
                  onClick={() => onReview?.(booking)}
                  className="btn btn-outline btn-xs rounded-full border-airbnb-primary/60 text-airbnb-primary"
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PropertyMetrics({ metrics }) {
  const bookings = metrics?.bookings ?? { total: 0, last30Days: 0, last7Days: 0 };
  const guests = metrics?.guests ?? { total: 0, last30Days: 0, last7Days: 0 };

  return (
    <div className="grid gap-3 sm:grid-cols-2 mt-4">
      <div className="rounded-xl bg-airbnb-primary/5 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.15em] text-airbnb-primary/70">Bookings</p>
        <p className="text-2xl font-semibold text-airbnb-charcoal">{bookings.total}</p>
        <p className="text-xs text-airbnb-charcoal/60 mt-1">
          7d: {bookings.last7Days} • 30d: {bookings.last30Days}
        </p>
      </div>
      <div className="rounded-xl bg-airbnb-secondary/10 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.15em] text-airbnb-secondary/70">Guests</p>
        <p className="text-2xl font-semibold text-airbnb-charcoal">{guests.total}</p>
        <p className="text-xs text-airbnb-charcoal/60 mt-1">
          7d: {guests.last7Days} • 30d: {guests.last30Days}
        </p>
      </div>
    </div>
  );
}

function PropertyList({ properties, selectedPropertyId, onPropertySelect }) {
  if (!properties?.length) {
    return <div className="dashed-shell">You haven&apos;t posted any properties yet.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Properties Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {properties.map((property) => {
          const isSelected = property.id === selectedPropertyId;
          return (
            <div 
              key={property.id} 
              className={`card-surface transition hover:-translate-y-1 cursor-pointer ${
                isSelected ? 'ring-2 ring-airbnb-primary bg-airbnb-primary/5' : ''
              }`}
              onClick={() => {
                if (isSelected) {
                  onPropertySelect(null);
                } else {
                  onPropertySelect(property.id);
                }
              }}
            >
              <div className="relative space-y-3">
                {/* Selection Checkbox */}
                <div className="absolute top-2 right-2 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Handled by parent div onClick
                    className="checkbox checkbox-primary checkbox-sm bg-white/90"
                  />
                </div>

                {/* Property Image */}
                {property.photos && property.photos.length > 0 && (
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <img
                      src={property.photos.find(p => p.isCover)?.url || property.photos[0]?.url}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="px-2">
                  <h3 className="text-lg font-semibold text-airbnb-charcoal pr-8">
                    {property.title}
                  </h3>
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
                  <PropertyMetrics metrics={property.metrics} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useOwnerDashboard();
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const topProperties = useMemo(() => data?.topProperties ?? [], [data]);
  const totalProperties = data?.summary?.totalProperties ?? 0;
  const acceptBooking = useAcceptBooking();
  const cancelBooking = useCancelBooking();
  const [reviewBooking, setReviewBooking] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionError, setDecisionError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const isActionLoading = acceptBooking.isLoading || cancelBooking.isLoading;

  useEffect(() => {
    if (!selectedPropertyId) return;
    const stillVisible = topProperties.some((property) => property.id === selectedPropertyId);
    if (!stillVisible) {
      setSelectedPropertyId(null);
    }
  }, [topProperties, selectedPropertyId]);

  const openReviewModal = (booking) => {
    setReviewBooking(booking);
    setDecisionReason('');
    setDecisionError(null);
    setActionError(null);
    setActionMessage(null);
    acceptBooking.reset();
    cancelBooking.reset();
  };

  const closeReviewModal = (force = false) => {
    if (!force && isActionLoading) {
      return;
    }
    setReviewBooking(null);
    setDecisionReason('');
    setDecisionError(null);
    acceptBooking.reset();
    cancelBooking.reset();
  };

  const handleReasonChange = (event) => {
    setDecisionReason(event.target.value);
  };

  const handleApprove = () => {
    if (!reviewBooking) return;
    setDecisionError(null);
    acceptBooking.mutate(reviewBooking.id, {
      onSuccess: () => {
        setActionMessage('Booking approved and guest notified.');
        setActionError(null);
        refetch();
        closeReviewModal(true);
      },
      onError: (mutationError) => {
        const message = mutationError?.message ?? 'Unable to approve the request.';
        setDecisionError(message);
        setActionError(message);
      },
    });
  };

  const handleReject = () => {
    if (!reviewBooking) return;
    setDecisionError(null);
    cancelBooking.mutate(
      { bookingId: reviewBooking.id, reason: decisionReason },
      {
        onSuccess: () => {
          setActionMessage('Booking request declined.');
          setActionError(null);
          refetch();
          closeReviewModal(true);
        },
        onError: (mutationError) => {
          const message = mutationError?.message ?? 'Unable to decline the request.';
          setDecisionError(message);
          setActionError(message);
        },
      }
    );
  };

  useEffect(() => {
    if (!actionMessage && !actionError) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setActionMessage(null);
      setActionError(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [actionMessage, actionError]);

  const handleAddNew = () => {
    navigate('/owner/properties/new');
  };

  const handleUpdateSelected = () => {
    if (selectedPropertyId) {
      navigate(`/owner/properties/${selectedPropertyId}/edit`);
    }
  };

  const handleViewAll = () => {
    navigate('/owner/properties');
  };

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
      accent: 'bg-airbnb-primary/15 text-airbnb-primary',
      iconPath: '/dashboard/quick-pannel/properties.png',
      onClick: () => navigate('/owner/properties'),
    },
    {
      title: 'Total bookings',
      value: data.summary.totalBookings,
      iconPath: '/dashboard/quick-pannel/total-bookings.png',
      accent: 'bg-airbnb-secondary/15 text-airbnb-secondary',
      onClick: () => navigate('/owner/bookings'),
    },
    {
      title: 'Pending requests',
      value: data.summary.pendingRequests,
      iconPath: '/dashboard/quick-pannel/pending-requests.png',
      accent: 'bg-airbnb-primary/10 text-airbnb-primary',
      onClick: () => navigate('/owner/bookings'),
    },
    {
      title: 'Upcoming stays',
      value: data.summary.upcomingBookings,
      iconPath: '/dashboard/quick-pannel/upcoming-stays.png',
      accent: 'bg-airbnb-secondary/10 text-airbnb-secondary',
      onClick: () => navigate('/owner/bookings'),
    },
  ];

  return (
    <div className="space-y-10">
      {actionMessage ? (
        <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success flex items-center justify-between gap-3">
          <span>{actionMessage}</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs rounded-full text-success"
            onClick={() => setActionMessage(null)}
          >
            Close
          </button>
        </div>
      ) : null}
      {actionError ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error flex items-center justify-between gap-3">
          <span>{actionError}</span>
          <button
            type="button"
            className="btn btn-ghost btn-xs rounded-full text-error"
            onClick={() => setActionError(null)}
          >
            Close
          </button>
        </div>
      ) : null}
      <section className="section-shell space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-airbnb-charcoal">Welcome back, host</h2>
            <p className="text-sm text-airbnb-charcoal/60">
              Keep an eye on bookings and performance at a glance.
            </p>
          </div>
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
        <RecentRequestsTable bookings={data.recentRequests} onReview={openReviewModal} />
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
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-airbnb-charcoal">Your properties</h2>
            {totalProperties > 0 && (
              <span className="badge rounded-full border-none bg-airbnb-primary/10 text-xs tracking-[0.2em] text-airbnb-primary">
                Top {Math.min(topProperties.length, totalProperties)} of {totalProperties}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleViewAll}
              className="btn btn-outline btn-sm rounded-full border-airbnb-primary/30 px-4 text-airbnb-primary"
            >
              View All Properties
            </button>
            <button
              type="button"
              onClick={handleUpdateSelected}
              disabled={!selectedPropertyId}
              className={`btn btn-sm rounded-full border-none px-4 ${
                !selectedPropertyId
                  ? 'btn-disabled text-base-content/40'
                  : 'btn-outline btn-primary'
              }`}
            >
              Update Selected
            </button>
            <button
              type="button"
              onClick={handleAddNew}
              className="btn btn-primary btn-sm rounded-full border-none px-4 text-white"
            >
              Add New Property
            </button>
          </div>
        </div>
        <PropertyList 
          properties={topProperties} 
          selectedPropertyId={selectedPropertyId}
          onPropertySelect={setSelectedPropertyId}
        />
      </section>

      {reviewBooking ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => closeReviewModal()}
          />
          <div className="absolute inset-0 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-xl space-y-5 rounded-3xl bg-white p-6 shadow-xl">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-airbnb-charcoal">Manage booking request</h2>
                <p className="text-sm text-airbnb-charcoal/60">
                  Review the stay {reviewBooking.traveler?.name ? `requested by ${reviewBooking.traveler.name}` : 'request'} for <span className="font-semibold text-airbnb-charcoal">{reviewBooking.property.title}</span>.
                </p>
              </div>

              <div className="grid gap-3 rounded-2xl bg-base-200/60 px-4 py-3 text-sm text-airbnb-charcoal/70">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-semibold text-airbnb-charcoal/80">Check-in</span>
                  <span>{new Date(reviewBooking.startDate).toLocaleDateString()}</span>
                  <span className="font-semibold text-airbnb-charcoal/80">Check-out</span>
                  <span>{new Date(reviewBooking.endDate).toLocaleDateString()}</span>
                  <span className="font-semibold text-airbnb-charcoal/80">Guests</span>
                  <span>{reviewBooking.guests}</span>
                  <span className="font-semibold text-airbnb-charcoal/80">Traveler email</span>
                  <span>{reviewBooking.traveler?.email ?? '—'}</span>
                </div>
                {reviewBooking.notes ? (
                  <div>
                    <p className="font-semibold text-sm text-airbnb-charcoal/80">Traveler notes</p>
                    <p className="mt-1 rounded-2xl bg-white px-3 py-2 text-sm text-airbnb-charcoal/70">
                      {reviewBooking.notes}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                    Reason (optional when declining)
                  </span>
                </label>
                <textarea
                  name="decisionReason"
                  value={decisionReason}
                  onChange={handleReasonChange}
                  rows={3}
                  className="textarea textarea-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Share a short note for the traveler if you decline this request"
                  disabled={isActionLoading}
                />
              </div>

              {decisionError ? (
                <div className="rounded-xl bg-error/10 px-3 py-2 text-xs text-error">{decisionError}</div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReject}
                  className="btn btn-outline btn-error btn-sm rounded-full px-5"
                  disabled={isActionLoading}
                >
                  {cancelBooking.isLoading ? 'Declining…' : 'Decline request'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => closeReviewModal()}
                    className="btn btn-ghost btn-sm rounded-full px-5"
                    disabled={isActionLoading}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="btn btn-primary btn-sm rounded-full px-5 text-white"
                    disabled={isActionLoading}
                  >
                    {acceptBooking.isLoading ? 'Approving…' : 'Approve request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
