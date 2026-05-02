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

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');

  const handleSendCode = () => {
    // Navigate to the confirmation screen and pass the email/phone
    navigation.navigate('ForgotPasswordConfirmation', { email: emailOrPhone });
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

            <View style={styles.inputSection}>
              <CustomInput 
                placeholder="Email or phone number" 
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleSendCode}
            >
              <Text style={styles.resetButtonText}>Send Reset Code</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

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
  resetButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  resetButtonText: { color: '#1D4D2F', fontSize: 14, fontWeight: '700' },
});

export default ForgotPasswordScreen;