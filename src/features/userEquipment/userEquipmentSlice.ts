import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserEquipmentState, UserEquipment } from './userEquipmentTypes';
import {
  assignEquipmentToUser,
  getUserEquipments,
} from './userEquipmentActions';

const initialState: UserEquipmentState = {
  userEquipments: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
};

const userEquipmentSlice = createSlice({
  name: 'userEquipment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUserEquipments: (state) => {
      state.userEquipments = [];
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
    removeEquipment: (state, action: PayloadAction<number>) => {
      state.userEquipments = state.userEquipments.filter(
        (item) => item.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Assign Equipment
    builder.addCase(assignEquipmentToUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(assignEquipmentToUser.fulfilled, (state, action) => {
      state.isLoading = false;
      // Add the newly assigned equipment to the list
      if (action.payload?.data) {
        state.userEquipments.push(action.payload.data);
      } else if (action.payload) {
        state.userEquipments.push(action.payload);
      }
      state.error = null;
    });
    builder.addCase(assignEquipmentToUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get User Equipments
    builder.addCase(getUserEquipments.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getUserEquipments.fulfilled, (state, action) => {
      state.isLoading = false;
      
      // Handle different response structures
      let equipmentsData = [];
      
      if (action.payload?.data) {
        equipmentsData = action.payload.data;
      } else if (action.payload?.userEquipments) {
        equipmentsData = action.payload.userEquipments;
      } else if (Array.isArray(action.payload)) {
        equipmentsData = action.payload;
      } else {
        equipmentsData = [];
      }
      
      state.userEquipments = equipmentsData;
      state.pagination.total = equipmentsData.length;
      state.error = null;
    });
    builder.addCase(getUserEquipments.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, clearUserEquipments, removeEquipment } = userEquipmentSlice.actions;
export const userEquipmentReducer = userEquipmentSlice.reducer;