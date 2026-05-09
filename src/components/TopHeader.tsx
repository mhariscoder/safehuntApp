import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ViewStyle,
} from 'react-native';

// Standardized Asset Mapping
const ASSETS = {
  nav1: require('../../assets/nav_1.png'), // Menu
  nav2: require('../../assets/nav_2.png'), // Search/Compass
  nav3: require('../../assets/nav_3.png'), // Weather
};

interface TopHeaderProps {
  onMenuPress: () => void;
  onSearchPress?: () => void;
  onSOSPress?: () => void;
  temperature?: string;
  containerStyle?: ViewStyle; // Added to accept outside styles
}

const TopHeader: React.FC<TopHeaderProps> = ({ 
  onMenuPress = () => {}, 
  onSearchPress = () => {}, 
  onSOSPress = () => {}, 
  temperature = "31°",
  containerStyle, // Destructured for use in the main View
}) => {
  return (
    <View style={[styles.topControls, containerStyle]}>
      {/* Menu Toggle */}
      <TouchableOpacity 
        style={[styles.iconButton, styles.bgGreen]} 
        onPress={onMenuPress}
        activeOpacity={0.7}
      >
        <Image style={styles.navIcon} source={ASSETS.nav1} />
      </TouchableOpacity>
      
      {/* Search / Action Button */}
      <TouchableOpacity 
        style={[styles.iconButton, styles.bgBrown]} 
        onPress={onSearchPress}
        activeOpacity={0.7}
      >
        <Image style={styles.navIcon} source={ASSETS.nav2} />
      </TouchableOpacity>
      
      {/* Weather Badge */}
      <View style={styles.weatherBadge}>
        <Image style={styles.navIcon} source={ASSETS.nav3} />
        <Text style={styles.weatherTemp}>{temperature}</Text>
      </View>
      
      {/* SOS Button */}
      <TouchableOpacity 
        style={styles.sosButton} 
        onPress={onSOSPress}
        activeOpacity={0.8}
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  iconButton: {
    width: 60,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgGreen: { backgroundColor: '#0E713E' },
  bgBrown: { backgroundColor: '#4D3626' },
  navIcon: {
    height: 24,
    width: 24,
    resizeMode: 'contain',
  },
  weatherBadge: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    // elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  weatherTemp: {
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 5,
  },
  sosButton: {
    backgroundColor: '#FF0000',
    width: 65,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TopHeader;