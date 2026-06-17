// src/navigation/MainNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import NotificationScreen from '../screens/NotificationScreen';
import SettingScreen from '../screens/SettingScreen';
import MessageScreen from '../screens/MessageScreen';
import MessageDetailScreen from '../screens/MessageDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HuntingJournalScreen from '../screens/HuntingJournalScreen';
import NewNoteScreen from '../screens/NewNoteScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import FriendsScreen from '../screens/FriendsScreen';
import GroupPostsScreen from '../screens/GroupPostsScreen';
import CreateGroupPostScreen from '../screens/CreateGroupPostScreen.tsx';
import CreateGroupScreen from '../screens/CreateGroupScreen.tsx';
import MapTestScreen from '../screens/MapTestScreen.tsx';
import TermsConditionsScreen from '../screens/TermsConditionsScreen.tsx';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen.tsx';
import BlockedUsersScreen from '../screens/BlockedUsersScreen.tsx';
import ChangePasswordScreen from '../screens/ChangePasswordScreen.tsx';
import PostDetailScreen from '../screens/PostDetailScreen';
import UserScreen from '../screens/UserScreen';
import WindyScreen from '../screens/WindyScreen.tsx';
import { useAppSelector } from '../app/store/hooks.ts';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);
  console.log('user', user)

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      {/* Main Tab Screens - now directly in stack */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="Message" component={MessageScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Windy" component={WindyScreen} />
      
      {/* Other Screens */}
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="Settings" component={SettingScreen} />
      <Stack.Screen name="MessageDetail" component={MessageDetailScreen} />
      <Stack.Screen name="HuntingJournal" component={HuntingJournalScreen} />
      <Stack.Screen name="NewNote" component={NewNoteScreen} />
      
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="GroupPosts" component={GroupPostsScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="CreateGroupPost" component={CreateGroupPostScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="MapTest" component={MapTestScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="User" component={UserScreen} />
    </Stack.Navigator>
  );
};