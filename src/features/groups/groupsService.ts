import api from '../../services/api';
import { 
  CreateGroupData, 
  UpdateGroupData, 
  AddMemberData, 
  UpdateMemberStatusData,
  AddGroupPostData,
  UpdateGroupPostData
} from './groupsTypes';
import { API_BASE_URL } from '../../constants/config';

class GroupsService {

  private processGroup(group: any): any {
    if (!group) return group;
    return {
      ...group,
      cover: group.cover,
      logo: group.logo,
      AdminInfo: group.AdminInfo ? {
        ...group.AdminInfo,
        member: group.AdminInfo.member ? {
          ...group.AdminInfo.member,
          profilePhoto: group.AdminInfo.member.profilePhoto
        } : group.AdminInfo.member
      } : group.AdminInfo
    };
  }

  private processPost(post: any): any {
    if (!post) return post;
    return {
      ...post,
      image: post.image,
      user: post.user ? {
        ...post.user,
        profilePhoto: post.user.profilePhoto
      } : post.user
    };
  }

  // Create Group
  async createGroup(data: CreateGroupData) {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.cover) {
        formData.append('cover', {
          uri: data.cover.uri,
          type: data.cover.type,
          name: data.cover.name,
        } as any);
      }
      if (data.logo) {
        formData.append('logo', {
          uri: data.logo.uri,
          type: data.logo.type,
          name: data.logo.name,
        } as any);
      }
      
      const response = await api.post('/groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return this.processGroup(response.data);
    } catch (error) {
      console.error('Create group error:', error);
      throw error;
    }
  }

  // Get All Groups
  async getAllGroups() {
    try {
      const response = await api.get('/groups');
      const groups = response.data.data || response.data;
      return groups.map((group: any) => this.processGroup(group));
    } catch (error) {
      console.error('Get all groups error:', error);
      throw error;
    }
  }

  // Get Group by ID
  async getGroupById(id: number) {
    try {
      const response = await api.get(`/groups/${id}`);
      return this.processGroup(response.data);
    } catch (error) {
      console.error('Get group by ID error:', error);
      throw error;
    }
  }

  // Update Group
  async updateGroup(data: UpdateGroupData) {
    try {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.cover) {
        formData.append('cover', {
          uri: data.cover.uri,
          type: data.cover.type,
          name: data.cover.name,
        } as any);
      }
      if (data.logo) {
        formData.append('logo', {
          uri: data.logo.uri,
          type: data.logo.type,
          name: data.logo.name,
        } as any);
      }
      
      const response = await api.put(`/groups/${data.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Update group error:', error);
      throw error;
    }
  }

  // Delete Group
  async deleteGroup(id: number) {
    try {
      const response = await api.delete(`/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete group error:', error);
      throw error;
    }
  }

  // Add Member to Group
  async addMember(data: AddMemberData) {
    try {
      const response = await api.post(`/groups/${data.groupId}/members`, {
        memberId: data.memberId,
        type: data.type
      });
      return response.data;
    } catch (error) {
      console.error('Add member error:', error);
      throw error;
    }
  }

  // Update Member Status
  async updateMemberStatus(data: UpdateMemberStatusData) {
    try {
      const response = await api.put(`/groups/members/${data.memberId}`, {
        groupId: data.groupId,
        status: data.status
      });
      return response.data;
    } catch (error) {
      console.error('Update member status error:', error);
      throw error;
    }
  }

  // Remove Member
  async removeMember(groupId: number, memberId: number) {
    try {
      const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Remove member error:', error);
      throw error;
    }
  }

  // Get Group Members
  async getGroupMembers(groupId: number) {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      const members = response.data.data || response.data;
      return members.map((member: any) => ({
        ...member,
        member: member.member ? {
          ...member.member,
          profilePhoto: member.member.profilePhoto
        } : member.member
      }));
    } catch (error) {
      console.error('Get group members error:', error);
      throw error;
    }
  }

  // Add Post to Group
  async addGroupPost(data: AddGroupPostData) {
    try {
      const formData = new FormData();
      formData.append('description', data.description);
      if (data.image) {
        formData.append('image', {
          uri: data.image.uri,
          type: data.image.type,
          name: data.image.name,
        } as any);
      }
      
      const response = await api.post(`/groups/${data.groupId}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return this.processPost(response.data);
    } catch (error) {
      console.error('Add group post error:', error);
      throw error;
    }
  }

  // Update Group Post Status
  async updateGroupPostStatus(groupId: number, postId: number, status: string) {
    try {
      const response = await api.put(`/groups/${groupId}/posts/${postId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Update post status error:', error);
      throw error;
    }
  }

  // Remove Group Post
  async removeGroupPost(groupId: number, postId: number) {
    try {
      const response = await api.delete(`/groups/${groupId}/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Remove group post error:', error);
      throw error;
    }
  }

  // Edit Group Post
  async editGroupPost(data: UpdateGroupPostData) {
    try {
      const formData = new FormData();
      if (data.description) formData.append('description', data.description);
      if (data.image) {
        formData.append('image', {
          uri: data.image.uri,
          type: data.image.type,
          name: data.image.name,
        } as any);
      }
      
      const response = await api.put(`/groups/${data.groupId}/posts/${data.postId}/edit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return this.processPost(response.data);
    } catch (error) {
      console.error('Edit group post error:', error);
      throw error;
    }
  }

  // Get Group Posts
  async getGroupPosts(groupId: number) {
    try {
      const response = await api.get(`/groups/${groupId}/posts`);
      console.log('Raw getGroupPosts response:', response.data);
      const posts = response.data.data || response.data;
      return posts.map((post: any) => this.processPost(post));
    } catch (error) {
      console.error('Get group posts error:', error);
      throw error;
    }
  }

  // Get Pending Posts
  async getPendingPosts(groupId: number) {
    try {
      const response = await api.get(`/groups/${groupId}/posts/pending`);
      const posts = response.data.data || response.data;
      return posts.map((post: any) => this.processPost(post));
    } catch (error) {
      console.error('Get pending posts error:', error);
      throw error;
    }
  }
}

export default new GroupsService();