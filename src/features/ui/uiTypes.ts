export interface UIState {
  isLoading: boolean;
  isOffline: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  modalVisible: boolean;
  modalContent: React.ReactNode | null;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}