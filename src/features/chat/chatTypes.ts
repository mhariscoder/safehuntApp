export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  type: 'text' | 'image' | 'file' | 'number';
  status: 'sent' | 'delivered' | 'read';
  attachment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  user: {
    id: number;
    username: string;
    displayname: string;
    email: string;
    profilePhoto?: string;
    status?: string;
  };
  lastMessage: string;
  messageType: string;
  status: string;
  timestamp: string;
  unreadCount?: number;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  selectedConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  onlineUsers: { [key: string]: boolean };
  socketId: string | null;
}

export interface SendMessageData {
  receiverUserId: number;
  message: string;
  attachment?: string;
  type?: string;
}

export interface NearbyUser {
  id: number;
  displayname: string;
  username: string;
  profilePhoto?: string;
  currentLatitude: number;
  currentLongitude: number;
  distance?: number;
  isFriend?: boolean;
  isRequestSent?: boolean;
  isRequestReceived?: boolean;
  requestBy?: any;
}