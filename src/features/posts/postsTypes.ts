export interface Post {
  id: number;
  description: string;
  image?: string;
  tags?: string;
  latitude?: number;
  longitude?: number;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    displayname: string;
    email: string;
    profilePhoto?: string;
  };
  groupId?: number;
  likesCount: number;
  sharesCount: number;
  postLiked: boolean;
  comments: Comment[];
}

export interface Comment {
  id: number;
  text: string;
  likeCount: number;
  commentLiked: boolean;
  user: {
    id: number;
    username: string;
    displayname: string;
    profilePhoto?: string;
  };
  replies: Reply[];
  createdAt: string;
}

export interface Reply {
  id: number;
  text: string;
  likeCount: number;
  replyLiked: boolean;
  user: {
    id: number;
    username: string;
    displayname: string;
    profilePhoto?: string;
  };
  createdAt: string;
}

export interface PostsState {
  posts: Post[];
  myPosts: Post[];
  groupPosts: Post[];
  userPosts: Post[];
  selectedPost: Post | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  groupPagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  userPostPagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  pendingPosts: Post[];
}

export interface CreatePostData {
  description: string;
  image?: any;
  tags?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  groupId?: number;
}

export interface UpdatePostData {
  id: number;
  description?: string;
  image?: any;
  tags?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  groupId?: number;
}

export interface GetPostsParams {
  page?: number;
  limit?: number;
  groupId?: number;
  userId?: number;
}

export interface PendingPostResponse {
  posts: Post[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}