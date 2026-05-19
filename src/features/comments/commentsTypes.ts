export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    displayname: string;
    profilePhoto?: string;
  };
  likeCount: number;
  commentLiked: boolean;
  replies: Reply[];
  postId: number;
}

export interface Reply {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    displayname: string;
    profilePhoto?: string;
  };
  likeCount: number;
  replyLiked: boolean;
  parentCommentId: number;
}

export interface CommentsState {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface AddCommentData {
  postId: number;
  content: string;
  parentCommentId?: number;
}

export interface UpdateCommentData {
  commentId: number;
  content: string;
}

export interface AddReplyData {
  commentId: number;
  content: string;
}

export interface UpdateReplyData {
  replyId: number;
  content: string;
}