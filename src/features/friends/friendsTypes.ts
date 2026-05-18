export interface Friend {
  id: string | number;
  username: string;
  displayname: string;
  email: string;
  profilePhoto?: string;
  profilePicture?: string;
  status?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  firstname?: string | null;
  lastname?: string | null;
  subscriptionStatus?: string;
}

export interface FriendRequest {
  id: number;
  requesterId?: number;
  recipientId?: number;
  status: 'pending' | 'accepted' | 'declined';
  requester?: Friend;
  recipient?: Friend;
  createdAt?: string;
}

export interface PendingRequestsResponse {
  requests: FriendRequest[];
  meta: {
    totalRequests: number;
    currentPage: string;
    totalPages: number;
    perPage: string;
  };
}

export interface FriendshipState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface FriendRequestData {
  recipientId: number;
}

export interface FriendshipStatusUpdateData {
  requestId: number;
  status: 'accepted' | 'declined';
}