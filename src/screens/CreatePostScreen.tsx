// CreatePostScreen.js - With location text storage
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePosts } from '../hooks/usePosts';
import { useAppSelector } from '../app/store/hooks';
import { useFriends } from '../hooks/useFriends';
import { launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import { API_BASE_URL } from '../constants/config';

const { height, width } = Dimensions.get('window');

const ASSETS = {
  iconClose: require('./../../assets/close_icon.png'),
  iconMedia: require('./../../assets/media_icon.png'),
  iconLocation: require('./../../assets/location_icon.png'),
  iconTag: require('./../../assets/tag_icon.png'),
  iconSearch: require('./../../assets/search_icon.png'),
  iconCheck: require('./../../assets/accept_icon.png'),
};

const getFullImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  return `${API_BASE_URL}/public/uploads/${cleanPath}`;
};

const ActionSheetItem = ({ icon, label, onPress, subtitle }) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress}>
    <View style={styles.iconContainer}>
      <Image source={icon} style={styles.actionIcon} />
    </View>
    <View style={styles.actionTextContainer}>
      <Text style={styles.actionLabel}>{label}</Text>
      {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
    </View>
  </TouchableOpacity>
);

// Tag Hunters Modal Component
const TagHuntersModal = ({ visible, onClose, onSelectUsers, selectedIds = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(selectedIds);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    friends, 
    isLoading: friendsLoading, 
    getFriends,
    currentUserId 
  } = useFriends();

  useEffect(() => {
    if (visible && currentUserId) {
      loadFriends();
    }
  }, [visible, currentUserId]);

  const loadFriends = async () => {
    setIsLoading(true);
    try {
      await getFriends(currentUserId);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleConfirm = () => {
    onSelectUsers(selectedUsers);
    onClose();
  };

  const handleClearAll = () => {
    setSelectedUsers([]);
  };

  const filteredFriends = friends.filter(friend => {
    const searchLower = searchQuery.toLowerCase();
    return (friend.displayname || friend.username || '').toLowerCase().includes(searchLower) ||
           (friend.email || '').toLowerCase().includes(searchLower);
  });

  const renderFriendItem = ({ item }) => {
    const isSelected = selectedUsers.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => handleToggleUser(item.id)}
      >
        <View style={styles.friendInfo}>
          <View style={styles.profileCircle}>
            {item.profilePhoto ? (
              <Image 
                source={{ uri: getFullImageUrl(item.profilePhoto) || undefined }} 
                style={styles.profileImage} 
              />
            ) : (
              <Text style={styles.profileInitial}>
                {(item.displayname || item.username || 'U').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.displayname || item.username}</Text>
            <Text style={styles.friendEmail}>{item.email || ''}</Text>
          </View>
        </View>
        {isSelected && (
          <Image source={ASSETS.iconCheck} style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, styles.tagModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Tag Hunters</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Image source={ASSETS.iconClose} style={styles.modalCloseIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.tagSearchContainer}>
            <Image source={ASSETS.iconSearch} style={styles.searchIcon} />
            <TextInput
              style={styles.tagSearchInput}
              placeholder="Search friends..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.selectedInfo}>
            <Text style={styles.selectedCount}>
              {selectedUsers.length} {selectedUsers.length === 1 ? 'friend' : 'friends'} selected
            </Text>
            {selectedUsers.length > 0 && (
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {(friendsLoading || isLoading) && friends.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0E713E" />
              <Text style={styles.loadingText}>Loading friends...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderFriendItem}
              contentContainerStyle={styles.friendsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? `No friends found matching "${searchQuery}"` : 'No friends available'}
                  </Text>
                  {!searchQuery && (
                    <Text style={styles.emptySubtext}>Add friends to tag them in your posts</Text>
                  )}
                </View>
              }
            />
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalConfirmButton, selectedUsers.length === 0 && styles.disabledButton]}
              onPress={handleConfirm}
              disabled={selectedUsers.length === 0}
            >
              <Text style={styles.modalConfirmButtonText}>
                Tag {selectedUsers.length} {selectedUsers.length === 1 ? 'Hunter' : 'Hunters'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Main CreatePostScreen Component
const CreatePostScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  
  // Check if we're editing
  const isEditing = route.params?.isEditing || false;
  const editingPostId = route.params?.postId || null;
  const editingGroupId = route.params?.groupId || null;
  
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  
  const { user } = useAppSelector((state) => state.auth);
  const { createPost, updatePost, getPostById } = usePosts();

  // Load post data if editing
  useEffect(() => {
    if (isEditing && editingPostId) {
      loadPostData();
    } else {
      getCurrentLocation();
    }
  }, [isEditing, editingPostId]);

  const loadPostData = async () => {
    setIsLoadingPost(true);
    try {
      const post = await getPostById(editingPostId, editingGroupId);
      if (post) {
        setPostText(post.description || '');
        
        // Set existing image
        if (post.image) {
          setExistingImage(post.image);
        }
        
        // Set location
        if (post.latitude && post.longitude) {
          setSelectedLocation({ 
            lat: parseFloat(post.latitude), 
            lng: parseFloat(post.longitude) 
          });
          setIsGettingLocation(false);
          // If location name exists in the post, use it
          if (post.location) {
            setLocationName(post.location);
          } else {
            // Fetch location name from coordinates
            fetchLocationNameFromCoords(parseFloat(post.latitude), parseFloat(post.longitude));
          }
        } else {
          getCurrentLocation();
        }
        
        // Set tags
        if (post.tags) {
          try {
            const tags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;
            setSelectedTags(tags || []);
          } catch (e) {
            console.error('Error parsing tags:', e);
            setSelectedTags([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading post data:', error);
      Alert.alert('Error', 'Failed to load post data');
    } finally {
      setIsLoadingPost(false);
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedLocation({ lat: latitude, lng: longitude });
        setIsGettingLocation(false);
        setLocationError(null);
        // Fetch location name after getting coordinates
        fetchLocationNameFromCoords(latitude, longitude);
      },
      (err) => {
        console.warn('High accuracy error, falling back...', err);
        Geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setSelectedLocation({ lat: latitude, lng: longitude });
            setIsGettingLocation(false);
            setLocationError(null);
            fetchLocationNameFromCoords(latitude, longitude);
          },
          (fallbackErr) => {
            console.error('Fallback location error:', fallbackErr);
            setLocationError(`Unable to get location: ${fallbackErr.message}`);
            setIsGettingLocation(false);
            const defaultLocation = { lat: 34.958854, lng: -92.374599 };
            setSelectedLocation(defaultLocation);
            setLocationName('Default Location');
          },
          { enableHighAccuracy: false, timeout: 15000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  const fetchLocationNameFromCoords = async (lat: number, lng: number) => {
    try {
      const name = await getLocationName(lat, lng);
      setLocationName(name);
    } catch (error) {
      console.error('Failed to get location name:', error);
      setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleSelectImage = () => {
    const options: any = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, (response: any) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
        });
        // Clear existing image if a new one is selected
        if (existingImage) {
          setExistingImage(null);
        }
      }
    });
  };

  const handleLocationPress = () => {
    if (locationError || !selectedLocation) {
      getCurrentLocation();
    } else {
      Alert.alert(
        'Current Location',
        `Location: ${locationName || 'Unknown'}\nLatitude: ${selectedLocation.lat.toFixed(6)}\nLongitude: ${selectedLocation.lng.toFixed(6)}`,
        [
          { text: 'OK', style: 'default' },
          { text: 'Refresh', onPress: getCurrentLocation }
        ]
      );
    }
  };

  const handleTagsSelect = (userIds) => {
    setSelectedTags(userIds);
  };

  const handleSavePost = async () => {
    if (!postText.trim() && !selectedImage && !existingImage) {
      Alert.alert('Error', 'Please add some content to your post');
      return;
    }

    setLoading(true);
    try {
      const postData: any = {
        description: postText,
        latitude: selectedLocation ? selectedLocation.lat : 0,
        longitude: selectedLocation ? selectedLocation.lng : 0,
        location: locationName || 'Unknown Location', // Store the location text
        tags: selectedTags.length > 0 ? JSON.stringify(selectedTags) : null,
      };
      
      // Handle image - if there's a selected image (new), use it
      if (selectedImage) {
        postData.image = selectedImage;
      } 
      // If editing and there's an existing image but no new image selected, keep the existing
      else if (isEditing && existingImage) {
        postData.keepImage = true;
        postData.existingImage = existingImage;
      }
      
      // Add groupId if editing a group post
      if (editingGroupId) {
        postData.groupId = editingGroupId;
      }
      
      let result;
      if (isEditing && editingPostId) {
        // Update existing post
        postData.id = editingPostId;
        result = await updatePost(postData);
        Alert.alert('Success', 'Post updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Create new post
        result = await createPost(postData);
        Alert.alert('Success', 'Post created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setExistingImage(null);
  };

  const getLocationSubtitle = () => {
    if (isGettingLocation) {
      return '📍 Getting location...';
    }

    if (locationError) {
      return '📍 Location unavailable - Tap to retry';
    }

    if (locationName) {
      return `📍 ${locationName}`;
    }

    return 'Add location';
  };

  const getTagsSubtitle = () => {
    if (selectedTags.length > 0) {
      return `👥 ${selectedTags.length} hunter${selectedTags.length > 1 ? 's' : ''} tagged`;
    }
    return 'Tag hunters';
  };

  const getLocationName = async (lat: number|undefined, lon: number|undefined): Promise<string> => {
    try {
      const res = await fetch(
        `https://us1.locationiq.com/v1/reverse?key=pk.eb856481a602e04547d84550365ccece&lat=${lat}&lon=${lon}&format=json`
      );

      const data = await res.json();
      const a = data?.address || {};

      const city = a.city || a.town || a.village || a.suburb || a.county || '';
      const country = a.country || '';

      const locationName = city && country
        ? `${city}, ${country}`
        : data?.display_name || `${lat?.toFixed(4)}, ${lon?.toFixed(4)}`;

      return locationName;
    } catch (error) {
      console.warn('Failed to get location name:', error);
      return `${lat?.toFixed(4) || '0'}, ${lon?.toFixed(4) || '0'}`;
    }
  };

  // Show loading indicator while fetching post data
  if (isLoadingPost) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
        <Text style={styles.loadingText}>Loading post data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Image source={ASSETS.iconClose} style={styles.headerCloseIcon} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Post' : 'Create a Post'}</Text>
        
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleSavePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.headerPostText}>{isEditing ? 'Update' : 'Post'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileIndicator}>
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
          <Text style={styles.profileName}>{user?.displayname || user?.username}</Text>
        </View>

        <TextInput
          style={styles.textInput}
          placeholder="What Are You Thinking About?"
          multiline
          placeholderTextColor="#666"
          value={postText}
          onChangeText={setPostText}
          textAlignVertical="top"
          editable={!loading}
        />

        {/* Show existing image if editing and no new image selected */}
        {existingImage && !selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: getFullImageUrl(existingImage) || undefined }} 
              style={styles.imagePreview} 
            />
            <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.existingImageBadge}>
              <Text style={styles.existingImageBadgeText}>Existing Image</Text>
            </View>
          </View>
        )}

        {/* Show new selected image */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.actionSheetContainer}>
        <View style={styles.actionSheetPill}>
          <View style={styles.actionIndicator} />

          <View style={styles.actionSheetBody}>
            <ActionSheetItem
              icon={ASSETS.iconMedia}
              label={existingImage ? 'Change Media' : 'Media'}
              onPress={handleSelectImage}
            />
            <ActionSheetItem
              icon={ASSETS.iconLocation}
              label="Location"
              subtitle={getLocationSubtitle()}
              onPress={handleLocationPress}
            />
            <ActionSheetItem
              icon={ASSETS.iconTag}
              label="Tag Hunters"
              subtitle={getTagsSubtitle()}
              onPress={() => setShowTagModal(true)}
            />
          </View>
        </View>
      </View>

      {/* Tag Hunters Modal */}
      <TagHuntersModal
        visible={showTagModal}
        onClose={() => setShowTagModal(false)}
        onSelectUsers={handleTagsSelect}
        selectedIds={selectedTags}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFAF0',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FCFAF0',
  },
  header: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 50 : 75,
    paddingBottom: 15,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerButton: {
    padding: 5,
  },
  headerCloseIcon: {
    width: 22,
    height: 22,
    tintColor: '#FFFFFF',
  },
  headerPostText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4D3626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  profileInitial: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  textInput: {
    fontSize: 14,
    color: '#000',
    lineHeight: 22,
    minHeight: 150,
  },
  imagePreviewContainer: {
    marginTop: 15,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  existingImageBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(14, 113, 62, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  existingImageBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  actionSheetContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  actionSheetPill: {
    backgroundColor: '#0E713E',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  actionIndicator: {
    width: 32,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 25,
  },
  actionSheetBody: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
  },
  iconContainer: {
    marginRight: 15,
  },
  actionIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#FFF',
  },
  actionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', 
  },
  actionTextContainer: {
    flex: 1,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#A0C4B0',
    marginTop: 2,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  tagModalContent: {
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseIcon: {
    width: 24,
    height: 24,
    tintColor: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  modalConfirmButton: {
    flex: 2,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#0E713E',
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#A0C4B0',
  },
  // Tag Modal Styles
  tagSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#666',
  },
  tagSearchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  selectedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
  },
  clearAllText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  friendsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  friendItemSelected: {
    backgroundColor: '#F0F9F4',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  friendEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  checkIcon: {
    width: 24,
    height: 24,
    tintColor: '#0E713E',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#CCC',
    marginTop: 8,
    textAlign: 'center',
  },
  locationInfoContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationInfoText: {
    fontSize: 14,
    color: '#333',
  },
});

export default CreatePostScreen;