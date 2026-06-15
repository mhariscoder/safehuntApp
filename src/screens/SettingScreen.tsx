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
  TextInput,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import { useNotifications } from '../hooks/useNotifications';
import { deleteMyAccount } from '../features/auth/authActions';
import BottomTabNav from '../components/BottomTabNav';

const { width } = Dimensions.get('window');

const ASSETS = {
  iconBack: require('../../assets/back_white.png'),
  iconSearch: require('../../assets/search_icon.png'),
  iconAccount: require('../../assets/account_icon.png'),
  iconBell: require('../../assets/bell_icon.png'),
  iconAbout: require('../../assets/about_icon.png'),
  iconChevron: require('../../assets/chevron_right.png'),
  closeIcon: require('../../assets/close_icon.png'),
};

// Define setting items for filtering
const SETTING_ITEMS = [
  // Account Section
  { id: 'editProfile', label: 'Edit Profile', section: 'Account', screen: 'Profile', type: 'navigate' },
  { id: 'changePassword', label: 'Change Password', section: 'Account', screen: 'ChangePassword', type: 'navigate' },
  { id: 'block', label: 'Block', section: 'Account', screen: 'BlockedUsers', type: 'navigate' },
  // Notifications Section
  { id: 'pushNotifications', label: 'Push Notifications', section: 'Notifications', type: 'switch', switchKey: 'notificationsEnabled' },
  { id: 'inAppNotifications', label: 'In-App Notifications', section: 'Notifications', type: 'switch', switchKey: 'appNotificationsEnabled' },
  // About Section
  { id: 'terms', label: 'Terms & Conditions', section: 'About', screen: 'TermsConditions', type: 'navigate' },
  { id: 'privacy', label: 'Privacy Policy', section: 'About', screen: 'PrivacyPolicy', type: 'navigate' },
  // Action Buttons
  { id: 'deleteAccount', label: 'Delete Account', section: 'Actions', type: 'action' },
  { id: 'logout', label: 'Logout', section: 'Actions', type: 'action' },
];

const SettingScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const {
    notificationSettings,
    toggleNotifications,
    toggleAppNotifications,
    getNotificationStatus,
    isLoading: notificationsLoading,
  } = useNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [appNotificationsEnabled, setAppNotificationsEnabled] = useState(true);
  const [togglingNotifications, setTogglingNotifications] = useState(false);
  const [togglingAppNotifications, setTogglingAppNotifications] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (notificationSettings) {
      setNotificationsEnabled(notificationSettings.notificationsEnabled);
      setAppNotificationsEnabled(notificationSettings.appNotificationsEnabled);
    }
  }, [notificationSettings]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadNotificationStatus();
      }
    }, [user?.id])
  );

  const loadNotificationStatus = async () => {
    if (user?.id) {
      await getNotificationStatus(user.id);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
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

  // Filter settings based on search query
  const filteredSettings = SETTING_ITEMS.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(searchLower) ||
      item.section.toLowerCase().includes(searchLower)
    );
  });

  // Group filtered settings by section
  const groupedSettings = filteredSettings.reduce((groups: any, item) => {
    if (!groups[item.section]) {
      groups[item.section] = [];
    }
    groups[item.section].push(item);
    return groups;
  }, {});

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

  const renderSettingItem = (item: any) => {
    switch (item.type) {
      case 'navigate':
        return (
          <SettingItem 
            key={item.id}
            label={item.label} 
            onPress={() => navigation.navigate(item.screen)} 
            showBorder={item.id !== 'block'}
          />
        );
      case 'switch':
        if (item.switchKey === 'notificationsEnabled') {
          return (
            <SettingItem 
              key={item.id}
              label={item.label} 
              hasSwitch={true} 
              switchValue={notificationsEnabled} 
              onSwitchChange={handleToggleNotifications}
              isLoading={togglingNotifications}
              showBorder={item.id !== 'inAppNotifications'}
            />
          );
        } else {
          return (
            <SettingItem 
              key={item.id}
              label={item.label} 
              hasSwitch={true} 
              switchValue={appNotificationsEnabled} 
              onSwitchChange={handleToggleAppNotifications}
              showBorder={false}
              isLoading={togglingAppNotifications}
            />
          );
        }
      case 'action':
        if (item.label === 'Delete Account') {
          return null; // Handled separately
        }
        return null;
      default:
        return null;
    }
  };

  // Get section icon
  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'Account':
        return ASSETS.iconAccount;
      case 'Notifications':
        return ASSETS.iconBell;
      case 'About':
        return ASSETS.iconAbout;
      default:
        return ASSETS.iconAccount;
    }
  };

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
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image source={ASSETS.iconBack} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.searchToggleButton}
            onPress={() => {
              setShowSearch(!showSearch);
              if (!showSearch) {
                setSearchQuery('');
              }
            }}
          >
            <Image source={ASSETS.iconSearch} style={styles.headerSearchIcon} />
          </TouchableOpacity>
        </View>
        
        {/* --- SEARCH INPUT --- */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Image source={ASSETS.iconSearch} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search settings..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Image source={ASSETS.closeIcon} style={styles.clearIcon} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Results Count */}
        {showSearch && searchQuery.length > 0 && (
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              Found {filteredSettings.length} {filteredSettings.length === 1 ? 'result' : 'results'} for "{searchQuery}"
            </Text>
          </View>
        )}

        {/* Dynamic Sections based on search */}
        {Object.keys(groupedSettings).length > 0 ? (
          Object.keys(groupedSettings).map((section) => {
            const sectionItems = groupedSettings[section];
            const isActionSection = section === 'Actions';
            
            if (isActionSection) {
              return (
                <View key={section}>
                  <View style={styles.buttonsContainer}>
                    {/* Delete Account Button */}
                    {sectionItems.some(item => item.label === 'Delete Account') && (
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
                    )}

                    {/* Logout Button */}
                    {sectionItems.some(item => item.label === 'Logout') && (
                      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }
            
            return (
              <View key={section}>
                <SectionHeader icon={getSectionIcon(section)} title={section} />
                <View style={styles.sectionGroup}>
                  {sectionItems.map((item: any) => renderSettingItem(item))}
                </View>
              </View>
            );
          })
        ) : (
          // No results found
          <View style={styles.noResultsContainer}>
            <Image source={ASSETS.iconSearch} style={styles.noResultsIcon} />
            <Text style={styles.noResultsTitle}>No settings found</Text>
            <Text style={styles.noResultsText}>
              No settings match "{searchQuery}"
            </Text>
          </View>
        )}
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
    backgroundColor: '#FCFAF0',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  header: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 0 : 50
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 15,
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
    fontSize: 18,
    fontWeight: '900',
  },
  searchToggleButton: {
    padding: 8,
  },
  headerSearchIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFF',
    resizeMode: 'contain',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    marginTop: 5,
    marginBottom: 15,
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: '#999',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  clearIcon: {
    width: 18,
    height: 18,
    tintColor: '#999',
  },
  countContainer: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 10,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  noResultsIcon: {
    width: 60,
    height: 60,
    tintColor: '#CCC',
    marginBottom: 20,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SettingScreen;