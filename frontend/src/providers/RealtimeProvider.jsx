import { useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import RealtimeContext from '../context/RealtimeContext';
import { useCurrentUser } from '../hooks/useAuth';
import {
  connectionStarted,
  connectionEstablished,
  connectionError,
  connectionDisconnected,
  propertySubscribed,
  propertyUnsubscribed,
} from '../store/slices/socketSlice';
import {
  fetchBookingNotifications,
  incomingBookingNotification,
  incomingPropertyNotification,
  enqueueToast,
  resetNotifications,
} from '../store/slices/notificationsSlice';

function getBackendSocketUrl() {
  if (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL !== 'auto') {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (window?.__AIRBNB_BACKEND_URL__) {
    return window.__AIRBNB_BACKEND_URL__;
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }
  return window.location.origin;
}

export default function RealtimeProvider({ children }) {
  const { data: user } = useCurrentUser();
  const socketRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      dispatch(connectionDisconnected());
      dispatch(resetNotifications());
      return undefined;
    }

    dispatch(fetchBookingNotifications());
    dispatch(connectionStarted());

    const socket = io(getBackendSocketUrl(), {
      withCredentials: true,
      transports: ['websocket'],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      dispatch(connectionEstablished());
    });

    socket.on('connect_error', (error) => {
      dispatch(connectionError(error?.message ?? 'Connection error'));
    });

    socket.on('disconnect', () => {
      dispatch(connectionDisconnected());
    });

    socket.on('booking:request', (payload) => {
      dispatch(
        enqueueToast({
          title: 'New booking request',
          message: `${payload?.booking?.propertyTitle ?? 'Listing'} · ${payload?.booking?.startDate} → ${payload?.booking?.endDate}`,
          variant: 'info',
        })
      );
      dispatch(incomingBookingNotification(payload));
    });

    socket.on('booking:status', (payload) => {
      dispatch(
        enqueueToast({
          title:
            payload?.booking?.status === 'ACCEPTED'
              ? 'Booking approved'
              : 'Booking update',
          message: `${payload?.booking?.propertyTitle ?? 'Listing'} · ${payload?.booking?.status}`,
          variant: payload?.booking?.status === 'ACCEPTED' ? 'success' : 'warning',
        })
      );
      dispatch(incomingBookingNotification(payload));
    });

    socket.on('property:update', (payload) => {
      dispatch(
        enqueueToast({
          title: 'Listing updated',
          message: `${payload?.title ?? 'Property'} · $${payload?.pricePerNight ?? ''}`,
          variant: 'info',
        })
      );
      dispatch(incomingPropertyNotification(payload));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, dispatch]);

  const contextValue = useMemo(
    () => ({
      subscribeToProperty(propertyId) {
        const id = Number(propertyId);
        if (!socketRef.current || !Number.isFinite(id)) return;
        socketRef.current.emit('subscribe:property', { propertyId: id });
        dispatch(propertySubscribed(id));
      },
      unsubscribeFromProperty(propertyId) {
        const id = Number(propertyId);
        if (!socketRef.current || !Number.isFinite(id)) return;
        socketRef.current.emit('unsubscribe:property', { propertyId: id });
        dispatch(propertyUnsubscribed(id));
      },
    }),
    [dispatch]
  );

  return <RealtimeContext.Provider value={contextValue}>{children}</RealtimeContext.Provider>;
}
