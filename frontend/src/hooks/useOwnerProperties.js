import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export function useOwnerProperties(page = 1, pageSize = 6) {
  return useQuery({
    queryKey: ['ownerProperties', page, pageSize],
    keepPreviousData: true,
    queryFn: async () => {
      const { data } = await apiClient.get('/owner/properties', {
        params: { page, pageSize },
      });
      return data.data;
    },
  });
}
