import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Static mapping for assets based on design mockups
const ASSETS = {
  tab0: require('../../assets/tab_0.png'), // Home/Middle
  tab1: require('../../assets/tab_1.png'), // Messages
  tab2: require('../../assets/tab_2.png'), // Feed
  tab3: require('../../assets/tab_3.png'), // Notifications
  tab4: require('../../assets/tab_4.png'), // Settings
};

interface BottomTabNavProps {
  containerStyle?: ViewStyle; 
  activeTab?: string; // This fixes the TypeScript error ts(2322)
}

const BottomTabNav: React.FC<BottomTabNavProps> = ({ containerStyle, activeTab }) => {
  const navigation = useNavigation<any>();

  // Helper to determine if an icon should be highlighted
  const getIconStyle = (tabName: string) => [
    styles.navIcon,
    activeTab === tabName ? styles.activeIcon : styles.inactiveIcon
  ];

  return (
    <View style={[styles.bottomNav, containerStyle]}>
      {/* Messages Tab */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Feed')}
      >
        <Image style={getIconStyle('Feed')} source={ASSETS.tab1} />
      </TouchableOpacity>

      {/* Feed Tab */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Notification')}
      >
        <Image style={getIconStyle('Notification')} source={ASSETS.tab2} />
      </TouchableOpacity>

      {/* Home/Main Tab */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Home')}
      >
        <Image style={getIconStyle('Home')} source={ASSETS.tab0} />
      </TouchableOpacity>

      {/* Notifications Tab */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Message')}
      >
        <Image style={getIconStyle('Message')} source={ASSETS.tab3} />
      </TouchableOpacity>

      {/* Settings Tab */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Settings')}
      >
        <Image style={getIconStyle('Settings')} source={ASSETS.tab4} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: { 
    flexDirection: 'row', 
    backgroundColor: '#096235B5', 
    height: 52, 
    borderRadius: 30, 
    alignItems: 'center', 
    paddingHorizontal: 20,
    width: '100%' 
  },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { height: 20, width: 20, resizeMode: 'contain' },
  activeIcon: {
    tintColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  inactiveIcon: {
    tintColor: 'rgba(255, 255, 255, 0.6)',
  },
});

export default BottomTabNav;