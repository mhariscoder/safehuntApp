import api from '../../services/api';
import { AssignEquipmentData } from './userEquipmentTypes';

class UserEquipmentService {
  // Assign equipment to user
  async assignEquipmentToUser(equipmentId: number) {
    try {
      const response = await api.post('/user-equipment/assign', { equipmentId });
      return response.data;
    } catch (error) {
      console.error('Assign equipment error:', error);
      throw error;
    }
  }

  // Get all equipment assigned to the authenticated user
  async getUserEquipments() {
    try {
      const response = await api.get('/user-equipment');
      return response.data;
    } catch (error) {
      console.error('Get user equipments error:', error);
      throw error;
    }
  }
}

export default new UserEquipmentService();