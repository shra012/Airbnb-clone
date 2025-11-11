import { useMemo, useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markNotificationRead } from '../store/slices/notificationsSlice';

function formatDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.booking);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const bookingLoading = useSelector((state) => state.notifications.bookingLoading);

  const latest = useMemo(() => notifications.slice(0, 8), [notifications]);

  useEffect(() => {
    const handler = (event) => {
      if (!containerRef.current || containerRef.current.contains(event.target)) {
        return;
      }
      setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleMarkRead = (notificationId) => {
    dispatch(markNotificationRead(notificationId));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="btn btn-ghost btn-circle relative"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-5 w-5 text-airbnb-charcoal"
          fill="currentColor"
        >
          <path d="M12 2a7 7 0 0 0-7 7v3.382l-.894 1.789A1 1 0 0 0 5 15h14a1 1 0 0 0 .894-1.47L19 12.382V9a7 7 0 0 0-7-7Zm0 20a3 3 0 0 0 2.995-2.824L15 19h-6a3 3 0 0 0 2.824 2.995L12 22Z" />
        </svg>
        {unreadCount > 0 && (
          <span className="badge badge-error badge-sm absolute -right-1 -top-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-3 w-80 rounded-2xl border border-base-200 bg-base-100 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-airbnb-charcoal">Live notifications</p>
            {bookingLoading && <span className="loading loading-xs loading-spinner" />}
          </div>
          {latest.length === 0 ? (
            <p className="text-sm text-airbnb-charcoal/70">No notifications yet.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
              {latest.map((item) => (
                <li
                  key={item._id}
                  className={`rounded-2xl border p-3 text-sm ${
                    item.read ? 'border-base-200' : 'border-airbnb-primary/40 bg-airbnb-primary/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-airbnb-charcoal">
                      {item.payload?.propertyTitle ?? 'Booking update'}
                    </p>
                    <span className="text-xs text-airbnb-charcoal/60">{formatDate(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-airbnb-charcoal/80">
                    Status:&nbsp;
                    <span className="font-semibold">{item.payload?.status ?? item.type}</span>
                  </p>
                  {!item.read && (
                    <button
                      type="button"
                      className="btn btn-link btn-xs mt-2 px-0 text-airbnb-primary"
                      onClick={() => handleMarkRead(item._id)}
                    >
                      Mark as read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
