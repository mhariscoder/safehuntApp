import api from '../../services/api';
import { 
  CreateHuntingJournalData, 
  UpdateHuntingJournalData, 
  SearchHuntingJournalParams 
} from './huntingJournalTypes';
import { API_BASE_URL } from '../../constants/config';

class HuntingJournalService {
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

  private processJournal(journal: any): any {
    if (!journal) return journal;
    return {
      ...journal,
      user: this.processUser(journal.user)
    };
  }

  // Create a new journal entry
  async createJournal(data: CreateHuntingJournalData) {
    try {
      const response = await api.post('/hunting-journal', data);
      return this.processJournal(response.data);
    } catch (error) {
      console.error('Create journal error:', error);
      throw error;
    }
  }

  // Get all journals
  async getAllJournals() {
    try {
      const response = await api.get('/hunting-journal');
      const journals = response.data.data || response.data;
      return journals.map((journal: any) => this.processJournal(journal));
    } catch (error) {
      console.error('Get all journals error:', error);
      throw error;
    }
  }

  // Get journals by user (my journals)
  async getMyJournals(page: number = 1, limit: number = 10) {
    try {
      const response = await api.get('/hunting-journal/my-journals', {
        params: { page, limit }
      });
      const journals = response.data.data || response.data;
      return journals.map((journal: any) => this.processJournal(journal));
    } catch (error) {
      console.error('Get my journals error:', error);
      throw error;
    }
  }

  // Get journal by ID
  async getJournalById(id: number) {
    try {
      const response = await api.get(`/hunting-journal/${id}`);
      return this.processJournal(response.data);
    } catch (error) {
      console.error('Get journal by ID error:', error);
      throw error;
    }
  }

  // Update journal
  async updateJournal(data: UpdateHuntingJournalData) {
    try {
      const { id, ...updateData } = data;
      const response = await api.put(`/hunting-journal/${id}`, updateData);
      return this.processJournal(response.data);
    } catch (error) {
      console.error('Update journal error:', error);
      throw error;
    }
  }

  // Delete journal
  async deleteJournal(id: number) {
    try {
      const response = await api.delete(`/hunting-journal/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete journal error:', error);
      throw error;
    }
  }

  // Search journals
  async searchJournals(params: SearchHuntingJournalParams) {
    try {
      const response = await api.get('/hunting-journal/search', { params });
      const journals = response.data.data || response.data;
      return journals.map((journal: any) => this.processJournal(journal));
    } catch (error) {
      console.error('Search journals error:', error);
      throw error;
    }
  }

  // Share journal with a friend
  async shareJournal(id: number, friendId: number) {
    try {
      const response = await api.post(`/hunting-journal/${id}/share`, { friendId });
      return this.processJournal(response.data);
    } catch (error) {
      console.error('Share journal error:', error);
      throw error;
    }
  }

  // Get journals shared with me
  async getSharedWithMeJournals(page: number = 1, limit: number = 10) {
    try {
      const response = await api.get('/hunting-journal/shared-with-me', {
        params: { page, limit }
      });
      const journals = response.data.data || response.data;
      return journals.map((journal: any) => this.processJournal(journal));
    } catch (error) {
      console.error('Get shared journals error:', error);
      throw error;
    }
  }
}

export default new HuntingJournalService();