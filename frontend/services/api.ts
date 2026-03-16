import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || getCookieValue('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle major service failures (5xx) or network errors
    if (!error.response || error.response.status >= 500) {
      console.error('Critical Service Failure:', error);
      // We can use window.dispatchEvent or a global state management tool
      // to show the ErrorPage. For now, we'll log it specifically for the UI to catch.
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('app-critical-error', { 
          detail: { 
            message: error.response?.data?.message || 'The server is currently unable to handle the request.',
            status: error.response?.status || 'Network Error'
          } 
        });
        window.dispatchEvent(event);
      }
    }
    
    // Important: do NOT auto-clear auth state on a single 401 here.
    return Promise.reject(error);
  }
);

export default api;
