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
import { resetPassword } from '../features/auth/authActions';
import { clearError } from '../features/auth/authSlice';

const ResetPasswordScreen = ({ navigation, route }: any) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Get email and token from route params
  const email = route?.params?.email || '';
  const token = route?.params?.token || '';
  
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Password validation function
  const validatePassword = (pass: string) => {
    const hasMinLength = pass.length >= 8;
    const hasSpecialChar = /[!@#$%&]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    
    return {
      isValid: hasMinLength && hasSpecialChar && hasNumber,
      hasMinLength,
      hasSpecialChar,
      hasNumber,
    };
  };

  const handleResetPassword = async () => {
    // Validation
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter a new password');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Validation Error', 'Please confirm your password');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Password Requirements',
        'Password must contain:\n• At least 8 characters\n• At least 1 special character (!@#$%&)\n• At least 1 number'
      );
      return;
    }

    try {
      // Clear any previous errors
      dispatch(clearError());
      
      // Call the reset password API
      const payload = { 
        newPassword: password,
        token: token,
        email: email
      }
      console.log('Reset password payload:', payload);
      await dispatch(resetPassword(payload)).unwrap();
      
      // Show success message
      Alert.alert(
        'Success',
        'Your password has been reset successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      console.error('Reset password error:', err);
      
      // Show error message from API
      let errorMessage = 'Failed to reset password. Please try again.';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Reset Failed', errorMessage);
    }
  };

  // Get password validation status for visual feedback
  const passwordValidation = validatePassword(password);
  const isPasswordValid = passwordValidation.isValid;

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
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={require('../../assets/back_arrow.png')} style={styles.backArrow} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <View style={{ width: 40 }} /> 
          </View>

          {/* Form Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Create new password</Text>

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
                placeholder="Password *" 
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                editable={!isLoading}
              />
              
              <CustomInput 
                placeholder="Confirm Password *" 
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
                editable={!isLoading}
              />
            </View>

            {/* Password Requirements with visual indicators */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsHeader}>Password requirements:</Text>
              
              <View style={styles.bulletRow}>
                <View style={[
                  styles.bullet, 
                  password && (passwordValidation.hasMinLength ? styles.bulletValid : styles.bulletInvalid)
                ]} />
                <Text style={[
                  styles.requirementText,
                  password && passwordValidation.hasMinLength && styles.requirementValid
                ]}>
                  Must contain at least 8 characters
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <View style={[
                  styles.bullet,
                  password && (passwordValidation.hasSpecialChar ? styles.bulletValid : styles.bulletInvalid)
                ]} />
                <Text style={[
                  styles.requirementText,
                  password && passwordValidation.hasSpecialChar && styles.requirementValid
                ]}>
                  Must contain at least 1 special symbol (!@#$%&)
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <View style={[
                  styles.bullet,
                  password && (passwordValidation.hasNumber ? styles.bulletValid : styles.bulletInvalid)
                ]} />
                <Text style={[
                  styles.requirementText,
                  password && passwordValidation.hasNumber && styles.requirementValid
                ]}>
                  Must contain at least 1 number
                </Text>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={[styles.resetButton, (isLoading || !isPasswordValid) && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading || !isPasswordValid}
            >
              {isLoading ? (
                <ActivityIndicator color="#1D4D2F" size="small" />
              ) : (
                <Text style={styles.resetButtonText}>Reset Password</Text>
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
  contentContainer: { flex: 1 },
  sectionTitle: { 
    color: '#FFF', 
    fontSize: 22, 
    fontWeight: '400',
    marginBottom: 30 
  },
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
  inputSection: {
    marginBottom: 23,
  },
  input: {
    backgroundColor: '#004925',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: '#FFF',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 15,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  requirementsContainer: {
    marginBottom: 50,
    paddingHorizontal: 15
  },
  requirementsHeader: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 15,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingRight: 20,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginTop: 6,
    marginRight: 10,
    opacity: 0.6,
  },
  bulletValid: {
    backgroundColor: '#4CAF50',
    opacity: 1,
  },
  bulletInvalid: {
    backgroundColor: '#FF6B6B',
    opacity: 1,
  },
  requirementText: {
    color: '#FFF',
    fontSize: 13,
    opacity: 0.6,
    lineHeight: 18,
  },
  requirementValid: {
    opacity: 1,
    color: '#4CAF50',
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
  resetButtonText: { 
    color: '#1D4D2F', 
    fontSize: 14, 
    fontWeight: '700' 
  },
});

export default ResetPasswordScreen;