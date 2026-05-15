import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  StatusBar
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const LoadingScreen = ({ navigation }: any) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth infinite rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Signature Background Gradient */}
      <LinearGradient
        colors={['#0B733F', '#4E2D18']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.safeArea}>

        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome To Safe Hunt</Text>
          
          <Animated.View style={[styles.spinnerWrapper, { transform: [{ rotate: spin }] }]}>
            <Svg height="80" width="80" viewBox="0 0 100 100">
              <Defs>
                <SvgGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
                </SvgGradient>
              </Defs>
              <Circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#grad)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="180 100" // Creates the "gap" in the circle
              />
            </Svg>
          </Animated.View>
          
          <Text style={styles.loadingSubtext}>Syncing your hunter profile...</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 25,
    marginTop: 20,
  },
  backButton: { padding: 5 },
  backArrow: {
    width: 21,
    height: 21,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 50,
  },
  spinnerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 30,
    fontWeight: '500',
  }
});

export default LoadingScreen;