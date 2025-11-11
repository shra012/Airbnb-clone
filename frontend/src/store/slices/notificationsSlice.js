import { createAsyncThunk, createSlice, nanoid } from '@reduxjs/toolkit';
import apiClient from '../../lib/apiClient';

const MAX_BOOKING_NOTIFICATIONS = 30;
const MAX_PROPERTY_NOTIFICATIONS = 30;
const MAX_TOASTS = 4;

export const fetchBookingNotifications = createAsyncThunk(
  'notifications/fetchBooking',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/notifications');
      return data?.data ?? [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await apiClient.post(`/notifications/${notificationId}/read`);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPropertyNotifications = createAsyncThunk(
  'notifications/fetchProperty',
  async ({ propertyId, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(`/properties/${propertyId}/notifications`, {
        params: { limit },
      });
      return { propertyId, items: data?.data ?? [] };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  booking: [],
  bookingLoading: false,
  bookingError: null,
  property: {},
  propertyLoading: {},
  propertyHydrated: {},
  unreadCount: 0,
  toasts: [],
};

const upsertBookingNotification = (state, notification) => {
  if (!notification) {
    return;
  }
  const exists = state.booking.some((item) => item._id === notification._id);
  if (exists) {
    return;
  }
  state.booking = [notification, ...state.booking].slice(0, MAX_BOOKING_NOTIFICATIONS);
  if (!notification.read) {
    state.unreadCount += 1;
  }
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    resetNotifications: () => initialState,
    incomingBookingNotification: (state, action) => {
      const notification =
        action.payload?.notification ??
        {
          _id: `temp-${Date.now()}`,
          type: action.payload?.type ?? 'BOOKING_EVENT',
          bookingId: action.payload?.booking?.bookingId,
          payload: action.payload?.booking ?? {},
          read: false,
          createdAt: new Date().toISOString(),
        };
      upsertBookingNotification(state, notification);
    },
    incomingPropertyNotification: (state, action) => {
      const { propertyId } = action.payload ?? {};
      if (!propertyId) return;
      const existing = state.property[propertyId] ?? [];
      const alreadyExists = existing.some(
        (item) => item._id && item._id === action.payload?._id && action.payload?._id
      );
      const nextList = alreadyExists
        ? existing
        : [action.payload, ...existing].slice(0, MAX_PROPERTY_NOTIFICATIONS);
      state.property[propertyId] = nextList;
    },
    enqueueToast: (state, action) => {
      const toast = {
        id: nanoid(),
        createdAt: Date.now(),
        ...action.payload,
      };
      state.toasts = [...state.toasts, toast].slice(-MAX_TOASTS);
    },
    dismissToast: (state, action) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookingNotifications.pending, (state) => {
        state.bookingLoading = true;
        state.bookingError = null;
      })
      .addCase(fetchBookingNotifications.fulfilled, (state, action) => {
        state.bookingLoading = false;
        state.booking = action.payload;
        state.unreadCount = action.payload.filter((item) => !item.read).length;
      })
      .addCase(fetchBookingNotifications.rejected, (state, action) => {
        state.bookingLoading = false;
        state.bookingError = action.payload || 'Failed to load notifications';
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const target = state.booking.find((item) => item._id === id);
        if (target && !target.read) {
          target.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(fetchPropertyNotifications.pending, (state, action) => {
        const { propertyId } = action.meta.arg;
        state.propertyLoading[propertyId] = true;
      })
      .addCase(fetchPropertyNotifications.fulfilled, (state, action) => {
        const { propertyId, items } = action.payload;
        state.property[propertyId] = items;
        state.propertyLoading[propertyId] = false;
        state.propertyHydrated[propertyId] = true;
      })
      .addCase(fetchPropertyNotifications.rejected, (state, action) => {
        const { propertyId } = action.meta.arg;
        state.propertyLoading[propertyId] = false;
        state.propertyHydrated[propertyId] = false;
        state.propertyError = action.payload || 'Failed to load property updates';
      });
  },
});

export const {
  resetNotifications,
  incomingBookingNotification,
  incomingPropertyNotification,
  enqueueToast,
  dismissToast,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
