// src/navigation/types.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  SignUpConfirmation: { email: string };
  ForgotPassword: undefined;
  ForgotPasswordConfirmation: { email: string };
  ResetPassword: { token: string };
};

export type MainStackParamList = {
  // Main screens
  Home: undefined;
  Feed: undefined;
  Notification: undefined;
  Message: undefined;
  Profile: { userId?: string };
  
  // Other screens
  CreatePost: undefined;
  Settings: undefined;
  MessageDetail: { messageId: string };
  HuntingJournal: undefined;
  NewNote: undefined;
  Subscription: undefined;
  CardDetail: undefined;
  Friends: undefined;
  AvailableEquipment: undefined;
  GroupPosts: { groupId: number; groupName: string; groupLogo?: string; groupCover?: string; groupDescription?: string };
  CreateGroup: undefined;
  CreateGroupPost: { groupId: number; groupName: string };
  
  TermsConditions: undefined;
  PrivacyPolicy: undefined;
  BlockedUsers: undefined;
  ChangePassword: undefined;
  MapTest: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  SignUpConfirmation: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type AuthScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;
  
export type MainScreenProps<T extends keyof MainStackParamList> = 
  NativeStackScreenProps<MainStackParamList, T>;