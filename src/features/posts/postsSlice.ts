// src/features/posts/postsSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PostsState, Post } from './postsTypes';
import {
  createPost,
  getAllPosts,
  getMyPosts,
  getPostsByUserId,
  getPostById,
  updatePost,
  deletePost,
  getPendingPosts,
  updateGroupPostStatus,
  toggleLike,
  getGroupPosts, // ✅ Import toggleLike instead of likePost/unlikePost
} from './postsActions';

const initialState: PostsState = {
  posts: [],
  myPosts: [],
  groupPosts: [],
  userPosts: [],
  selectedPost: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
  groupPagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
  userPostPagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
  pendingPosts: [],
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPosts: (state) => {
      state.posts = [];
      state.myPosts = [];
      state.groupPosts = [];

      state.selectedPost = null;

      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        hasMore: true,
      };

      state.groupPagination = {
        page: 1,
        limit: 10,
        total: 0,
        hasMore: true,
      };
    },
    clearPendingPosts: (state) => {
      state.pendingPosts = [];
    },
    // Local actions for optimistic updates
    toggleLikeLocally: (state, action: PayloadAction<number>) => {
      const postId = action.payload;
      
      // Helper function to toggle like on a post
      const togglePostLike = (post: any) => {
        if (post) {
          post.postLiked = !post.postLiked;
          post.likesCount = post.postLiked 
            ? (post.likesCount || 0) + 1 
            : Math.max((post.likesCount || 0) - 1, 0);
        }
      };
      
      // Update in main posts array
      const postInPosts = state.posts.find(p => p.id === postId);
      togglePostLike(postInPosts);
      
      // Update in myPosts array
      const postInMyPosts = state.myPosts.find(p => p.id === postId);
      togglePostLike(postInMyPosts);
      
      // Update selected post if it's the same
      if (state.selectedPost?.id === postId) {
        togglePostLike(state.selectedPost);
      }
    },
  },
  extraReducers: (builder) => {
    // Create Post
    builder.addCase(createPost.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createPost.fulfilled, (state, action) => {
      state.isLoading = false;
      state.posts.unshift(action.payload.data);
      state.myPosts.unshift(action.payload.data);
      state.error = null;
    });
    builder.addCase(createPost.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get All Posts
    builder.addCase(getAllPosts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getAllPosts.fulfilled, (state, action) => {
      state.isLoading = false;
      const { posts, currentPage, totalPages } = action.payload;
      
      if (currentPage === 1) {
        state.posts = posts;
      } else {
        state.posts = [...state.posts, ...posts];
      }
      
      state.pagination = {
        page: currentPage,
        limit: 10,
        total: action.payload.totalPosts || 0,
        hasMore: currentPage < totalPages,
      };
      state.error = null;
    });
    builder.addCase(getAllPosts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get My Posts
    builder.addCase(getMyPosts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getMyPosts.fulfilled, (state, action) => {
      state.isLoading = false;
      const { posts, currentPage, totalPages } = action.payload;
      
      if (currentPage === 1) {
        state.myPosts = posts;
      } else {
        state.myPosts = [...state.myPosts, ...posts];
      }
      
      state.pagination = {
        page: currentPage,
        limit: 10,
        total: action.payload.totalPosts || 0,
        hasMore: currentPage < totalPages,
      };
      state.error = null;
    });
    builder.addCase(getMyPosts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get Posts By User ID
    builder.addCase(getPostsByUserId.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getPostsByUserId.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userPosts = action.payload;
      state.error = null;
    });
    builder.addCase(getPostsByUserId.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get Post By ID
    builder.addCase(getPostById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getPostById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedPost = action.payload;
      state.error = null;
    });
    builder.addCase(getPostById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update Post
    builder.addCase(updatePost.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updatePost.fulfilled, (state, action) => {
      state.isLoading = false;
      const index = state.posts.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
      if (state.selectedPost?.id === action.payload.id) {
        state.selectedPost = action.payload;
      }
      state.error = null;
    });
    builder.addCase(updatePost.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Delete Post
    builder.addCase(deletePost.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deletePost.fulfilled, (state, action) => {
      state.isLoading = false;
      state.posts = state.posts.filter(p => p.id !== action.payload.id);
      state.myPosts = state.myPosts.filter(p => p.id !== action.payload.id);
      if (state.selectedPost?.id === action.payload.id) {
        state.selectedPost = null;
      }
      state.error = null;
    });
    builder.addCase(deletePost.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get Pending Posts
    builder.addCase(getPendingPosts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getPendingPosts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.pendingPosts = action.payload;
      state.error = null;
    });
    builder.addCase(getPendingPosts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update Group Post Status
    builder.addCase(updateGroupPostStatus.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateGroupPostStatus.fulfilled, (state, action) => {
      state.isLoading = false;
      state.pendingPosts = state.pendingPosts.filter(p => p.id !== action.payload.postId);
      state.error = null;
    });
    builder.addCase(updateGroupPostStatus.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // ✅ Toggle Like - Handle API response (no need for extra state update since optimistic already did it)
    builder.addCase(toggleLike.rejected, (state, action) => {
      // If API fails, we need to revert the optimistic update
      // The error will be shown to the user, and the local action should have already been reverted
      state.error = action.payload as string;
    });

    // Get Group Posts
    builder.addCase(getGroupPosts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(getGroupPosts.fulfilled, (state, action) => {
      state.isLoading = false;

      const {
        posts,
        currentPage,
        totalPages,
        totalPosts,
      } = action.payload;

      if (currentPage === 1) {
        state.groupPosts = posts;
      } else {
        state.groupPosts = [
          ...state.groupPosts,
          ...posts,
        ];
      }

      state.groupPagination = {
        page: currentPage,
        limit: 10,
        total: totalPosts,
        hasMore: currentPage < totalPages,
      };

      state.error = null;
    });

    builder.addCase(getGroupPosts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { 
  clearError, 
  clearPosts, 
  clearPendingPosts, 
  toggleLikeLocally 
} = postsSlice.actions;
export const postsReducer = postsSlice.reducer;