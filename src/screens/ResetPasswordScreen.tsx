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

const ResetPasswordScreen = ({ navigation }: any) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

            <View style={styles.inputSection}>
              <CustomInput 
                placeholder="Password *" 
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
              
              <CustomInput 
                placeholder="Confirm Password *" 
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
              />
            </View>

            {/* Password Requirements matching image_200599.png */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsHeader}>Password requirements:</Text>
              
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.requirementText}>
                  Must contain at least 8 characters, 1 special symbol (!@#$%&), 1 number
                </Text>
              </View>

              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.requirementText}>
                  May not be a previously used password
                </Text>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => console.log('Reset Password Pressed')}
            >
              <Text style={styles.resetButtonText}>Reset Password</Text>
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
  },
  requirementText: {
    color: '#FFF',
    fontSize: 13,
    opacity: 0.6,
    lineHeight: 18,
  },
  resetButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  resetButtonText: { 
    color: '#1D4D2F', 
    fontSize: 14, 
    fontWeight: '700' 
  },
});

export default ResetPasswordScreen;