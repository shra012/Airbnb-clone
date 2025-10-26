import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export function useConciergeAgent() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/agent/concierge', payload);
      return data;
    },
  });
}

export function useChatAgent() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post('/agent/chat', payload);
      return data;
    },
  });
}
