// src/hooks/usePosts.ts

import { useAppSelector, useAppDispatch } from '../app/store/hooks';
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
  toggleLike, // ✅ Import toggleLike
  getGroupPosts
} from '../features/posts/postsActions';
import {
  clearError,
  clearPosts,
  clearPendingPosts,
  toggleLikeLocally, // ✅ Import local toggle
} from '../features/posts/postsSlice';
import { CreatePostData, UpdatePostData, GetPostsParams } from '../features/posts/postsTypes';

export const usePosts = () => {
  const dispatch = useAppDispatch();
  const { posts, myPosts, selectedPost, isLoading, error, pagination, pendingPosts, groupPosts, groupPagination } = useAppSelector(
    (state) => state.posts
  );

  const handleCreatePost = async (postData: CreatePostData) => {
    return dispatch(createPost(postData)).unwrap();
  };

  const handleGetAllPosts = async (params?: GetPostsParams) => {
    return dispatch(getAllPosts(params || {})).unwrap();
  };

  const handleGetAllGroupPosts = async (params?: GetPostsParams) => {
    return dispatch(getGroupPosts(params || {})).unwrap();
  };

  const handleGetMyPosts = async (params?: GetPostsParams) => {
    return dispatch(getMyPosts(params || {})).unwrap();
  };

  const handleGetPostsByUserId = async (userId: number, params?: GetPostsParams) => {
    return dispatch(getPostsByUserId({ userId, params })).unwrap();
  };

  const handleGetPostById = async (id: number, groupId?: number) => {
    return dispatch(getPostById({ id, groupId })).unwrap();
  };

  const handleUpdatePost = async (postData: UpdatePostData) => {
    return dispatch(updatePost(postData)).unwrap();
  };

  const handleDeletePost = async (id: number, groupId?: number) => {
    return dispatch(deletePost({ id, groupId })).unwrap();
  };

  const handleGetPendingPosts = async (groupId: number, page?: number, limit?: number) => {
    return dispatch(getPendingPosts({ groupId, page, limit })).unwrap();
  };

  const handleUpdateGroupPostStatus = async (
    groupId: number,
    postId: number,
    status: 'pending' | 'approved' | 'rejected' | 'published'
  ) => {
    return dispatch(updateGroupPostStatus({ groupId, postId, status })).unwrap();
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearPosts = () => {
    dispatch(clearPosts());
  };

  const handleClearPendingPosts = () => {
    dispatch(clearPendingPosts());
  };

  const handleToggleLike = async (postId: number) => {
    dispatch(toggleLikeLocally(postId));
    
    try {
      await dispatch(toggleLike(postId)).unwrap();
    } catch (error) {
      dispatch(toggleLikeLocally(postId));
      throw error;
    }
  };

  return {
    // State
    posts,
    myPosts,
    selectedPost,
    isLoading,
    error,
    pagination,
    pendingPosts,
    groupPosts, 
    groupPagination,
    
    // Actions
    createPost: handleCreatePost,
    getAllPosts: handleGetAllPosts,
    getAllGroupPost: handleGetAllGroupPosts,
    getMyPosts: handleGetMyPosts,
    getPostsByUserId: handleGetPostsByUserId,
    getPostById: handleGetPostById,
    updatePost: handleUpdatePost,
    deletePost: handleDeletePost,
    getPendingPosts: handleGetPendingPosts,
    updateGroupPostStatus: handleUpdateGroupPostStatus,
    clearError: handleClearError,
    clearPosts: handleClearPosts,
    clearPendingPosts: handleClearPendingPosts,
    toggleLike: handleToggleLike,
  };
};