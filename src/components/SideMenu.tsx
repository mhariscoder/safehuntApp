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
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { logout } from '../features/auth/authActions';
import { resetAndNavigate } from '../navigation/navigationRef';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

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

const getFullImageUrl = (imagePath: string | null | undefined, size?: string): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  const sizeParam = size ? `?size=${size}` : '';
  return `${API_BASE_URL}/public/uploads/${cleanPath}${sizeParam}`;
};

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, userName = "Display Name" }) => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isLoading, user } = useAppSelector((state) => state.auth);

  userName = user?.displayname || userName;
  
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

  const handleLogout = async () => {
    // Show confirmation dialog
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              onClose(); // Close the drawer first
              
              // Call logout API through Redux action
              await dispatch(logout()).unwrap();
              
              // Navigate to login screen after successful logout
              // Using reset to clear navigation stack
              resetAndNavigate('Auth', { screen: 'Login' });
              
              // Show success message (optional)
              Alert.alert('Success', 'Logged out successfully');
            } catch (error: any) {
              console.error('Logout error:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to logout. Please try again.'
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleClearTrial = async () => {
    try {
      await AsyncStorage.removeItem('HAS_STARTED_TRIAL');
      
      // Force navigation refresh
      // @ts-ignore
      if (global.refreshNavigation) {
        // @ts-ignore
        global.refreshNavigation();
        navigation.navigate('Subscription');
      }
      
      // Alert.alert('Success', 'Trial status cleared. Please restart the app to see changes.');
      onClose();
    } catch (error) {
      console.error('Clear trial error:', error);
      Alert.alert('Error', 'Failed to clear trial status.');
    }
  };

  const MenuItem = ({ 
    icon, 
    label, 
    onPress, 
    isLogout = false 
  }: { 
    icon: any, 
    label: string, 
    onPress: () => void,
    isLogout?: boolean 
  }) => (
    <TouchableOpacity 
      style={[styles.menuItem, isLogout && styles.logoutItem]} 
      activeOpacity={0.7} 
      onPress={onPress}
      disabled={isLoading && isLogout}
    >
      <Image 
        source={icon} 
        style={[
          styles.menuIconSmall, 
          isLogout && styles.logoutIcon
        ]} 
      />
      <Text style={[styles.menuText, isLogout && styles.logoutText]}>
        {label}
        {isLoading && isLogout && <ActivityIndicator size="small" color="#FFF" style={styles.loader} />}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      {isOpen && <Pressable style={styles.overlay} onPress={onClose} />}
      
      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        <View style={styles.drawerContent}>
          <View style={styles.drawerHeader}>
            <View style={styles.profileCircle}>
              {user?.profilePhoto ? (
                <Image 
                  source={{ uri: getFullImageUrl(user.profilePhoto) || undefined }} 
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                  }} 
                />
              ) : (
                <Text style={styles.profileInitial}>
                  {user?.displayname?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{userName}</Text>
          
          <View style={styles.menuList}>
            <MenuItem label="My profile" icon={ASSETS.profile} onPress={() => handlePress('Profile')} />
            <MenuItem label="Notification" icon={ASSETS.notification} onPress={() => handlePress('Notification')} />
            <MenuItem label="Feed" icon={ASSETS.feed} onPress={() => handlePress('Feed')} />
            <MenuItem label="Messages" icon={ASSETS.messages} onPress={() => handlePress('Message')} />
            <MenuItem label="Map" icon={ASSETS.map} onPress={() => handlePress('Home')} />
            <MenuItem label="Setting" icon={ASSETS.setting} onPress={() => handlePress('Settings')} />
            <MenuItem label="Subscription" icon={ASSETS.setting} onPress={() => handleClearTrial()} />

            <MenuItem label="Terms & conditions" icon={ASSETS.terms} onPress={() => handlePress('TermsConditions')} />
            <MenuItem label="Privacy policy" icon={ASSETS.privacy} onPress={() => handlePress('PrivacyPolicy')} />
            {/* <MenuItem label="Map Test" icon={ASSETS.map} onPress={() => handlePress('MapTest')} /> */}
            <MenuItem 
              label="Logout" 
              icon={ASSETS.logout} 
              onPress={handleLogout}
              isLogout={true}
            />
          </View>
        </View>
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
    zIndex: 999999999,
  },
  drawerContent: { 
    flex: 1,
    backgroundColor: '#0B733F',
  },
  drawerHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    minHeight: 100, 
    backgroundColor: '#0E713E', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 50 : 75,
  },
  profileCircle: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileInitial: { 
    color: '#0E713E', 
    fontWeight: 'bold', 
    fontSize: 22 
  },
  closeIcon: { 
    color: '#FFF', 
    fontSize: 24, 
    fontWeight: '300' 
  },
  userName: { 
    backgroundColor: '#0E713E', 
    color: '#FFF', 
    fontSize: 20, 
    fontWeight: 'bold', 
    padding: 20, 
    borderBottomWidth: 0.5, 
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  menuList: { 
    flex: 1, 
    backgroundColor: '#0B733F',
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    borderBottomWidth: 0.5, 
    borderBottomColor: 'rgba(255, 255, 255, 0.2)', 
    paddingHorizontal: 20 
  },
  logoutItem: {
    // borderTopWidth: 1,
    // borderTopColor: 'rgba(255, 255, 255, 0.3)',
    // marginTop: 10,
  },
  menuIconSmall: { 
    width: 22, 
    height: 22, 
    marginRight: 25, 
    tintColor: '#FFF', 
    resizeMode: 'contain' 
  },
  logoutIcon: {
    tintColor: '#FF6B6B',
  },
  menuText: { 
    color: '#FFF', 
    fontSize: 16,
    flex: 1,
  },
  logoutText: {
    color: '#FF6B6B',
  },
  separator: { 
    height: 20 
  },
  overlay: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 999,
  },
  loader: {
    marginLeft: 10,
  },
});

export default SideMenu;