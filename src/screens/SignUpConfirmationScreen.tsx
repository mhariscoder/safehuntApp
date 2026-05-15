import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { otpVerification, regenerateOtp } from '../features/auth/authActions';
import { clearError, updateUser } from '../features/auth/authSlice';

const SignUpConfirmationScreen = ({ navigation, route }: any) => {
  const [code, setCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const email = route?.params?.email || '';
  
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleVerifyCode = async () => {
    // Validation
    if (!code.trim()) {
      Alert.alert('Validation Error', 'Please enter the confirmation code');
      return;
    }

    if (code.length < 4) {
      Alert.alert('Validation Error', 'Please enter a valid confirmation code');
      return;
    }

    try {
      // Clear any previous errors
      dispatch(clearError());
      
      // Call the OTP verification API
      const result = await dispatch(otpVerification({ 
        email: email, 
        otp: code 
      })).unwrap();
      
      console.log('OTP verification response:', result);
      
      // Update user status to OTP_VERIFIED
      dispatch(updateUser({ status: 'OTP_VERIFIED' }));
      
      // Show success message and navigate to subscription
      Alert.alert(
        'Success',
        'Email verified successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Subscription');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      console.error('OTP verification error:', err);
      
      // Show error message from API
      let errorMessage = 'Invalid verification code. Please try again.';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Verification Failed', errorMessage);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Email address not found');
      return;
    }

    try {
      setIsResending(true);
      
      // Call regenerate OTP API
      const result = await dispatch(regenerateOtp({ email: email })).unwrap();
      
      console.log('Regenerate OTP response:', result);
      
      Alert.alert(
        'Code Sent',
        `A new verification code has been sent to ${email}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('Resend code error:', err);
      
      let errorMessage = 'Failed to resend code. Please try again.';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0B733F', '#4E2D18', '#121212']}
        locations={[0.3, 1, 0.5]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          
          {/* Header matches your SignUpScreen exactly */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image 
                source={require('../../assets/back_arrow.png')} 
                style={styles.backArrow} 
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign Up</Text>
            <View style={{ width: 40 }} /> 
          </View>

          {/* Progress Indicators: Both are now white (progressActive) */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, styles.progressActive]} />
            <View style={[styles.progressBar, styles.progressActive]} />
          </View>

          {/* Confirmation Text Section */}
          <View style={styles.textSection}>
            <Text style={styles.mainMessage}>
              A confirmation code was sent to{'\n'}
              <Text style={styles.boldText}>{email}</Text>.
            </Text>

            <Text style={styles.subMessage}>
              Check your email and enter the code below.
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {Array.isArray(error) ? error.join(', ') : error}
              </Text>
            </View>
          )}

          {/* Confirmation Code Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isLoading && styles.inputDisabled]}
              placeholder="Confirmation Code"
              placeholderTextColor="#A4A4A4"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              editable={!isLoading}
              maxLength={6}
            />
            
            <TouchableOpacity 
              onPress={handleResendCode}
              disabled={isLoading || isResending}
            >
              <Text style={styles.resendText}>
                Didn't receive a code?{' '}
                <Text style={styles.boldText}>
                  {isResending ? 'Sending...' : 'Send again.'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.continueButton, (isLoading || isResending) && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={isLoading || isResending}
            >
              {isLoading ? (
                <ActivityIndicator color="#1D4D2F" size="small" />
              ) : (
                <Text style={styles.continueText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 25 },
  
  // Header styles (Copied from your reference)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 50,
  },
  backButton: { 
    // padding: 10 
  },
  backArrow: { width: 21, height: 21, resizeMode: 'contain' },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },

  // Progress Bar (Copied from your reference)
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 80,
  },
  progressBar: {
    height: 8,
    width: 46,
    borderRadius: 3,
    marginHorizontal: 10,
  },
  progressActive: { backgroundColor: '#FFF' },

  // Text Section
  textSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainMessage: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  subMessage: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    opacity: 0.9,
  },

  // Error Container
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },

  // Input styles
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#004925',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 2,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  resendText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },

  // Primary Button
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  continueText: { 
    color: '#1D4D2F', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  boldText: { fontWeight: '900' },
});

export default SignUpConfirmationScreen;