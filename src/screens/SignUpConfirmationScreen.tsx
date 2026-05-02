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
  Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const SignUpConfirmationScreen = ({ navigation, route }: any) => {
  const [code, setCode] = useState('');
  // Grabbing email from navigation params, or defaulting for preview
  const email = route?.params?.email || 'example123@gmail.com';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Exact Gradient from your reference code */}
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

          {/* Confirmation Code Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirmation Code"
              placeholderTextColor="#A4A4A4"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />
            
            <TouchableOpacity onPress={() => console.log('Resend code')}>
              <Text style={styles.resendText}>
                Didn't receive a code? <Text style={styles.boldText}>Send again.</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => navigation.navigate('Subscription')}
            >
              <Text style={styles.continueText}>Continue</Text>
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
    marginBottom: 80, // Increased spacing to match confirmation layout
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

  // Input styles (Copied and modified for centering)
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
    fontSize: 15
  },
  resendText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },

  // Primary Button (Copied from your reference)
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
  continueText: { 
    color: '#1D4D2F', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  boldText: { fontWeight: '900' },
});

export default SignUpConfirmationScreen;