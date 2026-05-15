// import React from 'react';
// import { StatusBar } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import BootSplash from 'react-native-bootsplash';

// import SplashScreen from './src/screens/SplashScreen';
// import WelcomeScreen from './src/screens/WelcomeScreen';
// import SignUpScreen from './src/screens/SignUpScreen';
// import SubscriptionScreen from './src/screens/SubscriptionScreen';
// import CardDetailScreen from './src/screens/CardDetailScreen';
// import HomeScreen from './src/screens/HomeScreen';
// import SignUpConfirmationScreen from './src/screens/SignUpConfirmationScreen';
// import LoginScreen from './src/screens/LoginScreen';
// import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
// import ForgotPasswordConfirmationScreen from './src/screens/ForgotPasswordConfirmationScreen';
// import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
// import FeedScreen from './src/screens/FeedScreen';
// import CreatePostScreen from './src/screens/CreatePostScreen';
// import NotificationScreen from './src/screens/NotificationScreen';
// import SettingScreen from './src/screens/SettingScreen';
// import MessageScreen from './src/screens/MessageScreen';
// import MessageDetailScreen from './src/screens/MessageDetailScreen';
// import ProfileScreen from './src/screens/ProfileScreen';
// import HuntingJournalScreen from './src/screens/HuntingJournalScreen';
// import NewNoteScreen from './src/screens/NewNoteScreen';

// const Stack = createNativeStackNavigator();

// const App = () => {
//   return (
//     <>
//       {/* Translucent status bar makes the gradient go to the very top */}
//       <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

//       <NavigationContainer
//         onReady={() => {
//           // BootSplash.hide({ fade: true });
//         }}
//       >
//         <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
//           <Stack.Screen name="Splash" component={SplashScreen} />
//           <Stack.Screen name="Welcome" component={WelcomeScreen} />
//           <Stack.Screen name="SignUp" component={SignUpScreen} />
//           <Stack.Screen name="SignUpConfirmation" component={SignUpConfirmationScreen} />
//           <Stack.Screen name="Login" component={LoginScreen} />
//           <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
//           <Stack.Screen name="ForgotPasswordConfirmation" component={ForgotPasswordConfirmationScreen} />
//           <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
//           <Stack.Screen name="Subscription" component={SubscriptionScreen} />
//           <Stack.Screen name="Home" component={HomeScreen} />
//           <Stack.Screen name="Feed" component={FeedScreen} />
//           <Stack.Screen name="CreatePost" component={CreatePostScreen} />
//           <Stack.Screen name="Notification" component={NotificationScreen} />
//           <Stack.Screen name="Settings" component={SettingScreen} />
//           <Stack.Screen name="Message" component={MessageScreen} />
//           <Stack.Screen name="MessageDetail" component={MessageDetailScreen} />
//           <Stack.Screen name="Profile" component={ProfileScreen} />
//           <Stack.Screen name="HuntingJournal" component={HuntingJournalScreen} />
//           <Stack.Screen name="NewNote" component={NewNoteScreen} />
//         </Stack.Navigator>
//       </NavigationContainer>
//     </>
//   );
// };

// export default App;

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { store, persistor } from './store';
import { RootNavigator } from '../navigation/RootNavigator';
import BootSplash from 'react-native-bootsplash';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5
    },
  },
});

const App = () => {
  useEffect(() => {
    const hideSplash = async () => {
      await BootSplash.hide({ fade: true });
    };
    hideSplash();
  }, []);

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <RootNavigator />
            <Toast />
          </SafeAreaProvider>
        </QueryClientProvider>
      </PersistGate>
    </ReduxProvider>
  );
};

export default App;