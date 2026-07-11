// src/features/reports/reportsService.ts

import api from '../../services/api';
import { ReportReason } from './reportsTypes';

class ReportsService {
  // Report a post
  async reportPost(postId: number, reason: ReportReason, otherReason?: string) {
    try {
      const response = await api.post('/reports', {
        postId,
        reason,
        otherReason: otherReason || undefined
      });
      return response.data;
    } catch (error) {
      console.error('Report post error:', error);
      throw error;
    }
  }

  // Get all reports (admin only)
  async getAllReports() {
    try {
      const response = await api.get('/reports');
      return response.data;
    } catch (error) {
      console.error('Get reports error:', error);
      throw error;
    }
  }
}

export default new ReportsService();