import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

function normalizeFilters(filters = {}) {
  const normalized = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (key === 'guests') {
      const numericValue = Number(value);
      if (Number.isNaN(numericValue) || numericValue <= 0) {
        return;
      }
      normalized[key] = numericValue;
      return;
    }

    if (key === 'minPrice' || key === 'maxPrice') {
      const numericValue = Number(value);
      if (Number.isNaN(numericValue) || numericValue < 0) {
        return;
      }
      normalized[key] = numericValue;
      return;
    }

    if (key === 'startDate' || key === 'endDate') {
      const dateValue = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(dateValue.getTime())) {
        return;
      }
      normalized[key] = dateValue.toISOString();
      return;
    }

    normalized[key] = value;
  });

  return normalized;
}

export function usePropertySearch(filters, options = {}) {
  const normalizedFilters = normalizeFilters(filters);

  return useQuery({
    queryKey: ['propertySearch', normalizedFilters],
    queryFn: async () => {
      const { data } = await apiClient.get('/properties', {
        params: normalizedFilters,
      });
      return data.data;
    },
    ...options,
  });
}

export default usePropertySearch;
