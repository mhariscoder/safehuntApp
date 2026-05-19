// src/features/posts/postsService.ts

import api from '../../services/api';
import { CreatePostData, UpdatePostData, GetPostsParams } from './postsTypes';
import { API_BASE_URL } from '../../constants/config';

class PostsService {
  // Helper to get full image URL
  private getFullImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
    return `${API_BASE_URL}/public/uploads/${cleanPath}`;
  }

  // Helper to process post images
  private processPost(post: any): any {
    if (!post) return post;
    return {
      ...post,
      image: this.getFullImageUrl(post.image),
      user: post.user ? {
        ...post.user,
        profilePhoto: this.getFullImageUrl(post.user.profilePhoto)
      } : post.user,
      comments: post.comments?.map((comment: any) => ({
        ...comment,
        user: comment.user ? {
          ...comment.user,
          profilePhoto: this.getFullImageUrl(comment.user.profilePhoto)
        } : comment.user,
        replies: comment.replies?.map((reply: any) => ({
          ...reply,
          user: reply.user ? {
            ...reply.user,
            profilePhoto: this.getFullImageUrl(reply.user.profilePhoto)
          } : reply.user
        }))
      })) || []
    };
  }

  // Create a new post
  async createPost(postData: CreatePostData) {
    try {
      const formData = new FormData();
      
      formData.append('description', postData.description);
      if (postData.tags) formData.append('tags', postData.tags);
      if (postData.latitude) formData.append('latitude', String(postData.latitude));
      if (postData.longitude) formData.append('longitude', String(postData.longitude));
      if (postData.groupId) formData.append('groupId', String(postData.groupId));
      
      if (postData.image) {
        formData.append('image', {
          uri: postData.image.uri,
          type: postData.image.type,
          name: postData.image.name,
        } as any);
      }
      
      const response = await api.post('/post', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return this.processPost(response.data);
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  }

  // Get all posts
  async getAllPosts(params: GetPostsParams = {}) {
    try {
      const { page = 1, limit = 10, groupId } = params;
      const response = await api.get('/post', {
        params: { page, limit, groupId }
      });
      
      let postsArray = [];
      let currentPage = page;
      let totalPages = 1;
      let totalPosts = 0;
      
      if (response.data && Array.isArray(response.data.posts)) {
        postsArray = response.data.posts;
        currentPage = response.data.currentPage || page;
        totalPages = response.data.totalPages || 1;
        totalPosts = response.data.totalPosts || 0;
      } else if (response.data && Array.isArray(response.data)) {
        postsArray = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data.posts)) {
        postsArray = response.data.data.posts;
        currentPage = response.data.data.currentPage || page;
        totalPages = response.data.data.totalPages || 1;
        totalPosts = response.data.data.totalPosts || 0;
      } else {
        postsArray = [];
      }
      
      const processedPosts = postsArray.map((post: any) => this.processPost(post));
      
      return {
        posts: processedPosts,
        currentPage,
        totalPages,
        totalPosts,
        hasMore: currentPage < totalPages
      };
    } catch (error) {
      console.error('Get all posts error:', error);
      throw error;
    }
  }

  // Get my posts
  async getMyPosts(params: GetPostsParams = {}) {
    try {
      const { page = 1, limit = 10, groupId } = params;
      const response = await api.get('/post/my-posts', {
        params: { page, limit, groupId }
      });
      
      let postsArray = [];
      let currentPage = page;
      let totalPages = 1;
      let totalPosts = 0;
      
      if (response.data && Array.isArray(response.data.posts)) {
        postsArray = response.data.posts;
        currentPage = response.data.currentPage || page;
        totalPages = response.data.totalPages || 1;
        totalPosts = response.data.totalPosts || 0;
      } else if (response.data && Array.isArray(response.data)) {
        postsArray = response.data;
      } else {
        postsArray = [];
      }
      
      const processedPosts = postsArray.map((post: any) => this.processPost(post));
      
      return {
        posts: processedPosts,
        currentPage,
        totalPages,
        totalPosts,
        hasMore: currentPage < totalPages
      };
    } catch (error) {
      console.error('Get my posts error:', error);
      throw error;
    }
  }

  // Get posts by user ID
  async getPostsByUserId(userId: number, params: GetPostsParams = {}) {
    try {
      const { page = 1, limit = 10, groupId } = params;
      const response = await api.get(`/post/user/${userId}`, {
        params: { page, limit, groupId }
      });
      
      let postsArray = [];
      
      if (response.data && Array.isArray(response.data.posts)) {
        postsArray = response.data.posts;
      } else if (response.data && Array.isArray(response.data)) {
        postsArray = response.data;
      } else {
        postsArray = [];
      }
      
      return postsArray.map((post: any) => this.processPost(post));
    } catch (error) {
      console.error('Get posts by user error:', error);
      throw error;
    }
  }

  // Get post by ID
  async getPostById(id: number, groupId?: number) {
    try {
      const response = await api.get(`/post/${id}`, {
        params: { groupId }
      });
      return this.processPost(response.data);
    } catch (error) {
      console.error('Get post by ID error:', error);
      throw error;
    }
  }

  // Update post
  async updatePost(postData: UpdatePostData) {
    try {
      const formData = new FormData();
      
      if (postData.description) formData.append('description', postData.description);
      if (postData.tags) formData.append('tags', postData.tags);
      if (postData.latitude) formData.append('latitude', String(postData.latitude));
      if (postData.longitude) formData.append('longitude', String(postData.longitude));
      if (postData.groupId) formData.append('groupId', String(postData.groupId));
      
      if (postData.image) {
        formData.append('image', {
          uri: postData.image.uri,
          type: postData.image.type,
          name: postData.image.name,
        } as any);
      }
      
      const response = await api.put(`/post/${postData.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: { groupId: postData.groupId }
      });
      
      return this.processPost(response.data);
    } catch (error) {
      console.error('Update post error:', error);
      throw error;
    }
  }

  // Delete post
  async deletePost(id: number, groupId?: number) {
    try {
      const response = await api.delete(`/post/${id}`, {
        params: { groupId }
      });
      return response.data;
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  }

  // ✅ Toggle like/unlike - New API
  async toggleLike(postId: number, userId: number) {
    try {
      const response = await api.post('/likes', {
        userId,
        postId,
        commentOrReplyId: 0 // Default value as per your DTO
      });
      return response.data;
    } catch (error) {
      console.error('Toggle like error:', error);
      throw error;
    }
  }

  // Get likes by post
  async getLikesByPost(postId: number) {
    try {
      const response = await api.get(`/likes/post/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Get likes by post error:', error);
      throw error;
    }
  }

  // Get pending posts for groups
  async getPendingPosts(groupId: number, page: number = 1, limit: number = 10) {
    try {
      const response = await api.get(`/post/pending/${groupId}`, {
        params: { page, limit }
      });
      
      let postsArray = [];
      
      if (response.data && Array.isArray(response.data.posts)) {
        postsArray = response.data.posts;
      } else if (response.data && Array.isArray(response.data)) {
        postsArray = response.data;
      } else {
        postsArray = [];
      }
      
      return postsArray.map((post: any) => this.processPost(post));
    } catch (error) {
      console.error('Get pending posts error:', error);
      throw error;
    }
  }

  // Update group post status
  async updateGroupPostStatus(groupId: number, postId: number, status: 'pending' | 'approved' | 'rejected' | 'published') {
    try {
      const response = await api.patch(`/post/groups/${groupId}/grouppost/${postId}/status`, {
        status
      });
      return response.data;
    } catch (error) {
      console.error('Update group post status error:', error);
      throw error;
    }
  }
}

export default new PostsService();