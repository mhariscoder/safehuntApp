import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  updateMemberStatus,
  removeMember,
  getGroupMembers,
  addGroupPost,
  updateGroupPostStatus,
  removeGroupPost,
  editGroupPost,
  getGroupPosts,
  getPendingPosts,
} from '../features/groups/groupsActions';
import {
  clearError,
  clearGroups,
  clearSelectedGroup,
} from '../features/groups/groupsSlice';
import { 
  CreateGroupData, 
  UpdateGroupData, 
  AddMemberData, 
  UpdateMemberStatusData,
  AddGroupPostData,
  UpdateGroupPostData
} from '../features/groups/groupsTypes';

export const useGroups = () => {
  const dispatch = useAppDispatch();
  const { groups, selectedGroup, groupMembers, groupPosts, pendingPosts, isLoading, error, pagination } = useAppSelector(
    (state) => state.groups
  );

  const handleCreateGroup = async (data: CreateGroupData) => {
    return dispatch(createGroup(data)).unwrap();
  };

  const handleGetAllGroups = async () => {
    return dispatch(getAllGroups()).unwrap();
  };

  const handleGetGroupById = async (id: number) => {
    return dispatch(getGroupById(id)).unwrap();
  };

  const handleUpdateGroup = async (data: UpdateGroupData) => {
    return dispatch(updateGroup(data)).unwrap();
  };

  const handleDeleteGroup = async (id: number) => {
    return dispatch(deleteGroup(id)).unwrap();
  };

  const handleAddMember = async (data: AddMemberData) => {
    return dispatch(addMember(data)).unwrap();
  };

  const handleUpdateMemberStatus = async (data: UpdateMemberStatusData) => {
    return dispatch(updateMemberStatus(data)).unwrap();
  };

  const handleRemoveMember = async (groupId: number, memberId: number) => {
    return dispatch(removeMember({ groupId, memberId })).unwrap();
  };

  const handleGetGroupMembers = async (groupId: number) => {
    return dispatch(getGroupMembers(groupId)).unwrap();
  };

  const handleAddGroupPost = async (data: AddGroupPostData) => {
    return dispatch(addGroupPost(data)).unwrap();
  };

  const handleUpdateGroupPostStatus = async (groupId: number, postId: number, status: string) => {
    return dispatch(updateGroupPostStatus({ groupId, postId, status })).unwrap();
  };

  const handleRemoveGroupPost = async (groupId: number, postId: number) => {
    return dispatch(removeGroupPost({ groupId, postId })).unwrap();
  };

  const handleEditGroupPost = async (data: UpdateGroupPostData) => {
    return dispatch(editGroupPost(data)).unwrap();
  };

  const handleGetGroupPosts = async (groupId: number) => {
    return dispatch(getGroupPosts(groupId)).unwrap();
  };

  const handleGetPendingPosts = async (groupId: number) => {
    return dispatch(getPendingPosts(groupId)).unwrap();
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearGroups = () => {
    dispatch(clearGroups());
  };

  const handleClearSelectedGroup = () => {
    dispatch(clearSelectedGroup());
  };

  return {
    // State
    groups,
    selectedGroup,
    groupMembers,
    groupPosts,
    pendingPosts,
    isLoading,
    error,
    pagination,
    
    // Actions
    createGroup: handleCreateGroup,
    getAllGroups: handleGetAllGroups,
    getGroupById: handleGetGroupById,
    updateGroup: handleUpdateGroup,
    deleteGroup: handleDeleteGroup,
    addMember: handleAddMember,
    updateMemberStatus: handleUpdateMemberStatus,
    removeMember: handleRemoveMember,
    getGroupMembers: handleGetGroupMembers,
    addGroupPost: handleAddGroupPost,
    updateGroupPostStatus: handleUpdateGroupPostStatus,
    removeGroupPost: handleRemoveGroupPost,
    editGroupPost: handleEditGroupPost,
    getGroupPosts: handleGetGroupPosts,
    getPendingPosts: handleGetPendingPosts,
    clearError: handleClearError,
    clearGroups: handleClearGroups,
    clearSelectedGroup: handleClearSelectedGroup,
  };
};