import api from './api';

export enum NotificationType {
  GENERAL = 'GENERAL',
  NOTICE = 'NOTICE',
  MARKS = 'MARKS',
  CHAT = 'CHAT',
  ASSIGNMENT = 'ASSIGNMENT',
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  departmentId?: number;
  semesterId?: number;
  divisionId?: number;
}

export const notificationService = {
  async getMyNotifications(params?: { departmentId?: number; semesterId?: number; divisionId?: number }) {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  async markAsRead(id: number) {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },

  async deleteAll() {
    const response = await api.post('/notifications/clear-all');
    return response.data;
  },
};
