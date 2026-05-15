import { createAsyncThunk } from '@reduxjs/toolkit';
import postsService from './postsService';
import { CreatePostData, UpdatePostData } from './postsTypes';
import { RootState } from '../../app/store';

interface FetchPostsParams {
  page?: number;
  limit?: number;
  userId?: string;
}

export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (params: FetchPostsParams = {}, { rejectWithValue }) => {
    try {
      const response = await postsService.getPosts(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
    }
  }
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await postsService.getPostById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch post');
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData: CreatePostData, { rejectWithValue }) => {
    try {
      const response = await postsService.createPost(postData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ id, data }: UpdatePostData, { rejectWithValue }) => {
    try {
      const response = await postsService.updatePost(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update post');
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (id: string, { rejectWithValue }) => {
    try {
      await postsService.deletePost(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete post');
    }
  }
);

export const likePost = createAsyncThunk(
  'posts/likePost',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await postsService.likePost(id);
      return { id, likes: response.likes };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like post');
    }
  }
);