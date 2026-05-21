export interface Notification {
  id: number;
  recipientId: number;
  type: 'postComment' | 'postLike' | 'friendRequest' | 'Test';
  title: string;
  description: string;
  postId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  notificationSettings: {
    notificationsEnabled: boolean;
    appNotificationsEnabled: boolean;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CreateNotificationData {
  userId: number;
  type: 'postComment' | 'postLike' | 'friendRequest';
  message: string;
}