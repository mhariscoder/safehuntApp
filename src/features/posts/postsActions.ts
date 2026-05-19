// src/features/posts/postsActions.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import postsService from './postsService';
import { CreatePostData, UpdatePostData, GetPostsParams } from './postsTypes';
import { RootState } from '../../app/store';
import { Alert } from 'react-native';

// Create a new post
export const createPost = createAsyncThunk(
  'posts/create',
  async (postData: CreatePostData, { rejectWithValue }) => {
    try {
      const response = await postsService.createPost(postData);
      return response;
    } catch (error: any) {
      console.error('Create post action error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
  }
);

// Get all posts
export const getAllPosts = createAsyncThunk(
  'posts/getAll',
  async (params: GetPostsParams = {}, { rejectWithValue }) => {
    try {
      const response = await postsService.getAllPosts(params);
      return response;
    } catch (error: any) {
      console.error('Get all posts action error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
    }
  }
);

// Get my posts
export const getMyPosts = createAsyncThunk(
  'posts/getMyPosts',
  async (params: GetPostsParams = {}, { rejectWithValue }) => {
    try {
      const response = await postsService.getMyPosts(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your posts');
    }
  }
);

// Get posts by user ID
export const getPostsByUserId = createAsyncThunk(
  'posts/getByUserId',
  async ({ userId, params }: { userId: number; params?: GetPostsParams }, { rejectWithValue }) => {
    try {
      const response = await postsService.getPostsByUserId(userId, params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user posts');
    }
  }
);

// Get post by ID
export const getPostById = createAsyncThunk(
  'posts/getById',
  async ({ id, groupId }: { id: number; groupId?: number }, { rejectWithValue }) => {
    try {
      const response = await postsService.getPostById(id, groupId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch post');
    }
  }
);

// Update post
export const updatePost = createAsyncThunk(
  'posts/update',
  async (postData: UpdatePostData, { rejectWithValue }) => {
    try {
      const response = await postsService.updatePost(postData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update post');
    }
  }
);

// Delete post
export const deletePost = createAsyncThunk(
  'posts/delete',
  async ({ id, groupId }: { id: number; groupId?: number }, { rejectWithValue }) => {
    try {
      await postsService.deletePost(id, groupId);
      return { id, groupId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete post');
    }
  }
);

// ✅ Toggle like - New unified API (replaces likePost and unlikePost)
export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async (postId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const response = await postsService.toggleLike(postId, userId);
      return { postId, message: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle like');
    }
  }
);

// Get likes by post
export const getLikesByPost = createAsyncThunk(
  'posts/getLikes',
  async (postId: number, { rejectWithValue }) => {
    try {
      const response = await postsService.getLikesByPost(postId);
      return { postId, data: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get likes');
    }
  }
);

// Get pending posts for groups
export const getPendingPosts = createAsyncThunk(
  'posts/getPending',
  async ({ groupId, page, limit }: { groupId: number; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await postsService.getPendingPosts(groupId, page, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending posts');
    }
  }
);

// Update group post status
export const updateGroupPostStatus = createAsyncThunk(
  'posts/updateGroupStatus',
  async ({ groupId, postId, status }: { groupId: number; postId: number; status: 'pending' | 'approved' | 'rejected' | 'published' }, { rejectWithValue }) => {
    try {
      const response = await postsService.updateGroupPostStatus(groupId, postId, status);
      return { ...response, postId, status };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update post status');
    }
  }
);