import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
} from '../features/block/blockActions';
import {
  clearError,
  clearBlockedUsers,
  removeBlockedUserLocally,
  addBlockedUserLocally,
} from '../features/block/blockSlice';
import { BlockUserData, UnblockUserData } from '../features/block/blockTypes';

export const useBlock = () => {
  const dispatch = useAppDispatch();
  const { blockedUsers, isLoading, error, pagination } = useAppSelector(
    (state) => state.block
  );

  const handleBlockUser = async (blockedId: number) => {
    return dispatch(blockUser({ blockedId })).unwrap();
  };

  const handleUnblockUser = async (blockedId: number) => {
    return dispatch(unblockUser({ blockedId })).unwrap();
  };

  const handleGetBlockedUsers = async (page?: number, limit?: number) => {
    return dispatch(getBlockedUsers({ page, limit })).unwrap();
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearBlockedUsers = () => {
    dispatch(clearBlockedUsers());
  };

  const handleRemoveBlockedUserLocally = (blockedId: number) => {
    dispatch(removeBlockedUserLocally(blockedId));
  };

  const handleAddBlockedUserLocally = (blockedUser: any) => {
    dispatch(addBlockedUserLocally(blockedUser));
  };

  return {
    // State
    blockedUsers,
    isLoading,
    error,
    pagination,
    
    // Actions
    blockUser: handleBlockUser,
    unblockUser: handleUnblockUser,
    getBlockedUsers: handleGetBlockedUsers,
    clearError: handleClearError,
    clearBlockedUsers: handleClearBlockedUsers,
    removeBlockedUserLocally: handleRemoveBlockedUserLocally,
    addBlockedUserLocally: handleAddBlockedUserLocally,
  };
};