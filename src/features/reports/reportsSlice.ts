// src/features/reports/reportsSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { reportPost, getAllReports } from './reportsActions';
import { ReportReason } from './reportsTypes';

interface ReportState {
  reports: any[];
  isLoading: boolean;
  error: string | null;
  reportedPosts: Set<number>; // Track which posts the user has reported
}

const initialState: ReportState = {
  reports: [],
  isLoading: false,
  error: null,
  reportedPosts: new Set<number>(),
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
      state.reportedPosts = new Set<number>();
    },
    // Track reported posts locally
    markPostAsReported: (state, action: PayloadAction<number>) => {
      state.reportedPosts.add(action.payload);
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
      state.reportedPosts.add(action.payload.postId);
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

export const { clearError, clearReports, markPostAsReported } = reportsSlice.actions;
export const reportsReducer = reportsSlice.reducer;