import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GroupsState, Group, GroupMember, GroupPost } from './groupsTypes';
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
} from './groupsActions';

const initialState: GroupsState = {
  groups: [],
  selectedGroup: null,
  groupMembers: [],
  groupPosts: [],
  pendingPosts: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
};

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearGroups: (state) => {
      state.groups = [];
      state.selectedGroup = null;
      state.groupMembers = [];
      state.groupPosts = [];
      state.pendingPosts = [];
    },
    clearSelectedGroup: (state) => {
      state.selectedGroup = null;
    },
  },
  extraReducers: (builder) => {
    // Create Group
    builder.addCase(createGroup.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createGroup.fulfilled, (state, action) => {
      state.isLoading = false;
      state.groups.unshift(action.payload);
      state.error = null;
    });
    builder.addCase(createGroup.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get All Groups
    builder.addCase(getAllGroups.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getAllGroups.fulfilled, (state, action) => {
      state.isLoading = false;
      state.groups = action.payload;
      state.error = null;
    });
    builder.addCase(getAllGroups.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get Group by ID
    builder.addCase(getGroupById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getGroupById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedGroup = action.payload;
      state.error = null;
    });
    builder.addCase(getGroupById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update Group
    builder.addCase(updateGroup.fulfilled, (state, action) => {
      const index = state.groups.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.groups[index] = { ...state.groups[index], ...action.payload };
      }
      if (state.selectedGroup?.id === action.payload.id) {
        state.selectedGroup = { ...state.selectedGroup, ...action.payload };
      }
    });

    // Delete Group
    builder.addCase(deleteGroup.fulfilled, (state, action) => {
      state.groups = state.groups.filter(g => g.id !== action.payload.id);
      if (state.selectedGroup?.id === action.payload.id) {
        state.selectedGroup = null;
      }
    });

    // Get Group Members
    builder.addCase(getGroupMembers.fulfilled, (state, action) => {
      state.groupMembers = action.payload.members || [];
    });

    // Get Group Posts
    builder.addCase(getGroupPosts.fulfilled, (state, action) => {
      state.groupPosts = action.payload.posts || [];
    });

    // Get Pending Posts
    builder.addCase(getPendingPosts.fulfilled, (state, action) => {
      state.pendingPosts = action.payload.pendingPosts || [];
    });

    // Add Group Post
    builder.addCase(addGroupPost.fulfilled, (state, action) => {
      state.groupPosts.unshift(action.payload);
    });

    // Remove Group Post
    builder.addCase(removeGroupPost.fulfilled, (state, action) => {
      state.groupPosts = state.groupPosts.filter(p => p.id !== action.payload.postId);
      state.pendingPosts = state.pendingPosts.filter(p => p.id !== action.payload.postId);
    });

    // Edit Group Post
    builder.addCase(editGroupPost.fulfilled, (state, action) => {
      const index = state.groupPosts.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.groupPosts[index] = action.payload;
      }
    });

    // Update Post Status
    builder.addCase(updateGroupPostStatus.fulfilled, (state, action) => {
      state.pendingPosts = state.pendingPosts.filter(p => p.id !== action.payload.postId);
      const post = state.groupPosts.find(p => p.id === action.payload.postId);
      if (post) {
        post.status = 'approved';
      }
    });
  },
});

export const { clearError, clearGroups, clearSelectedGroup } = groupsSlice.actions;
export const groupsReducer = groupsSlice.reducer;