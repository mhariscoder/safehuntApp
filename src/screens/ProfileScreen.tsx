import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';

const { width } = Dimensions.get('window');

const ASSETS = {
  iconBack: require('../../assets/back_white.png'),
  iconSearch: require('../../assets/search_icon.png'),
  coverImage: require('../../assets/forest_cover.png'),
  profilePic: require('../../assets/friend.png'),
  searchIcon: require('../../assets/search_icon.png'),
  backIcon: require('../../assets/back_white.png'),
  friendsIcon: require('../../assets/friends_icon_white.png'),
  messageIcon: require('../../assets/message_icon_white.png'),
  moreIcon: require('../../assets/more_dots_grey.png'),
  imagePlaceholder: require('../../assets/image_upload_icon.png'),
  // Equipment Images
  pistolIcon: require('../../assets/pistol_icon.png'),
  bowIcon: require('../../assets/bow_icon.png'),
  knifeIcon: require('../../assets/knife_icon.png'),
};

const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState('Details');

  const renderContent = () => {
    switch (activeTab) {
      case 'Posts':
        return (
          <View style={styles.postInputSection}>
            <Text style={styles.postHeader}>Henry's posts</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.miniAvatar}>
                <Text style={styles.avatarText}>W</Text>
              </View>
              <TextInput 
                placeholder="Write Something To Henry..." 
                style={styles.input}
                placeholderTextColor="#666"
              />
              <Image source={ASSETS.imagePlaceholder} style={styles.inputImageIcon} />
            </View>
          </View>
        );

      case 'Photos':
        return (
          <View style={styles.tabPlaceholder}>
            <Text style={styles.placeholderText}>No Photos Available</Text>
          </View>
        );

      case 'Details':
        return (
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Hunting Experiences</Text>
              <Text style={styles.detailValue}>5 Years Hunting Experience</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Skills</Text>
              <Text style={styles.skillsValue}>#Loremsipsum #Loremsipsum #Loremsipsum</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Equipment</Text>
              <View style={styles.equipmentRow}>
                <Image source={ASSETS.pistolIcon} style={styles.equipIconImage} />
                <Image source={ASSETS.pistolIcon} style={styles.equipIconImage} />
                <Image source={ASSETS.pistolIcon} style={styles.equipIconImage} />
                <Image source={ASSETS.bowIcon} style={styles.equipIconImage} />
                <Image source={ASSETS.knifeIcon} style={[styles.equipIconImage, { width: 22 }]} />
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Image source={ASSETS.iconBack} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Henry</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.searchCircle}>
          <Image source={ASSETS.iconSearch} style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Image source={ASSETS.coverImage} style={styles.coverImage} />

          <View style={styles.profilePicContainer}>
            <Image source={ASSETS.profilePic} style={styles.profilePic} />
          </View>
        </View>
        
        {/* --- USER INFO --- */}
        <View style={styles.infoSection}>
          <Text style={styles.userName}>Henry</Text>
          <Text style={styles.mutualFriends}>59 mutual friends</Text>
          <Text style={styles.bio}>
            "The search for a scapegoat is the easiest of all hunting expeditions."
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnFriends}>
              <Image source={ASSETS.friendsIcon} style={styles.btnIcon} />
              <Text style={styles.btnText}>Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnMessage}>
              <Image source={ASSETS.messageIcon} style={styles.btnIcon} />
              <Text style={styles.btnText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnMore}>
              <Image source={ASSETS.moreIcon} style={styles.moreDots} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- DYNAMIC TABS --- */}
        <View style={styles.tabBar}>
          {['Posts', 'Photos', 'Details'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- TAB CONTENT AREA --- */}
        {renderContent()}

        {/* --- FRIENDS GRID --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <Text style={styles.sectionSubtitle}>59 mutual friends</Text>
        </View>

        <View style={styles.friendsGrid}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <View key={item} style={styles.friendCard}>
              <Image source={ASSETS.profilePic} style={styles.friendImage} />
              <View style={styles.friendLabel}>
                <Text style={styles.friendName} numberOfLines={1}>Juba tal</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See All Friends</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerContainer: { height: 260, position: 'relative' },
  coverImage: { width: '100%', height: 215 },
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
  navIcon: { width: 24, height: 24 },
  headerName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  profilePicContainer: {
    position: 'absolute',
    top: 140,
    left: 20,
    borderWidth: 4,
    borderColor: '#0E713E',
    borderRadius: 80,
    overflow: 'hidden',
    backgroundColor: '#FFF'
  },
  profilePic: { width: 130, height: 130 },
  infoSection: { paddingHorizontal: 25, marginTop: 30 },
  userName: { fontSize: 20, fontWeight: '900', color: '#000' },
  mutualFriends: { color: '#666', fontSize: 12, marginVertical: 4 },
  bio: { color: '#333', fontSize: 12, fontStyle: 'italic', marginBottom: 15 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  btnFriends: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0E713E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnMessage: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4A321F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnMore: { backgroundColor: '#AACEBC', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  btnIcon: { width: 12, height: 14, resizeMode: 'contain', marginRight: 8, tintColor: '#FFF' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  moreDots: { width: 20, height: 20, tintColor: '#ffffff', resizeMode: 'contain' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0E713E',
    padding: 5,
    paddingHorizontal: 25,
    paddingVertical: 10,
    marginBottom: 10,
    
  },
  tabItem: { alignItems: 'center', paddingVertical: 5, paddingHorizontal: 20 },
  activeTab: { backgroundColor: '#FFF', borderRadius: 20 },
  activeTabText: { color: '#0E713E', fontWeight: 'bold' },
  tabText: { color: '#FFF', fontWeight: '500', fontSize: 12 },
  detailsContainer: { paddingHorizontal: 25, paddingVertical: 15 },
  detailItem: { marginBottom: 20 },
  detailLabel: { fontSize: 12, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  detailValue: { fontSize: 12, color: '#666' },
  skillsValue: { fontSize: 12, color: '#0E713E', fontWeight: '500' },
  equipmentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  equipIconImage: { width: 28, height: 28, marginRight: 20, resizeMode: 'contain' },
  tabPlaceholder: { padding: 40, alignItems: 'center' },
  placeholderText: { color: '#999', fontStyle: 'italic' },
  sectionHeader: { paddingHorizontal: 25, paddingTop: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold' },
  sectionSubtitle: { color: '#666', fontSize: 12, marginBottom: 15 },
  friendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 25,
    justifyContent: 'space-between',
  },
  friendCard: { width: (width - 60) / 3, marginBottom: 15, borderRadius: 10, overflow: 'hidden' },
  friendImage: { width: '100%', height: 110 },
  friendLabel: { backgroundColor: '#0E713E', paddingVertical: 5, alignItems: 'center', paddingBottom: 24 },
  friendName: { color: '#FFF', fontSize: 12 },
  seeAllButton: {
    backgroundColor: '#0E713E',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 60,
    alignItems: 'center',
    marginBottom: 30,
  },
  seeAllText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  postInputSection: { padding: 20, backgroundColor: '#0E713E', marginHorizontal: 20, borderRadius: 15, marginBottom: 20 },
  postHeader: { color: '#FFF', marginBottom: 15, fontSize: 16, fontWeight: 'bold' },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 30,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  miniAvatar: { width: 35, height: 35, borderRadius: 20, backgroundColor: '#4A321F', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: 'bold' },
  input: { flex: 1, paddingHorizontal: 10, height: 40, color: '#000', fontSize: 12 },
  inputImageIcon: { width: 24, height: 24, tintColor: '#0E713E' },
});

export default ProfileScreen;