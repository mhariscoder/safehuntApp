export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  comments: number;
  image?: string;
}

export interface PostsState {
  posts: Post[];
  selectedPost: Post | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CreatePostData {
  title: string;
  content: string;
  image?: string;
}

export interface UpdatePostData {
  id: string;
  data: Partial<Post>;
}