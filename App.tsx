import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BootSplash from 'react-native-bootsplash';

import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import CardDetailScreen from './src/screens/CardDetailScreen';
import HomeScreen from './src/screens/HomeScreen';
import SignUpConfirmationScreen from './src/screens/SignUpConfirmationScreen';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ForgotPasswordConfirmationScreen from './src/screens/ForgotPasswordConfirmationScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <>
      {/* Translucent status bar makes the gradient go to the very top */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <NavigationContainer
        onReady={() => {
          // BootSplash.hide({ fade: true });
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="SignUpConfirmation" component={SignUpConfirmationScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ForgotPasswordConfirmation" component={ForgotPasswordConfirmationScreen} />
          <Stack.Screen name="ResetPassowrd" component={ResetPasswordScreen} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;