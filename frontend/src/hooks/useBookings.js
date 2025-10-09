import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, startDate, endDate, guests, notes }) => {
      const payload = {
        propertyId,
        startDate,
        endDate,
        guests,
        notes: notes?.trim() ? notes.trim() : undefined,
      };

      const { data } = await apiClient.post('/bookings', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travelerDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['travelerBookings'] });
    },
  });
}

export function useAcceptBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId) => {
      const { data } = await apiClient.post(`/bookings/${bookingId}/accept`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ownerBookings'] });
      queryClient.invalidateQueries({ queryKey: ['travelerDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['travelerBookings'] });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason }) => {
      const payload = reason && reason.trim().length > 0 ? { reason: reason.trim() } : {};
      const { data } = await apiClient.post(`/bookings/${bookingId}/cancel`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['ownerBookings'] });
      queryClient.invalidateQueries({ queryKey: ['travelerDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['travelerBookings'] });
    },
  });
}

export default useCreateBooking;
