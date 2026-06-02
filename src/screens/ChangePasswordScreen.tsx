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
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { changePassword } from '../features/auth/authActions';
import { clearError } from '../features/auth/authSlice';

const ChangePasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Password validation function (min 6, max 20 as per backend)
  const validatePassword = (pass: string) => {
    const hasMinLength = pass.length >= 6 && pass.length <= 20;
    const hasSpecialChar = /[!@#$%&]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    
    return {
      isValid: hasMinLength && hasSpecialChar && hasNumber,
      hasMinLength,
      hasSpecialChar,
      hasNumber,
    };
  };

  const handleChangePassword = async () => {
    // Validation for current password
    if (!currentPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your current password');
      return;
    }

    // Validation for new password
    if (!newPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter a new password');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Validation Error', 'Please confirm your new password');
      return;
    }

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match');
      return;
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      Alert.alert('Validation Error', 'New password must be different from current password');
      return;
    }

    // Validate password length (6-20 characters as per backend)
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword.length > 20) {
      Alert.alert('Validation Error', 'Password must be at most 20 characters');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Password Requirements',
        'Password must contain:\n• 6-20 characters\n• At least 1 special character (!@#$%&)\n• At least 1 number'
      );
      return;
    }

    try {
      // Clear any previous errors
      dispatch(clearError());
      
      // Call the change password API with correct field names
      const payload = { 
        currentPassword: currentPassword,
        newPassword: newPassword,
      };
      console.log('Change password payload:', { 
        currentPassword: '***', 
        newPassword: '***' 
      });
      await dispatch(changePassword(payload)).unwrap();
      
      // Show success message
      Alert.alert(
        'Success',
        'Your password has been changed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
        { cancelable: false }
      );
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Change password error:', err);
      
      // Show error message from API
      let errorMessage = 'Failed to change password. Please try again.';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Change Failed', errorMessage);
    }
  };

  // Get password validation status for visual feedback
  const passwordValidation = validatePassword(newPassword);
  const isPasswordValid = newPassword ? passwordValidation.isValid : true;

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
            <Text style={styles.headerTitle}>Change Password</Text>
            <View style={{ width: 40 }} /> 
          </View>

          {/* Form Content */}
          <View style={styles.contentContainer}>
            {/* <Text style={styles.sectionTitle}>Change your password</Text> */}

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
                placeholder="Current Password *" 
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={true}
                editable={!isLoading}
              />
              
              <CustomInput 
                placeholder="New Password *" 
                value={newPassword}
                onChangeText={setNewPassword}
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
                  newPassword && (passwordValidation.hasMinLength ? styles.bulletValid : styles.bulletInvalid)
                ]} />
                <Text style={[
                  styles.requirementText,
                  newPassword && passwordValidation.hasMinLength && styles.requirementValid
                ]}>
                  Must contain 6-20 characters
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <View style={[
                  styles.bullet,
                  newPassword && (passwordValidation.hasSpecialChar ? styles.bulletValid : styles.bulletInvalid)
                ]} />
                <Text style={[
                  styles.requirementText,
                  newPassword && passwordValidation.hasSpecialChar && styles.requirementValid
                ]}>
                  Must contain at least 1 special symbol (!@#$%&)
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <View style={[
                  styles.bullet,
                  newPassword && (passwordValidation.hasNumber ? styles.bulletValid : styles.bulletInvalid)
                ]} />
                <Text style={[
                  styles.requirementText,
                  newPassword && passwordValidation.hasNumber && styles.requirementValid
                ]}>
                  Must contain at least 1 number
                </Text>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={[
                styles.changeButton, 
                (isLoading || (newPassword && !isPasswordValid)) && styles.changeButtonDisabled
              ]}
              onPress={handleChangePassword}
              disabled={isLoading || (!!newPassword && !isPasswordValid)}
            >
              {isLoading ? (
                <ActivityIndicator color="#1D4D2F" size="small" />
              ) : (
                <Text style={styles.changeButtonText}>Change Password</Text>
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
    marginBottom: 60,
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
  changeButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  changeButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  changeButtonText: { 
    color: '#1D4D2F', 
    fontSize: 14, 
    fontWeight: '700' 
  },
});

export default ChangePasswordScreen;