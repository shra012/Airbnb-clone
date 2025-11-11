import { useEffect } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import usePropertyNotifications from '../hooks/usePropertyNotifications';
import { useCurrentUser } from '../hooks/useAuth';

function formatRelative(value) {
  if (!value) return '';
  try {
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    const now = Date.now();
    const diff = now - new Date(value).getTime();
    const minutes = Math.round(diff / (1000 * 60));
    if (Math.abs(minutes) < 60) {
      return formatter.format(-minutes, 'minute');
    }
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) {
      return formatter.format(-hours, 'hour');
    }
    const days = Math.round(hours / 24);
    return formatter.format(-days, 'day');
  } catch {
    return value;
  }
}

export default function PropertyUpdatesPanel({ propertyId }) {
  const { data: user } = useCurrentUser();
  const realtime = useRealtime();
  const { notifications, loading, refresh } = usePropertyNotifications(propertyId, {
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!propertyId || !user) return undefined;
    realtime.subscribeToProperty(propertyId);
    return () => {
      realtime.unsubscribeFromProperty(propertyId);
    };
  }, [propertyId, realtime, user]);

  if (!user) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-base-200 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-airbnb-charcoal">Live listing updates</h3>
          <p className="text-sm text-airbnb-charcoal/70">Changes appear within a second.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={refresh}>
          Refresh
        </button>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-airbnb-charcoal/70">
          <span className="loading loading-spinner loading-xs" />
          Loading latest activity...
        </div>
      )}
      {!loading && !notifications.length && (
        <p className="text-sm text-airbnb-charcoal/70">No updates yet for this listing.</p>
      )}
      {!loading && notifications.length > 0 && (
        <ul className="flex flex-col gap-3">
          {notifications.slice(0, 6).map((event) => (
            <li
              key={event._id ?? `${event.eventType}-${event.emittedAt}`}
              className="rounded-2xl border border-base-200 bg-base-100 p-4"
            >
              <div className="flex items-center justify-between text-sm text-airbnb-charcoal/70">
                <span className="font-semibold text-airbnb-charcoal">{event.eventType}</span>
                <span>{formatRelative(event.createdAt ?? event.emittedAt)}</span>
              </div>
              <p className="mt-1 text-airbnb-charcoal">
                ${event.pricePerNight ?? '—'} · {event.city}, {event.state}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
