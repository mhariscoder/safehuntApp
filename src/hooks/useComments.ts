// src/hooks/useComments.ts
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
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
} from '../features/comments/commentsActions';
import {
  clearError,
  clearComments,
} from '../features/comments/commentsSlice';
import { AddCommentData, UpdateCommentData, AddReplyData, UpdateReplyData } from '../features/comments/commentsTypes';

export const useComments = () => {
  // ✅ All hooks called unconditionally at the top level
  const dispatch = useAppDispatch();
  const { comments, isLoading, error, pagination } = useAppSelector(
    (state) => state.comments
  );

  // ✅ All handlers defined after hooks
  const handleGetCommentsByPost = async (postId: number) => {
    try {
      const result = await dispatch(getCommentsByPost(postId)).unwrap();
      return result;
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  };

  const handleAddComment = async (data: AddCommentData) => {
    try {
      const result = await dispatch(addComment(data)).unwrap();
      return result;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  };

  const handleUpdateComment = async (data: UpdateCommentData) => {
    return dispatch(updateComment(data)).unwrap();
  };

  const handleDeleteComment = async (commentId: number) => {
    return dispatch(deleteComment(commentId)).unwrap();
  };

  const handleAddReply = async (data: AddReplyData) => {
    return dispatch(addReply(data)).unwrap();
  };

  const handleUpdateReply = async (data: UpdateReplyData) => {
    return dispatch(updateReply(data)).unwrap();
  };

  const handleDeleteReply = async (replyId: number) => {
    return dispatch(deleteReply(replyId)).unwrap();
  };

  const handleLikeComment = async (commentId: number) => {
    return dispatch(likeComment(commentId)).unwrap();
  };

  const handleUnlikeComment = async (commentId: number) => {
    return dispatch(unlikeComment(commentId)).unwrap();
  };

  const handleLikeReply = async (replyId: number) => {
    return dispatch(likeReply(replyId)).unwrap();
  };

  const handleUnlikeReply = async (replyId: number) => {
    return dispatch(unlikeReply(replyId)).unwrap();
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearComments = () => {
    dispatch(clearComments());
  };

  return {
    // State
    comments,
    isLoading,
    error,
    pagination,
    
    // Actions
    getCommentsByPost: handleGetCommentsByPost,
    addComment: handleAddComment,
    updateComment: handleUpdateComment,
    deleteComment: handleDeleteComment,
    addReply: handleAddReply,
    updateReply: handleUpdateReply,
    deleteReply: handleDeleteReply,
    likeComment: handleLikeComment,
    unlikeComment: handleUnlikeComment,
    likeReply: handleLikeReply,
    unlikeReply: handleUnlikeReply,
    clearError: handleClearError,
    clearComments: handleClearComments,
  };
};