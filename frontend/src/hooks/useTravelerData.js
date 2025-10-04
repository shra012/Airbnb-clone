import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export function useTravelerDashboard() {
  return useQuery({
    queryKey: ['travelerDashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/traveler/dashboard');
      return data.data;
    },
  });
}

export function useTravelerBookings() {
  return useQuery({
    queryKey: ['travelerBookings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/traveler/bookings');
      return data.data;
    },
  });
}

export function useTravelerFavorites() {
  return useQuery({
    queryKey: ['travelerFavorites'],
    queryFn: async () => {
      const { data } = await apiClient.get('/favorites');
      return data.data;
    },
  });
}
