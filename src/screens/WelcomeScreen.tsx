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
  Linking,
  Modal,
  TextInput,
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
import { appleAuth } from '@invertase/react-native-apple-authentication';

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
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | 'apple' | null>(null);
  
  // EULA Acceptance State
  const [hasAcceptedEULA, setHasAcceptedEULA] = useState(false);

  const [showAppleNameModal, setShowAppleNameModal] = useState(false);
  const [appleName, setAppleName] = useState('');

  const [appleData, setAppleData] = useState({
    identityToken: '',
    email: '',
  });

  // Combine both loading sources to prevent button interactions while processing
  const isAuthenticating = loadingProvider !== null || reduxLoading;

  // The final disabled status for all buttons: They cannot be pressed if currently authenticating,
  // or if the mandatory EULA checkbox has not been accepted yet.
  const isButtonDisabled = isAuthenticating || !hasAcceptedEULA;

  // Helper to securely open terms & privacy links
  const openURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', `Cannot open webpage: ${url}`);
    }
  };

  // --- GOOGLE SIGN IN ---
  const handleGoogleSignIn = async () => {
    // if (isButtonDisabled) return;
    try {
      setLoadingProvider('google');
      await GoogleSignin.hasPlayServices();
      
      // 1. Fire up native Google Single Sign-On window interface
      const signInResponse = await GoogleSignin.signIn();
      console.log('Google Sign-In Response:', signInResponse);

      // Defensively target data across newer/older Google SDK return structures
      const data = signInResponse.data || signInResponse;
      const { idToken, user } = data as any;

      if (!idToken) {
        throw new Error('Failed to retrieve ID token from Google initialization.');
      }

      const deviceToken = await getDeviceToken();

      // 2. Dispatch the SocialLoginData payload directly into your updated Redux flow
      const resultAction = await dispatch(
        loginViaSocialToken({
          socialType: 'google',
          socialToken: idToken,
          email: user.email,
          name: user.name ?? '',
          deviceToken: deviceToken, 
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
    // if (isButtonDisabled) return;
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

  // --- APPLE SIGN IN ---
  const handleAppleSignIn = async () => {
    // if (isButtonDisabled) return;
    try {
      setLoadingProvider('apple');

      // 1. Request credential authorization from Apple Native Client
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      // 2. Extract identityToken used for secure back-end API verification
      const { identityToken, email, fullName } = appleAuthRequestResponse;

      if (!identityToken) {
        throw new Error('Apple Sign-In failed to return an identity token.');
      }

      // Build fallback name if details are passed by Apple OS (Only happens on first authentication)
      const computedName = fullName 
        ? `${fullName.givenName ?? ''} ${fullName.familyName ?? ''}`.trim() 
        : '';

      const deviceToken = await getDeviceToken();


      if (!computedName) {
        setAppleData({
          identityToken: identityToken!,
          email: email ?? '',
        });

        setShowAppleNameModal(true);
        return;
      }

      // 3. Dispatch payload directly into your Redux Action pipeline
      const resultAction = await dispatch(
        loginViaSocialToken({
          socialType: 'apple',
          socialToken: identityToken,
          email: email ?? '',
          name: computedName,
          deviceToken: deviceToken,
          deviceType: Platform.OS,
        })
      );

      if (loginViaSocialToken.fulfilled.match(resultAction)) {
        Alert.alert('Success', 'Logged in successfully with Apple!');
      } else {
        const errorMessage = resultAction.payload as string;
        throw new Error(errorMessage || 'Server rejected Apple authorization token.');
      }

    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
        console.log('User canceled Apple Sign-In');
      } else {
        console.error('Apple Sign-In Error:', error);
        Alert.alert('Apple Sign-In Error', error.message || 'An error occurred.');
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const submitAppleName = async () => {
    setLoadingProvider('apple');

    try {
      const trimmedName = appleName.trim();

      if (!trimmedName) {
        Alert.alert('Validation', 'Please enter your full name.');
        return;
      }

      const deviceToken = await getDeviceToken();

      setShowAppleNameModal(false);

      const resultAction = await dispatch(
        loginViaSocialToken({
          socialType: 'apple',
          socialToken: appleData.identityToken,
          email: appleData.email,
          name: trimmedName,
          deviceToken,
          deviceType: Platform.OS,
        }),
      );

      if (loginViaSocialToken.fulfilled.match(resultAction)) {
        setAppleName('');
        setAppleData({
          identityToken: '',
          email: '',
        });

        Alert.alert('Success', 'Logged in successfully with Apple!');
      } else {
        Alert.alert(
          'Apple Sign-In Error',
          (resultAction.payload as string) || 'Login failed.',
        );
      }
    } catch (error) {
      console.error('Apple name submit error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (

    <>
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

      <SafeAreaView style={styles.content}>
        
        <LogoComponent style={{ marginTop: 20 }} />

        {/* Buttons and EULA Section */}
        <View style={styles.buttonContainer}>
          
          {/* --- MANDATORY EULA CHECKBOX --- */}
          {/* <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={styles.checkbox} 
              onPress={() => setHasAcceptedEULA(!hasAcceptedEULA)}
              activeOpacity={0.8}
            >
              {hasAcceptedEULA && <View style={styles.checkboxInner} />}
            </TouchableOpacity>
            
            <Text style={styles.checkboxText}>
              I agree to the{' '}
              <Text style={styles.link} onPress={() => openURL('https://safehunt.app/terms-and-conditions')}>
                Terms of Use (EULA)
              </Text>
              {' '}and{' '}
              <Text style={styles.link} onPress={() => openURL('https://safehunt.app/privacy')}>
                Privacy Policy
              </Text>
              . I understand there is absolutely zero tolerance for objectionable content or abusive users.
            </Text>
          </View> */}

          {/* Sign Up Button */}
          <TouchableOpacity 
            style={[styles.signUpButton, isButtonDisabled && styles.disabledButtonOpacity]}
            onPress={() => navigation.navigate('SignUp')}
            // disabled={isButtonDisabled}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Log In Button */}
          <TouchableOpacity 
            style={[styles.logInButton, isButtonDisabled && styles.disabledButtonOpacity]}
            onPress={() => navigation.navigate('Login')}
            // disabled={isButtonDisabled}
          >
            <Text style={styles.logInText}>Log In</Text>
          </TouchableOpacity>

          {/* Google Sign In */}
          <TouchableOpacity 
            style={[styles.socialLink, isButtonDisabled && styles.disabledSocialOpacity]}
            onPress={handleGoogleSignIn}
            // disabled={isButtonDisabled}
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
            style={[styles.socialLink, isButtonDisabled && styles.disabledSocialOpacity]}
            onPress={handleFacebookSignIn}
            // disabled={isButtonDisabled}
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

          {/* Apple Sign In */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={[styles.socialLink, isButtonDisabled && styles.disabledSocialOpacity]}
              onPress={handleAppleSignIn}
              // disabled={isButtonDisabled}
            >
              {loadingProvider === 'apple' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.socialText}>Sign Up With </Text>
                  <Image
                    source={require('../../assets/apple-logo.png')}
                    style={{ marginLeft: 5, width: 20, height: 20, tintColor: '#FFFFFF' }}
                    resizeMode="contain"
                  />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
      <Modal
        visible={showAppleNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>

            <Text style={styles.title}>Complete Your Profile</Text>

            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#888"
              value={appleName}
              onChangeText={setAppleName}
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={submitAppleName}
            />

            <TouchableOpacity
              onPress={submitAppleName}
              style={styles.button}
              disabled={loadingProvider === 'apple'}
            >
              {loadingProvider === 'apple' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </>
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
    paddingVertical: 30,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  // --- Checkbox Styling ---
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  checkboxText: {
    flex: 1,
    color: '#E5E5EA',
    fontSize: 12,
    lineHeight: 16,
  },
  link: {
    color: '#34C759', // Green accent matching your brand
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  // --- Button & Opacity Styling ---
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
    marginBottom: 30,
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
    marginVertical: 10,
  },
  socialText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  // Dims the registration buttons to 40% opacity when the EULA is not checked
  disabledButtonOpacity: {
    // opacity: 0.4,
  },
  // Dims the social login buttons to 40% opacity when the EULA is not checked
  disabledSocialOpacity: {
    // opacity: 0.4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    width: '100%',
    backgroundColor: '#1B1B1B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#0E713E',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#FFFFFF',
    backgroundColor: '#2A2A2A',
    fontSize: 16,
    marginBottom: 20,
  },

  button: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#0E713E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default WelcomeScreen;