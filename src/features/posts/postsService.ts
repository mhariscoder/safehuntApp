import api from '../../services/api';

class PostsService {
  async getPosts(params: { page?: number; limit?: number; userId?: string }) {
    const response = await api.get('/posts', { params });
    return response.data;
  }

  async getPostById(id: string) {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  }

  async createPost(postData: { title: string; content: string; image?: string }) {
    const response = await api.post('/posts', postData);
    return response.data;
  }

  async updatePost(id: string, data: Partial<any>) {
    const response = await api.put(`/posts/${id}`, data);
    return response.data;
  }

  async deletePost(id: string) {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  }

  async likePost(id: string) {
    const response = await api.post(`/posts/${id}/like`);
    return response.data;
  }
}

export default new PostsService();