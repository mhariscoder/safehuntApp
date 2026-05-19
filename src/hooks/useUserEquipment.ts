// src/hooks/useUserEquipment.ts
import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import {
  assignEquipmentToUser,
  getUserEquipments,
} from '../features/userEquipment/userEquipmentActions';
import { clearError, clearUserEquipments, removeEquipment } from '../features/userEquipment/userEquipmentSlice';

export const useUserEquipment = () => {
  const dispatch = useAppDispatch();
  
  // ✅ Always access state, even if it might be undefined initially
  const userEquipmentState = useAppSelector((state) => state.userEquipment);
  
  // ✅ Provide default values if state is undefined
  const userEquipments = userEquipmentState?.userEquipments || [];
  const isLoading = userEquipmentState?.isLoading || false;
  const error = userEquipmentState?.error || null;
  const pagination = userEquipmentState?.pagination || { page: 1, limit: 10, total: 0, hasMore: true };

  const handleAssignEquipment = useCallback(async (equipmentId: number) => {
    return dispatch(assignEquipmentToUser({ equipmentId })).unwrap();
  }, [dispatch]);

  const handleGetUserEquipments = useCallback(async () => {
    return dispatch(getUserEquipments()).unwrap();
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleClearUserEquipments = useCallback(() => {
    dispatch(clearUserEquipments());
  }, [dispatch]);

  const handleRemoveEquipment = useCallback((equipmentId: number) => {
    dispatch(removeEquipment(equipmentId));
  }, [dispatch]);

  return {
    userEquipments,
    isLoading,
    error,
    pagination,
    assignEquipment: handleAssignEquipment,
    getUserEquipments: handleGetUserEquipments,
    clearError: handleClearError,
    clearUserEquipments: handleClearUserEquipments,
    removeEquipment: handleRemoveEquipment,
  };
};