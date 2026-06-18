import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { navigationRef } from './navigationRef';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import LoadingScreen from '../screens/LoadingScreen';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import { checkAuth } from '../features/auth/authActions';
import { setOffline } from '../features/ui/uiSlice';
import NetInfo from '@react-native-community/netinfo';
import { resetAndNavigate } from './navigationRef';
import SignUpConfirmationScreen from '../screens/SignUpConfirmationScreen';
import { Alert } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const initializeAuth = async () => {
      await dispatch(checkAuth());
    };
    
    // initializeAuth();
    
    // Network listener
    const unsubscribe = NetInfo.addEventListener(state => {
      dispatch(setOffline(!state.isConnected));
    });

    return () => unsubscribe();
  }, []);

  // Check if user needs email verification
  const needsVerification = user?.status === 'PENDING_VERIFICATION';
  const isVerified = user?.status === 'OTP_VERIFIED';

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {
          !isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) 
          : needsVerification ? (
            // If user is authenticated but not verified, redirect to verification
            <Stack.Screen name="SignUpConfirmation" component={SignUpConfirmationScreen} />
          ) 
          : (
            <Stack.Screen name="Main" component={MainNavigator} />
          )
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
};