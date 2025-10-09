import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ErrorState from '../../components/ErrorState';
import LoadingScreen from '../../components/LoadingScreen';
import apiClient from '../../lib/apiClient';
import { useAcceptBooking, useCancelBooking } from '../../hooks/useBookings';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    badge: 'bg-airbnb-primary/10 text-airbnb-primary',
  },
  ACCEPTED: {
    label: 'Accepted',
    badge: 'bg-airbnb-secondary/10 text-airbnb-secondary',
  },
  CANCELLED: {
    label: 'Cancelled',
    badge: 'bg-error/10 text-error',
  },
};

function StatusPill({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`badge border-none ${config.badge}`}>{config.label}</span>
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

  const acceptBooking = useAcceptBooking();
  const cancelBooking = useCancelBooking();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionError, setDecisionError] = useState(null);
  const [detailsBooking, setDetailsBooking] = useState(null);

  const flattened = useMemo(() => {
    if (!data?.bookings) return [];
    return ['pending', 'accepted', 'cancelled'].flatMap((key) =>
      data.bookings[key].map((booking) => ({ ...booking, status: key.toUpperCase() }))
    );
  }, [data]);

  const filtered = useMemo(() => {
    return flattened.filter((booking) => {
      if (statusFilter !== 'ALL' && booking.status !== statusFilter) {
        return false;
      }
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        booking.property.title.toLowerCase().includes(term) ||
        booking.traveler?.name?.toLowerCase().includes(term) ||
        booking.traveler?.email?.toLowerCase().includes(term)
      );
    });
  }, [flattened, statusFilter, searchTerm]);

  const isLoadingAction = acceptBooking.isLoading || cancelBooking.isLoading;

  const openManageModal = (booking) => {
    setSelectedBooking(booking);
    setDecisionReason('');
    setDecisionError(null);
  };

  const closeManageModal = () => {
    if (isLoadingAction) return;
    setSelectedBooking(null);
    setDecisionReason('');
    setDecisionError(null);
    acceptBooking.reset();
    cancelBooking.reset();
  };

  const handleApprove = () => {
    if (!selectedBooking) return;
    setDecisionError(null);
    acceptBooking.mutate(selectedBooking.id, {
      onSuccess: () => {
        closeManageModal();
        refetch();
      },
      onError: (mutationError) => {
        setDecisionError(mutationError?.message ?? 'Unable to approve booking.');
      },
    });
  };

  const handleDecline = () => {
    if (!selectedBooking) return;
    setDecisionError(null);
    cancelBooking.mutate(
      { bookingId: selectedBooking.id, reason: decisionReason },
      {
        onSuccess: () => {
          closeManageModal();
          refetch();
        },
        onError: (mutationError) => {
          setDecisionError(mutationError?.message ?? 'Unable to decline booking.');
        },
      }
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Loading bookings" fullScreen />;
  }

  if (isError) {
    return <ErrorState message={error.message} retry={refetch} />;
  }

  return (
    <div className="space-y-8">
      <section className="section-shell space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-airbnb-charcoal">Bookings overview</h2>
            <p className="text-sm text-airbnb-charcoal/60">
              Track every stay at a glance—from new requests to trusted repeat guests.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {['ALL', 'PENDING', 'ACCEPTED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`btn btn-sm rounded-full border-none px-4 ${
                  statusFilter === status ? 'btn-primary text-white' : 'btn-ghost text-airbnb-charcoal/70'
                }`}
              >
                {status === 'ALL' ? 'All' : STATUS_CONFIG[status].label}
                {status === 'ALL'
                  ? ` (${flattened.length})`
                  : ` (${data.counts[status.toLowerCase()]})`}
              </button>
            ))}
          </div>
        </div>
        <div className="form-control">
          <label className="input input-bordered flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-airbnb-charcoal/50">Search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Property or traveler"
              className="flex-1"
            />
          </label>
        </div>
      </section>

      <section className="section-shell space-y-4">
        {filtered.length === 0 ? (
          <div className="dashed-shell text-sm">
            No bookings match the selected filters yet.
          </div>
        ) : (
          <div className="table-shell">
            <table className="table w-full">
              <thead className="bg-base-200 text-xs uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                <tr>
                  <th>Property</th>
                  <th>Traveler</th>
                  <th>Check-in / out</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
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
                    <td><StatusPill status={booking.status} /></td>
                    <td className="text-right">
                      {booking.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openManageModal(booking)}
                            className="btn btn-outline btn-xs rounded-full border-airbnb-primary/60 text-airbnb-primary"
                          >
                            Review
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDetailsBooking(booking)}
                          className="btn btn-ghost btn-xs rounded-full px-4"
                        >
                          View details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedBooking ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeManageModal} />
          <div className="absolute inset-0 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-xl space-y-5 rounded-3xl bg-white p-6 shadow-xl">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-airbnb-charcoal">Manage booking request</h2>
                <p className="text-sm text-airbnb-charcoal/60">
                  Review the stay {selectedBooking.traveler?.name ? `requested by ${selectedBooking.traveler.name}` : 'request'} for <span className="font-semibold text-airbnb-charcoal">{selectedBooking.property.title}</span>.
                </p>
              </div>
              <div className="grid gap-3 rounded-2xl bg-base-200/60 px-4 py-3 text-sm text-airbnb-charcoal/70">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-semibold text-airbnb-charcoal/80">Check-in</span>
                  <span>{new Date(selectedBooking.startDate).toLocaleDateString()}</span>
                  <span className="font-semibold text-airbnb-charcoal/80">Check-out</span>
                  <span>{new Date(selectedBooking.endDate).toLocaleDateString()}</span>
                  <span className="font-semibold text-airbnb-charcoal/80">Guests</span>
                  <span>{selectedBooking.guests}</span>
                  <span className="font-semibold text-airbnb-charcoal/80">Traveler email</span>
                  <span>{selectedBooking.traveler?.email ?? '—'}</span>
                </div>
                {selectedBooking.notes ? (
                  <div>
                    <p className="font-semibold text-sm text-airbnb-charcoal/80">Traveler notes</p>
                    <p className="mt-1 rounded-2xl bg-white px-3 py-2 text-sm text-airbnb-charcoal/70">
                      {selectedBooking.notes}
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
                  onChange={(event) => setDecisionReason(event.target.value)}
                  rows={3}
                  className="textarea textarea-bordered w-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Share a short note for the traveler if you decline this request"
                  disabled={isLoadingAction}
                />
              </div>

              {decisionError ? (
                <div className="rounded-xl bg-error/10 px-3 py-2 text-xs text-error">{decisionError}</div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="btn btn-outline btn-error btn-sm rounded-full px-5"
                  disabled={isLoadingAction}
                >
                  {cancelBooking.isLoading ? 'Declining…' : 'Decline request'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeManageModal}
                    className="btn btn-ghost btn-sm rounded-full px-5"
                    disabled={isLoadingAction}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="btn btn-primary btn-sm rounded-full px-5 text-white"
                    disabled={isLoadingAction}
                  >
                    {acceptBooking.isLoading ? 'Approving…' : 'Approve request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {detailsBooking ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetailsBooking(null)} />
          <div className="absolute inset-0 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl space-y-5 rounded-3xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-airbnb-charcoal">Booking details</h2>
                  <p className="text-sm text-airbnb-charcoal/60">
                    {detailsBooking.property.title} · {detailsBooking.property.city}, {detailsBooking.property.country}
                  </p>
                </div>
                <StatusPill status={detailsBooking.status} />
              </div>
              <div className="grid gap-4 md:grid-cols-2 text-sm text-airbnb-charcoal/80">
                <div>
                  <p className="font-semibold">Traveler</p>
                  <p>{detailsBooking.traveler?.name ?? '—'}</p>
                  <p className="text-xs text-airbnb-charcoal/60">{detailsBooking.traveler?.email ?? '—'}</p>
                </div>
                <div>
                  <p className="font-semibold">Stay dates</p>
                  <p>
                    {new Date(detailsBooking.startDate).toLocaleDateString()} →{' '}
                    {new Date(detailsBooking.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Guests</p>
                  <p>{detailsBooking.guests}</p>
                </div>
                <div>
                  <p className="font-semibold">Value</p>
                  <p>
                    {detailsBooking.totalPrice
                      ? `$${Number(detailsBooking.totalPrice).toLocaleString()}`
                      : 'Pending pricing'}
                  </p>
                </div>
              </div>
              {detailsBooking.notes ? (
                <div>
                  <p className="font-semibold text-sm text-airbnb-charcoal/80">Traveler notes</p>
                  <p className="mt-1 rounded-2xl bg-base-200/60 px-3 py-2 text-sm text-airbnb-charcoal/70">
                    {detailsBooking.notes}
                  </p>
                </div>
              ) : null}
              {detailsBooking.cancellationReason ? (
                <div>
                  <p className="font-semibold text-sm text-airbnb-charcoal/80">Cancellation reason</p>
                  <p className="mt-1 rounded-2xl bg-error/10 px-3 py-2 text-sm text-error">
                    {detailsBooking.cancellationReason}
                  </p>
                </div>
              ) : null}
              <div className="text-xs text-airbnb-charcoal/50">
                Requested on {new Date(detailsBooking.createdAt).toLocaleString()}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsBooking(null)}
                  className="btn btn-ghost btn-sm rounded-full px-5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
