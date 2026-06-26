import axios, { AxiosInstance, AxiosResponse } from 'axios';

/**
 * API service configuration and utilities
 * Handles all HTTP requests to the backend server
 */

// API base configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null): void => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
};

// Pass-through interceptors. Per-request success logging was noisy and is removed.
// Errors are propagated to callers, which now surface them through ErrorState/ErrorBanner.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => Promise.reject(error)
);

/**
 * Test API connectivity. Calls /test to verify server connection.
 */
export const testAPI = async (): Promise<AxiosResponse> => apiClient.get('/test');

/**
 * Generic API request methods
 */
export const api = {
  get: <T = any>(url: string, config?: any): Promise<AxiosResponse<T>> =>
    apiClient.get(url, config),
  
  post: <T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> =>
    apiClient.post(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> =>
    apiClient.put(url, data, config),
  
  patch: <T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> =>
    apiClient.patch(url, data, config),
  
  delete: <T = any>(url: string, config?: any): Promise<AxiosResponse<T>> =>
    apiClient.delete(url, config),
};

export default apiClient;
