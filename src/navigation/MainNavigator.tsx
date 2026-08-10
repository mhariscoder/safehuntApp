// src/navigation/MainNavigator.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator = () => {
  const { user } = useAppSelector(state => state.auth);

  const [loading, setLoading] = useState(true);
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const determineAccess = useCallback(async () => {
    try {
      setLoading(true);

      const hasStartedTrial = await AsyncStorage.getItem(
        'HAS_STARTED_TRIAL',
      );

      console.log('========== ACCESS CHECK ==========');
      console.log('User:', user);
      console.log('Subscription Status:', user?.subscriptionStatus);
      console.log('HAS_STARTED_TRIAL:', hasStartedTrial);
      console.log('==================================');

      /**
       * 1. Active subscription
       * Always allow access.
       */
      if (user?.subscriptionStatus === 'SUBSCRIBED') {
        setNeedsSubscription(false);
        return;
      }

      /**
       * 2. User cancelled/expired subscription
       * Force subscription screen.
       */
      if (user?.subscriptionStatus === 'CANCELLED') {
        setNeedsSubscription(true);
        return;
      }

      /**
       * 3. Trial already started
       *
       * This is shared across all login providers:
       * Apple / Google / Facebook / Custom Login.
       */
      if (hasStartedTrial === 'true') {
        setNeedsSubscription(false);
        return;
      }

      /**
       * 4. Completely new user
       *
       * No subscription and no trial.
       */
      setNeedsSubscription(true);
    } catch (error) {
      console.error(
        'Error checking subscription access:',
        error,
      );

      /**
       * Fail safe:
       * If we cannot determine the user's access,
       * show the subscription screen.
       */
      setNeedsSubscription(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    determineAccess();
  }, [determineAccess]);

  /**
   * Keep global refreshNavigation for compatibility
   * with SubscriptionScreen.
   */
  useEffect(() => {
    // @ts-ignore
    global.refreshNavigation = async () => {
      console.log('🔄 Refreshing navigation access...');

      await determineAccess();
    };

    return () => {
      // @ts-ignore
      delete global.refreshNavigation;
    };
  }, [determineAccess]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={refreshKey}
      // Set initialRouteName dynamically based on subscription state
      initialRouteName={needsSubscription ? 'Subscription' : 'Home'}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {/* ALWAYS include both screens in the stack so navigation doesn't break */}
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
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