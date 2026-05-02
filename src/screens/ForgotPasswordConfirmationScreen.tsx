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

const ForgotPasswordConfirmationScreen = ({ navigation, route }: any) => {
  // Accessing email from navigation params, defaulting to example if not provided
  const email = route?.params?.email || "example123@gmail.com";
  const [confirmationCode, setConfirmationCode] = useState('');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Consistent Background Gradient */}
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
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <View style={{ width: 40 }} /> 
          </View>

          {/* Main Content matching image_20e2d9.png */}
          <View style={styles.contentContainer}>
            <Text style={styles.messageText}>
              A password reset code was sent to{"\n"}
              <Text style={styles.boldText}>{email}</Text>.
            </Text>

            <Text style={styles.instructionText}>
              Check your email and enter the code below.
            </Text>

            {/* Confirmation Code Input */}
            <View style={styles.inputSection}>
              <CustomInput 
                placeholder="Confirmation Code" 
                value={confirmationCode}
                onChangeText={setConfirmationCode}
                keyboardType="number-pad"
              />
            </View>

            {/* Resend Code Link */}
            <TouchableOpacity onPress={() => console.log('Resend Code')}>
              <Text style={styles.resendText}>
                Didn't receive a code? <Text style={styles.boldText}>Send again.</Text>
              </Text>
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => navigation.navigate('ResetPassowrd')}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
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
    style={styles.input}
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
    alignItems: 'center', // Center text as seen in reference images
  },
  messageText: { 
    color: '#FFF', 
    fontSize: 18, 
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 60,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 15,
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
    textAlign: 'left',
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