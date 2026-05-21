// src/features/notifications/notificationsActions.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import notificationsService from './notificationsService';
import { CreateNotificationData } from './notificationsTypes';
import { RootState } from '../../app/store';

// Get user notifications
export const getUserNotifications = createAsyncThunk(
  'notifications/getUserNotifications',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await notificationsService.getUserNotifications(userId);
      return { userId, notifications: response || [] };
    } catch (error: any) {
      console.error('Get notifications action error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: number, { rejectWithValue }) => {
    try {
      await notificationsService.markNotificationAsRead(id);
      return { id };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

// Get unread count
export const getUnreadCount = createAsyncThunk(
  'notifications/getUnreadCount',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await notificationsService.getUnreadCount(userId);
      let count = 0;
      if (typeof response === 'number') {
        count = response;
      } else if (response?.unreadCount) {
        count = response.unreadCount;
      } else if (response?.count) {
        count = response.count;
      }
      return { userId, count };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get unread count');
    }
  }
);

// Toggle notifications
export const toggleNotifications = createAsyncThunk(
  'notifications/toggle',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await notificationsService.toggleNotifications(userId);
      return { userId, message: response?.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle notifications');
    }
  }
);

// Toggle app notifications
export const toggleAppNotifications = createAsyncThunk(
  'notifications/toggleApp',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await notificationsService.toggleAppNotifications(userId);
      return { userId, message: response?.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle app notifications');
    }
  }
);

// Get notification status
export const getNotificationStatus = createAsyncThunk(
  'notifications/getStatus',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await notificationsService.getNotificationStatus(userId);
      return { 
        userId, 
        notificationsEnabled: response?.notificationsEnabled ?? true,
        appNotificationsEnabled: response?.appNotificationsEnabled ?? true
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get notification status');
    }
  }
);

// Create notification
export const createNotification = createAsyncThunk(
  'notifications/create',
  async (data: CreateNotificationData, { rejectWithValue }) => {
    try {
      const response = await notificationsService.createNotification(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create notification');
    }
  }
);