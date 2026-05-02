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

const SignUpScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

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
          
          {/* Header with Back Arrow & Progress */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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

          {/* Input Fields */}
          
          <View>
            <CustomInput placeholder="Email or Phone Number *" />
            <Text style={styles.charCount}></Text>
          </View>
          
          <View>
            <CustomInput placeholder="Display Name *" />
            <Text style={styles.charCount}>0/20</Text>
          </View>

          <View>
            <CustomInput placeholder="Username *" />
            <Text style={styles.charCount}>0/20</Text>
          </View>

          <View>
            <CustomInput placeholder="Password *" secureTextEntry={true} />
            <Text style={styles.charCount}></Text>
          </View>
          
          <View>
            <CustomInput placeholder="Confirm Password *" secureTextEntry={true} />
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementTitle}>Password requirements:</Text>
            <RequirementItem text="Must contain at least 8 characters, 1 special symbol (!@#$%&), 1 number" />
            <RequirementItem text="May not include your name or birth date" />
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => navigation.navigate('SignUpConfirmation', { email: formData.email })}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>

          {/* Footer Links */}
          <Text style={styles.termsText}>
            By clicking continue, you agree to our{'\n'}
            <Text style={styles.boldText}>Terms of Service</Text> and <Text style={styles.boldText}>Privacy Policy</Text>.
          </Text>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>
              Already have an account? <Text style={styles.boldText}>{`Log in >`}</Text>
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
    style={styles.input}
    placeholderTextColor="#A4A4A4"
    {...props}
  />
);

const RequirementItem = ({ text }: { text: string }) => (
  <View style={styles.requirementRow}>
    <View style={styles.dot} />
    <Text style={styles.requirementText}>{text}</Text>
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
  charCount: {
    color: '#FFF',
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 10,
    marginRight: 10,
    fontSize: 12,
  },
  requirementsContainer: { marginVertical: 10, paddingHorizontal: 15 },
  requirementTitle: { color: '#FFF', fontSize: 14, marginBottom: 8 },
  requirementRow: { flexDirection: 'row', marginBottom: 5, paddingRight: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF', marginTop: 6, marginRight: 10 },
  requirementText: { color: '#FFF', fontSize: 12, lineHeight: 18 },
  continueButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 35,
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
});

export default SignUpScreen;