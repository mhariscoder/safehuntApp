// src/features/chat/chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, Message } from './chatTypes';
import {
  connectSocket,
  disconnectSocket,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from './chatActions';

const initialState: ChatState = {
  conversations: [],
  messages: [],
  selectedConversation: null,
  isLoading: false,
  error: null,
  isConnected: false,
  onlineUsers: {},
  socketId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    clearConversations: (state) => {
      state.conversations = [];
      state.selectedConversation = null;
    },
    receiveMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      state.messages.push(message);
      
      const conversationIndex = state.conversations.findIndex(
        c => c.user.id === message.senderId || c.user.id === message.receiverId
      );
      
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message.message;
        state.conversations[conversationIndex].timestamp = message.createdAt;
        if (state.conversations[conversationIndex].user.id === message.senderId) {
          if (state.conversations[conversationIndex].unreadCount) {
            state.conversations[conversationIndex].unreadCount! += 1;
          } else {
            state.conversations[conversationIndex].unreadCount = 1;
          }
        }
      }
    },
    markMessageAsRead: (state, action: PayloadAction<number>) => {
      const senderId = action.payload;
      const conversation = state.conversations.find(c => c.user.id === senderId);
      if (conversation) {
        conversation.unreadCount = 0;
      }
      
      state.messages.forEach(msg => {
        if (msg.senderId === senderId && msg.status !== 'read') {
          msg.status = 'read';
        }
      });
    },
    setOnlineStatus: (state, action: PayloadAction<{ userId: number; isOnline: boolean }>) => {
      state.onlineUsers[action.payload.userId] = action.payload.isOnline;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(connectSocket.fulfilled, (state, action) => {
      state.isConnected = true;
      state.socketId = action.payload.socketId || null;
    });
    builder.addCase(connectSocket.rejected, (state) => {
      state.isConnected = false;
    });

    builder.addCase(disconnectSocket.fulfilled, (state) => {
      state.isConnected = false;
      state.socketId = null;
    });

    builder.addCase(getConversations.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getConversations.fulfilled, (state, action) => {
      state.isLoading = false;
      state.conversations = action.payload || [];
      state.error = null;
    });
    builder.addCase(getConversations.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(getMessages.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getMessages.fulfilled, (state, action) => {
      state.isLoading = false;
      state.messages = action.payload.messages || [];
      state.error = null;
    });
    builder.addCase(getMessages.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.messages.push(action.payload);
    });

    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const conversation = state.conversations.find(c => c.user.id === action.payload.senderId);
      if (conversation) {
        conversation.unreadCount = 0;
      }
      state.messages.forEach(msg => {
        if (msg.senderId === action.payload.senderId) {
          msg.status = 'read';
        }
      });
    });
  },
});

export const { 
  clearError, 
  clearMessages, 
  clearConversations, 
  receiveMessage, 
  markMessageAsRead, 
  setOnlineStatus 
} = chatSlice.actions;
export const chatReducer = chatSlice.reducer;