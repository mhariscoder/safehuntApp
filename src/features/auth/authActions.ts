// src/features/auth/authActions.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';
import { 
  LoginCredentials, 
  SignupData, 
  ResetPasswordData,
  OtpVerificationData,
  RequestResetPasswordData,
  RegenerateOtpData,
  ChangePasswordData,
  UpdateUserData,
  SocialLoginData
} from './authTypes';
import { RootState } from '../../app/store';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async (userData: SignupData, { rejectWithValue }) => {
    try {
      const response = await authService.signup(userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Signup failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        return null;
      }
      
      const user = await authService.verifyToken(token);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Auth check failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: ResetPasswordData, { rejectWithValue }) => {
    try {
      await authService.resetPassword(data);
      return;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Password reset failed');
    }
  }
);

export const otpVerification = createAsyncThunk(
  'auth/otpVerification',
  async (data: OtpVerificationData, { rejectWithValue }) => {
    try {
      const response = await authService.otpVerification(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'OTP verification failed');
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (data: RequestResetPasswordData, { rejectWithValue }) => {
    try {
      const response = await authService.requestPasswordReset(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Password reset request failed');
    }
  }
);

export const regenerateOtp = createAsyncThunk(
  'auth/regenerateOtp',
  async (data: RegenerateOtpData, { rejectWithValue }) => {
    try {
      const response = await authService.regenerateOtp(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'OTP regeneration failed');
    }
  }
);

// FIX: Handle the response properly
export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (data: { userId: number|undefined; userData: UpdateUserData; files?: any }, { rejectWithValue }) => {
    try {
      const response = await authService.updateUser(data.userId, data.userData, data.files);
      
      // Return the user data from the response
      // Adjust based on your API response structure
      if (response && response.data) {
        return response.data;
      } else if (response && response.user) {
        return response.user;
      } else {
        return response;
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'User update failed');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (data: ChangePasswordData, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Password change failed');
    }
  }
);

export const deleteMyAccount = createAsyncThunk(
  'auth/deleteMyAccount',
  async (_, { rejectWithValue }) => {
    try {
      await authService.deleteMyAccount();
      return;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Account deletion failed');
    }
  }
);

export const getUsersByIds = createAsyncThunk(
  'auth/getUsersByIds',
  async ({ ids, currentUserId }: { ids: number[]; currentUserId: number }, { rejectWithValue }) => {
    try {
      const response = await authService.getUsersByIds(ids, currentUserId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const getAllUsers = createAsyncThunk(
  'auth/getAllUsers',
  async ({ limit, page }: { limit?: number; page?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await authService.getAllUsers(limit, page);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const loginViaSocialToken = createAsyncThunk(
  'auth/loginViaSocialToken',
  async (payload: SocialLoginData, { rejectWithValue }) => {
    try {
      const response = await authService.loginViaSocialToken(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Social authentication processing failed'
      );
    }
  }
);