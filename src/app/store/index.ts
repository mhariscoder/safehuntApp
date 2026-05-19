import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authReducer } from '../../features/auth/authSlice';
import { postsReducer } from '../../features/posts/postsSlice';
import { uiReducer } from '../../features/ui/uiSlice';
import { friendsReducer } from '../../features/friends/friendsSlice';
import { userEquipmentReducer } from '../../features/userEquipment/userEquipmentSlice';
import { commentsReducer } from '../../features/comments/commentsSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'ui'], // only auth and ui will be persisted
  blacklist: ['posts'], // posts won't be persisted
};

const rootReducer = combineReducers({
  auth: authReducer,
  posts: postsReducer,
  comments: commentsReducer,
  ui: uiReducer,
  friends: friendsReducer,
  userEquipment: userEquipmentReducer,
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