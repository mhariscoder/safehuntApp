import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PostsState, Post } from './postsTypes';
import {
  fetchPosts,
  fetchPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
} from './postsActions';

const initialState: PostsState = {
  posts: [],
  selectedPost: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearPosts: (state) => {
      state.posts = [];
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
    clearSelectedPost: (state) => {
      state.selectedPost = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Posts
    builder.addCase(fetchPosts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchPosts.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload.page === 1) {
        state.posts = action.payload.posts;
      } else {
        state.posts = [...state.posts, ...action.payload.posts];
      }
      state.pagination = {
        ...state.pagination,
        page: action.payload.page,
        total: action.payload.total,
        hasMore: action.payload.hasMore,
      };
      state.error = null;
    });
    builder.addCase(fetchPosts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch Post By ID
    builder.addCase(fetchPostById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchPostById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedPost = action.payload;
      state.error = null;
    });
    builder.addCase(fetchPostById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create Post
    builder.addCase(createPost.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createPost.fulfilled, (state, action) => {
      state.isLoading = false;
      state.posts = [action.payload, ...state.posts];
      state.error = null;
    });
    builder.addCase(createPost.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update Post
    builder.addCase(updatePost.fulfilled, (state, action) => {
      const index = state.posts.findIndex((post) => post.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
      if (state.selectedPost?.id === action.payload.id) {
        state.selectedPost = action.payload;
      }
    });

    // Delete Post
    builder.addCase(deletePost.fulfilled, (state, action) => {
      state.posts = state.posts.filter((post) => post.id !== action.payload);
      if (state.selectedPost?.id === action.payload) {
        state.selectedPost = null;
      }
    });

    // Like Post
    builder.addCase(likePost.fulfilled, (state, action) => {
      const post = state.posts.find((p) => p.id === action.payload.id);
      if (post) {
        post.likes = action.payload.likes;
      }
    });
  },
});

export const { clearPosts, clearSelectedPost, clearError } = postsSlice.actions;
export const postsReducer = postsSlice.reducer;