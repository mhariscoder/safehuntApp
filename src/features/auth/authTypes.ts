// src/features/auth/authTypes.ts
export interface User {
  id: number;
  email: string;
  username: string;
  displayname?: string;
  name?: string;
  profilePhoto?: string;
  profilePicture?: string;
  profilecomplete?: boolean;
  status?: 'OTP_VERIFIED' | 'PENDING_VERIFICATION';
  subscriptionTier?: 'free' | 'premium';
  subscriptionStatus?: "SUBSCRIBED" | "TRIAL" | "CANCEL";
  createdAt?: string;
  coverPhoto?: string;
  equipmentImages?: string[];
  isRequestSent?: boolean;
  isRequestReceived?: boolean;
  requestedBy?: any;
  huntingExperience?: string;
  skills?: string;
  bio?: string;
  phonenumber?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | string[] | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  displayname: string;
  username: string;
}

export interface ResetPasswordData {
  newPassword: string;
  token: string;
  email: string;
}

export interface OtpVerificationData {
  email: string;
  otp: string;
}

export interface RequestResetPasswordData {
  email: string;
}

export interface RegenerateOtpData {
  email: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  displayname?: string;
  profilePhoto?: string;
  coverPhoto?: string;
  equipmentImages?: string[];
  [key: string]: any;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface SocialLoginData {
  socialType: 'google' | 'facebook' | 'apple';
  socialToken: string;
  email?: string;
  name?: string;
  deviceToken?: string | any;
  deviceType?: string;
}