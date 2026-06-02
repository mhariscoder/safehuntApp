import { createAsyncThunk } from '@reduxjs/toolkit';
import blockService from './blockService';
import { BlockUserData, UnblockUserData } from './blockTypes';
import { RootState } from '../../app/store';

// Block a user
export const blockUser = createAsyncThunk(
  'block/blockUser',
  async (data: BlockUserData, { rejectWithValue, getState }) => {
    try {
      const response = await blockService.blockUser(data.blockedId);
      return { blockedId: data.blockedId, message: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to block user');
    }
  }
);

// Unblock a user
export const unblockUser = createAsyncThunk(
  'block/unblockUser',
  async (data: UnblockUserData, { rejectWithValue }) => {
    try {
      const response = await blockService.unblockUser(data.blockedId);
      return { blockedId: data.blockedId, message: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unblock user');
    }
  }
);

// Get blocked users list
export const getBlockedUsers = createAsyncThunk(
  'block/getBlockedUsers',
  async ({ page, limit }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await blockService.getBlockedUsers(page, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch blocked users');
    }
  }
);