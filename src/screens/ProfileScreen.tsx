import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
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
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import { useFriends } from '../hooks/useFriends';
import { useUserEquipment } from '../hooks/useUserEquipment';
import { updateUser } from '../features/auth/authActions';

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
  pistolIcon: require('../../assets/pistol_icon.png'),
  bowIcon: require('../../assets/bow_icon.png'),
  knifeIcon: require('../../assets/knife_icon.png'),
  editIcon: require('../../assets/edit_icon.png'),
  closeIcon: require('../../assets/close_icon.png'),
};

const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState('Details');
  const [showAllFriends, setShowAllFriends] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState('');
  const [editValue, setEditValue] = useState('');
  
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isLoading: authLoading, user } = useAppSelector((state) => state.auth);
  
  const {
    friends,
    isLoading: friendsLoading,
    getFriends,
    currentUserId,
  } = useFriends();

  const { userEquipments, getUserEquipments } = useUserEquipment();

  useEffect(() => {
    if (currentUserId) {
      loadFriends();
      getUserEquipments();
    }
  }, [currentUserId]);

  const loadFriends = async () => {
    try {
      await getFriends(currentUserId!);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updateData: any = {};
      
      switch (editingField) {
        case 'huntingExperience':
          updateData.huntingExperience = editValue;
          break;
        case 'skills':
          updateData.skills = editValue;
          break;
        case 'bio':
          updateData.bio = editValue;
          break;
      }
      
      await dispatch(updateUser({ userId: user?.id, userData: updateData })).unwrap();
      
      Alert.alert('Success', `${editingField} updated successfully`);
      setEditModalVisible(false);
      
      // Refresh user data
      // You might want to dispatch an action to refresh user data
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update');
    }
  };

  const handleAddEquipment = () => {
    navigation.navigate('AvailableEquipment');
  };

  const displayedFriends = showAllFriends ? friends : friends.slice(0, 6);
  const hasMoreFriends = friends.length > 6;

  const renderContent = () => {
    switch (activeTab) {
      case 'Posts':
        return (
          <View style={styles.postInputSection}>
            <Text style={styles.postHeader}>{user?.displayname}'s posts</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.miniAvatar}>
                <Text style={styles.avatarText}>{user?.displayname?.charAt(0) || 'U'}</Text>
              </View>
              <TextInput 
                placeholder={`Write Something To ${user?.displayname}...`} 
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
            {/* Bio Section with Edit */}
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailLabel}>Bio</Text>
                <TouchableOpacity onPress={() => handleEdit('bio', user?.bio || '')}>
                  <Image source={ASSETS.editIcon} style={styles.editIcon} />
                </TouchableOpacity>
              </View>
              <Text style={styles.detailValue}>{user?.bio || 'No bio available'}</Text>
            </View>

            {/* Hunting Experiences with Edit */}
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailLabel}>Hunting Experiences</Text>
                <TouchableOpacity onPress={() => handleEdit('huntingExperience', user?.huntingExperience || '')}>
                  <Image source={ASSETS.editIcon} style={styles.editIcon} />
                </TouchableOpacity>
              </View>
              <Text style={styles.detailValue}>{user?.huntingExperience || 'Not specified'}</Text>
            </View>

            {/* Skills with Edit */}
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailLabel}>Skills</Text>
                <TouchableOpacity onPress={() => handleEdit('skills', user?.skills || '')}>
                  <Image source={ASSETS.editIcon} style={styles.editIcon} />
                </TouchableOpacity>
              </View>
              <Text style={styles.skillsValue}>{user?.skills || 'Not specified'}</Text>
            </View>

            {/* Equipment with Add Button */}
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailLabel}>Equipment</Text>
                <TouchableOpacity onPress={handleAddEquipment}>
                  <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.equipmentRow}>
                {userEquipments.length > 0 ? (
                  userEquipments.map((item) => (
                    <View key={item.id} style={styles.equipmentItem}>
                      <Image 
                        source={item.equipment?.imageUrl ? { uri: item.equipment.imageUrl } : ASSETS.pistolIcon} 
                        style={styles.equipIconImage} 
                      />
                    </View>
                  ))
                ) : (
                  <Text style={styles.noEquipmentText}>No equipment added</Text>
                )}
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={ASSETS.iconBack} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>{user?.displayname}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.searchCircle}>
          <Image source={ASSETS.iconSearch} style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Image source={ASSETS.coverImage} style={styles.coverImage} />

          <View style={styles.profilePicContainer}>
            <Image 
              source={user?.profilePhoto ? { uri: user.profilePhoto } : ASSETS.profilePic} 
              style={styles.profilePic} 
            />
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.userName}>{user?.displayname || user?.username}</Text>
          <Text style={styles.mutualFriends}>{friends.length} friends</Text>
          <Text style={styles.bio}>
            {user?.bio || 'No bio available'}
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.btnFriends} 
              onPress={() => navigation.navigate('Friends')}
            >
              <Image source={ASSETS.friendsIcon} style={styles.btnIcon} />
              <Text style={styles.btnText}>Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.btnMessage} 
              onPress={() => navigation.navigate('Messages')}
            >
              <Image source={ASSETS.messageIcon} style={styles.btnIcon} />
              <Text style={styles.btnText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnMore}>
              <Image source={ASSETS.moreIcon} style={styles.moreDots} />
            </TouchableOpacity>
          </View>
        </View>

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

        {renderContent()}

        {friends.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Friends</Text>
              <Text style={styles.sectionSubtitle}>{friends.length} friends</Text>
            </View>

            {friendsLoading ? (
              <ActivityIndicator style={styles.friendsLoader} color="#0E713E" />
            ) : (
              <View style={styles.friendsGrid}>
                {displayedFriends.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.friendCard}
                    onPress={() => navigation.navigate('Profile', { userId: item.id })}
                  >
                    <Image 
                      source={item.profilePhoto ? { uri: item.profilePhoto } : ASSETS.profilePic} 
                      style={styles.friendImage} 
                    />
                    <View style={styles.friendLabel}>
                      <Text style={styles.friendName} numberOfLines={1}>
                        {item.displayname || item.username}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {hasMoreFriends && !showAllFriends && (
              <TouchableOpacity 
                style={styles.seeAllButton} 
                onPress={() => setShowAllFriends(true)}
              >
                <Text style={styles.seeAllText}>See All Friends</Text>
              </TouchableOpacity>
            )}

            {showAllFriends && hasMoreFriends && (
              <TouchableOpacity 
                style={styles.seeAllButton} 
                onPress={() => setShowAllFriends(false)}
              >
                <Text style={styles.seeAllText}>Show Less</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {friends.length === 0 && !friendsLoading && (
          <View style={styles.noFriendsContainer}>
            <Text style={styles.noFriendsText}>No friends yet</Text>
            <TouchableOpacity 
              style={styles.findFriendsButton}
              onPress={() => navigation.navigate('FindFriends')}
            >
              <Text style={styles.findFriendsText}>Find Friends</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editingField === 'huntingExperience' ? 'Hunting Experience' : 
                       editingField === 'skills' ? 'Skills' : 'Bio'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Image source={ASSETS.closeIcon} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter ${editingField}`}
              placeholderTextColor="#999"
              multiline={editingField === 'bio'}
              numberOfLines={editingField === 'bio' ? 4 : 1}
            />
            
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
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
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
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
  profilePic: { width: 130, height: 130, resizeMode: 'cover' },
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
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: { fontSize: 12, fontWeight: 'bold', color: '#000' },
  detailValue: { fontSize: 12, color: '#666' },
  editIcon: { width: 16, height: 16, tintColor: '#0E713E' },
  addButtonText: { fontSize: 12, color: '#0E713E', fontWeight: '600' },
  noEquipmentText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  skillsValue: { fontSize: 12, color: '#0E713E', fontWeight: '500' },
  equipmentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, flexWrap: 'wrap' },
  equipmentItem: { position: 'relative' },
  equipIconImage: { width: 28, height: 28, marginRight: 20, marginBottom: 10, resizeMode: 'contain' },
  tabPlaceholder: { padding: 40, alignItems: 'center' },
  placeholderText: { color: '#999', fontStyle: 'italic' },
  sectionHeader: { paddingHorizontal: 25, paddingTop: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold' },
  sectionSubtitle: { color: '#666', fontSize: 12, marginBottom: 15 },
  friendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 25,
    gap: 5,
  },
  friendCard: { width: (width - 60) / 3, marginBottom: 15, borderRadius: 10, overflow: 'hidden' },
  friendImage: { width: '100%', height: 110 },
  friendLabel: { backgroundColor: '#0E713E', padding: 10, alignItems: 'center' },
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
  friendsLoader: { marginVertical: 20 },
  noFriendsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginHorizontal: 25,
  },
  noFriendsText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 15,
  },
  findFriendsButton: {
    backgroundColor: '#0E713E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  findFriendsText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: width - 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: '#666',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#000',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#0E713E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProfileScreen;