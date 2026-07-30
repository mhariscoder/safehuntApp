import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import { useUserEquipment } from '../hooks/useUserEquipment';
import { useBlock } from '../hooks/useBlock';
import { usePosts } from '../hooks/usePosts';
import { getUsersByIds } from '../features/auth/authActions';
import { sendFriendRequest, acceptFriendRequest } from '../features/friends/friendsActions';
import { API_BASE_URL } from '../constants/config';

const { width } = Dimensions.get('window');

const ASSETS = {
  iconBack: require('../../assets/back_white.png'),
  iconSearch: require('../../assets/search_icon.png'),
  coverImage: require('../../assets/forest_cover.png'),
  profilePic: require('../../assets/friend.png'),
  searchIcon: require('../../assets/search_icon.png'),
  friendsIcon: require('../../assets/friends_icon_white.png'),
  messageIcon: require('../../assets/message_icon_white.png'),
  moreIcon: require('../../assets/more_dots_grey.png'),
  imagePlaceholder: require('../../assets/image_upload_icon.png'),
  pistolIcon: require('../../assets/pistol_icon.png'),
  bowIcon: require('../../assets/bow_icon.png'),
  knifeIcon: require('../../assets/knife_icon.png'),
  addFriendIcon: require('../../assets/plus_icon.png'),
  greenHeart: require('../../assets/green_heart.png'),
  greenComment: require('../../assets/green_comment.png'),
  greenShare: require('../../assets/green_share.png'),
  pendingIcon: require('../../assets/more_dots_grey.png'),
};

interface UserData {
  id: string;
  displayname: string;
  username: string;
  email: string;
  phonenumber: string;
  bio: string | null;
  huntingExperience: string | null;
  skills: string[] | null;
  profilePhoto: string | null;
  coverPhoto: string | null;
  currentLatitude?: number;
  currentLongitude?: number;
  subscriptionStatus?: string;
  status?: string;
  isFriend: number;
  isRequested: number;
  isRequestSent: boolean;
  isRequestReceived: boolean;
  requestedBy: string | null;
}



const getFullImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '');
  return `${API_BASE_URL}/public/uploads/${cleanPath}`;
};

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
};

const UserScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  
  const { userId } = route.params || {};
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Details');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isAcceptingRequest, setIsAcceptingRequest] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');

  const {
    blockUser,
    unblockUser,
    blockedUsers,
  } = useBlock();

  const blockedUserIds = React.useMemo(() => {
    return new Set(
      blockedUsers.map(
        (block: any) => block.blockedId || block.blocked?.id
      )
    );
  }, [blockedUsers]);

  const isBlocked = userData
    ? blockedUserIds.has(Number(userData.id))
    : false;
  
  const { getUserEquipments, userEquipments } = useUserEquipment();
  const {
    getPostsByUserId,
    posts: userPosts,
    isLoading: postsLoading,
    toggleLike,
  } = usePosts();

  useEffect(() => {
    console.log('userPosts', userPosts)
  }, [userPosts])

  useEffect(() => {
    blockUser({ page: 1, limit: 100 });
  }, []);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadUserPosts();
    }
  }, [userId]);

  useEffect(() => {
    if (userData?.id) {
      getUserEquipments(parseInt(userData.id));
    }
  }, [userData?.id]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const result = await dispatch(getUsersByIds({ 
        ids: [parseInt(userId)], 
        currentUserId: currentUser?.id 
      })).unwrap();

      console.log('API response for user data:', result);
      
      let userDataArray = result;
      if (result?.data?.data) {
        userDataArray = result.data.data;
      } else if (result?.data) {
        userDataArray = result.data;
      }
      
      if (userDataArray && userDataArray.length > 0) {
        const user = userDataArray[0];
        setUserData(user);
        
        if (user.isFriend === 1) {
          setFriendStatus('friends');
        } else if (user.isRequestSent === true) {
          setFriendStatus('pending_sent');
        } else if (user.isRequestReceived === true) {
          setFriendStatus('pending_received');
        } else {
          setFriendStatus('none');
        }
      } else {
        Alert.alert('Error', 'User not found');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error loading user:', error);
      Alert.alert('Error', error.message || 'Failed to load user data');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      await getPostsByUserId(parseInt(userId), { page: 1, limit: 20 });
    } catch (error) {
      console.error('Error loading user posts:', error);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!userData) return;
    
    setIsSendingRequest(true);
    try {
      await dispatch(sendFriendRequest({ recipientId: userData.id })).unwrap();
      setFriendStatus('pending_sent');
      Alert.alert('Success', `Friend request sent to ${userData.displayname}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!userData) return;
    
    setIsAcceptingRequest(true);
    try {
      await dispatch(acceptFriendRequest({ requestId: userData.id })).unwrap();
      setFriendStatus('friends');
      Alert.alert('Success', `You are now friends with ${userData.displayname}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept friend request');
    } finally {
      setIsAcceptingRequest(false);
    }
  };

  const handleMessagePress = () => {
    navigation.navigate('MessageDetail', {
      userId: userData?.id,
      displayname: userData?.displayname,
      chatId: userData?.id,
    });
  };

  const handleLike = async (postId: number) => {
    try {
      await toggleLike(postId);
      await loadUserPosts();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update like');
    }
  };

  const handleBlockToggle = () => {
    if (!userData) return;

    if (isBlocked) {
      Alert.alert(
        'Unblock User',
        `Are you sure you want to unblock ${userData.displayname}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            onPress: async () => {
              try {
                await unblockUser(Number(userData.id));
                Alert.alert('Success', 'User unblocked successfully');
                loadUserData();
              } catch (e: any) {
                Alert.alert(
                  'Error',
                  e.message || 'Failed to unblock user'
                );
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Block User',
        `Are you sure you want to block ${userData.displayname}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              try {
                await blockUser(Number(userData.id));
                Alert.alert('Success', 'User blocked successfully');
                navigation.goBack();
              } catch (e: any) {
                Alert.alert(
                  'Error',
                  e.message || 'Failed to block user'
                );
              }
            },
          },
        ]
      );
    }
  };

  const renderPostItem = ({ item: post }: { item: any }) => {
    const postDate = post.created_at || post.createdAt;
    const imageUrl = post.image ? getFullImageUrl(post.image) : null;
    const userAvatar = post.user?.profilePhoto ? getFullImageUrl(post.user.profilePhoto) : null;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image 
            source={userAvatar ? { uri: userAvatar } : ASSETS.profilePic} 
            style={styles.postAvatar} 
          />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postUserName}>{post.user?.displayname || post.user?.username || 'User'}</Text>
            <Text style={styles.postLocation}>
              {formatTimeAgo(postDate)} • {post.location || ''}
            </Text>
          </View>
        </View>

        <Text style={styles.postCaption}>
          {post.description}
          {post.tags && <Text style={styles.hashtag}> {post.tags}</Text>}
        </Text>

        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.postImage} />
        )}

        <View style={styles.postStatsRow}>
          <Text style={styles.postStatsText}>❤️ {post.likesCount || 0} {(post.likesCount === 1 ? 'Like' : 'Likes')}</Text>
          <Text style={styles.postStatsText}>{post.comments?.length || 0} Comments</Text>
        </View>

        <View style={styles.postActionButtons}>
          <TouchableOpacity 
            style={styles.postActionBtn}
            onPress={() => handleLike(post.id)}
          >
            <Image 
              source={ASSETS.greenHeart} 
              resizeMode='contain' 
              style={[styles.postActionImage, post.postLiked && styles.postActionImageActive]} 
            />
            <Text style={[styles.postActionBtnText, post.postLiked && styles.postActionBtnTextActive]}>
              {post.postLiked ? 'Liked' : 'Like'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.postActionBtn}>
            <Image source={ASSETS.greenComment} resizeMode='contain' style={styles.postActionImage} />
            <Text style={styles.postActionBtnText}>Comment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.postActionBtn}>
            <Image source={ASSETS.greenShare} resizeMode='contain' style={styles.postActionImage} />
            <Text style={styles.postActionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Posts':
        return (
          <View style={styles.postsContainer}>
            {postsLoading && userPosts.length === 0 ? (
              <ActivityIndicator size="large" color="#0E713E" style={styles.postsLoader} />
            ) : userPosts && userPosts.length > 0 ? (
              <FlatList
                data={userPosts}
                renderItem={renderPostItem}
                keyExtractor={(item, index) => {
                  if (item && item.id) {
                    return item.id.toString();
                  }
                  return index.toString();
                }}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noPostsContainer}>
                <Text style={styles.noPostsText}>No posts yet</Text>
              </View>
            )}
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
              <Text style={styles.detailLabel}>Display Name</Text>
              <Text style={styles.detailValue}>{userData?.displayname || 'Not specified'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Username</Text>
              <Text style={styles.detailValue}>{userData?.username || 'Not specified'}</Text>
            </View>

            {/* <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{userData?.email || 'Not specified'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>{userData?.phonenumber || 'Not specified'}</Text>
            </View> */}

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Bio</Text>
              <Text style={styles.detailValue}>{userData?.bio || 'No bio available'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Hunting Experiences</Text>
              <Text style={styles.detailValue}>{userData?.huntingExperience || 'Not specified'}</Text>
            </View>

            {/* <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Skills</Text>
              <Text style={styles.skillsValue}>
                {Array.isArray(userData?.skills) && userData.skills.length > 0 
                  ? userData.skills.join(', ') 
                  : (userData?.skills || 'Not specified')}
              </Text>
            </View> */}

            {/* <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailLabel}>Equipment</Text>
              </View>
              <View style={styles.equipmentRow}>
                {userEquipments && userEquipments.length > 0 ? (
                  userEquipments.map((item) => (
                    <View key={item.id} style={styles.equipmentItem}>
                      <Image 
                        source={item.equipment?.imageUrl ? { uri: getFullImageUrl(item.equipment.imageUrl) } : ASSETS.pistolIcon} 
                        style={styles.equipIconImage} 
                      />
                    </View>
                  ))
                ) : (
                  <Text style={styles.noEquipmentText}>No equipment added</Text>
                )}
              </View>
            </View> */}
          </View>
        );
      default:
        return null;
    }
  };

  const renderActionButton = () => {
    switch (friendStatus) {
      case 'friends':
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.btnMessage} 
              onPress={handleMessagePress}
            >
              <Image source={ASSETS.messageIcon} style={styles.btnIcon} />
              <Text style={styles.btnText}>Message</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.btnMore}>
              <Image source={ASSETS.moreIcon} style={styles.moreDots} />
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[
                  styles.btnBlock,
                  isBlocked && styles.btnUnblock,
              ]}
              onPress={handleBlockToggle}
          >
              <Text style={styles.btnText}>
                  {isBlocked ? 'Unblock User' : 'Block User'}
              </Text>
          </TouchableOpacity>
          </View>
        );
      
      case 'pending_sent':
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.btnPending} 
              disabled={true}
            >
              <Image source={ASSETS.pendingIcon} style={styles.btnIcon} />
              <Text style={styles.btnText}>Request Sent</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'pending_received':
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.btnAccept} 
              onPress={handleAcceptFriendRequest}
              disabled={isAcceptingRequest}
            >
              {isAcceptingRequest ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Image source={ASSETS.addFriendIcon} style={styles.btnIcon} />
                  <Text style={styles.btnText}>Accept Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );
      
      default:
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.btnAddFriend} 
              onPress={handleSendFriendRequest}
              disabled={isSendingRequest}
            >
              {isSendingRequest ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Image source={ASSETS.addFriendIcon} style={styles.btnIcon} />
                  <Text style={styles.btnText}>Add Friend</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity 
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profilePhotoUrl = getFullImageUrl(userData.profilePhoto);
  const coverPhotoUrl = getFullImageUrl(userData.coverPhoto);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={ASSETS.iconBack} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>{userData.displayname}</Text>
        </TouchableOpacity>
        
        {/* <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchCircle}>
            <Image source={ASSETS.iconSearch} style={styles.searchIcon} />
          </TouchableOpacity>
        </View> */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Image 
            source={coverPhotoUrl ? { uri: coverPhotoUrl } : ASSETS.coverImage}
            style={styles.coverImage} 
          />

          {/* <View style={styles.profilePicContainer}>
            <Image 
              source={profilePhotoUrl ? { uri: profilePhotoUrl } : ASSETS.profilePic}
              style={styles.profilePic} 
            />
          </View> */}
          <View style={styles.profilePicContainer}>
            {profilePhotoUrl ? (
              <Image 
                source={profilePhotoUrl ? { uri: profilePhotoUrl } : ASSETS.profilePic}
                style={styles.profilePic}
              />
            ) : (
              <Text style={styles.profileText}>
                {userData?.displayname?.charAt(0) || userData?.username?.charAt(0) || 'U'}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.userName}>{userData.displayname || userData.username}</Text>
          <Text style={styles.mutualFriends}>
            {userData.isFriend === 1 ? 'Friend' : 'Hunter'}
          </Text>
          <Text style={styles.bio}>
            {userData.bio || 'No bio available'}
          </Text>

          {renderActionButton()}
        </View>

        <View style={styles.tabBar}>
          {[
            'Posts', 
            // 'Photos', 
            'Details'
          ].map((tab) => (
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
      </ScrollView>
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
  headerContainer: { height: 260, position: 'relative' },
  coverImage: { width: '100%', height: 215, resizeMode: 'cover' },
  header: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 50 : 75,
    paddingBottom: 15,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between'
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
  searchCircle: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    width: 18,
    height: 18,
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
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center', 
    width: 130, 
    height: 130
  },
  profilePic: { width: 130, height: 130, resizeMode: 'cover' },
  profileText: { color: '#000', fontSize: 48, fontWeight: '800', textAlign: 'center'},
  infoSection: { paddingHorizontal: 25, marginTop: 30 },
  userName: { fontSize: 20, fontWeight: '900', color: '#000' },
  mutualFriends: { color: '#666', fontSize: 12, marginVertical: 4 },
  bio: { color: '#333', fontSize: 12, fontStyle: 'italic', marginBottom: 15 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  btnMessage: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0E713E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAddFriend: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4A321F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPending: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#999',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAccept: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0E713E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnMore: { 
    backgroundColor: '#AACEBC', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: { width: 14, height: 14, resizeMode: 'contain', marginRight: 8, tintColor: '#FFF' },
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
  detailLabel: { fontSize: 12, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  detailValue: { fontSize: 12, color: '#666' },
  skillsValue: { fontSize: 12, color: '#0E713E', fontWeight: '500' },
  equipmentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, flexWrap: 'wrap' },
  equipmentItem: { position: 'relative' },
  equipIconImage: { width: 28, height: 28, marginRight: 20, marginBottom: 10, resizeMode: 'contain' },
  noEquipmentText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  tabPlaceholder: { padding: 40, alignItems: 'center' },
  placeholderText: { color: '#999', fontStyle: 'italic' },
  
  postsContainer: { paddingHorizontal: 25, paddingVertical: 15 },
  postsLoader: { marginVertical: 20 },
  postCard: { 
    backgroundColor: '#FFF', 
    marginBottom: 20, 
    borderRadius: 12, 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 1 
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  postHeaderInfo: { flex: 1 },
  postUserName: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  postLocation: { fontSize: 10, color: '#666', marginTop: 2 },
  postCaption: { paddingHorizontal: 15, marginBottom: 10, fontSize: 12, lineHeight: 18 },
  hashtag: { fontWeight: 'bold', color: '#0E713E' },
  postImage: { width: '100%', height: 200, resizeMode: 'cover' },
  postStatsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#EEE' 
  },
  postStatsText: { color: '#666', fontSize: 10 },
  postActionButtons: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 8, gap: 10 },
  postActionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 6, 
    backgroundColor: '#0E713E', 
    borderRadius: 20 
  },
  postActionBtnText: { color: '#FFF', fontSize: 10, fontWeight: '600', marginLeft: 5 },
  postActionBtnTextActive: { color: '#FF6B6B' },
  postActionImage: { width: 14, height: 14, tintColor: '#FFF' },
  postActionImageActive: { tintColor: '#FF6B6B' },
  noPostsContainer: { alignItems: 'center', paddingVertical: 40 },
  noPostsText: { color: '#999', fontSize: 14, marginBottom: 15 },
  errorText: { fontSize: 16, color: '#666', marginBottom: 15 },
  goBackButton: { backgroundColor: '#0E713E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  goBackButtonText: { color: '#FFF', fontWeight: '600' },
  btnBlock: {
    flex: 1,
    backgroundColor: '#C62828',
    paddingVertical: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnUnblock: {
    backgroundColor: '#0E713E',
  },
});

export default UserScreen;