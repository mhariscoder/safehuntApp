import React, { useEffect, useRef } from 'react';
import { StatusBar, Platform, Alert, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { check, request, openSettings, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
import * as RNAndroidLocationEnabler from 'react-native-android-location-enabler';

import { store, persistor } from './store';
import { RootNavigator } from '../navigation/RootNavigator';
import BootSplash from 'react-native-bootsplash';

import './../config/googleAuth';

import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs();//Ignore all log notifications

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5
    },
  },
});

const App = () => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const initApp = async () => {
      // CRITICAL FIX 1: Clear the splash screen FIRST. 
      // Native window alerts can get buried underneath the splash layer layout.
      await BootSplash.hide({ fade: true });
      
      // Run checks right after splash fades out
      await handleLocationChecks();
    };
    initApp();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        handleLocationChecks();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleLocationChecks = async () => {
    const locationPermission = Platform.select({
      ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    });

    if (!locationPermission) return;

    try {
      const status = await check(locationPermission);
      console.log("Current permission status status:", status); // Debug log

      if (status === RESULTS.GRANTED) {
        // CRITICAL FIX 2: Check hardware switch directly on Android instead of waiting for geolocation to fail
        verifyDeviceLocationService();
      } else if (status === RESULTS.DENIED || status === RESULTS.LIMITED) {
        const requestResult = await request(locationPermission);
        if (requestResult === RESULTS.GRANTED) {
          verifyDeviceLocationService();
        } else {
          showPermissionDeniedAlert();
        }
      } else if (status === RESULTS.BLOCKED) {
        showPermissionDeniedAlert();
      }
    } catch (error) {
      console.warn("Location permission flow error:", error);
    }
  };

  const verifyDeviceLocationService = async () => {
    if (Platform.OS === 'android') {
      try {
        // Trigger the Google Play Services Popup Directly inside your app frame
        const result = await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
          interval: 10000
        });
        
        console.log("Enabler result status:", result);
        if (result === 'already-enabled' || result === 'enabled') {
          // Success! Clear check by fetching real location stream
          triggerLocationFetch();
        }
      } catch (err) {
        console.log("User rejected location prompt:", err);
        // User clicked "No thanks", loop them back to enforce app operational rule
        verifyDeviceLocationService();
      }
    } else {
      // iOS handling
      triggerLocationFetch();
    }
  };

  const triggerLocationFetch = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        console.log("Location successfully acquired:", position);
      },
      (error) => {
        console.log("Geolocation read error context:", error.code, error.message);
        // If it timed out (code 3) but location switch is on, try again without rigid constraints
        if (error.code === 3) {
           triggerLocationFetch();
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 } // Loosened restrictions for faster cold-boots
    );
  };

  const showPermissionDeniedAlert = () => {
    Alert.alert(
      "Permission Required",
      "This app cannot function without location access. Please enable it in system settings.",
      [
        {
          text: "Open Settings",
          onPress: () => {
            openSettings().catch(() => console.warn("Cannot open settings"));
          }
        }
      ],
      { cancelable: false }
    );
  };

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