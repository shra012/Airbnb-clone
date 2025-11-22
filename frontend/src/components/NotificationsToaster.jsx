import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dismissToast } from '../store/slices/notificationsSlice';

const VARIANT_STYLES = {
  success: 'bg-emerald-500/15 border-emerald-500/40',
  warning: 'bg-amber-500/15 border-amber-500/40',
  info: 'bg-sky-500/15 border-sky-500/40',
};

export default function NotificationsToaster() {
  const toasts = useSelector((state) => state.notifications.toasts);
  const dispatch = useDispatch();

  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        dispatch(dismissToast(toast.id));
      }, 5500)
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts, dispatch]);

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[60] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-80 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur ${VARIANT_STYLES[toast.variant] ?? 'bg-base-100/90 border-base-200'}`}
        >
          <div className="flex items-start justify-between gap-3 text-sm text-airbnb-charcoal">
            <div>
              <p className="font-semibold">{toast.title}</p>
              {toast.message && <p className="mt-0.5 text-airbnb-charcoal/80">{toast.message}</p>}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => dispatch(dismissToast(toast.id))}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
