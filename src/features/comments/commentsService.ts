import api from '../../services/api';
import { API_BASE_URL } from '../../constants/config';
import { AddCommentData, UpdateCommentData, AddReplyData, UpdateReplyData } from './commentsTypes';

class CommentsService {
  private getFullImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  }

  private processUser(user: any): any {
    if (!user) return user;
    return {
      ...user,
      profilePhoto: this.getFullImageUrl(user.profilePhoto)
    };
  }

  private processComment(comment: any): any {
    if (!comment) return comment;
    return {
      ...comment,
      user: this.processUser(comment.user),
      replies: comment.replies?.map((reply: any) => ({
        ...reply,
        user: this.processUser(reply.user),
        replyLiked: reply.replyLiked || false
      })) || [],
      commentLiked: comment.commentLiked || false
    };
  }

  // Add a new comment or reply
  async addComment(data: AddCommentData) {
    try {
      const response = await api.post(`/comments/${data.postId}`, {
        content: data.content,
        parentCommentId: data.parentCommentId
      });
      return this.processComment(response.data);
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  }

  // Get all comments for a post
  async getCommentsByPost(postId: number) {
    try {
      const response = await api.get(`/comments/${postId}`);
      console.log('Raw comments response:', response.data);
      const comments = response.data.data;
      return {
        comments: comments.map((comment: any) => this.processComment(comment))
      };
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  }

  // Get all replies for a specific comment
  async getRepliesByComment(commentId: number) {
    try {
      const response = await api.get(`/comments/replies/${commentId}`);
      return {
        replies: response.data.map((reply: any) => this.processComment(reply))
      };
    } catch (error) {
      console.error('Get replies error:', error);
      throw error;
    }
  }

  // Update a comment
  async updateComment(data: UpdateCommentData) {
    try {
      const response = await api.put(`/comments/${data.commentId}`, {
        content: data.content
      });
      return this.processComment(response.data);
    } catch (error) {
      console.error('Update comment error:', error);
      throw error;
    }
  }

  // Add a reply to a comment
  async addReply(data: AddReplyData) {
    try {
      const response = await api.post(`/comments/${data.commentId}/reply`, {
        content: data.content
      });
      return this.processComment(response.data);
    } catch (error) {
      console.error('Add reply error:', error);
      throw error;
    }
  }

  // Update a reply
  async updateReply(data: UpdateReplyData) {
    try {
      const response = await api.put(`/comments/replies/${data.replyId}`, {
        content: data.content
      });
      return this.processComment(response.data);
    } catch (error) {
      console.error('Update reply error:', error);
      throw error;
    }
  }

  // Delete a comment
  async deleteComment(commentId: number) {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  }

  // Delete a reply
  async deleteReply(replyId: number) {
    try {
      const response = await api.delete(`/comments/replies/${replyId}`);
      return response.data;
    } catch (error) {
      console.error('Delete reply error:', error);
      throw error;
    }
  }

  // Like a comment
  async likeComment(commentId: number) {
    try {
      const response = await api.post(`/comments/${commentId}/like`);
      return { commentId, liked: true };
    } catch (error) {
      console.error('Like comment error:', error);
      throw error;
    }
  }

  // Unlike a comment
  async unlikeComment(commentId: number) {
    try {
      const response = await api.delete(`/comments/${commentId}/like`);
      return { commentId, liked: false };
    } catch (error) {
      console.error('Unlike comment error:', error);
      throw error;
    }
  }

  // Like a reply
  async likeReply(replyId: number) {
    try {
      const response = await api.post(`/comments/replies/${replyId}/like`);
      return { replyId, liked: true };
    } catch (error) {
      console.error('Like reply error:', error);
      throw error;
    }
  }

  // Unlike a reply
  async unlikeReply(replyId: number) {
    try {
      const response = await api.delete(`/comments/replies/${replyId}/unlike`);
      return { replyId, liked: false };
    } catch (error) {
      console.error('Unlike reply error:', error);
      throw error;
    }
  }
}

export default new CommentsService();