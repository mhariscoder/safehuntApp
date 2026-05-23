// src/features/chat/chatService.ts

import io, { Socket } from 'socket.io-client';
import { SendMessageData } from './chatTypes';
import { SOCKET_URL } from '../../constants/config';
import { store } from '../../app/store';
import api from '../../services/api';

class ChatService {
  private static _instance: ChatService;
  private _socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private isSettingUpListeners: boolean = false;

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService._instance) {
      ChatService._instance = new ChatService();
    }
    return ChatService._instance;
  }

  public get socket(): Socket | null {
    return this._socket;
  }

  public initializeSocket({ receiverUserId }: { receiverUserId?: string } = {}): void {
    const token = store.getState().auth.token;
    
    console.log('🔧 Initializing socket with:', {
      hasToken: !!token,
      receiverUserId,
      socketUrl: SOCKET_URL
    });
    
    if (!token) {
      console.error('❌ No token available for socket connection');
      return;
    }

    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
    
    try {
      this._socket = io(SOCKET_URL, {
        transports: ['websocket'],
        query: {
          token: token,
          receiverUserId: receiverUserId || ''
        },
        extraHeaders: {
          'token': token,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        forceNew: true,
      });
      
      this.setupSocketEvents();
    } catch (error) {
      console.error('❌ Socket creation error:', error);
    }
  }
  
  private setupSocketEvents(): void {
    if (!this._socket) return;
    
    this._socket.on('connect', () => {
      console.log('✅ Socket connected successfully!');
      console.log('📱 Socket ID:', this._socket?.id);
      this.notifyListeners('connect', { socketId: this._socket?.id });
    });

    this._socket.on('reconnect', (attempt: number) => {
      console.log(`🔄 Socket Reconnected: Attempt ${attempt}`);
      this.notifyListeners('reconnect', { attempt });
    });

    this._socket.on('disconnect', (reason: string) => {
      console.log(`❌ Socket disconnected: ${reason}`);
      this.notifyListeners('disconnect', { reason });
    });

    this._socket.on('connect_error', (error: any) => {
      console.error('⚠️ Socket connection error:', error.message);
      this.notifyListeners('connect_error', { message: error.message });
    });

    this._socket.on('error', (error: any) => {
      console.error('⚠️ Socket error:', error);
      this.notifyListeners('error', error);
    });
  }

  public connectSocket(): void {
    if (!this._socket) {
      console.error('Socket not initialized. Call initializeSocket first.');
      return;
    }

    console.log('🔌 Attempting to connect socket...');
    this._socket.connect();
  }

  public emitEvent({ eventName, eventParameters }: { eventName: string; eventParameters: any }): void {
    if (!this._socket?.connected) {
      console.warn(`⚠️ Socket not connected, cannot emit ${eventName}`);
      return;
    }
    
    console.log(`📤 Emitting event: ${eventName}`);
    this._socket?.emit(eventName, eventParameters);
  }

  public listen(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    
    // Also register with socket if not already registered
    if (this._socket && !this._socket.hasListeners(event)) {
      this._socket.on(event, (data: any) => {
        // Call all registered callbacks for this event
        const callbacks = this.listeners.get(event);
        if (callbacks) {
          callbacks.forEach(cb => cb(data));
        }
      });
    }
  }

  public off(event: string, callback?: Function): void {
    if (callback) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0 && this._socket) {
          this._socket.off(event);
        }
      }
    } else {
      this.listeners.delete(event);
      if (this._socket) {
        this._socket.off(event);
      }
    }
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks && callbacks.length > 0) {
      // Use setTimeout to prevent recursive calls
      setTimeout(() => {
        callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in listener for ${event}:`, error);
          }
        });
      }, 0);
    }
  }

  public commonConnectSocket({ receiverUserId }: { receiverUserId?: string } = {}): void {
    console.log('🔌 Common connect socket called with receiverUserId:', receiverUserId);
    this.initializeSocket({ receiverUserId });
    this.connectSocket();
    this.setupListeners();
  }

  private setupListeners(): void {
    // Prevent multiple setups
    if (this.isSettingUpListeners) {
      console.log('Listeners already being set up');
      return;
    }
    
    this.isSettingUpListeners = true;
    
    // Use the listen method which handles registration properly
    this.listen('response', (data) => {
      console.log('📨 Response received:', data);
    });

    this.listen('allMessages', (data) => {
      console.log('📨 All messages received:', data);
    });

    this.listen('sendMessage', (data) => {
      console.log('📨 Send message response:', data);
    });

    this.listen('receiverID', (data) => {
      console.log('📨 Receiver ID:', data);
    });

    this.listen('receiveMessage', (data) => {
      console.log('📨 Receive message:', data);
    });

    this.listen('userInfo', (data) => {
      console.log('📨 User info:', data);
    });
    
    this.isSettingUpListeners = false;
  }

  public dispose(): void {
    if (this._socket) {
      console.log('🧹 Disposing socket...');
      this.listeners.clear();
      this._socket.disconnect();
      this._socket.close();
      this._socket = null;
    }
  }

  public sendMessage(receiverUserId: number, message: string, attachment?: string, type: string = 'text'): void {
    this.emitEvent({
      eventName: 'sendMessage',
      eventParameters: {
        receiverUserId,
        message,
        attachment,
        type,
        status: 'sent'
      }
    });
  }

  public getAllMessages(receiverUserId: number): void {
    this.emitEvent({
      eventName: "getAllMessages",
      eventParameters: {
        "event": "allMessages",
        "data": {"receiverUserId": receiverUserId}
      },
    });
  }

  public updateLocation(userId: number, latitude: number, longitude: number): void {
    this.emitEvent({
      eventName: 'map:updateLocation',
      eventParameters: { userId, latitude, longitude }
    });
  }

  public async getInbox(): Promise<any> {
    try {
      const response = await api.get('/inbox');
      return response.data;
    } catch (error) {
      console.error('Get inbox error:', error);
      throw error;
    }
  }
}

export default ChatService.getInstance();