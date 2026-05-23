// src/features/chat/chatActions.ts

import { createAsyncThunk } from '@reduxjs/toolkit';
import ChatService from './chatService';
import { SendMessageData } from './chatTypes';
import { RootState } from '../../app/store';

// Track if listeners are already set
let listenersInitialized = false;

// Connect to socket
export const connectSocket = createAsyncThunk(
  'chat/connectSocket',
  async ({ receiverUserId }: { receiverUserId?: string } = {}) => {
    // Only set up listeners once
    if (!listenersInitialized) {
      ChatService.commonConnectSocket({ receiverUserId });
      listenersInitialized = true;
    } else {
      // Just initialize without re-setting listeners
      ChatService.initializeSocket({ receiverUserId });
      ChatService.connectSocket();
    }
    return { connected: true, socketId: ChatService.socket?.id };
  }
);

// Disconnect socket
export const disconnectSocket = createAsyncThunk(
  'chat/disconnectSocket',
  async () => {
    listenersInitialized = false;
    ChatService.dispose();
    return;
  }
);

// Rest of the actions remain the same...
export const getConversations = createAsyncThunk(
  'chat/getConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ChatService.getInbox();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (receiverId: number, { rejectWithValue }) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ChatService.off('allMessages', messageHandler);
        reject(new Error('Timeout fetching messages'));
      }, 10000);

      const messageHandler = (data: any) => {
        console.log('📨 allMessages event received:', data);
        if (data.receiverUserId === receiverId) {
          clearTimeout(timeout);
          ChatService.off('allMessages', messageHandler);
          resolve({ receiverId, messages: data.messages || [] });
        }
      };

      ChatService.listen('allMessages', messageHandler);
      
      // ✅ Send payload in the format the server expects
      // Server expects: { data: { receiverUserId } }
      ChatService.getAllMessages(receiverId);
    }).catch((error: any) => rejectWithValue(error.message || 'Failed to fetch messages'));
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (data: SendMessageData, { getState }) => {
    const state = getState() as RootState;
    const senderId = state.auth.user?.id;
    
    ChatService.sendMessage(data.receiverUserId, data.message, data.attachment, data.type);
    
    return {
      id: Date.now(),
      senderId: senderId,
      receiverId: data.receiverUserId,
      message: data.message,
      attachment: data.attachment,
      type: data.type || 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (senderId: number) => {
    ChatService.emitEvent({
      eventName: 'markAsRead',
      eventParameters: { senderId }
    });
    return { senderId };
  }
);

export const updateLocation = createAsyncThunk(
  'chat/updateLocation',
  async ({ userId, latitude, longitude }: { userId: number; latitude: number; longitude: number }) => {
    ChatService.updateLocation(userId, latitude, longitude);
    return { success: true };
  }
);