import { createAsyncThunk } from '@reduxjs/toolkit';
import commentsService from './commentsService';
import { AddCommentData, UpdateCommentData, AddReplyData, UpdateReplyData } from './commentsTypes';

// Get comments by post
export const getCommentsByPost = createAsyncThunk(
  'comments/getByPost',
  async (postId: number, { rejectWithValue }) => {
    try {
      const response = await commentsService.getCommentsByPost(postId);
      return { postId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
  }
);

// Get replies by comment
export const getRepliesByComment = createAsyncThunk(
  'comments/getReplies',
  async (commentId: number, { rejectWithValue }) => {
    try {
      const response = await commentsService.getRepliesByComment(commentId);
      return { commentId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch replies');
    }
  }
);

// Add comment
export const addComment = createAsyncThunk(
  'comments/add',
  async (data: AddCommentData, { rejectWithValue }) => {
    try {
      const response = await commentsService.addComment(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
  }
);

// Update comment
export const updateComment = createAsyncThunk(
  'comments/update',
  async (data: UpdateCommentData, { rejectWithValue }) => {
    try {
      const response = await commentsService.updateComment(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update comment');
    }
  }
);

// Add reply
export const addReply = createAsyncThunk(
  'comments/addReply',
  async (data: AddReplyData, { rejectWithValue }) => {
    try {
      const response = await commentsService.addReply(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add reply');
    }
  }
);

// Update reply
export const updateReply = createAsyncThunk(
  'comments/updateReply',
  async (data: UpdateReplyData, { rejectWithValue }) => {
    try {
      const response = await commentsService.updateReply(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update reply');
    }
  }
);

// Delete comment
export const deleteComment = createAsyncThunk(
  'comments/delete',
  async (commentId: number, { rejectWithValue }) => {
    try {
      await commentsService.deleteComment(commentId);
      return { commentId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

// Delete reply
export const deleteReply = createAsyncThunk(
  'comments/deleteReply',
  async (replyId: number, { rejectWithValue }) => {
    try {
      await commentsService.deleteReply(replyId);
      return { replyId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete reply');
    }
  }
);

// Like comment
export const likeComment = createAsyncThunk(
  'comments/like',
  async (commentId: number, { rejectWithValue }) => {
    try {
      const response = await commentsService.likeComment(commentId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like comment');
    }
  }
);

// Unlike comment
export const unlikeComment = createAsyncThunk(
  'comments/unlike',
  async (commentId: number, { rejectWithValue }) => {
    try {
      const response = await commentsService.unlikeComment(commentId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unlike comment');
    }
  }
);

// Like reply
export const likeReply = createAsyncThunk(
  'comments/likeReply',
  async (replyId: number, { rejectWithValue }) => {
    try {
      const response = await commentsService.likeReply(replyId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like reply');
    }
  }
);

// Unlike reply
export const unlikeReply = createAsyncThunk(
  'comments/unlikeReply',
  async (replyId: number, { rejectWithValue }) => {
    try {
      const response = await commentsService.unlikeReply(replyId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unlike reply');
    }
  }
);