import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer from './slices/notificationsSlice';
import socketReducer from './slices/socketSlice';

export const store = configureStore({
  reducer: {
    notifications: notificationsReducer,
    socket: socketReducer,
  },
});

export const AppDispatch = store.dispatch;
