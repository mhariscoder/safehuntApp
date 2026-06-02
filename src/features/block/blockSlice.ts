import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BlockState, BlockedUser } from './blockTypes';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
} from './blockActions';

const initialState: BlockState = {
  blockedUsers: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
};

const blockSlice = createSlice({
  name: 'block',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearBlockedUsers: (state) => {
      state.blockedUsers = [];
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
    removeBlockedUserLocally: (state, action: PayloadAction<number>) => {
      state.blockedUsers = state.blockedUsers.filter(
        (item) => item.blocked?.id !== action.payload
      );
      state.pagination.total = state.blockedUsers.length;
    },
    addBlockedUserLocally: (state, action: PayloadAction<BlockedUser>) => {
      state.blockedUsers.unshift(action.payload);
      state.pagination.total = state.blockedUsers.length;
    },
  },
  extraReducers: (builder) => {
    // Block User
    builder.addCase(blockUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(blockUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(blockUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Unblock User
    builder.addCase(unblockUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(unblockUser.fulfilled, (state, action) => {
      state.isLoading = false;
      // Remove from blocked users list
      state.blockedUsers = state.blockedUsers.filter(
        (item) => item.blocked?.id !== action.payload.blockedId
      );
      state.pagination.total = state.blockedUsers.length;
      state.error = null;
    });
    builder.addCase(unblockUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get Blocked Users
    builder.addCase(getBlockedUsers.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getBlockedUsers.fulfilled, (state, action) => {
      state.isLoading = false;
      state.blockedUsers = action.payload.blockedUsers || [];
      state.pagination = {
        page: action.payload.currentPage || 1,
        limit: 10,
        total: action.payload.totalItems || 0,
        hasMore: action.payload.hasMore || false,
      };
      state.error = null;
    });
    builder.addCase(getBlockedUsers.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { 
  clearError, 
  clearBlockedUsers, 
  removeBlockedUserLocally, 
  addBlockedUserLocally 
} = blockSlice.actions;
export const blockReducer = blockSlice.reducer;