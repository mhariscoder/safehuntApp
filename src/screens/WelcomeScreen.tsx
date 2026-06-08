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

// Native SDK SSO integration module
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

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
  const [localLoading, setLocalLoading] = useState<boolean>(false);

  // Combine both loading sources to prevent button interactions while processing
  const isAuthenticating = localLoading || reduxLoading;

  const handleGoogleSignIn = async () => {
    try {
      setLocalLoading(true);
      await GoogleSignin.hasPlayServices();
      
      // 1. Fire up native Google Single Sign-On window interface
      const signInResponse = await GoogleSignin.signIn();
      console.log('Google Sign-In Response:', signInResponse);
      const { idToken, user } = signInResponse.data;

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
          deviceToken: '', // Pass real system identifier token if available
          deviceType: Platform.OS, // Automatically flags system as 'ios' or 'android'
        })
      );

      // 3. Evaluate store response result status matching criteria rules
      if (loginViaSocialToken.fulfilled.match(resultAction)) {
        Alert.alert('Success', 'Logged in successfully!');
        // Note: If your App component shifts layout flows reactively based on 
        // state.auth.isAuthenticated, navigation transitions happen automatically.
        // Otherwise, manually switch stacks here:
        // navigation.replace('MainTabs'); 
      } else {
        // Fallback catch showing validation error messages received from NestJS
        const errorMessage = resultAction.payload as string;
        throw new Error(errorMessage || 'Server rejected authorization context.');
      }

    } catch (error: any) {
      console.error(error);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0B733F', '#4E2D18', '#121212']}
        locations={[0.3, 1, 0.5]}
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

          {/* Social Sign Up - Connected via Redux Dispatcher Action */}
          <TouchableOpacity 
            style={styles.socialLink}
            onPress={handleGoogleSignIn}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
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

          <TouchableOpacity 
            style={styles.phoneLink}
            onPress={() => navigation.navigate('Subscription')}
            disabled={isAuthenticating}
          >
            <Text style={styles.phoneText}>Sign Up With Phone Number</Text>
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
    marginBottom: 60,
    height: 30, // Keeps layout dimension sizing strict and static while UI activity spinners toggle
  },
  socialText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  phoneLink: {
    marginBottom: 20,
  },
  phoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;