import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import {
  connectSocket,
  disconnectSocket,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  updateLocation,
  getNearbyUsers,
} from '../features/chat/chatActions';
import {
  clearError,
  clearMessages,
  clearConversations,
  receiveMessage,
  markMessageAsRead,
  setOnlineStatus,
} from '../features/chat/chatSlice';
import { SendMessageData } from '../features/chat/chatTypes';
import chatService from '../features/chat/chatService';

export const useChat = () => {
  const dispatch = useAppDispatch();
  const { conversations, messages, selectedConversation, isLoading, error, isConnected, onlineUsers } = useAppSelector(
    (state) => state.chat
  );
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user?.id) {
      dispatch(connectSocket());
      
      // Setup socket listeners
      chatService.on('receiveMessage', (data: any) => {
        dispatch(receiveMessage(data));
      });
      
      chatService.on('messageRead', (data: { messageId: number; senderId: number }) => {
        dispatch(markMessageAsRead(data.senderId));
      });
      
      chatService.on('userOnline', (data: { userId: number }) => {
        dispatch(setOnlineStatus({ userId: data.userId, isOnline: true }));
      });
      
      chatService.on('userOffline', (data: { userId: number }) => {
        dispatch(setOnlineStatus({ userId: data.userId, isOnline: false }));
      });
      
      return () => {
        chatService.off('receiveMessage', () => {});
        chatService.off('messageRead', () => {});
        chatService.off('userOnline', () => {});
        chatService.off('userOffline', () => {});
        dispatch(disconnectSocket());
      };
    }
  }, [user?.id]);

  const handleGetConversations = async () => {
    return dispatch(getConversations()).unwrap();
  };

  const handleGetMessages = async (receiverId: number) => {
    return dispatch(getMessages(receiverId)).unwrap();
  };

  const handleSendMessage = async (data: SendMessageData) => {
    // Emit via socket for real-time
    chatService.emit('sendMessage', data);
    // Also save via API
    return dispatch(sendMessage(data)).unwrap();
  };

  const handleMarkAsRead = async (senderId: number) => {
    return dispatch(markAsRead(senderId)).unwrap();
  };

  const handleUpdateLocation = async (latitude: number, longitude: number) => {
    // Update via socket
    chatService.emit('map:updateLocation', { userId: user?.id, latitude, longitude });
    // Also via API
    return dispatch(updateLocation({ latitude, longitude })).unwrap();
  };

  const handleGetNearbyUsers = async () => {
    return dispatch(getNearbyUsers()).unwrap();
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearMessages = () => {
    dispatch(clearMessages());
  };

  const handleClearConversations = () => {
    dispatch(clearConversations());
  };

  return {
    // State
    conversations,
    messages,
    selectedConversation,
    isLoading,
    error,
    isConnected,
    onlineUsers,
    currentUserId: user?.id,
    
    // Actions
    getConversations: handleGetConversations,
    getMessages: handleGetMessages,
    sendMessage: handleSendMessage,
    markAsRead: handleMarkAsRead,
    updateLocation: handleUpdateLocation,
    getNearbyUsers: handleGetNearbyUsers,
    clearError: handleClearError,
    clearMessages: handleClearMessages,
    clearConversations: handleClearConversations,
  };
};