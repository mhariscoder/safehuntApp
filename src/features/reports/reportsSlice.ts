// src/features/reports/reportsSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { reportPost, getAllReports } from './reportsActions';
import { ReportReason } from './reportsTypes';

interface ReportState {
  reports: any[];
  isLoading: boolean;
  error: string | null;
  reportedPosts: number[]; // Use array instead of Set for serializability
}

const initialState: ReportState = {
  reports: [],
  isLoading: false,
  error: null,
  reportedPosts: [], // Initialize as empty array
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearReports: (state) => {
      state.reports = [];
      state.reportedPosts = [];
    },
    // Track reported posts locally
    markPostAsReported: (state, action: PayloadAction<number>) => {
      // Check if post ID already exists before adding
      if (!state.reportedPosts.includes(action.payload)) {
        state.reportedPosts.push(action.payload);
      }
    },
    // Remove a post from reported list (optional)
    unmarkPostAsReported: (state, action: PayloadAction<number>) => {
      state.reportedPosts = state.reportedPosts.filter(
        (postId) => postId !== action.payload
      );
    },
    // Reset reported posts (optional)
    resetReportedPosts: (state) => {
      state.reportedPosts = [];
    },
  },
  extraReducers: (builder) => {
    // Report Post
    builder.addCase(reportPost.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(reportPost.fulfilled, (state, action) => {
      state.isLoading = false;
      // Add post ID to reported posts if it doesn't exist
      const postId = action.payload.postId;
      if (!state.reportedPosts.includes(postId)) {
        state.reportedPosts.push(postId);
      }
      state.error = null;
    });
    builder.addCase(reportPost.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get All Reports
    builder.addCase(getAllReports.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getAllReports.fulfilled, (state, action) => {
      state.isLoading = false;
      state.reports = action.payload;
      state.error = null;
    });
    builder.addCase(getAllReports.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { 
  clearError, 
  clearReports, 
  markPostAsReported,
  unmarkPostAsReported,
  resetReportedPosts 
} = reportsSlice.actions;

export const reportsReducer = reportsSlice.reducer;