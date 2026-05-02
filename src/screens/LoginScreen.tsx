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
  Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Established Background Gradient */}
      <LinearGradient
        colors={['#0B733F', '#4E2D18', '#121212']}
        locations={[0.3, 1, 0.5]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header with Back Arrow */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={require('../../assets/back_arrow.png')} style={styles.backArrow} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Log In</Text>
            <View style={{ width: 40 }} /> 
          </View>

          <View>
            {/* Greeting Section */}
            <Text style={styles.sectionTitle}>Good to see you again!</Text>

            {/* Input Fields */}
            <View style={styles.inputSection}>
                <CustomInput 
                placeholder="Username" 
                value={username}
                onChangeText={setUsername}
                />
                
                <CustomInput 
                placeholder="Password" 
                secureTextEntry={true} 
                value={password}
                onChangeText={setPassword}
                />
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
                <TouchableOpacity 
                style={styles.rememberMeContainer} 
                onPress={() => setRememberMe(!rememberMe)}
                >
                <View style={[styles.checkbox, rememberMe && styles.checkboxSelected]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.optionText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.boldText}>Forgot Password?</Text>
                </TouchableOpacity>
            </View>

            {/* Log In Button */}
            <TouchableOpacity 
                style={styles.loginButton}
               onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}>
              New to Safe Hunt? <Text style={styles.boldText}>Sign Up {'>'}</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Reusing your CustomInput sub-component for consistency
const CustomInput = (props: any) => (
  <TextInput
    style={styles.input}
    placeholderTextColor="#A4A4A4"
    {...props}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40, flex: 1, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 60, // Spacing before greeting
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