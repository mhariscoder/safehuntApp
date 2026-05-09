import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Static mapping for assets
const ASSETS = {
  tab0: require('../../assets/tab_0.png'),
  tab1: require('../../assets/tab_1.png'),
  tab2: require('../../assets/tab_2.png'),
  tab3: require('../../assets/tab_3.png'),
  tab4: require('../../assets/tab_4.png'),
};

interface BottomTabNavProps {
  containerStyle?: ViewStyle; // Allows you to pass outside styles like marginBottom
}

const BottomTabNav: React.FC<BottomTabNavProps> = ({ containerStyle }) => {
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.bottomNav, containerStyle]}>
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Messages')}
      >
        <Image style={styles.navIcon} source={ASSETS.tab1} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Feed')}
      >
        <Image style={styles.navIcon} source={ASSETS.tab2} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Home')}
      >
        <Image style={styles.navIcon} source={ASSETS.tab0} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Notifications')}
      >
        <Image style={styles.navIcon} source={ASSETS.tab3} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Settings')}
      >
        <Image style={styles.navIcon} source={ASSETS.tab4} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: { 
    flexDirection: 'row', 
    backgroundColor: '#4a9267d7', 
    height: 60, 
    borderRadius: 30, 
    alignItems: 'center', 
    justifyContent: 'space-around',
    width: '100%' 
  },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { height: 24, width: 24, resizeMode: 'contain' },
});

export default BottomTabNav;