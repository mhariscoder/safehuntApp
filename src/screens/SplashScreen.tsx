import React, { useEffect } from 'react';
import { StyleSheet, Image, Dimensions, View, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LogoComponent from '../components/LogoComponent';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }: any) => {
  useEffect(() => {
    // Show this beautiful gradient for 2.5 seconds, then go to Home
    const timer = setTimeout(() => {
      navigation.replace('Welcome'); 
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
        <LinearGradient
            colors={['#0B733F', '#4E2D18', '#121212']}
            locations={[0.3, 1, 0.5]}
            style={StyleSheet.absoluteFill}
        />
        <LogoComponent style={{ marginTop: 60 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.25,
    height: width * 0.25,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 10,
  },
});

export default SplashScreen;