import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export function useTravelerDashboard(options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['travelerDashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/traveler/dashboard');
      return data.data;
    },
    enabled,
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

export function useTravelerHistory() {
  return useQuery({
    queryKey: ['travelerHistory'],
    queryFn: async () => {
      const { data } = await apiClient.get('/traveler/history');
      return data.data;
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, isFavorite, property }) => {
      if (isFavorite) {
        await apiClient.delete(`/favorites/${propertyId}`);
        return { propertyId, isFavorite: false };
      }

      const { data } = await apiClient.post(`/favorites/${propertyId}`);
      return { propertyId, isFavorite: true, favorite: data.data, property };
    },
    onMutate: async ({ propertyId, isFavorite, property }) => {
      await queryClient.cancelQueries({ queryKey: ['travelerFavorites'] });
      await queryClient.cancelQueries({ queryKey: ['travelerDashboard'] });

      const previousFavorites = queryClient.getQueryData(['travelerFavorites']);
      const previousDashboard = queryClient.getQueryData(['travelerDashboard']);

      if (Array.isArray(previousFavorites)) {
        const updatedFavorites = isFavorite
          ? previousFavorites.filter((fav) => fav.property.id !== propertyId)
          : [
              ...previousFavorites,
              {
                id: propertyId,
                createdAt: new Date().toISOString(),
                property,
              },
            ];
        queryClient.setQueryData(['travelerFavorites'], updatedFavorites);
      }

      if (previousDashboard?.favoriteProperties) {
        const updatedDashFavorites = isFavorite
          ? previousDashboard.favoriteProperties.filter((fav) => fav.id !== propertyId)
          : [
              ...previousDashboard.favoriteProperties,
              {
                id: propertyId,
                title: property.title,
                city: property.city,
                country: property.country,
                pricePerNight: property.pricePerNight,
                maxGuests: property.maxGuests,
                coverPhoto: property.coverPhoto,
              },
            ];
        queryClient.setQueryData(['travelerDashboard'], {
          ...previousDashboard,
          favoriteProperties: updatedDashFavorites,
          summary: {
            ...previousDashboard.summary,
            favorites: Math.max(
              0,
              (previousDashboard.summary?.favorites ?? 0) + (isFavorite ? -1 : 1)
            ),
          },
        });
      }

      return { previousFavorites, previousDashboard };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(['travelerFavorites'], context.previousFavorites);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(['travelerDashboard'], context.previousDashboard);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['travelerFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['travelerDashboard'] });
    },
  });
}
