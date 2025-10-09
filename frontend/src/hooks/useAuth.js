import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export const CURRENT_USER_QUERY_KEY = ['currentUser'];

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data.data;
    },
    retry: false,
    staleTime: 300000,
  });
}

export function useAuthActions() {
  const queryClient = useQueryClient();

  const resetOwnerQueries = () => {
    queryClient.removeQueries({ queryKey: ['ownerDashboard'], exact: false });
    queryClient.removeQueries({ queryKey: ['ownerProperties'], exact: false });
    queryClient.removeQueries({ queryKey: ['property'], exact: false });
  };

  const login = async (payload) => {
    const { data } = await apiClient.post('/auth/login', payload);
    resetOwnerQueries();
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, data.data);
    return data.data;
  };

  const logout = async () => {
    await apiClient.post('/auth/logout');
    resetOwnerQueries();
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
  };

  const signupTraveler = async (payload) => {
    const { data } = await apiClient.post('/auth/traveler/signup', payload);
    return data.data;
  };

  const signupOwner = async (payload) => {
    const { data } = await apiClient.post('/auth/owner/signup', payload);
    return data.data;
  };

  return { login, logout, signupTraveler, signupOwner };
}
