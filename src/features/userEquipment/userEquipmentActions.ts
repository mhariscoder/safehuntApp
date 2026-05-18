import { createAsyncThunk } from '@reduxjs/toolkit';
import userEquipmentService from './userEquipmentService';
import { AssignEquipmentData } from './userEquipmentTypes';

// Assign equipment to user
export const assignEquipmentToUser = createAsyncThunk(
  'userEquipment/assign',
  async (data: AssignEquipmentData, { rejectWithValue }) => {
    try {
      const response = await userEquipmentService.assignEquipmentToUser(data.equipmentId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign equipment');
    }
  }
);

// Get user equipments
export const getUserEquipments = createAsyncThunk(
  'userEquipment/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userEquipmentService.getUserEquipments();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user equipments');
    }
  }
);