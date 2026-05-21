// src/features/notifications/notificationsSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationsState, Notification } from './notificationsTypes';
import {
  getUserNotifications,
  markNotificationAsRead,
  getUnreadCount,
  toggleNotifications,
  toggleAppNotifications,
  getNotificationStatus,
} from './notificationsActions';

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  notificationSettings: {
    notificationsEnabled: true,
    appNotificationsEnabled: true,
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
    markAsReadLocally: (state, action: PayloadAction<number>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(state.unreadCount - 1, 0);
      }
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    // Get User Notifications
    builder.addCase(getUserNotifications.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getUserNotifications.fulfilled, (state, action) => {
      state.isLoading = false;
      const notificationsData = action.payload?.notifications || [];
      state.notifications = notificationsData;
      state.unreadCount = notificationsData.filter((n: any) => !n.isRead).length;
      state.error = null;
    });
    builder.addCase(getUserNotifications.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Mark Notification as Read
    builder.addCase(markNotificationAsRead.fulfilled, (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload?.id);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(state.unreadCount - 1, 0);
      }
    });

    // Get Unread Count
    builder.addCase(getUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload?.count || 0;
    });

    // Toggle Notifications - Fixed with optional chaining
    builder.addCase(toggleNotifications.fulfilled, (state, action) => {
      const message = action.payload?.message;
      if (message) {
        state.notificationSettings.notificationsEnabled = message.includes('enabled');
      }
    });

    // Toggle App Notifications - Fixed with optional chaining
    builder.addCase(toggleAppNotifications.fulfilled, (state, action) => {
      const message = action.payload?.message;
      if (message) {
        state.notificationSettings.appNotificationsEnabled = message.includes('enabled');
      }
    });

    // Get Notification Status
    builder.addCase(getNotificationStatus.fulfilled, (state, action) => {
      const payload = action.payload;
      if (payload) {
        state.notificationSettings = {
          notificationsEnabled: payload.notificationsEnabled ?? true,
          appNotificationsEnabled: payload.appNotificationsEnabled ?? true,
        };
      }
    });
  },
});

export const { 
  clearError, 
  clearNotifications, 
  markAsReadLocally, 
  addNotification 
} = notificationsSlice.actions;
export const notificationsReducer = notificationsSlice.reducer;