import api from '../../services/api';
import { API_BASE_URL } from '../../constants/config';

class BlockService {
  private getFullImageUrl(imagePath: string | null | undefined): string | null {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  }

  private processBlockedUser(blockRecord: any): any {
    if (!blockRecord) return blockRecord;
    return {
      ...blockRecord,
      blocked: blockRecord.blocked ? {
        ...blockRecord.blocked,
        profilePhoto: this.getFullImageUrl(blockRecord.blocked.profilePhoto)
      } : blockRecord.blocked,
      blocker: blockRecord.blocker ? {
        ...blockRecord.blocker,
        profilePhoto: this.getFullImageUrl(blockRecord.blocker.profilePhoto)
      } : blockRecord.blocker
    };
  }

  // Block a user
  async blockUser(blockedId: number) {
    try {
      const response = await api.post(`/block/${blockedId}`);
      return response.data;
    } catch (error) {
      console.error('Block user error:', error);
      throw error;
    }
  }

  // Unblock a user
  async unblockUser(blockedId: number) {
    try {
      const response = await api.delete(`/block/${blockedId}`);
      return response.data;
    } catch (error) {
      console.error('Unblock user error:', error);
      throw error;
    }
  }

    async getBlockedUsers(page: number = 1, limit: number = 10) {
        try {
            const response = await api.get('/block', {
                params: { page, limit }
            });
            
            console.log('Get blocked users response:', response.data);
            
            let blockedUsers = [];
            let totalPages = 0;
            let totalItems = 0;
            
            // Your response structure: { statusCode, message, data: { data, totalPages, totalItems } }
            if (response.data?.data?.data) {
                // Map through the data array
                blockedUsers = response.data.data.data.map((item: any) => this.processBlockedUser(item));
                totalPages = response.data.data.totalPages || 0;
                totalItems = response.data.data.totalItems || 0;
            } 
            // Fallback for other possible structures
            else if (response.data?.data && Array.isArray(response.data.data)) {
                blockedUsers = response.data.data.map((item: any) => this.processBlockedUser(item));
                totalItems = blockedUsers.length;
                totalPages = Math.ceil(totalItems / limit) || 0;
            }
            else if (Array.isArray(response.data)) {
                blockedUsers = response.data.map((item: any) => this.processBlockedUser(item));
                totalItems = blockedUsers.length;
            }
            else {
                blockedUsers = [];
            }
            
            console.log('Processed blocked users count:', blockedUsers.length);
            console.log('Total items:', totalItems);
            console.log('Total pages:', totalPages);
            
            return {
                blockedUsers,
                totalPages,
                totalItems,
                currentPage: page,
                hasMore: page < totalPages
            };
        } catch (error) {
            console.error('Get blocked users error:', error);
            throw error;
        }
    
    }
}

export default new BlockService();