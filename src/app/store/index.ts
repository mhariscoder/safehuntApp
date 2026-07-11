import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authReducer } from '../../features/auth/authSlice';
import { postsReducer } from '../../features/posts/postsSlice';
import { uiReducer } from '../../features/ui/uiSlice';
import { friendsReducer } from '../../features/friends/friendsSlice';
import { userEquipmentReducer } from '../../features/userEquipment/userEquipmentSlice';
import { commentsReducer } from '../../features/comments/commentsSlice';
import { notificationsReducer } from '../../features/notifications/notificationsSlice';
import { huntingJournalReducer } from '../../features/huntingJournal/huntingJournalSlice';
import { groupsReducer } from '../../features/groups/groupsSlice';
import { chatReducer } from '../../features/chat/chatSlice';
import { blockReducer } from '../../features/block/blockSlice';
import { reportsReducer } from '../../features/reports/reportsSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'ui', 'groups'], // only auth, ui, and groups will be persisted
  blacklist: ['posts'], // posts won't be persisted
};

const rootReducer = combineReducers({
  auth: authReducer,
  posts: postsReducer,
  comments: commentsReducer,
  ui: uiReducer,
  friends: friendsReducer,
  userEquipment: userEquipmentReducer,
  notifications: notificationsReducer,
  huntingJournal: huntingJournalReducer,
  groups: groupsReducer,
  chat: chatReducer,
  block: blockReducer,
  reports: reportsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      // Add custom middleware here
    ),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;