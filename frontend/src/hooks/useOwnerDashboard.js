import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export function useOwnerDashboard() {
  return useQuery({
    queryKey: ['ownerDashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/owner/dashboard');
      return data.data;
    },
  });
}
