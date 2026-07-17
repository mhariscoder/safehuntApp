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
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { signup } from '../features/auth/authActions';
import { clearError } from '../features/auth/authSlice';

const SignUpScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    email: '',
    displayname: '',  // Changed from displayName to displayname
    username: '',
    password: '',
    confirmPassword: '',  // Added confirmPassword field
  });
  const [hasAcceptedEULA, setHasAcceptedEULA] = useState(false);

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

  // Validate form before submission
  const validateForm = () => {
    // Check required fields
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    if (!formData.displayname.trim()) {
      Alert.alert('Validation Error', 'Display name is required');
      return false;
    }

    if (formData.displayname.length < 4) {
      Alert.alert('Validation Error', 'Display name must be at least 4 characters');
      return false;
    }

    if (!formData.username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return false;
    }

    if (formData.username.length < 3) {
      Alert.alert('Validation Error', 'Username must be at least 3 characters');
      return false;
    }

    if (!formData.password) {
      Alert.alert('Validation Error', 'Password is required');
      return false;
    }

    // Password strength validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Password Requirements',
        'Password must contain:\n• At least 8 characters\n• At least 1 special character (!@#$%&)\n• At least 1 number'
      );
      return false;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }

    if (!hasAcceptedEULA) {
      Alert.alert(
        'Agreement Required',
        'Please accept the Terms of Use (EULA) and Privacy Policy to continue.'
      );
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Clear any previous errors
      dispatch(clearError());
      
      // Call the signup API with correct field names
      const result = await dispatch(signup({
        email: formData.email,
        password: formData.password,
        displayname: formData.displayname,  // Changed from name to displayname
        username: formData.username,
        confirmPassword: formData.confirmPassword,  // Added confirmPassword
      })).unwrap();
      
      console.log('Signup response:', result);
      
      // Show success message and navigate to confirmation
      Alert.alert(
        'Success',
        'Account created successfully! Please verify your email.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('SignUpConfirmation', { 
                email: formData.email 
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Show error message from API
      let errorMessage = 'Failed to create account. Please try again.';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert('Signup Failed', errorMessage);
    }
  };

  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get password validation status
  const passwordValidation = validatePassword(formData.password);
  const isPasswordValid = formData.password ? passwordValidation.isValid : true;

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
          
          {/* Header with Back Arrow & Progress */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Welcome')} style={styles.backButton}>
              <Image source={require('../../assets/back_arrow.png')} style={styles.backArrow} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign Up</Text>
            <View style={{ width: 40 }} /> 
          </View>

          {/* Progress Indicators */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, styles.progressActive]} />
            <View style={[styles.progressBar, styles.progressInactive]} />
          </View>

          <Text style={styles.sectionTitle}>Get Started</Text>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <ScrollView style={styles.errorScrollView}>
                <Text style={styles.errorText}>
                  {Array.isArray(error) ? error.join('\n') : error}
                </Text>
              </ScrollView>
            </View>
          )}

          {/* Input Fields */}
          <View>
            <CustomInput 
              placeholder="Email or Phone Number *"
              value={formData.email}
              onChangeText={(value: string) => updateFormField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
          
          <View>
            <CustomInput 
              placeholder="Display Name *"
              value={formData.displayname}
              onChangeText={(value: string) => updateFormField('displayname', value)}
              maxLength={255}
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{formData.displayname.length}/255</Text>
          </View>

          <View>
            <CustomInput 
              placeholder="Username *"
              value={formData.username}
              onChangeText={(value: string) => updateFormField('username', value)}
              autoCapitalize="none"
              maxLength={20}
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{formData.username.length}/20</Text>
          </View>

          <View>
            <CustomInput 
              placeholder="Password *" 
              secureTextEntry={true}
              value={formData.password}
              onChangeText={(value: string) => updateFormField('password', value)}
              editable={!isLoading}
            />
          </View>
          
          <View>
            <CustomInput 
              placeholder="Confirm Password *" 
              secureTextEntry={true}
              value={formData.confirmPassword}
              onChangeText={(value: string) => updateFormField('confirmPassword', value)}
              editable={!isLoading}
            />
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementTitle}>Password requirements:</Text>
            <RequirementItem 
              text="Must contain at least 8 characters" 
              isValid={formData.password ? passwordValidation.hasMinLength : undefined}
            />
            <RequirementItem 
              text="Must contain at least 1 special symbol (!@#$%&)" 
              isValid={formData.password ? passwordValidation.hasSpecialChar : undefined}
            />
            <RequirementItem 
              text="Must contain at least 1 number" 
              isValid={formData.password ? passwordValidation.hasNumber : undefined}
            />
          </View>

          {/* --- MANDATORY EULA CHECKBOX --- */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setHasAcceptedEULA(!hasAcceptedEULA)}
              activeOpacity={0.8}
            >
              {hasAcceptedEULA && <View style={styles.checkboxInner} />}
            </TouchableOpacity>

            <Text style={styles.checkboxText}>
              I agree to the{' '}
              <Text
                style={styles.link}
                onPress={() =>
                  Linking.openURL(
                    'https://safehunt.app/terms-and-conditions'
                  )
                }
              >
                Terms of Use (EULA)
              </Text>
              {' '}and{' '}
              <Text
                style={styles.link}
                onPress={() =>
                  Linking.openURL(
                    'https://safehunt.app/privacy'
                  )
                }
              >
                Privacy Policy
              </Text>
              . I understand there is absolutely zero tolerance for objectionable content or abusive users.
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[
              styles.continueButton,
              (isLoading || !isPasswordValid || !hasAcceptedEULA) &&
                styles.continueButtonDisabled,
            ]}
            disabled={
              isLoading ||
              !isPasswordValid ||
              !hasAcceptedEULA
            }
            onPress={handleSignUp}
          >
            {isLoading ? (
              <ActivityIndicator color="#1D4D2F" size="small" />
            ) : (
              <Text style={styles.continueText}>Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
            <Text style={styles.loginLink}>
              Already have an account? <Text style={styles.boldText}>{`Log in`}</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Sub-components for cleaner code
const CustomInput = (props: any) => (
  <TextInput
    style={[styles.input, props.editable === false && styles.inputDisabled]}
    placeholderTextColor="#A4A4A4"
    {...props}
  />
);

const RequirementItem = ({ text, isValid }: { text: string; isValid?: boolean }) => (
  <View style={styles.requirementRow}>
    <View style={[
      styles.dot,
      isValid !== undefined && (isValid ? styles.dotValid : styles.dotInvalid)
    ]} />
    <Text style={[
      styles.requirementText,
      isValid !== undefined && isValid && styles.requirementValid
    ]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 50,
  },
  progressBar: {
    height: 8,
    width: 46,
    borderRadius: 3,
    marginHorizontal: 10,
  },
  progressActive: { backgroundColor: '#FFF' },
  progressInactive: { backgroundColor: '#9A9A9A' },
  sectionTitle: { color: '#FFF', fontSize: 20, marginBottom: 20 },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    maxHeight: 150,
  },
  errorScrollView: {
    maxHeight: 130,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#004925',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: '#FFF',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 15,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  charCount: {
    color: '#FFF',
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 10,
    marginRight: 10,
    fontSize: 12,
    opacity: 0.7,
  },
  requirementsContainer: { marginVertical: 10, paddingHorizontal: 15 },
  requirementTitle: { color: '#FFF', fontSize: 14, marginBottom: 8, opacity: 0.8 },
  requirementRow: { flexDirection: 'row', marginBottom: 5, paddingRight: 20 },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#FFF', 
    marginTop: 6, 
    marginRight: 10,
    opacity: 0.6,
  },
  dotValid: {
    backgroundColor: '#4CAF50',
    opacity: 1,
  },
  dotInvalid: {
    backgroundColor: '#FF6B6B',
    opacity: 1,
  },
  requirementText: { 
    color: '#FFF', 
    fontSize: 12, 
    lineHeight: 18,
    opacity: 0.6,
  },
  requirementValid: {
    opacity: 1,
    color: '#4CAF50',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 35,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  continueText: { color: '#1D4D2F', fontSize: 14, fontWeight: '700' },
  termsText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 25,
    lineHeight: 20,
  },
  loginLink: { color: '#FFF', textAlign: 'center', marginTop: 40, fontSize: 14 },
  boldText: { fontWeight: '900' },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 25,
  },

  checkboxText: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 12,
  },

  link: {
    color: '#FFFFFF',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#FFF',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
});

export default SignUpScreen;