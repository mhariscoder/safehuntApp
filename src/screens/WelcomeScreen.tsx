import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LogoComponent from '../components/LogoComponent';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0B733F', '#4E2D18', '#121212']}
        locations={[0.3, 1, 0.5]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.content}>
        
        <LogoComponent style={{ marginTop: 60 }} />

        {/* Buttons Section */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={() => navigation.navigate('SignUp')} // UPDATED: Navigates to SignUp
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logInButton}
            onPress={() => navigation.navigate('Login')} // Assuming you have a Login route
          >
            <Text style={styles.logInText}>Log In</Text>
          </TouchableOpacity>

          {/* Social Sign Up */}
          <TouchableOpacity style={styles.socialLink}>
            <Text style={styles.socialText}>Sign Up With </Text>
            <Image
              source={require('../../assets/logos_google-icon.png')}
              style={{ marginLeft: 5 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.phoneLink}
            onPress={() => navigation.navigate('Subscription')} // Also links to Subscription
          >
            <Text style={styles.phoneText}>Sign Up With Phone Number</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: width * 0.25,
    height: width * 0.25,
  },
  brandName: {
    fontFamily: 'Montserrat-Black',
    fontWeight: '900',              
    fontSize: 24,                   
    lineHeight: 28,
    letterSpacing: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: '#FFFFFF',
    marginTop: 10,
  },
  
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  signUpButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  signUpText: {
    color: '#1D4D2F',
    fontSize: 14,
    fontWeight: '700',
  },
  logInButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 40,
  },
  logInText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  socialText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  phoneLink: {
    marginBottom: 20,
  },
  phoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;