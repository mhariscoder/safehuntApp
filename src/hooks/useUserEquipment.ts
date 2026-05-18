import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import {
  assignEquipmentToUser,
  getUserEquipments,
} from '../features/userEquipment/userEquipmentActions';
import { clearError, clearUserEquipments, removeEquipment } from '../features/userEquipment/userEquipmentSlice';

export const useUserEquipment = () => {
  const dispatch = useAppDispatch();
  const { userEquipments, isLoading, error, pagination } = useAppSelector(
    (state) => state.userEquipment
  );

  const handleAssignEquipment = async (equipmentId: number) => {
    return dispatch(assignEquipmentToUser({ equipmentId })).unwrap();
  };

  const handleGetUserEquipments = async () => {
    return dispatch(getUserEquipments()).unwrap();
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearUserEquipments = () => {
    dispatch(clearUserEquipments());
  };

  const handleRemoveEquipment = (equipmentId: number) => {
    dispatch(removeEquipment(equipmentId));
  };

  return {
    // State
    userEquipments,
    isLoading,
    error,
    pagination,
    
    // Actions
    assignEquipment: handleAssignEquipment,
    getUserEquipments: handleGetUserEquipments,
    clearError: handleClearError,
    clearUserEquipments: handleClearUserEquipments,
    removeEquipment: handleRemoveEquipment,
  };
};