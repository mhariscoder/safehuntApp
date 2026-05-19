import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CommentsState, Comment } from './commentsTypes';
import {
  getCommentsByPost,
  addComment,
  updateComment,
  deleteComment,
  addReply,
  updateReply,
  deleteReply,
  likeComment,
  unlikeComment,
  likeReply,
  unlikeReply,
} from './commentsActions';

const initialState: CommentsState = {
  comments: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
};

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearComments: (state) => {
      state.comments = [];
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
    // Local actions for optimistic updates
    likeCommentLocally: (state, action: PayloadAction<number>) => {
      const commentId = action.payload;
      const findComment = (comments: Comment[]): Comment | undefined => {
        for (const comment of comments) {
          if (comment.id === commentId) return comment;
          const reply = comment.replies.find(r => r.id === commentId);
          if (reply) return reply as any;
        }
        return undefined;
      };
      
      const target = findComment(state.comments);
      if (target) {
        // @ts-ignore - handles both comment and reply
        target.commentLiked = target.commentLiked !== undefined ? !target.commentLiked : !target.replyLiked;
        // @ts-ignore
        target.likeCount = target.likeCount + (target.commentLiked || target.replyLiked ? 1 : -1);
      }
    },
    unlikeCommentLocally: (state, action: PayloadAction<number>) => {
      const commentId = action.payload;
      const findComment = (comments: Comment[]): Comment | undefined => {
        for (const comment of comments) {
          if (comment.id === commentId) return comment;
          const reply = comment.replies.find(r => r.id === commentId);
          if (reply) return reply as any;
        }
        return undefined;
      };
      
      const target = findComment(state.comments);
      if (target) {
        // @ts-ignore
        target.commentLiked = target.commentLiked !== undefined ? !target.commentLiked : !target.replyLiked;
        // @ts-ignore
        target.likeCount = target.likeCount - (target.commentLiked || target.replyLiked ? 1 : -1);
      }
    },
  },
  extraReducers: (builder) => {
    // Get Comments by Post
    builder.addCase(getCommentsByPost.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getCommentsByPost.fulfilled, (state, action) => {
      state.isLoading = false;
      state.comments = action.payload.comments || [];
      state.error = null;
    });
    builder.addCase(getCommentsByPost.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Add Comment
    builder.addCase(addComment.fulfilled, (state, action) => {
      state.comments.unshift(action.payload);
    });

    // Update Comment
    builder.addCase(updateComment.fulfilled, (state, action) => {
      const index = state.comments.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.comments[index] = action.payload;
      }
    });

    // Delete Comment
    builder.addCase(deleteComment.fulfilled, (state, action) => {
      state.comments = state.comments.filter(c => c.id !== action.payload.commentId);
    });

    // Add Reply
    builder.addCase(addReply.fulfilled, (state, action) => {
      const comment = state.comments.find(c => c.id === action.payload.parentCommentId);
      if (comment) {
        comment.replies.push(action.payload);
      }
    });

    // Update Reply
    builder.addCase(updateReply.fulfilled, (state, action) => {
      for (const comment of state.comments) {
        const replyIndex = comment.replies.findIndex(r => r.id === action.payload.id);
        if (replyIndex !== -1) {
          comment.replies[replyIndex] = action.payload;
          break;
        }
      }
    });

    // Delete Reply
    builder.addCase(deleteReply.fulfilled, (state, action) => {
      for (const comment of state.comments) {
        comment.replies = comment.replies.filter(r => r.id !== action.payload.replyId);
      }
    });

    // Like Comment
    builder.addCase(likeComment.fulfilled, (state, action) => {
      const comment = state.comments.find(c => c.id === action.payload.commentId);
      if (comment) {
        comment.commentLiked = true;
        comment.likeCount += 1;
      }
    });

    // Unlike Comment
    builder.addCase(unlikeComment.fulfilled, (state, action) => {
      const comment = state.comments.find(c => c.id === action.payload.commentId);
      if (comment) {
        comment.commentLiked = false;
        comment.likeCount -= 1;
      }
    });

    // Like Reply
    builder.addCase(likeReply.fulfilled, (state, action) => {
      for (const comment of state.comments) {
        const reply = comment.replies.find(r => r.id === action.payload.replyId);
        if (reply) {
          reply.replyLiked = true;
          reply.likeCount += 1;
          break;
        }
      }
    });

    // Unlike Reply
    builder.addCase(unlikeReply.fulfilled, (state, action) => {
      for (const comment of state.comments) {
        const reply = comment.replies.find(r => r.id === action.payload.replyId);
        if (reply) {
          reply.replyLiked = false;
          reply.likeCount -= 1;
          break;
        }
      }
    });
  },
});

export const { clearError, clearComments, likeCommentLocally, unlikeCommentLocally } = commentsSlice.actions;
export const commentsReducer = commentsSlice.reducer;