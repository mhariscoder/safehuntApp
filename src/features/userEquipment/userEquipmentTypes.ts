export interface Equipment {
  id: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserEquipment {
  id: number;
  user: any; // User relation
  equipment: Equipment;
  createdAt: string;
  updatedAt: string;
}

export interface UserEquipmentState {
  userEquipments: UserEquipment[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface AssignEquipmentData {
  equipmentId: number;
}

export interface EquipmentResponse {
  statusCode: number;
  message: string;
  data: UserEquipment[];
}