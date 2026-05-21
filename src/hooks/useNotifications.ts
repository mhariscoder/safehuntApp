import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import {
  getUserNotifications,
  markNotificationAsRead,
  getUnreadCount,
  toggleNotifications,
  toggleAppNotifications,
  getNotificationStatus,
} from '../features/notifications/notificationsActions';
import {
  clearError,
  clearNotifications,
  markAsReadLocally,
} from '../features/notifications/notificationsSlice';

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, isLoading, error, notificationSettings, pagination } = useAppSelector(
    (state) => state.notifications
  );
  const { user } = useAppSelector((state) => state.auth);

  const handleGetUserNotifications = async (userId: number) => {
    return dispatch(getUserNotifications(userId)).unwrap();
  };

  const handleMarkNotificationAsRead = async (id: number) => {
    dispatch(markAsReadLocally(id));
    try {
      await dispatch(markNotificationAsRead(id)).unwrap();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleGetUnreadCount = async (userId: number) => {
    return dispatch(getUnreadCount(userId)).unwrap();
  };

  const handleToggleNotifications = async (userId: number) => {
    return dispatch(toggleNotifications(userId)).unwrap();
  };

  const handleToggleAppNotifications = async (userId: number) => {
    return dispatch(toggleAppNotifications(userId)).unwrap();
  };

  const handleGetNotificationStatus = async (userId: number) => {
    return dispatch(getNotificationStatus(userId)).unwrap();
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearNotifications = () => {
    dispatch(clearNotifications());
  };

  const handleRefreshNotifications = async () => {
    if (user?.id) {
      await Promise.all([
        handleGetUserNotifications(user.id),
        handleGetUnreadCount(user.id),
        handleGetNotificationStatus(user.id),
      ]);
    }
  };

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    error,
    notificationSettings,
    pagination,
    currentUserId: user?.id,
    
    // Actions
    getUserNotifications: handleGetUserNotifications,
    markNotificationAsRead: handleMarkNotificationAsRead,
    getUnreadCount: handleGetUnreadCount,
    toggleNotifications: handleToggleNotifications,
    toggleAppNotifications: handleToggleAppNotifications,
    getNotificationStatus: handleGetNotificationStatus,
    clearError: handleClearError,
    clearNotifications: handleClearNotifications,
    refreshNotifications: handleRefreshNotifications,
  };
};