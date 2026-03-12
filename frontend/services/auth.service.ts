import api from './api';

export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'FACULTY' | 'STUDENT';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  failedLoginAttempts?: number;
  accountLockedUntil?: string;
  student?: {
    id: number;
    enrollmentNo: string;
    name: string;
    email: string;
    departmentId: number;
    divisionId: number;
    semesterId: number;
  };
  faculty?: {
    id: number;
    name: string;
    email: string;
    designation: string;
    qualification: string;
    departmentId: number;
  };
  admin?: {
    id: number;
    name: string;
    userId: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: 'ADMIN' | 'FACULTY' | 'STUDENT';
  name?: string;
  // Additional fields based on role
  enrollmentNo?: string;
  designation?: string;
  qualification?: string;
  departmentId?: number;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string) {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const response = await api.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  },

  async updateProfile(data: Partial<User>) {
    const response = await api.put('/auth/profile', data);
    return response.data;
  }
};

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  async getUserById(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async createUser(data: RegisterData): Promise<User> {
    const response = await api.post('/users', data);
    return response.data;
  },

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<User> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async getUsersByRole(role: string): Promise<User[]> {
    const response = await api.get(`/users/role/${role}`);
    return response.data;
  },

  async getUserStats() {
    const response = await api.get('/users/stats');
    return response.data;
  }
};
