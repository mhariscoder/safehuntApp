export interface BlockedUser {
  id: number;
  blocker: {
    id: number;
    username: string;
    displayname: string;
    email: string;
    profilePhoto?: string;
  };
  blocked: {
    id: number;
    username: string;
    displayname: string;
    email: string;
    profilePhoto?: string;
  };
  createdAt?: string;
}

export interface BlockState {
  blockedUsers: BlockedUser[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface BlockUserData {
  blockedId: number;
}

export interface UnblockUserData {
  blockedId: number;
}