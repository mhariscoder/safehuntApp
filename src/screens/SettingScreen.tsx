import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  const navigation = useNavigation<any>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [appNotificationsEnabled, setAppNotificationsEnabled] = useState(true);

  const SettingItem = ({ label, onPress, showBorder = true, hasSwitch = false, switchValue, onSwitchChange }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, !showBorder && { borderBottomWidth: 0 }]} 
      onPress={onPress}
      disabled={hasSwitch}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      {hasSwitch ? (
        <Switch
          trackColor={{ false: '#D1D1D1', true: '#0E713E' }}
          thumbColor={'#FFFFFF'}
          ios_backgroundColor="#D1D1D1"
          onValueChange={onSwitchChange}
          value={switchValue}
        />
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
          <SettingItem label="Change Password" onPress={() => {}} />
          <SettingItem label="Block" onPress={() => {}} showBorder={false} />
        </View>

        {/* --- NOTIFICATIONS SECTION --- */}
        <SectionHeader icon={ASSETS.iconBell} title="Notifications" />
        <View style={styles.sectionGroup}>
          <SettingItem 
            label="Notifications" 
            hasSwitch={true} 
            switchValue={notificationsEnabled} 
            onSwitchChange={setNotificationsEnabled} 
          />
          <SettingItem 
            label="App Notifications" 
            hasSwitch={true} 
            switchValue={appNotificationsEnabled} 
            onSwitchChange={setAppNotificationsEnabled} 
            showBorder={false}
          />
        </View>

        {/* --- ABOUT SECTION --- */}
        <SectionHeader icon={ASSETS.iconAbout} title="About App" />
        <View style={styles.sectionGroup}>
          <SettingItem label="Terms & Conditions" onPress={() => {}} />
          <SettingItem label="Privacy Policy" onPress={() => {}} />
          <SettingItem label="Rate Our App" onPress={() => {}} showBorder={false} />
        </View>

        {/* --- LOGOUT BUTTON --- */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  logoutButton: {
    backgroundColor: '#0E713E',
    marginHorizontal: 100,
    marginTop: 40,
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
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
});

export default SettingScreen;