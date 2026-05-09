import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  Animated,
  Pressable,
} from 'react-native';
// 1. Import the hook
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width;

const ASSETS = {
  profile: require('../../assets/profile.png'),
  notification: require('../../assets/notification.png'),
  feed: require('../../assets/feed.png'),
  messages: require('../../assets/messages.png'),
  map: require('../../assets/map.png'),
  setting: require('../../assets/setting.png'),
  terms: require('../../assets/terms.png'),
  privacy: require('../../assets/privacy.png'),
  rate: require('../../assets/rate.png'),
  logout: require('../../assets/logout.png'),
};

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, userName = "William jack" }) => {
  const navigation = useNavigation<any>(); 
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const handlePress = (screenName: string) => {
    onClose();
    navigation.navigate(screenName);
  };

  const MenuItem = ({ icon, label, onPress }: { icon: any, label: string, onPress: () => void }) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <Image source={icon} style={styles.menuIconSmall} />
      <Text style={styles.menuText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      {isOpen && <Pressable style={styles.overlay} onPress={onClose} />}
      
      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        <SafeAreaView style={styles.drawerContent}>
          <View style={styles.drawerHeader}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileInitial}>{userName.charAt(0)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{userName}</Text>
          
          <View style={styles.menuList}>
            {/* 4. Assign the navigation targets here */}
            <MenuItem label="My profile" icon={ASSETS.profile} onPress={() => handlePress('Profile')} />
            <MenuItem label="Notification" icon={ASSETS.notification} onPress={() => handlePress('Notifications')} />
            <MenuItem label="Feed" icon={ASSETS.feed} onPress={() => handlePress('Feed')} />
            <MenuItem label="Messages" icon={ASSETS.messages} onPress={() => handlePress('Messages')} />
            <MenuItem label="Map" icon={ASSETS.map} onPress={() => handlePress('Home')} />
            <MenuItem label="Setting" icon={ASSETS.setting} onPress={() => handlePress('Settings')} />
            <MenuItem label="Terms & conditions" icon={ASSETS.terms} onPress={() => handlePress('Terms')} />
            <MenuItem label="Privacy policy" icon={ASSETS.privacy} onPress={() => handlePress('Privacy')} />
            <MenuItem label="Logout" icon={ASSETS.logout} onPress={() => {
                onClose();
                console.log("Logging out...");
                // Add logout logic here, e.g., navigation.replace('Login')
            }} />
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    
    zIndex: 1000,
    
    
    // shadowColor: '#000',
    // shadowOffset: { width: 2, height: 0 },
    // shadowOpacity: 0.3,
    // shadowRadius: 5,
  },
  drawerContent: { flex: 1 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 100, backgroundColor: '#0E713E', paddingHorizontal: 20, paddingVertical: 40, },
  profileCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: '#0E713E', fontWeight: 'bold', fontSize: 22 },
  closeIcon: { color: '#FFF', fontSize: 24, fontWeight: '300' },
  userName: { backgroundColor: '#0E713E', color: '#FFF', fontSize: 20, fontWeight: 'bold', padding: 20, borderBottomWidth: 0.5, borderBottomColor: 'rgb(255, 255, 255)', },
  menuList: { flex: 1, backgroundColor: '#0B733FB5' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: 'rgb(255, 255, 255)', paddingHorizontal: 20 },
  menuIconSmall: { width: 22, height: 22, marginRight: 25, tintColor: '#FFF', resizeMode: 'contain' },
  menuText: { color: '#FFF', fontSize: 16 },
  separator: { height: 20 },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 999,
  },
});

export default SideMenu;