import api from '../../services/api';

class FriendsService {
  // Send a friend request
  async sendFriendRequest(recipientId: number) {
    try {
      const response = await api.post('/friends/request', { recipientId });
      return response.data;
    } catch (error) {
      console.error('Send friend request error:', error);
      throw error;
    }
  }

  async getPendingRequests(page: number = 1, limit: number = 10) {
    try {
        const response = await api.get('/friends/requests', {
        params: { page, limit }
        });
        // Return full response with data wrapper
        return response.data;
    } catch (error) {
        console.error('Get pending requests error:', error);
        throw error;
    }
    }

    // Get friends list
    async getFriends(userId: number, page: number = 1, limit: number = 10) {
    try {
        const response = await api.get(`/friends/${userId}`, {
        params: { page, limit }
        });
        // Return full response with data wrapper
        return response.data;
    } catch (error) {
        console.error('Get friends error:', error);
        throw error;
    }
    }

  // Update friendship status (accept/decline)
  async updateFriendshipStatus(requestId: number, status: 'accepted' | 'declined') {
    try {
      const response = await api.put('/friends/update-status', { requestId, status });
      return response.data;
    } catch (error) {
      console.error('Update friendship status error:', error);
      throw error;
    }
  }

  // Unfriend a user
  async unfriend(friendId: number) {
    try {
      const response = await api.delete(`/friends/unfriend/${friendId}`);
      return response.data;
    } catch (error) {
      console.error('Unfriend error:', error);
      throw error;
    }
  }

  // Cancel friend request
  async cancelFriendRequest(recipientId: number) {
    try {
      const response = await api.delete('/friends/cancel', {
        data: { recipientId }
      });
      return response.data;
    } catch (error) {
      console.error('Cancel friend request error:', error);
      throw error;
    }
  }
}

export default new FriendsService();