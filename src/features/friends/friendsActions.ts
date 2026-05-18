import { createAsyncThunk } from '@reduxjs/toolkit';
import friendsService from './friendsService';
import { FriendRequestData, FriendshipStatusUpdateData } from './friendsTypes';

// Send friend request
export const sendFriendRequest = createAsyncThunk(
  'friends/sendRequest',
  async (data: FriendRequestData, { rejectWithValue }) => {
    try {
      const response = await friendsService.sendFriendRequest(data.recipientId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send friend request');
    }
  }
);

// Get pending friend requests
export const getPendingRequests = createAsyncThunk(
  'friends/getPendingRequests',
  async ({ page, limit }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await friendsService.getPendingRequests(page, limit);
      // Return the full response which includes { requests, meta }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get pending requests');
    }
  }
);

// Get friends list
export const getFriends = createAsyncThunk(
  'friends/getFriends',
  async ({ userId, page, limit }: { userId: number; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await friendsService.getFriends(userId, page, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get friends');
    }
  }
);

// Accept friend request
export const acceptFriendRequest = createAsyncThunk(
  'friends/acceptRequest',
  async (data: FriendshipStatusUpdateData, { rejectWithValue }) => {
    try {
      const response = await friendsService.updateFriendshipStatus(data.requestId, 'accepted');
      return { ...response, requestId: data.requestId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept friend request');
    }
  }
);

// Decline friend request
export const declineFriendRequest = createAsyncThunk(
  'friends/declineRequest',
  async (data: FriendshipStatusUpdateData, { rejectWithValue }) => {
    try {
      const response = await friendsService.updateFriendshipStatus(data.requestId, 'declined');
      return { ...response, requestId: data.requestId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to decline friend request');
    }
  }
);

// Unfriend
export const unfriend = createAsyncThunk(
  'friends/unfriend',
  async (friendId: number, { rejectWithValue }) => {
    try {
      const response = await friendsService.unfriend(friendId);
      return { ...response, friendId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unfriend');
    }
  }
);

// Cancel friend request
export const cancelFriendRequest = createAsyncThunk(
  'friends/cancelRequest',
  async (recipientId: number, { rejectWithValue }) => {
    try {
      const response = await friendsService.cancelFriendRequest(recipientId);
      return { ...response, recipientId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel friend request');
    }
  }
);