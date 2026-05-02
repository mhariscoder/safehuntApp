import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ViewStyle, StyleProp } from 'react-native';

const { width } = Dimensions.get('window');

// Destructure { style } from props
const LogoComponent = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  return (
    <View style={[styles.logoContainer, style]}>
      <Image
        source={require('../../assets/safe-hunt-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.brandName}>SAFE HUNT</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    // Removed marginTop: 40 so the parent can control positioning via the style prop
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
  },
  brandName: {
    fontWeight: '900',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: '#FFFFFF',
    marginTop: 10,
  },
});

export default LogoComponent;