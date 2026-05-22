export interface Group {
  id: number;
  name: string;
  cover: string | null;
  logo: string | null;
  description: string;
  status: 'active' | 'inactive';
  creatorId?: number;
  creator?: User;
//   status?: 'Joined' | 'Pending' | 'Not a Member';
  AdminInfo?: GroupMember;
  members?: GroupMember[];
  posts?: GroupPost[];
}

export interface GroupMember {
  id: number;
  groupId: number;
  memberId: number;
  member: User;
  type: 'Admin' | 'Member';
  status: 'pending' | 'approved' | 'rejected';
}

export interface GroupPost {
  id: number;
  groupId: number;
  userId: number;
  user: User;
  description: string;
  image: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  displayname: string;
  email: string;
  profilePhoto?: string;
}

export interface GroupsState {
  groups: Group[];
  selectedGroup: Group | null;
  groupMembers: GroupMember[];
  groupPosts: GroupPost[];
  pendingPosts: GroupPost[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CreateGroupData {
  name: string;
  description?: string;
  cover?: any;
  logo?: any;
}

export interface UpdateGroupData {
  id: number;
  name?: string;
  description?: string;
  cover?: any;
  logo?: any;
}

export interface AddMemberData {
  groupId: number;
  memberId: number;
  type: 'Admin' | 'Member';
}

export interface UpdateMemberStatusData {
  groupId: number;
  memberId: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AddGroupPostData {
  groupId: number;
  description: string;
  image?: any;
}

export interface UpdateGroupPostData {
  groupId: number;
  postId: number;
  description?: string;
  image?: any;
  status?: 'pending' | 'approved' | 'rejected';
}