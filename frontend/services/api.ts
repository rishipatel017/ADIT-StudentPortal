import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30s to handle slow DB/Bcrypt operations
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
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle major service failures (network errors / connection refused)
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
      console.error(isTimeout ? 'API Timeout:' : 'Critical Network Failure:', error);
      
      if (typeof window !== 'undefined') {
        // Only trigger critical error page for actual connection failures, not timeouts
        if (!isTimeout) {
          const event = new CustomEvent('app-critical-error', { 
            detail: { 
              message: 'Unable to connect to the server. Please check if the backend is running.',
              status: 'Network Error'
            } 
          });
          window.dispatchEvent(event);
        }
      }
    } else if (error.response.status >= 500) {
      console.error('Server Error (500+):', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api;
