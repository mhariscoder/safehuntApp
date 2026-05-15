import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/config';
import { store } from '../app/store';
import { logoutLocal } from '../features/auth/authSlice';
import { addNotification } from '../features/ui/uiSlice';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token;

    console.log('token from store:', token);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - logout user
      store.dispatch(logoutLocal());
      store.dispatch(addNotification({
        type: 'error',
        message: 'Session expired. Please login again.',
      }));
    }
    
    return Promise.reject(error);
  }
);

export default api;