import messaging from '@react-native-firebase/messaging';

export const getDeviceToken = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
    }

    const token = await messaging().getToken();

    console.log('FCM Token:', token);

    return token;
  } catch (error) {
    console.log('FCM error:', error);
    return null;
  }
};