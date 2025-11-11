import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';
import { fetchPropertyNotifications } from '../store/slices/notificationsSlice';

export function usePropertyNotifications(propertyId, options = {}) {
  const { enabled = true } = options;
  const dispatch = useDispatch();
  const notifications = useSelector(
    (state) => state.notifications.property[propertyId] ?? []
  );
  const loading = useSelector(
    (state) => state.notifications.propertyLoading[propertyId] ?? false
  );
  const hydrated = useSelector(
    (state) => state.notifications.propertyHydrated[propertyId] ?? false
  );

  useEffect(() => {
    if (!enabled || !propertyId || hydrated) {
      return;
    }
    dispatch(fetchPropertyNotifications({ propertyId }));
  }, [propertyId, hydrated, enabled, dispatch]);

  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
      ),
    [notifications]
  );

  const refresh = () => {
    if (!propertyId || !enabled) return;
    dispatch(fetchPropertyNotifications({ propertyId }));
  };

  return { notifications: sorted, loading: enabled ? loading : false, refresh };
}

export default usePropertyNotifications;
