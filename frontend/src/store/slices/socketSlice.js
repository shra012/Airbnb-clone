import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  status: 'idle',
  error: null,
  lastConnectedAt: null,
  subscriptions: [],
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    connectionStarted: (state) => {
      state.status = 'connecting';
      state.error = null;
    },
    connectionEstablished: (state) => {
      state.status = 'connected';
      state.lastConnectedAt = Date.now();
      state.error = null;
    },
    connectionError: (state, action) => {
      state.status = 'error';
      state.error = action.payload || 'Unable to connect';
    },
    connectionDisconnected: (state) => {
      state.status = 'disconnected';
    },
    propertySubscribed: (state, action) => {
      const id = action.payload;
      if (!state.subscriptions.includes(id)) {
        state.subscriptions.push(id);
      }
    },
    propertyUnsubscribed: (state, action) => {
      const id = action.payload;
      state.subscriptions = state.subscriptions.filter((value) => value !== id);
    },
    resetSocketState: () => initialState,
  },
});

export const {
  connectionStarted,
  connectionEstablished,
  connectionError,
  connectionDisconnected,
  propertySubscribed,
  propertyUnsubscribed,
  resetSocketState,
} = socketSlice.actions;

export default socketSlice.reducer;
