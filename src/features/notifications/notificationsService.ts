// src/features/notifications/notificationsService.ts

import api from '../../services/api';
import { CreateNotificationData } from './notificationsTypes';

class NotificationsService {
  // Get user notifications
  async getUserNotifications(userId: number) {
    try {
      const response = await api.get(`/notifications/${userId}`);
      console.log('Raw notifications response:', response.data);
      
      // Handle the response structure: { statusCode, message, data }
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data || [];
    } catch (error) {
      console.error('Get user notifications error:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(userId: number) {
    try {
      const response = await api.get(`/notifications/${userId}/unread-count`);
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(id: number) {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  // Toggle notifications
  async toggleNotifications(userId: number) {
    try {
      const response = await api.patch(`/notifications/${userId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Toggle notifications error:', error);
      throw error;
    }
  }

  // Toggle app notifications
  async toggleAppNotifications(userId: number) {
    try {
      const response = await api.patch(`/notifications/${userId}/toggle/app`);
      return response.data;
    } catch (error) {
      console.error('Toggle app notifications error:', error);
      throw error;
    }
  }

  // Get notification status
  async getNotificationStatus(userId: number) {
    try {
      const response = await api.get(`/notifications/${userId}/status`);
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Get notification status error:', error);
      throw error;
    }
  }
}

export default new NotificationsService();