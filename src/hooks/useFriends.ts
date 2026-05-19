// src/hooks/useFriends.ts
import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import {
  sendFriendRequest,
  getPendingRequests,
  getFriends,
  acceptFriendRequest,
  declineFriendRequest,
  unfriend,
  cancelFriendRequest,
} from '../features/friends/friendsActions';
import { clearError, clearFriends } from '../features/friends/friendsSlice';

export const useFriends = () => {
  const dispatch = useAppDispatch();
  
  // ✅ Always access state, even if it might be undefined initially
  const friendsState = useAppSelector((state) => state.friends);
  const authState = useAppSelector((state) => state.auth);
  
  // ✅ Provide default values if state is undefined
  const friends = friendsState?.friends || [];
  const pendingRequests = friendsState?.pendingRequests || [];
  const sentRequests = friendsState?.sentRequests || [];
  const isLoading = friendsState?.isLoading || false;
  const error = friendsState?.error || null;
  const pagination = friendsState?.pagination || { page: 1, limit: 10, total: 0, hasMore: true };
  const currentUserId = authState?.user?.id;

  const handleSendFriendRequest = useCallback(async (recipientId: number) => {
    return dispatch(sendFriendRequest({ recipientId })).unwrap();
  }, [dispatch]);

  const handleGetPendingRequests = useCallback(async (page?: number, limit?: number) => {
    return dispatch(getPendingRequests({ page, limit })).unwrap();
  }, [dispatch]);

  const handleGetFriends = useCallback(async (userId: number, page?: number, limit?: number) => {
    return dispatch(getFriends({ userId, page, limit })).unwrap();
  }, [dispatch]);

  const handleAcceptFriendRequest = useCallback(async (requestId: number) => {
    return dispatch(acceptFriendRequest({ requestId, status: 'accepted' })).unwrap();
  }, [dispatch]);

  const handleDeclineFriendRequest = useCallback(async (requestId: number) => {
    return dispatch(declineFriendRequest({ requestId, status: 'declined' })).unwrap();
  }, [dispatch]);

  const handleUnfriend = useCallback(async (friendId: number) => {
    return dispatch(unfriend(friendId)).unwrap();
  }, [dispatch]);

  const handleCancelFriendRequest = useCallback(async (recipientId: number) => {
    return dispatch(cancelFriendRequest(recipientId)).unwrap();
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleClearFriends = useCallback(() => {
    dispatch(clearFriends());
  }, [dispatch]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    pagination,
    currentUserId,
    sendFriendRequest: handleSendFriendRequest,
    getPendingRequests: handleGetPendingRequests,
    getFriends: handleGetFriends,
    acceptFriendRequest: handleAcceptFriendRequest,
    declineFriendRequest: handleDeclineFriendRequest,
    unfriend: handleUnfriend,
    cancelFriendRequest: handleCancelFriendRequest,
    clearError: handleClearError,
    clearFriends: handleClearFriends,
  };
};