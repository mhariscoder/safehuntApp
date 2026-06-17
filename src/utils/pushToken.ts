import messaging from '@react-native-firebase/messaging';

export const getDeviceToken = async () => {
  try {
    await messaging().requestPermission();
    const token = await messaging().getToken();
    console.log('FCM TOKEN:', token);
    return token;
  } catch (e) {
    console.log('FCM error:', e);
    return '';
  }
};