import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data.data;
    },
    staleTime: 300000,
  });
}

export function useUpdateTravelerProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData) => {
      const response = await apiClient.put('/traveler/profile', profileData);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Update the current user query with new profile data
      queryClient.setQueryData(['currentUser'], (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            travelerProfile: data,
          };
        }
        return oldData;
      });
      queryClient.invalidateQueries(['profile']);
    },
  });
}

export function useUpdateOwnerProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData) => {
      const response = await apiClient.put('/owner/profile', profileData);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Update the current user query with new profile data
      queryClient.setQueryData(['currentUser'], (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            ownerProfile: data,
          };
        }
        return oldData;
      });
      queryClient.invalidateQueries(['profile']);
    },
  });
}