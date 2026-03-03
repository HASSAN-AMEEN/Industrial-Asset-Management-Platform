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
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Test API connectivity
 * Calls the /test endpoint to verify server connection
 */
export const testAPI = async (): Promise<AxiosResponse> => {
  try {
    const response = await apiClient.get('/test');
    return response;
  } catch (error) {
    console.error('Test API failed:', error);
    throw error;
  }
};

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
