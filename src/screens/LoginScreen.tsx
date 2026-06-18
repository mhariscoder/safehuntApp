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
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { login } from '../features/auth/authActions';
import { clearError } from '../features/auth/authSlice';

const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleLogin = async () => {
    // Validation
    if (!username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Password is required');
      return;
    }

    try {
      await dispatch(login({ username, password, rememberMe })).unwrap();
      
      // Show success message
      Alert.alert(
        'Success',
        'Login successful!',
        [
          {
            text: 'OK',
            // onPress: () => navigation.replace('Home'),
            onPress: () => console.log('Navigate to Home or Main Screen'),
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      // Error is already handled in the action, but we can show additional feedback
      Alert.alert('Login Failed', err.message || 'Invalid username or password');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  // Clear error when component unmounts or when username/password changes
  React.useEffect(() => {
    if (error) {
      // Auto-clear error after 3 seconds
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      {/* Established Background Gradient */}
      <LinearGradient
        colors={['#0B733F', '#4E2D18', '#121212']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          
          {/* Header with Back Arrow */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Welcome')} style={styles.backButton}>
              <Image source={require('../../assets/back_arrow.png')} style={styles.backArrow} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Log In</Text>
            <View style={{ width: 40 }} /> 
          </View>

          <View>
            {/* Greeting Section */}
            <Text style={styles.sectionTitle}>Good to see you again!</Text>

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {Array.isArray(error) ? error.join(', ') : error}
                </Text>
              </View>
            )}

            {/* Input Fields */}
            <View style={styles.inputSection}>
              <CustomInput 
                placeholder="Username" 
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!isLoading}
              />
              
              <CustomInput 
                placeholder="Password" 
                secureTextEntry={true} 
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.rememberMeContainer} 
                onPress={() => setRememberMe(!rememberMe)}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxSelected]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.optionText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                <Text style={styles.boldText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Log In Button */}
            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#1D4D2F" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
            <Text style={styles.signupLink}>
              New to Safe Hunt? <Text style={styles.boldText}>Sign Up {'>'}</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

// Reusing your CustomInput sub-component for consistency
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
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40, flexGrow: 1, justifyContent: 'space-between' },
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
  sectionTitle: { 
    color: '#FFF', 
    fontSize: 20, 
    marginBottom: 30,
    fontWeight: '400' 
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
    marginBottom: 20,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginBottom: 40,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  checkboxSelected: {
    backgroundColor: '#FFF',
  },
  checkmark: {
    color: '#004925',
    fontSize: 12,
    fontWeight: '900',
  },
  optionText: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.8,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  loginButtonText: { 
    color: '#1D4D2F', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  signupLink: { 
    color: '#FFF', 
    textAlign: 'center', 
    marginTop: 40, 
    fontSize: 14 
  },
  boldText: { 
    color: '#FFF',
    fontWeight: '900' 
  },
});

export default LoginScreen;