/**
 * @format
 */

import React from 'react';
import { Alert, AppRegistry } from 'react-native';
import { getApps, initializeApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

import App from './src/app/App';
import { name as appName } from './app.json';

const firebaseConfig = {
  apiKey: 'AIzaSyBIiKZErTuP2wbgiWDlGGJOop525sIIjLY',
  authDomain: 'testing-account-a89c1.firebaseapp.com',
  projectId: 'testing-account-a89c1',
  storageBucket: 'testing-account-a89c1.firebasestorage.app',
  messagingSenderId: '1025243047759',
  appId: '1:1025243047759:android:d4082637c6451e311bc73a',
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

// Handle FCM messages when app is in background/quit state
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('FCM Background Message:', JSON.stringify(remoteMessage, null, 2));

  // Don't use Alert.alert() here
  // Save to storage, update local DB, or schedule a notification instead
  Alert.alert(JSON.stringify(remoteMessage))
});

// iOS Headless Check
function HeadlessCheck({ isHeadless }) {
  if (isHeadless) {
    return null;
  }

  return <App />;
}

AppRegistry.registerComponent(appName, () => HeadlessCheck);