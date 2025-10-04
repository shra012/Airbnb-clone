import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      return Promise.resolve({ data: { data: null } });
    }
    if (error.response && error.response.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
