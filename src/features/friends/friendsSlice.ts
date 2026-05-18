import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FriendshipState, Friend, FriendRequest } from './friendsTypes';
import {
  sendFriendRequest,
  getPendingRequests,
  getFriends,
  acceptFriendRequest,
  declineFriendRequest,
  unfriend,
  cancelFriendRequest,
} from './friendsActions';

const initialState: FriendshipState = {
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
};

const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearFriends: (state) => {
      state.friends = [];
      state.pendingRequests = [];
      state.sentRequests = [];
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    // Send Friend Request
    builder.addCase(sendFriendRequest.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(sendFriendRequest.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.sentRequests.push(action.payload);
      }
      state.error = null;
    });
    builder.addCase(sendFriendRequest.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get Pending Requests - FIXED for nested response
    builder.addCase(getPendingRequests.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getPendingRequests.fulfilled, (state, action) => {
      state.isLoading = false;
      
      // Your API response: { statusCode, message, data: { requests, meta } }
      const response = action.payload;
      
      if (response?.data?.requests) {
        state.pendingRequests = response.data.requests;
        
        // Update pagination from meta
        if (response.data.meta) {
          state.pagination = {
            ...state.pagination,
            total: response.data.meta.totalRequests || 0,
            page: parseInt(response.data.meta.currentPage) || 1,
            hasMore: parseInt(response.data.meta.currentPage) < response.data.meta.totalPages,
          };
        }
      } else if (response?.requests) {
        // Fallback if requests is at root level
        state.pendingRequests = response.requests;
      } else {
        state.pendingRequests = [];
      }
      
      state.error = null;
    });
    builder.addCase(getPendingRequests.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get Friends - FIXED for your API response
    builder.addCase(getFriends.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getFriends.fulfilled, (state, action) => {
      state.isLoading = false;
      
      // Your API response: { statusCode, message, data: { friends, meta } }
      const response = action.payload;
      
      if (response?.data?.friends) {
        state.friends = response.data.friends;
        
        // Update pagination
        if (response.data.meta) {
          state.pagination = {
            page: response.data.meta.currentPage || 1,
            limit: response.data.meta.perPage || 10,
            total: response.data.meta.total || 0,
            hasMore: response.data.meta.currentPage < response.data.meta.totalPages,
          };
        }
      } else if (response?.friends) {
        // Fallback if friends is at root level
        state.friends = response.friends;
      } else {
        state.friends = [];
      }
      
      state.error = null;
    });
    builder.addCase(getFriends.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Accept Friend Request
    builder.addCase(acceptFriendRequest.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(acceptFriendRequest.fulfilled, (state, action) => {
      state.isLoading = false;
      state.pendingRequests = state.pendingRequests.filter(
        (req) => req.id !== action.payload.requestId
      );
      state.error = null;
    });
    builder.addCase(acceptFriendRequest.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Decline Friend Request
    builder.addCase(declineFriendRequest.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(declineFriendRequest.fulfilled, (state, action) => {
      state.isLoading = false;
      state.pendingRequests = state.pendingRequests.filter(
        (req) => req.id !== action.payload.requestId
      );
      state.error = null;
    });
    builder.addCase(declineFriendRequest.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Unfriend
    builder.addCase(unfriend.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(unfriend.fulfilled, (state, action) => {
      state.isLoading = false;
      state.friends = state.friends.filter(
        (friend) => friend.id !== action.payload.friendId
      );
      state.error = null;
    });
    builder.addCase(unfriend.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Cancel Friend Request
    builder.addCase(cancelFriendRequest.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(cancelFriendRequest.fulfilled, (state, action) => {
      state.isLoading = false;
      state.sentRequests = state.sentRequests.filter(
        (req) => req.recipientId !== action.payload.recipientId
      );
      state.error = null;
    });
    builder.addCase(cancelFriendRequest.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, clearFriends } = friendsSlice.actions;
export const friendsReducer = friendsSlice.reducer;