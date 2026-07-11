// src/features/reports/reportsTypes.ts

export enum ReportReason {
  ABUSIVE_LANGUAGE = 'Abusive Language',
  HARASSMENT = 'Harassment or Bullying',
  SPAM = 'Spam or Scam',
  INAPPROPRIATE_CONTENT = 'Inappropriate Content',
  HATE_SPEECH = 'Hate Speech or Discrimination',
  OTHER = 'Other',
}

export interface ReportPostData {
  postId: number;
  reason: ReportReason;
  otherReason?: string;
}

export interface ReportResponse {
  id: number;
  userId: number;
  postId: number;
  reason: ReportReason;
  otherReason?: string;
  createdAt: string;
}