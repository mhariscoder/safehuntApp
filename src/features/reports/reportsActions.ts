// src/features/reports/reportsActions.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import reportsService from './reportsService';
import { ReportPostData, ReportReason } from './reportsTypes';
import { RootState } from '../../app/store';

// Report a post
export const reportPost = createAsyncThunk(
  'reports/reportPost',
  async ({ postId, reason, otherReason }: ReportPostData, { rejectWithValue }) => {
    try {
      const response = await reportsService.reportPost(postId, reason, otherReason);
      return { postId, response };
    } catch (error: any) {
      console.error('Report post action error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to report post');
    }
  }
);

// Get all reports (admin only)
export const getAllReports = createAsyncThunk(
  'reports/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reportsService.getAllReports();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports');
    }
  }
);