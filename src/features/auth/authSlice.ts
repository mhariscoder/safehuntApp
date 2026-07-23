import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from './authTypes';
import { 
  login, 
  signup, 
  logout, 
  checkAuth, 
  resetPassword, 
  loginViaSocialToken,
  updateUser,  // Import the updateUser action
  changePassword,
  deleteMyAccount
} from './authActions';

import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateSubscription: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.subscriptionTier = action.payload as 'free' | 'premium';
      }
    },
    updateUserLocal: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
        // Persist updated user state locally
        AsyncStorage.setItem('user', JSON.stringify(state.user)).catch(err =>
          console.error('Error saving user to AsyncStorage:', err)
        );
      }
    },
    logoutLocal: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Signup
    builder.addCase(signup.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(signup.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(signup.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    });

    // Check Auth
    builder.addCase(checkAuth.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(checkAuth.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.isAuthenticated = true;
        state.user = action.payload;
      }
    });
    builder.addCase(checkAuth.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    });

    // Reset Password
    builder.addCase(resetPassword.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(resetPassword.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(resetPassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update User - FIX: Update the user state with the response
    builder.addCase(updateUser.pending, (state) => {
      // state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateUser.fulfilled, (state, action) => {
      // state.isLoading = false;
      state.error = null;
      
      // Update the user state with the response data
      if (action.payload && action.payload.data) {
        // If the response has a nested data object
        const updatedUser = action.payload.data.user || action.payload.data;
        if (state.user) {
          state.user = { ...state.user, ...updatedUser };
        } else {
          state.user = updatedUser;
        }
      } else if (action.payload && action.payload.user) {
        // If the response has a user property
        if (state.user) {
          state.user = { ...state.user, ...action.payload.user };
        } else {
          state.user = action.payload.user;
        }
      } else if (action.payload && typeof action.payload === 'object') {
        // If the response is the user object directly
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        } else {
          state.user = action.payload;
        }
      }
      
      // Update the token if it's in the response
      if (action.payload && action.payload.token) {
        state.token = action.payload.token;
      }
    });
    builder.addCase(updateUser.rejected, (state, action) => {
      // state.isLoading = false;
      state.error = action.payload as string;
    });

    // Change Password
    builder.addCase(changePassword.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(changePassword.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(changePassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Delete Account
    builder.addCase(deleteMyAccount.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteMyAccount.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(deleteMyAccount.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Social Login
    builder.addCase(loginViaSocialToken.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginViaSocialToken.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(loginViaSocialToken.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { 
  clearError, 
  updateSubscription, 
  updateUserLocal, 
  logoutLocal 
} = authSlice.actions;

export const authReducer = authSlice.reducer;