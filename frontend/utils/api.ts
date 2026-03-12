import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

export const attendanceAPI = {
  getStudentAttendance: (studentId: number, params?: any) => 
    api.get(`/attendance/student/${studentId}`, { params }),
  getStudentStats: (studentId: number) => 
    api.get(`/attendance/student/${studentId}/stats`),
  getFacultyAttendance: (params?: any) => 
    api.get('/attendance/faculty', { params }),
  createAttendance: (data: any) => 
    api.post('/attendance', data),
  getDivisionStudents: (divisionId: number) => 
    api.get(`/attendance/division/${divisionId}/students`),
  getFacultySubjects: () => 
    api.get('/attendance/faculty/subjects'),
};

export const assignmentAPI = {
  getAssignments: (params?: any) => 
    api.get('/assignments', { params }),
  getAssignmentById: (id: number) => 
    api.get(`/assignments/${id}`),
  createAssignment: (data: any) => 
    api.post('/assignments', data),
  submitAssignment: (assignmentId: number, data: any) => 
    api.post(`/assignments/${assignmentId}/submit`, data),
  getSubmissions: (assignmentId: number) => 
    api.get(`/assignments/${assignmentId}/submissions`),
};

export const noticeAPI = {
  getNotices: (params?: any) => 
    api.get('/notices', { params }),
  getNoticeById: (id: number) => 
    api.get(`/notices/${id}`),
  createNotice: (data: any) => 
    api.post('/notices', data),
  updateNotice: (id: number, data: any) => 
    api.put(`/notices/${id}`, data),
  deleteNotice: (id: number) => 
    api.delete(`/notices/${id}`),
};

export const userAPI = {
  getStudents: (params?: any) => 
    api.get('/users/students', { params }),
  getFaculty: (params?: any) => 
    api.get('/users/faculty', { params }),
  getDepartments: () => 
    api.get('/users/departments'),
  getSubjects: (params?: any) => 
    api.get('/users/subjects'),
  getDivisions: (params?: any) => 
    api.get('/users/divisions'),
  createUser: (userData: any) => 
    api.post('/users/register', userData),
  updateUser: (id: number, data: any) => 
    api.put(`/users/${id}`, data),
  deleteUser: (id: number) => 
    api.delete(`/users/${id}`),
};

export default api;
