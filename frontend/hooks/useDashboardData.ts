import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface UseDashboardDataOptions {
  endpoint: string;
  dependencies?: any[];
  immediate?: boolean;
}

interface UseDashboardDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardData = <T = any>({
  endpoint,
  dependencies = [],
  immediate = true
}: UseDashboardDataOptions): UseDashboardDataReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchData = useCallback(async () => {
    if (!endpoint) {
      return;
    }

    if (!token) {
      setError('Authentication required. Please login again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(endpoint);
      setData(response.data);
    } catch (err: any) {
      console.error(`Failed to fetch data from ${endpoint}:`, err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You don\'t have permission to view this data.');
      } else if (err.response?.status === 404) {
        setError('Data not found. The requested resource may not exist.');
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Request timeout. Please check your connection and try again.');
      } else if (!navigator.onLine) {
        setError('No internet connection. Please check your network and try again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, token]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearError
  };
};

// Specific hooks for different dashboard data types
export const useStudentStats = (studentId?: number) => {
  const endpoint = studentId ? `/student/${studentId}/stats` : '';
  return useDashboardData({ endpoint, dependencies: [studentId], immediate: !!studentId });
};

export const useFacultyStats = () => {
  // No dedicated faculty stats endpoint exists currently; keep a lightweight call.
  return useDashboardData({ endpoint: '/faculty/profile' });
};

export const useAdminStats = () => {
  return useDashboardData({ endpoint: '/admin/dashboard/stats' });
};

export const useAssignments = (facultyId?: number) => {
  const endpoint = facultyId ? '/faculty/assignments' : '/assignments/student';
  return useDashboardData({ endpoint, dependencies: [facultyId] });
};

export const useNotices = (role?: string) => {
  const normalizedRole = role?.toLowerCase();
  const endpoint = normalizedRole === 'faculty'
    ? '/notices/faculty'
    : normalizedRole === 'student'
      ? '/notices/student'
      : '/notices/student';
  return useDashboardData({ endpoint, dependencies: [role] });
};

export const useAttendance = (studentId?: number) => {
  const endpoint = studentId ? '/attendance/student' : '';
  return useDashboardData({ endpoint, dependencies: [studentId], immediate: !!studentId });
};
