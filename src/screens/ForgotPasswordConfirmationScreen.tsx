import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { otpVerification, regenerateOtp } from '../features/auth/authActions';
import { clearError } from '../features/auth/authSlice';

const ForgotPasswordConfirmationScreen = ({ navigation, route }: any) => {
  const email = route?.params?.email || "example123@gmail.com";
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleVerifyCode = async () => {
    // Validation
    if (!confirmationCode.trim()) {
      Alert.alert('Validation Error', 'Please enter the confirmation code');
      return;
    }

    if (confirmationCode.length < 4) {
      Alert.alert('Validation Error', 'Please enter a valid confirmation code');
      return;
    }

    try {
      // Clear any previous errors
      dispatch(clearError());
      
      // Call the OTP verification API
      const result = await dispatch(otpVerification({ 
        email: email, 
        otp: confirmationCode 
      })).unwrap();
      
      console.log('OTP verification response:', result);
      
      // Show success message and navigate to reset password
      Alert.alert(
        'Success',
        'Code verified successfully! Please set your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to reset password screen with email and token
              navigation.navigate('ResetPassword', { 
                email: email,
                token: result.token || confirmationCode // Pass the token if returned
              });
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
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header with Back Arrow */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={require('../../assets/back_arrow.png')} style={styles.backArrow} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <View style={{ width: 40 }} /> 
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.messageText}>
              A password reset code was sent to{"\n"}
              <Text style={styles.boldText}>{email}</Text>.
            </Text>

            <Text style={styles.instructionText}>
              Check your email and enter the code below.
            </Text>

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {Array.isArray(error) ? error.join(', ') : error}
                </Text>
              </View>
            )}

            {/* Confirmation Code Input */}
            <View style={styles.inputSection}>
              <CustomInput 
                placeholder="Confirmation Code" 
                value={confirmationCode}
                onChangeText={setConfirmationCode}
                keyboardType="number-pad"
                editable={!isLoading}
                maxLength={6}
              />
            </View>

            {/* Resend Code Link */}
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

            {/* Continue Button */}
            <TouchableOpacity 
              style={[styles.continueButton, (isLoading || isResending) && styles.continueButtonDisabled]}
              onPress={handleVerifyCode}
              disabled={isLoading || isResending}
            >
              {isLoading ? (
                <ActivityIndicator color="#1D4D2F" size="small" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Reusable Custom Input component
const CustomInput = (props: any) => (
  <TextInput
    style={[styles.input, props.editable === false && styles.inputDisabled]}
    placeholderTextColor="#A4A4A4"
    {...props}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: 25, 
    paddingBottom: 40, 
    flexGrow: 1 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 80,
  },
  backButton: { padding: 5 },
  backArrow: { width: 21, height: 21, resizeMode: 'contain' },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  messageText: { 
    color: '#FFF', 
    fontSize: 18, 
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 15,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  inputSection: {
    width: '100%',
    marginBottom: 20,
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
    textAlign: 'center'
  },
  inputDisabled: {
    opacity: 0.6,
  },
  resendText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 80,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  continueButtonText: { 
    color: '#1D4D2F', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  boldText: { 
    fontWeight: '900' 
  },
});

export default ForgotPasswordConfirmationScreen;