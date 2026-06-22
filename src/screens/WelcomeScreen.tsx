import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LogoComponent from '../components/LogoComponent';

// Redux Core Integration imports
import { useDispatch, useSelector } from 'react-redux';
import { loginViaSocialToken } from '../features/auth/authActions';
import { AppDispatch, RootState } from '../app/store';

// Native SDK SSO integration modules
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken, Profile } from 'react-native-fbsdk-next';
import { getDeviceToken } from '../utils/pushToken';

const { width } = Dimensions.get('window');

// Initialize Google Configuration outside component lifecycle
GoogleSignin.configure({
  webClientId: '1025243047759-dborv8d3da2nrilgj0fd5rq7ib6div55.apps.googleusercontent.com',
  offlineAccess: true,
});

const WelcomeScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Connect cleanly to your auth state loading wrapper from slice
  const { isLoading: reduxLoading } = useSelector((state: RootState) => state.auth);
  const [loadingProvider, setLoadingProvider] = useState<
    'google' | 'facebook' | null
  >(null);

  // Combine both loading sources to prevent button interactions while processing
  const isAuthenticating =
  loadingProvider !== null || reduxLoading;

  // --- GOOGLE SIGN IN ---
  const handleGoogleSignIn = async () => {
    try {
      setLoadingProvider('google');
      await GoogleSignin.hasPlayServices();
      
      // 1. Fire up native Google Single Sign-On window interface
      const signInResponse = await GoogleSignin.signIn();
      console.log('Google Sign-In Response:', signInResponse);

      // Defensively target data across newer/older Google SDK return structures
      const data = signInResponse.data || signInResponse;
      const { idToken, user } = data;

      if (!idToken) {
        throw new Error('Failed to retrieve ID token from Google initialization.');
      }

      // 2. Dispatch the SocialLoginData payload directly into your updated Redux flow
      const resultAction = await dispatch(
        loginViaSocialToken({
          socialType: 'google',
          socialToken: idToken,
          email: user.email,
          name: user.name ?? '',
          deviceToken: '', 
          deviceType: Platform.OS, 
        })
      );

      // 3. Evaluate store response result status matching criteria rules
      if (loginViaSocialToken.fulfilled.match(resultAction)) {
        Alert.alert('Success', 'Logged in successfully with Google!');
      } else {
        const errorMessage = resultAction.payload as string;
        throw new Error(errorMessage || 'Server rejected authorization context.');
      }

    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Google Sign-In Error', error.message || 'An error occurred.');
    } finally {
      setLoadingProvider(null);
    }
  };

  // --- FACEBOOK SIGN IN ---
  const handleFacebookSignIn = async () => {
    try {
      setLoadingProvider('facebook');

      // 1. Prompt the user to log in via native Facebook UI/Browser
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw new Error('User cancelled the Facebook login process.');
      }

      // 2. Grab the access token from the successful SDK session
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) {
        throw new Error('Something went wrong obtaining the Facebook access token.');
      }
      const facebookAccessToken = data.accessToken.toString();

      // 3. Request Profile data to harvest name and email values natively
      const currentProfile = await Profile.getCurrentProfile();
      
      // Note: If currentProfile email field comes back empty (user signed up with a phone number on FB),
      // fallback to an empty string or build a custom fallback string.
      const userEmail = currentProfile?.email ?? '';
      const userName = currentProfile?.name ?? '';

      const deviceToken = await getDeviceToken();

      // 4. Dispatch identical layout directly into your NestJS/Firebase API gateway payload
      const resultAction = await dispatch(
        loginViaSocialToken({
          socialType: 'facebook',
          socialToken: facebookAccessToken,
          email: userEmail,
          name: userName,
          deviceToken: deviceToken, 
          deviceType: Platform.OS,
        })
      );

      if (loginViaSocialToken.fulfilled.match(resultAction)) {
        Alert.alert('Success', 'Logged in successfully with Facebook!');
      } else {
        const errorMessage = resultAction.payload as string;
        throw new Error(errorMessage || 'Server rejected Facebook credentials token.');
      }

    } catch (error: any) {
      console.error('Facebook Sign-In Error:', error);
      Alert.alert('Facebook Sign-In Error', error.message || 'An error occurred.');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0B733F', '#4E2D18', '#121212']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        
        <LogoComponent style={{ marginTop: 60 }} />

        {/* Buttons Section */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={() => navigation.navigate('SignUp')}
            disabled={isAuthenticating}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logInButton}
            onPress={() => navigation.navigate('Login')}
            disabled={isAuthenticating}
          >
            <Text style={styles.logInText}>Log In</Text>
          </TouchableOpacity>

          {/* Google Sign In */}
          <TouchableOpacity 
            style={styles.socialLink}
            onPress={handleGoogleSignIn}
            disabled={isAuthenticating}
          >
            {loadingProvider === 'google' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.socialText}>Sign Up With </Text>
                <Image
                  source={require('../../assets/logos_google-icon.png')}
                  style={{ marginLeft: 5, width: 20, height: 20 }}
                  resizeMode="contain"
                />
              </>
            )}
          </TouchableOpacity>

          {/* Facebook Sign In */}
          <TouchableOpacity 
            style={styles.socialLink}
            onPress={handleFacebookSignIn}
            disabled={isAuthenticating}
          >
            {loadingProvider === 'facebook' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.socialText}>Sign Up With </Text>
                <Image
                  source={require('../../assets/fb-logo.png')}
                  style={{ marginLeft: 5, width: 20, height: 20 }}
                  resizeMode="contain"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  signUpButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  signUpText: {
    color: '#1D4D2F',
    fontSize: 14,
    fontWeight: '700',
  },
  logInButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 40,
  },
  logInText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    marginVertical: 10
  },
  socialText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default WelcomeScreen;