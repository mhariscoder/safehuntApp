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
  const { friends, pendingRequests, sentRequests, isLoading, error, pagination } = useAppSelector(
    (state) => state.friends
  );
  const { user } = useAppSelector((state) => state.auth);

  const handleSendFriendRequest = async (recipientId: number) => {
    return dispatch(sendFriendRequest({ recipientId })).unwrap();
  };

  const handleGetPendingRequests = async (page?: number, limit?: number) => {
    return dispatch(getPendingRequests({ page, limit })).unwrap();
  };

  const handleGetFriends = async (userId: number, page?: number, limit?: number) => {
    return dispatch(getFriends({ userId, page, limit })).unwrap();
  };

  const handleAcceptFriendRequest = async (requestId: number) => {
    return dispatch(acceptFriendRequest({ requestId, status: 'accepted' })).unwrap();
  };

  const handleDeclineFriendRequest = async (requestId: number) => {
    return dispatch(declineFriendRequest({ requestId, status: 'declined' })).unwrap();
  };

  const handleUnfriend = async (friendId: number) => {
    return dispatch(unfriend(friendId)).unwrap();
  };

  const handleCancelFriendRequest = async (recipientId: number) => {
    return dispatch(cancelFriendRequest(recipientId)).unwrap();
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearFriends = () => {
    dispatch(clearFriends());
  };

  return {
    // State
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    pagination,
    currentUserId: user?.id,
    
    // Actions
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