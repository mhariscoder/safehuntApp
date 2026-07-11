// src/hooks/useReports.ts

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { reportPost, getAllReports } from '../features/reports/reportsActions';
import { markPostAsReported } from '../features/reports/reportsSlice';
import { ReportReason } from '../features/reports/reportsTypes';
import { Alert } from 'react-native';

export const useReports = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, reportedPosts } = useSelector(
    (state: RootState) => state.reports
  );

  // Report a post with reason selection
  const reportPostWithReason = useCallback(
    async (postId: number, onSuccess?: () => void) => {
      // Show reason selection alert
      return new Promise<void>((resolve, reject) => {
        Alert.alert(
          'Report Post',
          'Please select a reason for reporting this post:',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(),
            },
            {
              text: ReportReason.ABUSIVE_LANGUAGE,
              onPress: () => submitReport(postId, ReportReason.ABUSIVE_LANGUAGE, onSuccess, resolve, reject),
            },
            {
              text: ReportReason.HARASSMENT,
              onPress: () => submitReport(postId, ReportReason.HARASSMENT, onSuccess, resolve, reject),
            },
            {
              text: ReportReason.SPAM,
              onPress: () => submitReport(postId, ReportReason.SPAM, onSuccess, resolve, reject),
            },
            {
              text: ReportReason.INAPPROPRIATE_CONTENT,
              onPress: () => submitReport(postId, ReportReason.INAPPROPRIATE_CONTENT, onSuccess, resolve, reject),
            },
            {
              text: ReportReason.HATE_SPEECH,
              onPress: () => submitReport(postId, ReportReason.HATE_SPEECH, onSuccess, resolve, reject),
            },
            {
              text: ReportReason.OTHER,
              onPress: () => {
                // Prompt for custom reason
                Alert.prompt(
                  'Report Post',
                  'Please provide a reason:',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                      onPress: () => resolve(),
                    },
                    {
                      text: 'Submit',
                      onPress: (reason) => {
                        if (reason && reason.trim()) {
                          submitReport(postId, ReportReason.OTHER, onSuccess, resolve, reject, reason.trim());
                        } else {
                          Alert.alert('Error', 'Please provide a reason');
                          reject('No reason provided');
                        }
                      },
                    },
                  ],
                  'plain-text'
                );
              },
            },
          ],
          { cancelable: true }
        );
      });
    },
    [dispatch]
  );

  // Submit report to API
  const submitReport = async (
    postId: number,
    reason: ReportReason,
    onSuccess?: () => void,
    resolve?: () => void,
    reject?: (error: any) => void,
    otherReason?: string
  ) => {
    try {
      const result = await dispatch(
        reportPost({ postId, reason, otherReason })
      ).unwrap();
      
      if (result) {
        dispatch(markPostAsReported(postId));
        Alert.alert('Success', 'Post has been reported successfully');
        if (onSuccess) onSuccess();
        if (resolve) resolve();
      }
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to report post');
      if (reject) reject(error);
    }
  };

  // Check if a post has been reported by the current user
  const isPostReported = useCallback(
    (postId: number) => {
      return reportedPosts.has(postId);
    },
    [reportedPosts]
  );

  // Get all reports (admin only)
  const fetchAllReports = useCallback(async () => {
    try {
      const result = await dispatch(getAllReports()).unwrap();
      return result;
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to fetch reports');
      throw error;
    }
  }, [dispatch]);

  return {
    reportPost: reportPostWithReason,
    isPostReported,
    fetchAllReports,
    isLoading,
    error,
    reportedPosts,
  };
};