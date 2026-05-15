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
import { requestPasswordReset } from '../features/auth/authActions';
import { clearError } from '../features/auth/authSlice';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleSendCode = async () => {
    // Validation
    if (!emailOrPhone.trim()) {
      Alert.alert('Validation Error', 'Please enter your email or phone number');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailOrPhone)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    try {
      // Clear any previous errors
      dispatch(clearError());
      
      // Call the API
      const result = await dispatch(requestPasswordReset({ email: emailOrPhone })).unwrap();
      
      console.log('Password reset request response:', result);
      
      // Show success message
      Alert.alert(
        'Success',
        'Reset code sent successfully! Please check your email.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to confirmation screen with email
              navigation.navigate('ForgotPasswordConfirmation', { email: emailOrPhone });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Show error message from API
      let errorMessage = 'Failed to send reset code. Please try again.';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Error', errorMessage);
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={require('../../assets/back_arrow.png')} style={styles.backArrow} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <View style={{ width: 40 }} /> 
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Let's recover your account.</Text>
            <Text style={styles.subTitle}>
              Enter the email or phone number associated with your account.
            </Text>

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {Array.isArray(error) ? error.join(', ') : error}
                </Text>
              </View>
            )}

            <View style={styles.inputSection}>
              <CustomInput 
                placeholder="Email or phone number" 
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleSendCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#1D4D2F" size="small" />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

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
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40, flexGrow: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 100,
  },
  backButton: { padding: 5 },
  backArrow: { width: 21, height: 21, resizeMode: 'contain' },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  contentContainer: { flex: 1 },
  sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '400', marginBottom: 10 },
  subTitle: { color: '#FFF', fontSize: 14, opacity: 0.8, marginBottom: 30, lineHeight: 20 },
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
  inputSection: { marginBottom: 40 },
  input: {
    backgroundColor: '#004925',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 15,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  resetButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  resetButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  resetButtonText: { color: '#1D4D2F', fontSize: 14, fontWeight: '700' },
});

export default ForgotPasswordScreen;