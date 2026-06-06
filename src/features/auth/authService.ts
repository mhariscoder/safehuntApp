// src/features/auth/authService.ts
import api from '../../services/api';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LoginCredentials, 
  SignupData, 
  ResetPasswordData,
  OtpVerificationData,
  RequestResetPasswordData,
  RegenerateOtpData,
  ChangePasswordData,
  UpdateUserData,
  SocialLoginData
} from './authTypes';

class AuthService {
  async login(credentials: LoginCredentials) {
    try {
      console.log('Attempting login for:', credentials.username);
      
      const response = await api.post('/auth/login', {
        username: credentials.username,
        password: credentials.password,
      });
      
      console.log('Login response received:', response.data);
      
      const { data } = response.data;
    
      const token = data.token;
      const user = {
        id: data.id,
        role: data.role,
        email: data.email,
        username: data.username,
        displayname: data.displayname,
        profilePhoto: data.profilePhoto,
        coverPhoto: data.coverPhoto,
        profilePicture: data.profilePicture,
        profilecomplete: data.profilecomplete,
        status: data.status,
        phonenumber: data.phonenumber,
        bio: data.bio,
        huntingExperience: data.huntingExperience,
        skills: data.skills,
        currentLatitude: data.currentLatitude,
        currentLongitude: data.currentLongitude,
        subscriptionStatus: data.subscriptionStatus,
      };
      
      // Store token securely
      await Keychain.setGenericPassword(user.username || credentials.username, token);
      
      // Store user data
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      if (credentials.rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
      }
      
      console.log('Token stored successfully');
      
      return { user, token };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(userData: SignupData) {
    try {
      console.log('Attempting signup for:', userData.email);
      
      const response = await api.post('/auth/signup', {
        email: userData.email,
        password: userData.password,
        displayname: userData.displayname,
        username: userData.username,
        confirmPassword: userData.confirmPassword,
      });
      
      const data = response.data.data.user;
      const token = data.token;
      const user = {
        id: data.id,
        role: data.role,
        email: data.email,
        username: data.username,
        displayname: data.displayname,
        profilePhoto: data.profilePhoto,
        profilePicture: data.profilePicture,
        coverPhoto: data.coverPhoto,
        profilecomplete: data.profilecomplete,
        status: data.status,
        phonenumber: data.phonenumber,
        bio: data.bio,
        huntingExperience: data.huntingExperience,
        skills: data.skills,
        currentLatitude: data.currentLatitude,
        currentLongitude: data.currentLongitude,
        subscriptionStatus: data.subscriptionStatus,
      };
      
      await Keychain.setGenericPassword(user.username || userData.username, token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      console.log('Signup successful, token stored');
      
      return { user, token };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      console.log('Calling logout API...');
      await api.post('/auth/logout');
      console.log('Logout API successful');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      try {
        await Keychain.resetGenericPassword();
        console.log('Keychain cleared');
      } catch (keychainError) {
        console.error('Error clearing Keychain:', keychainError);
      }
      
      try {
        await AsyncStorage.multiRemove(['user', 'rememberMe']);
        console.log('AsyncStorage cleared');
      } catch (storageError) {
        console.error('Error clearing AsyncStorage:', storageError);
      }
    }
  }

  async verifyToken(token: string) {
    try {
      const response = await api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.user;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw error;
    }
  }

  async resetPassword(data: ResetPasswordData) {
    try {
      const response = await api.post('/auth/reset-password', data);
      console.log('Reset password response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async otpVerification(data: OtpVerificationData) {
    try {
      const response = await api.post('/auth/otp-verification', data);
      return response.data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  }

  async requestPasswordReset(data: RequestResetPasswordData) {
    try {
      const response = await api.post('/auth/request-reset-password', data);
      return response.data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  async regenerateOtp(data: RegenerateOtpData) {
    try {
      const response = await api.post('/auth/regenerate-otp', data);
      return response.data;
    } catch (error) {
      console.error('Regenerate OTP error:', error);
      throw error;
    }
  }

  async updateUser(userId: number, userData: UpdateUserData, files?: any) {
    try {
      const formData = new FormData();
      
      // Append all user data
      Object.keys(userData).forEach(key => {
        if (userData[key] !== undefined && userData[key] !== null) {
          if (key === 'equipmentImages' && Array.isArray(userData[key])) {
            userData[key].forEach((image: string, index: number) => {
              formData.append('equipmentImages', image);
            });
          } else {
            formData.append(key, String(userData[key]));
          }
        }
      });
      
      // Append files if any
      if (files) {
        if (files.coverPhoto) {
          formData.append('coverPhoto', {
            uri: files.coverPhoto.uri,
            type: files.coverPhoto.type,
            name: files.coverPhoto.name,
          } as any);
        }
        if (files.profilePhoto) {
          formData.append('profilePhoto', {
            uri: files.profilePhoto.uri,
            type: files.profilePhoto.type,
            name: files.profilePhoto.name,
          } as any);
        }
        if (files.equipmentImages && Array.isArray(files.equipmentImages)) {
          files.equipmentImages.forEach((image: any) => {
            formData.append('equipmentImages', {
              uri: image.uri,
              type: image.type,
              name: image.name,
            } as any);
          });
        }
      }
      
      const response = await api.put('/auth/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  async changePassword(data: ChangePasswordData) {
    try {
      const response = await api.put('/auth/change-password', data);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  async deleteMyAccount() {
    try {
      const response = await api.delete('/auth/delete-my-account');
      return response.data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }

  async getUsersByIds(ids: number[], currentUserId: number) {
    try {
      const response = await api.get('/auth/fetch', {
        params: {
          ids: ids.join(','),
          currentUserId,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Get users by IDs error:', error);
      throw error;
    }
  }

  async getAllUsers(limit?: number, page?: number) {
    try {
      const response = await api.get('/auth/users', {
        params: { limit, page },
      });
      return response.data;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  // Helper methods for stored data
  async getStoredToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword();
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  async getStoredUser(): Promise<any | null> {
    try {
      const userJson = await AsyncStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async getStoredUsername(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword();
      return credentials ? credentials.username : null;
    } catch (error) {
      console.error('Error getting stored username:', error);
      return null;
    }
  }

  async loginViaSocialToken(payload: SocialLoginData) {
    try {
      console.log(`Attempting social login via provider: ${payload.socialType}`);
      
      const response = await api.post('/social-auth/login', payload);
      
      console.log('Social login response received:', response.data);
      
      const { data } = response.data;
      
      const token = data.token;
      const user = {
        id: data.id,
        role: data.role,
        email: data.email,
        username: data.username,
        displayname: data.displayname,
        profilePhoto: data.profilePhoto,
        coverPhoto: data.coverPhoto,
        profilePicture: data.profilePicture,
        profilecomplete: data.profilecomplete,
        status: data.status,
        phonenumber: data.phonenumber,
        bio: data.bio,
        huntingExperience: data.huntingExperience,
        skills: data.skills,
        currentLatitude: data.currentLatitude,
        currentLongitude: data.currentLongitude,
        subscriptionStatus: data.subscriptionStatus,
      };
      
      await Keychain.setGenericPassword(user.username || user.email, token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      console.log('Social auth credentials securely persisted');
      
      return { user, token };
    } catch (error) {
      console.error('Social login service error:', error);
      throw error;
    }
  }
}

export default new AuthService();