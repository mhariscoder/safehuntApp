import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import { useNotifications } from '../hooks/useNotifications';
import { deleteMyAccount } from '../features/auth/authActions';
import BottomTabNav from '../components/BottomTabNav';

const ASSETS = {
  iconBack: require('../../assets/back_white.png'),
  iconSearch: require('../../assets/search_icon.png'),
  iconAccount: require('../../assets/account_icon.png'),
  iconBell: require('../../assets/bell_icon.png'),
  iconAbout: require('../../assets/about_icon.png'),
  iconChevron: require('../../assets/chevron_right.png'),
};

const SettingScreen = () => {
  // ✅ ALL HOOKS CALLED AT TOP LEVEL IN CONSISTENT ORDER
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  // ✅ useNotifications hook - called unconditionally
  const {
    notificationSettings,
    toggleNotifications,
    toggleAppNotifications,
    getNotificationStatus,
    isLoading: notificationsLoading,
  } = useNotifications();

  // ✅ All useState hooks
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [appNotificationsEnabled, setAppNotificationsEnabled] = useState(true);
  const [togglingNotifications, setTogglingNotifications] = useState(false);
  const [togglingAppNotifications, setTogglingAppNotifications] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // ✅ useEffect hooks
  useEffect(() => {
    if (notificationSettings) {
      setNotificationsEnabled(notificationSettings.notificationsEnabled);
      setAppNotificationsEnabled(notificationSettings.appNotificationsEnabled);
    }
  }, [notificationSettings]);

  // ✅ useFocusEffect hook
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadNotificationStatus();
      }
    }, [user?.id])
  );

  // ✅ Helper functions (defined after all hooks)
  const loadNotificationStatus = async () => {
    if (user?.id) {
      await getNotificationStatus(user.id);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (!user?.id) return;
    
    setTogglingNotifications(true);
    setNotificationsEnabled(value);
    
    try {
      await toggleNotifications(user.id);
      await getNotificationStatus(user.id);
    } catch (error: any) {
      setNotificationsEnabled(!value);
      Alert.alert('Error', error.message || 'Failed to toggle notifications');
    } finally {
      setTogglingNotifications(false);
    }
  };

  const handleToggleAppNotifications = async (value: boolean) => {
    if (!user?.id) return;
    
    setTogglingAppNotifications(true);
    setAppNotificationsEnabled(value);
    
    try {
      await toggleAppNotifications(user.id);
      await getNotificationStatus(user.id);
    } catch (error: any) {
      setAppNotificationsEnabled(!value);
      Alert.alert('Error', error.message || 'Failed to toggle app notifications');
    } finally {
      setTogglingAppNotifications(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is irreversible and all your data will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await dispatch(deleteMyAccount()).unwrap();
              Alert.alert(
                'Account Deleted',
                'Your account has been deleted successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Auth' }],
                      });
                    },
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
            } finally {
              setIsDeletingAccount(false);
            }
          }
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          }
        },
      ]
    );
  };

  const SettingItem = ({ label, onPress, showBorder = true, hasSwitch = false, switchValue, onSwitchChange, isLoading: itemLoading = false }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, !showBorder && { borderBottomWidth: 0 }]} 
      onPress={onPress}
      disabled={hasSwitch || itemLoading}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      {hasSwitch ? (
        itemLoading ? (
          <ActivityIndicator size="small" color="#0E713E" />
        ) : (
          <Switch
            trackColor={{ false: '#D1D1D1', true: '#0E713E' }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor="#D1D1D1"
            onValueChange={onSwitchChange}
            value={switchValue}
          />
        )
      ) : (
        <Image source={ASSETS.iconChevron} style={styles.chevron} />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ icon, title }: any) => (
    <View style={styles.sectionHeader}>
      <Image source={icon} style={styles.sectionIcon} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // ✅ Loading check AFTER all hooks
  if (notificationsLoading && !notificationSettings) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={ASSETS.iconBack} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.searchCircle}>
          <Image source={ASSETS.iconSearch} style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- ACCOUNT SECTION --- */}
        <SectionHeader icon={ASSETS.iconAccount} title="Account" />
        <View style={styles.sectionGroup}>
          <SettingItem label="Edit Profile" onPress={() => navigation.navigate('Profile')} />
          <SettingItem label="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
          <SettingItem label="Block" onPress={() => navigation.navigate('BlockedUsers')} showBorder={false} />
        </View>

        {/* --- NOTIFICATIONS SECTION --- */}
        <SectionHeader icon={ASSETS.iconBell} title="Notifications" />
        <View style={styles.sectionGroup}>
          <SettingItem 
            label="Push Notifications" 
            hasSwitch={true} 
            switchValue={notificationsEnabled} 
            onSwitchChange={handleToggleNotifications}
            isLoading={togglingNotifications}
          />
          <SettingItem 
            label="In-App Notifications" 
            hasSwitch={true} 
            switchValue={appNotificationsEnabled} 
            onSwitchChange={handleToggleAppNotifications}
            showBorder={false}
            isLoading={togglingAppNotifications}
          />
        </View>

        {/* --- ABOUT SECTION --- */}
        <SectionHeader icon={ASSETS.iconAbout} title="About App" />
        <View style={styles.sectionGroup}>
          <SettingItem label="Terms & Conditions" onPress={() => navigation.navigate('TermsConditions')} />
          <SettingItem label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
        </View>

        {/* --- ACTION BUTTONS --- */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.deleteAccountButton, isDeletingAccount && styles.buttonDisabled]} 
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
          >
            {isDeletingAccount ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.deleteAccountText}>Delete Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- BOTTOM NAVIGATION --- */}
      <View style={styles.bottomNavWrapper}>
        <BottomTabNav activeTab="Settings" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 60,
    backgroundColor: '#0E713E', 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: 'contain',
    tintColor: '#FFF',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  searchCircle: {
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#4D3626',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 25,
    marginBottom: 15,
  },
  sectionIcon: {
    width: 20,
    height: 20,
    marginRight: 15,
    resizeMode: 'contain',
    tintColor: '#0E713E',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  sectionGroup: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  settingLabel: {
    fontSize: 14,
    color: '#6D6A5B',
  },
  chevron: {
    width: 15,
    height: 15,
    tintColor: '#BCBCBC',
    resizeMode: 'contain',
  },
  buttonsContainer: {
    marginVertical: 20,
    paddingHorizontal: 25,
  },
  deleteAccountButton: {
    backgroundColor: '#FF6B6B',
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  deleteAccountText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#0E713E',
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
});

export default SettingScreen;