import { createAsyncThunk } from '@reduxjs/toolkit';
import groupsService from './groupsService';
import { 
  CreateGroupData, 
  UpdateGroupData, 
  AddMemberData, 
  UpdateMemberStatusData,
  AddGroupPostData,
  UpdateGroupPostData
} from './groupsTypes';

// Create Group
export const createGroup = createAsyncThunk(
  'groups/create',
  async (data: CreateGroupData, { rejectWithValue }) => {
    try {
      const response = await groupsService.createGroup(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create group');
    }
  }
);

// Get All Groups
export const getAllGroups = createAsyncThunk(
  'groups/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await groupsService.getAllGroups();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch groups');
    }
  }
);

// Get Group by ID
export const getGroupById = createAsyncThunk(
  'groups/getById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await groupsService.getGroupById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch group');
    }
  }
);

// Update Group
export const updateGroup = createAsyncThunk(
  'groups/update',
  async (data: UpdateGroupData, { rejectWithValue }) => {
    try {
      const response = await groupsService.updateGroup(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update group');
    }
  }
);

// Delete Group
export const deleteGroup = createAsyncThunk(
  'groups/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await groupsService.deleteGroup(id);
      return { id };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete group');
    }
  }
);

// Add Member
export const addMember = createAsyncThunk(
  'groups/addMember',
  async (data: AddMemberData, { rejectWithValue }) => {
    try {
      const response = await groupsService.addMember(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add member');
    }
  }
);

// Update Member Status
export const updateMemberStatus = createAsyncThunk(
  'groups/updateMemberStatus',
  async (data: UpdateMemberStatusData, { rejectWithValue }) => {
    try {
      const response = await groupsService.updateMemberStatus(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update member status');
    }
  }
);

// Remove Member
export const removeMember = createAsyncThunk(
  'groups/removeMember',
  async ({ groupId, memberId }: { groupId: number; memberId: number }, { rejectWithValue }) => {
    try {
      await groupsService.removeMember(groupId, memberId);
      return { groupId, memberId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove member');
    }
  }
);

// Get Group Members
export const getGroupMembers = createAsyncThunk(
  'groups/getMembers',
  async (groupId: number, { rejectWithValue }) => {
    try {
      const response = await groupsService.getGroupMembers(groupId);
      return { groupId, members: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch members');
    }
  }
);

// Add Group Post
export const addGroupPost = createAsyncThunk(
  'groups/addPost',
  async (data: AddGroupPostData, { rejectWithValue }) => {
    try {
      const response = await groupsService.addGroupPost(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add post');
    }
  }
);

// Update Group Post Status
export const updateGroupPostStatus = createAsyncThunk(
  'groups/updatePostStatus',
  async ({ groupId, postId, status }: { groupId: number; postId: number; status: string }, { rejectWithValue }) => {
    try {
      const response = await groupsService.updateGroupPostStatus(groupId, postId, status);
      return { postId, status, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update post status');
    }
  }
);

// Remove Group Post
export const removeGroupPost = createAsyncThunk(
  'groups/removePost',
  async ({ groupId, postId }: { groupId: number; postId: number }, { rejectWithValue }) => {
    try {
      await groupsService.removeGroupPost(groupId, postId);
      return { groupId, postId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove post');
    }
  }
);

// Edit Group Post
export const editGroupPost = createAsyncThunk(
  'groups/editPost',
  async (data: UpdateGroupPostData, { rejectWithValue }) => {
    try {
      const response = await groupsService.editGroupPost(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to edit post');
    }
  }
);

// Get Group Posts
export const getGroupPosts = createAsyncThunk(
  'groups/getPosts',
  async (groupId: number, { rejectWithValue }) => {
    try {
      const response = await groupsService.getGroupPosts(groupId);
      return { groupId, posts: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
    }
  }
);

// Get Pending Posts
export const getPendingPosts = createAsyncThunk(
  'groups/getPendingPosts',
  async (groupId: number, { rejectWithValue }) => {
    try {
      const response = await groupsService.getPendingPosts(groupId);
      return { groupId, pendingPosts: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending posts');
    }
  }
);