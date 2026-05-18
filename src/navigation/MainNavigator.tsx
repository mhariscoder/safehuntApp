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
import AvailableEquipmentScreen from '../screens/AvailableEquipmentScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      {/* Main Tab Screens - now directly in stack */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="Message" component={MessageScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      
      {/* Other Screens */}
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="Settings" component={SettingScreen} />
      <Stack.Screen name="MessageDetail" component={MessageDetailScreen} />
      <Stack.Screen name="HuntingJournal" component={HuntingJournalScreen} />
      <Stack.Screen name="NewNote" component={NewNoteScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="AvailableEquipment" component={AvailableEquipmentScreen} />
    </Stack.Navigator>
  );
};