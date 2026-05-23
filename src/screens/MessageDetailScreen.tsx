import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import ChatService from '../features/chat/chatService';
import { connectSocket, disconnectSocket, getMessages, sendMessage, markAsRead } from '../features/chat/chatActions';
import { receiveMessage, clearMessages } from '../features/chat/chatSlice';
import { API_BASE_URL } from '../constants/config';
import { launchImageLibrary } from 'react-native-image-picker';

const getFullImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  return `${API_BASE_URL}/uploads/${cleanPath}`;
};

const formatTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  
  const { userId, displayname, chatId } = route.params || {};
  
  const { user } = useAppSelector((state) => state.auth);
  const { messages, isLoading, isConnected } = useAppSelector((state) => state.chat);
  
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [socketDebugInfo, setSocketDebugInfo] = useState({
    status: 'disconnected',
    socketId: null as string | null,
    error: null as string | null,
    lastEvent: null as string | null,
  });
  
  const flatListRef = useRef<FlatList>(null);
  const sentMessageIds = useRef<Set<number>>(new Set());
  const messagesLoadedRef = useRef(false);
  
  const otherUserId = userId || chatId;
  const otherUserName = displayname || 'User';
  const otherUserIdNumber = otherUserId ? parseInt(otherUserId, 10) : 0;

  const logSocketStatus = useCallback((event: string, data?: any) => {
    const status = ChatService.socket?.connected ? 'connected' : 'disconnected';
    const socketId = ChatService.socket?.id || null;
    
    setSocketDebugInfo({
      status,
      socketId,
      error: null,
      lastEvent: event,
    });
    
    console.log(`🔍 Socket Debug - ${event}:`, {
      status,
      socketId,
      isConnected: ChatService.socket?.connected,
      data: data || 'N/A',
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!otherUserIdNumber) {
      console.log('⚠️ No otherUserIdNumber, skipping loadMessages');
      return;
    }
    
    if (!ChatService.socket?.connected) {
      console.log('⏳ Socket not connected yet, waiting...');
      return;
    }
    
    try {
      console.log('📥 Loading messages for user:', otherUserId);
      const result = await dispatch(getMessages(otherUserIdNumber)).unwrap();
      console.log('✅ Messages loaded:', result.messages?.length || 0);
      messagesLoadedRef.current = true;
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      logSocketStatus('loadMessages_error', { error });
    }
  }, [otherUserIdNumber, otherUserId, dispatch, logSocketStatus]);

  const handleSendMessage = useCallback(async () => {
    if ((!inputText.trim() && !selectedImage) || isSending || !otherUserIdNumber) {
      return;
    }

    console.log('📤 Sending message to user:', otherUserIdNumber);
    setIsSending(true);
    
    const messageText = inputText.trim();
    const attachment = selectedImage?.uri || null;
    
    setInputText('');
    setSelectedImage(null);
    
    const tempId = Date.now();
    sentMessageIds.current.add(tempId);
    
    const tempMessage = {
      id: tempId,
      senderId: user?.id,
      receiverId: otherUserIdNumber,
      message: messageText,
      type: selectedImage ? 'image' : 'text',
      status: 'sent',
      attachment: attachment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('📝 Adding optimistic message:', tempMessage);
    dispatch(receiveMessage(tempMessage));
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      await dispatch(sendMessage({
        receiverUserId: otherUserIdNumber,
        message: messageText,
        attachment: attachment,
        type: selectedImage ? 'image' : 'text',
      })).unwrap();
      console.log('✅ Message sent successfully');
      logSocketStatus('sendMessage', { success: true });
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      logSocketStatus('sendMessage_error', { error: error.message });
      Alert.alert('Error', error.message || 'Failed to send message');
      loadMessages();
    } finally {
      setIsSending(false);
    }
  }, [inputText, selectedImage, isSending, otherUserIdNumber, user?.id, dispatch, logSocketStatus, loadMessages]);

  const handleSelectImage = useCallback(() => {
    const options: any = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, (response: any) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
        });
      }
    });
  }, []);

  // ✅ Step 1: Initialize socket on mount
  useEffect(() => {
    if (otherUserIdNumber) {
      console.log('📱 Initializing chat for user:', otherUserId);
      dispatch(clearMessages());
      sentMessageIds.current.clear();
      messagesLoadedRef.current = false;
      setSocketReady(false);
      dispatch(connectSocket({ receiverUserId: otherUserId.toString() }));
      dispatch(markAsRead(otherUserIdNumber));
    }

    return () => {
      console.log('🧹 Cleaning up chat - disconnecting socket');
      dispatch(disconnectSocket());
      sentMessageIds.current.clear();
    };
  }, [otherUserIdNumber, otherUserId, dispatch]);

  // ✅ Step 2: Listen for socket connection and load messages
  useEffect(() => {
    const handleConnect = () => {
      console.log('✅ SOCKET CONNECTED! Loading messages...');
      setSocketReady(true);
      logSocketStatus('connect', { socketId: ChatService.socket?.id });
      
      // Small delay to ensure socket is fully ready
      setTimeout(() => {
        if (!messagesLoadedRef.current) {
          loadMessages();
        }
      }, 500);
    };
    
    const handleDisconnect = (reason: string) => {
      console.log('❌ SOCKET DISCONNECTED! Reason:', reason);
      setSocketReady(false);
      logSocketStatus('disconnect', { reason });
    };
    
    const handleConnectError = (error: any) => {
      console.log('⚠️ SOCKET CONNECT_ERROR!', error);
      setSocketDebugInfo(prev => ({ ...prev, status: 'error', error: error.message || 'Connection error' }));
      logSocketStatus('connect_error', { message: error.message });
    };
    
    const handleError = (error: any) => {
      console.log('⚠️ SOCKET ERROR!', error);
      logSocketStatus('error', { error });
    };

    ChatService.listen('connect', handleConnect);
    ChatService.listen('disconnect', handleDisconnect);
    ChatService.listen('connect_error', handleConnectError);
    ChatService.listen('error', handleError);
    
    // Check if already connected
    if (ChatService.socket?.connected) {
      console.log('✅ Socket already connected, loading messages...');
      setSocketReady(true);
      setTimeout(() => {
        if (!messagesLoadedRef.current) {
          loadMessages();
        }
      }, 500);
    }

    return () => {
      ChatService.off('connect', handleConnect);
      ChatService.off('disconnect', handleDisconnect);
      ChatService.off('connect_error', handleConnectError);
      ChatService.off('error', handleError);
    };
  }, [loadMessages, logSocketStatus]);

  // Receive message listener
  useEffect(() => {
    const handleReceiveMessage = (data: any) => {
      console.log('📨 Received message in screen:', data);
      
      const senderIdNum = parseInt(data.senderUserId, 10);
      
      if (senderIdNum === otherUserIdNumber) {
        const messageId = data.id || Date.now();
        
        if (sentMessageIds.current.has(messageId)) {
          console.log('⚠️ Duplicate message detected, skipping:', messageId);
          return;
        }
        
        sentMessageIds.current.add(messageId);
        
        const newMessage = {
          id: messageId,
          senderId: senderIdNum,
          receiverId: user?.id,
          message: data.message || '',
          type: data.type || 'text',
          status: data.status || 'delivered',
          attachment: data.attachment || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log('✅ Adding message to store:', newMessage);
        dispatch(receiveMessage(newMessage));
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    ChatService.listen('receiveMessage', handleReceiveMessage);

    return () => {
      ChatService.off('receiveMessage', handleReceiveMessage);
    };
  }, [otherUserIdNumber, user?.id, dispatch]);

  useEffect(() => {
    console.log('📊 Current messages count:', messages.length);
  }, [messages]);

  const renderMessage = useCallback(({ item }: { item: any }) => {
    const isMyMessage = item.senderId === user?.id;
    const messageDate = item.created_at || item.createdAt;
    const imageUrl = item.attachment ? getFullImageUrl(item.attachment) : null;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && (
          <Image 
            source={require('../../assets/circle_profile.png')} 
            style={styles.miniAvatar} 
          />
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myBubble : styles.otherBubble
        ]}>
          {!isMyMessage && (
            <Text style={styles.senderName}>{otherUserName}</Text>
          )}
          {imageUrl && (
            <Image source={{ uri: imageUrl }} style={styles.messageImage} />
          )}
          {item.message ? (
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.message}
            </Text>
          ) : null}
          <View style={styles.messageFooter}>
            <Text style={styles.timestamp}>{formatTime(messageDate)}</Text>
            {isMyMessage && (
              <Text style={styles.messageStatus}>
                {item.status === 'read' ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }, [user?.id, otherUserName]);

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No messages yet</Text>
      <Text style={styles.emptySubtext}>Start a conversation!</Text>
    </View>
  );

  const renderDebugHeader = () => {
    if (__DEV__) {
      return (
        <View style={styles.debugBar}>
          <Text style={styles.debugText}>
            Socket: {socketDebugInfo.status} 
            {socketDebugInfo.socketId ? ` | ID: ${socketDebugInfo.socketId?.substring(0, 8)}...` : ''}
            {socketDebugInfo.error ? ` | Error: ${socketDebugInfo.error}` : ''}
            | Ready: {socketReady ? '✅' : '❌'}
            | Msgs: {messages.length}
          </Text>
        </View>
      );
    }
    return null;
  };

  if (isLoading && messages.length === 0 && !socketReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />

      {renderDebugHeader()}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image source={require('../../assets/back_white.png')} style={styles.headerIcon} />
          </TouchableOpacity>
          <View style={styles.headerProfile}>
            <Image 
              source={require('../../assets/circle_profile.png')} 
              style={styles.avatar} 
            />
            <View style={[styles.onlineDot, isConnected && styles.onlineActive]} />
          </View>
          <View>
            <Text style={styles.headerName}>{otherUserName}</Text>
            <Text style={styles.headerStatus}>
              {isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Image 
            source={require('../../assets/more_vert.png')} 
            style={styles.moreIcon} 
          />
        </TouchableOpacity>
      </View>

      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
          <TouchableOpacity 
            style={styles.removeImageButton} 
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.removeImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={renderEmptyComponent}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={handleSelectImage} disabled={isSending}>
            <Image source={require('../../assets/attachment_icon.png')} style={styles.inputIcon} />
          </TouchableOpacity>
          
          <TextInput 
            style={styles.textInput}
            placeholder="Write a message..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isSending}
          />

          <TouchableOpacity 
            style={[styles.iconButton, (!inputText.trim() && !selectedImage) && styles.disabledButton]}
            onPress={handleSendMessage}
            disabled={(!inputText.trim() && !selectedImage) || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Image source={require('../../assets/send_icon.png')} style={styles.inputIcon} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  debugBar: { backgroundColor: '#333', paddingVertical: 4, paddingHorizontal: 10, marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  debugText: { color: '#0E713E', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  header: { height: 60, backgroundColor: '#0E713E', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { width: 20, height: 20, marginRight: 10, resizeMode: 'contain', tintColor: '#FFF' },
  headerProfile: { position: 'relative', marginRight: 12 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: '#FFF' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#999', borderWidth: 2, borderColor: '#0E713E' },
  onlineActive: { backgroundColor: '#4CAF50' },
  headerName: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  headerStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
  moreIcon: { width: 20, height: 20, tintColor: '#FFF', resizeMode: 'contain' },
  messageList: { padding: 20, paddingBottom: 20 },
  messageContainer: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
  myMessageContainer: { justifyContent: 'flex-end' },
  otherMessageContainer: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '75%', padding: 10, borderRadius: 12 },
  myBubble: { backgroundColor: '#0E713E' },
  otherBubble: { backgroundColor: '#AACEBC' },
  miniAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  senderName: { fontWeight: 'bold', color: '#0E713E', marginBottom: 4, fontSize: 11 },
  messageText: { fontSize: 12, lineHeight: 16 },
  myMessageText: { color: '#FFF' },
  otherMessageText: { color: '#333' },
  messageImage: { width: 200, height: 150, borderRadius: 8, marginBottom: 8 },
  messageFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 4 },
  timestamp: { fontSize: 10, color: 'rgba(0,0,0,0.5)' },
  messageStatus: { fontSize: 10, color: 'rgba(0,0,0,0.5)' },
  imagePreviewContainer: { position: 'relative', margin: 10, borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 200, resizeMode: 'cover' },
  removeImageButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  removeImageText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  inputContainer: { backgroundColor: '#0E713E', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  textInput: { flex: 1, color: '#FFF', fontSize: 14, marginHorizontal: 10, maxHeight: 80 },
  inputIcon: { width: 22, height: 22, tintColor: '#FFF', resizeMode: 'contain' },
  iconButton: { padding: 5 },
  disabledButton: { opacity: 0.5 },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#999', marginBottom: 8 },
  emptySubtext: { fontSize: 12, color: '#CCC' },
});

export default MessageDetailScreen;