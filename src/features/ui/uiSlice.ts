import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, Notification } from './uiTypes';

const initialState: UIState = {
  isLoading: false,
  isOffline: false,
  theme: 'light',
  notifications: [],
  modalVisible: false,
  modalContent: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setOffline: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({ ...action.payload, id });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    showModal: (state, action: PayloadAction<React.ReactNode>) => {
      state.modalVisible = true;
      state.modalContent = action.payload;
    },
    hideModal: (state) => {
      state.modalVisible = false;
      state.modalContent = null;
    },
  },
});

export const {
  setLoading,
  setOffline,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  showModal,
  hideModal,
} = uiSlice.actions;

export const uiReducer = uiSlice.reducer;