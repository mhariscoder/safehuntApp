// GroupPostsScreen.js - Complete Fix with Report and Block Functionality
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Dimensions,
  SafeAreaView,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { usePosts } from '../hooks/usePosts';
import { useComments } from '../hooks/useComments';
import { useBlock } from '../hooks/useBlock';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import { API_BASE_URL } from '../constants/config';
import {
  getGroupMembers,
  updateMemberStatus,
  removeMember,
  addMember,
} from '../features/groups/groupsActions';
import { clearPosts } from '../features/posts/postsSlice';
import axios from 'axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_IMAGE_HEIGHT = SCREEN_WIDTH * 0.8;

const ASSETS = {
  userAvatar: require('../../assets/circle_profile.png'),
  greenHeart: require('../../assets/green_heart.png'),
  greenComment: require('../../assets/green_comment.png'),
  greenShare: require('../../assets/green_share.png'),
  backIcon: require('../../assets/back_white.png'),
  imageIcon: require('../../assets/image.png'),
  arrowDown: require('../../assets/arrow_down.png'),
  arrowUp: require('../../assets/arrow_up.png'),
  groupAvatar: require('../../assets/group_avatar.png'),
  moreIcon: require('../../assets/more_vert.png'),
};

// Report Reasons (matching backend enum)
const REPORT_REASONS = {
  ABUSIVE_LANGUAGE: 'Abusive Language',
  HARASSMENT: 'Harassment or Bullying',
  SPAM: 'Spam or Scam',
  INAPPROPRIATE_CONTENT: 'Inappropriate Content',
  HATE_SPEECH: 'Hate Speech or Discrimination',
  OTHER: 'Other',
};

// Report options with icons
const REPORT_OPTIONS = [
  { key: REPORT_REASONS.ABUSIVE_LANGUAGE, label: REPORT_REASONS.ABUSIVE_LANGUAGE, icon: '⚠️' },
  { key: REPORT_REASONS.HARASSMENT, label: REPORT_REASONS.HARASSMENT, icon: '👊' },
  { key: REPORT_REASONS.SPAM, label: REPORT_REASONS.SPAM, icon: '📧' },
  { key: REPORT_REASONS.INAPPROPRIATE_CONTENT, label: REPORT_REASONS.INAPPROPRIATE_CONTENT, icon: '🔞' },
  { key: REPORT_REASONS.HATE_SPEECH, label: REPORT_REASONS.HATE_SPEECH, icon: '🚫' },
  { key: REPORT_REASONS.OTHER, label: REPORT_REASONS.OTHER, icon: '📝' },
];

const getFullImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  return `${API_BASE_URL}/public/uploads/${cleanPath}`;
};

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
};

// Group Members Modal Component
const GroupMembersModal = ({ visible, onClose, groupId, groupName, currentUserId, isAdmin }: any) => {
  const dispatch = useAppDispatch();
  const { groupMembers, isLoading } = useAppSelector((state) => state.groups);
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
  const [refreshing, setRefreshing] = useState(false);

  const loadMembers = async () => {
    if (groupId) {
      await dispatch(getGroupMembers(groupId));
    }
  };

  useEffect(() => {
    if (visible && groupId) {
      loadMembers();
    }
  }, [visible, groupId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (memberId: number) => {
    try {
      await dispatch(updateMemberStatus({
        groupId,
        memberId,
        status: 'approved'
      })).unwrap();
      Alert.alert('Success', 'Member request accepted');
      loadMembers();
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (memberId: number) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this join request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(updateMemberStatus({
                groupId,
                memberId,
                status: 'rejected'
              })).unwrap();
              Alert.alert('Success', 'Member request rejected');
              loadMembers();
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to reject request');
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeMember({ groupId, memberId })).unwrap();
              Alert.alert('Success', 'Member removed successfully');
              loadMembers();
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const members = groupMembers?.filter((m: any) => m.status === 'approved') || [];
  const pendingRequests = groupMembers?.filter((m: any) => m.status === 'pending') || [];

  const renderMemberItem = ({ item }: { item: any }) => {
    const member = item.member || item;
    const memberId = item.memberId || member?.id;
    const isCurrentUser = memberId === currentUserId;
    const avatarUrl = member?.profilePhoto ? getFullImageUrl(member.profilePhoto) : null;

    return (
      <View style={styles.memberItem}>
        <Image
          source={avatarUrl ? { uri: avatarUrl } : ASSETS.userAvatar}
          style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member?.displayname || member?.username || 'User'}</Text>
          <Text style={styles.memberType}>{item.type === 'Admin' ? 'Admin' : 'Member'}</Text>
        </View>
        {isAdmin && !isCurrentUser && item.type !== 'Admin' && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(memberId, member?.displayname || 'this member')}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    const member = item.member || item;
    const avatarUrl = member?.profilePhoto ? getFullImageUrl(member.profilePhoto) : null;
    const memberId = item.memberId || member?.id;

    return (
      <View style={styles.requestItem}>
        <Image
          source={avatarUrl ? { uri: avatarUrl } : ASSETS.userAvatar}
          style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member?.displayname || member?.username || 'User'}</Text>
          <Text style={styles.requestDate}>Requested to join</Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(memberId)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectRequest(memberId)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {activeTab === 'members' 
          ? 'No members found' 
          : 'No pending join requests'}
      </Text>
      {activeTab === 'requests' && (
        <Text style={styles.emptySubtext}>
          When someone requests to join, you'll see them here
        </Text>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainerFull}>
        <View style={styles.modalHeaderFull}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitleFull}>Group Members</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'members' && styles.activeTab]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
              Members ({members.length})
            </Text>
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                Requests ({pendingRequests.length})
              </Text>
              {pendingRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0E713E" />
          </View>
        ) : (
          <FlatList
            data={activeTab === 'members' ? members : pendingRequests}
            renderItem={activeTab === 'members' ? renderMemberItem : renderRequestItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
            }
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContentFull}
          />
        )}
      </View>
    </Modal>
  );
};

// Post Card Component with Group Share Functionality
const PostCard = ({ 
  post, 
  user, 
  token,
  groupId,
  onLike, 
  onCommentPress, 
  onEditPost, 
  onDeletePost, 
  onReportPost,
  onBlockUser,
  activeMenu, 
  onToggleMenu, 
  loadGroupPosts,
  onSharePress,
  isShared,
  shareCount,
  isSharing,
  isUserBlocked,
}: any) => {
  const postDate = post.created_at || post.createdAt;
  const imageUrl = post.image ? getFullImageUrl(post.image) : null;
  const userAvatar = post.user?.profilePhoto ? getFullImageUrl(post.user.profilePhoto) : null;
  const isOwner = user?.id === post.user?.id;
  const isMenuVisible = activeMenu === post.id;

  const handleEditPress = () => {
    onToggleMenu(post.id);
    onEditPost(post);
  };

  const handleDeletePress = () => {
    onToggleMenu(post.id);
    onDeletePost(post.id);
  };

  const handleReportPress = () => {
    onToggleMenu(post.id);
    onReportPost(post);
  };

  const handleBlockPress = () => {
    onToggleMenu(post.id);
    onBlockUser(post.user?.id, post.user?.displayname || post.user?.username);
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.profileCircleSmall}>
          {userAvatar ? (
            <Image 
              source={{ uri: getFullImageUrl(userAvatar) || undefined }} 
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
              }} 
            />
          ) : (
            <Text style={styles.profileInitial}>
              {post.user?.displayname?.charAt(0) || post.user?.username?.charAt(0) || 'U'}
            </Text>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{post.user?.displayname || post.user?.username || 'User'}</Text>
          <Text style={styles.location}>
            {formatTimeAgo(postDate)}
          </Text>
        </View>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity onPress={() => onToggleMenu(post.id)}>
            <Image source={ASSETS.moreIcon} style={styles.moreIcon} />
          </TouchableOpacity>

          {isMenuVisible && (
            <View style={styles.dropdown}>
              {isOwner ? (
                <>
                  <TouchableOpacity 
                    style={styles.dropdownItem} 
                    onPress={handleEditPress}
                  >
                    <Text style={styles.dropdownText}>Edit</Text>
                  </TouchableOpacity>

                  <View style={styles.dropdownDivider} />

                  <TouchableOpacity 
                    style={styles.dropdownItem} 
                    onPress={handleDeletePress}
                  >
                    <Text style={styles.dropdownText}>Delete</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.dropdownItem} 
                    onPress={handleReportPress}
                  >
                    <Text style={styles.dropdownText}>Report Post</Text>
                  </TouchableOpacity>

                  <View style={styles.dropdownDivider} />

                  <TouchableOpacity 
                    style={styles.dropdownItem} 
                    onPress={handleBlockPress}
                  >
                    <Text style={styles.dropdownText}>
                      {isUserBlocked ? 'Unblock User' : 'Block User'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Show shared indicator if post is shared */}
      {isShared && (
        <View style={styles.sharedIndicator}>
          <Text style={styles.sharedIndicatorText}>🔁 You shared this post</Text>
        </View>
      )}

      <Text style={styles.postCaption}>
        {post.description}
        {post.tags && <Text style={styles.hashtag}> {post.tags}</Text>}
      </Text>

      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.mainPostImage} />
      )}

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>❤️ {post.likesCount || 0} {(post.likesCount === 1 ? 'Like' : 'Likes')}</Text>
        <Text style={styles.statsText}>🔁 {shareCount || 0} {shareCount === 1 ? 'Share' : 'Shares'}</Text>
        <Text style={styles.statsText}>{post.comments?.length || 0} Comments</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => onLike(post.id)}
        >
          <Image 
            source={ASSETS.greenHeart} 
            resizeMode='contain' 
            style={[styles.actionImage, post.postLiked && styles.actionImageActive]} 
          />
          <Text style={[styles.actionBtnText, post.postLiked && styles.actionBtnTextActive]}>
            {post.postLiked ? 'Liked' : 'Like'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => onCommentPress(post)}
        >
          <Image source={ASSETS.greenComment} resizeMode='contain' style={styles.actionImage} />
          <Text style={styles.actionBtnText}>Comment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => onSharePress(post)}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color="#0E713E" />
          ) : (
            <>
              <Image 
                source={ASSETS.greenShare} 
                resizeMode='contain' 
                style={[styles.actionImage, isShared && styles.actionImageActive]} 
              />
              <Text style={[styles.actionBtnText, isShared && styles.actionBtnTextActive]}>
                {isShared ? 'Shared' : 'Share'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const GroupPostsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { groupId, groupName, groupLogo, groupCover, groupDescription } = route.params as any;
  const { user, token } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  
  const {
    posts,
    isLoading,
    getAllPosts,
    toggleLike,
    deletePost,
    updatePost,
  } = usePosts();

  const {
    getCommentsByPost,
    addComment,
    deleteComment,
    addReply,
    deleteReply,
    likeComment,
    unlikeComment,
    likeReply,
    unlikeReply,
  } = useComments();

  // Use the Block hook
  const { 
    blockUser, 
    unblockUser,
    blockedUsers,
    isLoading: isBlockLoading,
  } = useBlock();

  // Get blocked user IDs for quick lookup
  const blockedUserIds = React.useMemo(() => {
    return new Set(blockedUsers.map((block: any) => block.blockedId || block.blocked?.id));
  }, [blockedUsers]);

  // Check if a user is blocked
  const isUserBlocked = useCallback((userId: number) => {
    return blockedUserIds.has(userId);
  }, [blockedUserIds]);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showAllComments, setShowAllComments] = useState<{ [key: number]: boolean }>({});
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [showReplyInput, setShowReplyInput] = useState<{ [key: number]: boolean }>({});
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [modalComments, setModalComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  
  // Report Modal states
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [selectedPostForReport, setSelectedPostForReport] = useState<any>(null);
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);
  const [otherReportReason, setOtherReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportedPosts, setReportedPosts] = useState<Set<number>>(new Set());
  
  // Share related states
  const [sharedPosts, setSharedPosts] = useState<Set<number>>(new Set());
  const [shareCounts, setShareCounts] = useState<{ [key: number]: number }>({});
  const [isSharing, setIsSharing] = useState<{ [key: number]: boolean }>({});
  
  // Member management states
  const [isMembersModalVisible, setIsMembersModalVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joinStatus, setJoinStatus] = useState<'none' | 'pending' | 'approved'>('none');
  const [groupMembersList, setGroupMembersList] = useState<any[]>([]);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Helper function to extract members from response
  const extractMembersFromResponse = (response: any) => {
    // Try different possible response structures
    if (response?.members && Array.isArray(response.members)) {
      return response.members;
    }
    if (response?.data?.members && Array.isArray(response.data.members)) {
      return response.data.members;
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    // If response is an object with numeric keys (array-like)
    if (response && typeof response === 'object') {
      const values = Object.values(response);
      if (values.length > 0 && (values[0]?.memberId || values[0]?.member)) {
        return values;
      }
    }
    return [];
  };

  const loadGroupPosts = async () => {
    console.log('loadGroupPosts', groupId);
    try {
      if(groupId) {
        const result = await getAllPosts({ page: 1, limit: 20, groupId: groupId });
        // Check share status for each post
        if (result && result.posts) {
          for (const post of result.posts) {
            await checkShareStatus(post.id);
            await fetchShareCount(post.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading group posts:', error);
    }
  };

  // Report Post API call
  const reportPost = async (postId: number, reason: string, otherReason?: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/reports`,
        {
          postId,
          reason,
          otherReason: otherReason || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error reporting post:', error);
      throw error;
    }
  };

  // Share Post API calls with groupId
  const sharePost = async (postId: number) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/shares/${postId}/${user?.id}`,
        { groupId: groupId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  };

  const unsharePost = async (postId: number) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/shares/${postId}/${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { groupId: groupId },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error unsharing post:', error);
      throw error;
    }
  };

  const checkShareStatus = async (postId: number) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/shares/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { groupId: groupId },
        }
      );
      
      const shares = response.data || [];
      const hasShared = shares.some((share: any) => share.userId === user?.id);
      
      setSharedPosts(prev => {
        const newSet = new Set(prev);
        if (hasShared) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      
      setShareCounts(prev => ({
        ...prev,
        [postId]: shares.length || 0,
      }));
    } catch (error) {
      console.error('Error checking share status:', error);
    }
  };

  const fetchShareCount = async (postId: number) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/shares/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { groupId: groupId },
        }
      );
      const shares = response.data || [];
      setShareCounts(prev => ({
        ...prev,
        [postId]: shares.length || 0,
      }));
    } catch (error) {
      console.error('Error fetching share count:', error);
    }
  };

  const handleSharePress = async (post: any) => {
    if (!user) {
      Alert.alert('Error', 'Please login to share posts');
      return;
    }

    const postId = post.id;
    const isShared = sharedPosts.has(postId);

    setIsSharing(prev => ({ ...prev, [postId]: true }));

    const refreshPosts = async () => {
      await loadGroupPosts();
    };

    const handleShare = async () => {
      try {
        await sharePost(postId);
        await refreshPosts();
        Alert.alert('Success', 'Post shared successfully in this group');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to share post');
      } finally {
        setIsSharing(prev => ({ ...prev, [postId]: false }));
      }
    };

    const handleUnshare = async () => {
      try {
        await unsharePost(postId);
        await refreshPosts();
        Alert.alert('Success', 'Post unshared successfully');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to unshare post');
      } finally {
        setIsSharing(prev => ({ ...prev, [postId]: false }));
      }
    };

    if (isShared) {
      Alert.alert(
        'Unshare Post',
        'Are you sure you want to remove your share of this post from the group?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsSharing(prev => ({ ...prev, [postId]: false })),
          },
          {
            text: 'Unshare',
            style: 'destructive',
            onPress: handleUnshare,
          },
        ]
      );
    } else {
      await handleShare();
    }
  };

  const loadGroupMembers = async () => {
    console.log('loadGroupMembers', groupId);
    try {
      if (groupId) {
        const result = await dispatch(getGroupMembers(groupId)).unwrap();
        console.log('Raw group members result:', JSON.stringify(result));
        
        const membersArray = extractMembersFromResponse(result);
        console.log('Extracted membersArray:', membersArray);
        
        setGroupMembersList(membersArray);
        return membersArray;
      }
    } catch (error) {
      console.error('Error loading group members:', error);
      setGroupMembersList([]);
    }
    return [];
  };

  const handleToggleMenu = (postId: number) => {
    setActiveMenu(prev => (prev === postId ? null : postId));
  };

  // Check user role - FIXED VERSION
  const checkUserRole = useCallback(() => {
    console.log('=== CHECK USER ROLE ===');
    console.log('User ID:', user?.id);
    console.log('Group Members List Length:', groupMembersList?.length);
    console.log('Group Members List:', JSON.stringify(groupMembersList, null, 2));
    
    if (!user?.id) {
      console.log('No user ID - setting isMember to false');
      setIsMember(false);
      setJoinStatus('none');
      setIsAdmin(false);
      setIsCheckingRole(false);
      return;
    }
    
    // If no members list or empty, don't change states yet
    if (!groupMembersList || !Array.isArray(groupMembersList) || groupMembersList.length === 0) {
      console.log('No group members list or empty - waiting for data');
      setIsCheckingRole(false);
      return;
    }
    
    // Find the current user in the members list - TRY MULTIPLE FIELD NAMES
    let currentMember = null;
    
    for (const m of groupMembersList) {
      // Try different possible field names
      const memberId = m.memberId || m.member?.id || m.id || m.user?.id || m.userId;
      console.log(`Checking member: ID=${memberId}, Type=${m.type}, Status=${m.status}`);
      
      // Convert both to strings for comparison to handle type mismatches
      if (memberId && String(memberId) === String(user.id)) {
        currentMember = m;
        console.log('✅ Found matching member:', currentMember);
        break;
      }
    }
    
    console.log('Final currentMember:', currentMember);
    
    if (currentMember) {
      // User is a member
      setIsMember(true);
      setJoinStatus(currentMember.status || 'approved');
      const isUserAdmin = currentMember.type === 'Admin' || currentMember.role === 'Admin';
      setIsAdmin(isUserAdmin);
      console.log('User is admin:', isUserAdmin);
    } else {
      // User is not a member
      console.log('❌ User is NOT a member - setting isMember to false');
      setIsMember(false);
      setJoinStatus('none');
      setIsAdmin(false);
    }
    setIsCheckingRole(false);
  }, [user?.id, groupMembersList]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      
      const loadData = async () => {
        if (isMounted) {
          dispatch(clearPosts());
          // Load group posts and members in parallel
          await Promise.all([loadGroupPosts(), loadGroupMembers()]);
        }
      };
      
      loadData();
      
      return () => {
        isMounted = false;
      };
    }, [groupId])
  );

  // Re-check user role whenever groupMembersList changes
  useEffect(() => {
    if (groupMembersList && groupMembersList.length > 0) {
      checkUserRole();
    }
  }, [groupMembersList, checkUserRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    setIsCheckingRole(true);
    await Promise.all([loadGroupPosts(), loadGroupMembers()]);
    setRefreshing(false);
    // checkUserRole will be called by the useEffect
  };

  const handleLike = async (postId: number) => {
    try {
      await toggleLike(postId);
      await loadGroupPosts();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like post');
    }
  };

  const handleEditPost = (post: any) => {
    navigation.navigate('CreateGroupPost', { 
      postId: post.id,
      description: post.description,
      image: post.image,
      latitude: post.latitude,
      longitude: post.longitude,
      tags: post.tags ? JSON.parse(post.tags) : [],
      isEditing: true,
      groupId: groupId
    });
  };

  const handleDeletePost = async (postId: number) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId, groupId);
              Alert.alert('Success', 'Post deleted successfully');
              await loadGroupPosts();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete post');
            }
          }
        }
      ]
    );
  };

  // Report Post Handler - Opens Custom Modal
  const handleReportPost = (post: any) => {
    // Check if already reported
    if (reportedPosts.has(post.id)) {
      Alert.alert('Already Reported', 'You have already reported this post.');
      return;
    }
    
    setSelectedPostForReport(post);
    setSelectedReportReason(null);
    setOtherReportReason('');
    setIsReportModalVisible(true);
  };

  // Submit report from modal
  const handleReportSubmit = async () => {
    if (!selectedReportReason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }

    if (selectedReportReason === REPORT_REASONS.OTHER && !otherReportReason.trim()) {
      Alert.alert('Error', 'Please provide a reason');
      return;
    }

    if (!selectedPostForReport) return;

    setIsSubmittingReport(true);
    try {
      await reportPost(
        selectedPostForReport.id,
        selectedReportReason,
        selectedReportReason === REPORT_REASONS.OTHER ? otherReportReason.trim() : undefined
      );
      
      // Mark post as reported
      setReportedPosts(prev => new Set(prev).add(selectedPostForReport.id));
      
      // Close modal and show success
      setIsReportModalVisible(false);
      setSelectedPostForReport(null);
      setSelectedReportReason(null);
      setOtherReportReason('');
      Alert.alert('Success', 'Post has been reported successfully');
    } catch (error: any) {
      // Check if error is due to duplicate report
      if (error.response?.data?.message?.includes('already reported')) {
        Alert.alert('Already Reported', 'You have already reported this post.');
        setReportedPosts(prev => new Set(prev).add(selectedPostForReport.id));
        setIsReportModalVisible(false);
        setSelectedPostForReport(null);
        setSelectedReportReason(null);
        setOtherReportReason('');
      } else {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to report post');
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Block User Handler
  const handleBlockUser = (userId: number, userName?: string) => {
    if (!userId) return;
    
    const displayName = userName || 'this user';
    
    // Check if user is already blocked
    if (isUserBlocked(userId)) {
      // Unblock user
      Alert.alert(
        'Unblock User',
        `Are you sure you want to unblock ${displayName}? They will be able to interact with you again.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Unblock',
            style: 'default',
            onPress: async () => {
              try {
                await unblockUser(userId);
                Alert.alert('Success', 'User has been unblocked successfully');
                await loadGroupPosts();
              } catch (error: any) {
                Alert.alert('Error', error?.message || 'Failed to unblock user');
              }
            },
          },
        ]
      );
    } else {
      // Block user
      Alert.alert(
        'Block User',
        `Are you sure you want to block ${displayName}? They will not be able to interact with you and you won't see their posts.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Block',
            style: 'destructive',
            onPress: async () => {
              try {
                await blockUser(userId);
                Alert.alert('Success', 'User has been blocked successfully');
                await loadGroupPosts();
              } catch (error: any) {
                Alert.alert('Error', error?.message || 'Failed to block user');
              }
            },
          },
        ]
      );
    }
  };

  const handleCreatePost = () => {
    if (!isMember && !isAdmin) {
      Alert.alert('Access Denied', 'You must be a member to create posts');
      return;
    }
    navigation.navigate('CreateGroupPost', { groupId, groupName });
  };

  const handleCommentPress = async (post: any) => {
    setSelectedPost(post);
    setIsCommentModalVisible(true);
    setLoadingComments(true);
    try {
      const commentsData = await getCommentsByPost(post.id);
      setModalComments(commentsData.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setModalComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      await addComment({
        postId: selectedPost.id,
        content: commentText
      });
      setCommentText('');
      const commentsData = await getCommentsByPost(selectedPost.id);
      setModalComments(commentsData.comments || []);
      await loadGroupPosts();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add comment');
    }
  };

  const handleLikeComment = async (commentId: number) => {
    try {
      await likeComment(commentId);
      if (selectedPost) {
        const commentsData = await getCommentsByPost(selectedPost.id);
        setModalComments(commentsData.comments || []);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like comment');
    }
  };

  const handleReplyPress = (commentId: number) => {
    setSelectedCommentId(commentId);
    setShowReplyInput(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    setReplyText('');
  };

  const handleAddReply = async () => {
    if (!replyText.trim() || !selectedCommentId) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      await addReply({
        commentId: selectedCommentId,
        content: replyText
      });
      setReplyText('');
      setShowReplyInput(prev => ({ ...prev, [selectedCommentId]: false }));
      if (selectedPost) {
        const commentsData = await getCommentsByPost(selectedPost.id);
        setModalComments(commentsData.comments || []);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add reply');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId);
              if (selectedPost) {
                const commentsData = await getCommentsByPost(selectedPost.id);
                setModalComments(commentsData.comments || []);
                await loadGroupPosts();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete comment');
            }
          }
        }
      ]
    );
  };

  const handleDeleteReply = async (replyId: number) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReply(replyId);
              if (selectedPost) {
                const commentsData = await getCommentsByPost(selectedPost.id);
                setModalComments(commentsData.comments || []);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete reply');
            }
          }
        }
      ]
    );
  };

  const handleLikeReply = async (replyId: number) => {
    try {
      await likeReply(replyId);
      if (selectedPost) {
        const commentsData = await getCommentsByPost(selectedPost.id);
        setModalComments(commentsData.comments || []);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like reply');
    }
  };

  const handleJoinGroup = async () => {
    try {
      await dispatch(addMember({
        groupId,
        memberId: user?.id,
        type: 'Member'
      })).unwrap();
      Alert.alert('Success', 'Join request sent to admin');
      await loadGroupMembers();
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to send join request');
    }
  };

  const handleLeaveGroup = async () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeMember({ groupId, memberId: user?.id })).unwrap();
              Alert.alert('Success', 'You have left the group');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to leave group');
            }
          }
        }
      ]
    );
  };

  // Render Report Modal
  const renderReportModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isReportModalVisible}
        onRequestClose={() => {
          setIsReportModalVisible(false);
          setSelectedPostForReport(null);
          setSelectedReportReason(null);
          setOtherReportReason('');
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setIsReportModalVisible(false);
            setSelectedPostForReport(null);
            setSelectedReportReason(null);
            setOtherReportReason('');
          }}
        >
          <View style={styles.reportModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.reportModalContent}>
                <View style={styles.reportModalHeader}>
                  <Text style={styles.reportModalTitle}>Report Post</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsReportModalVisible(false);
                      setSelectedPostForReport(null);
                      setSelectedReportReason(null);
                      setOtherReportReason('');
                    }}
                  >
                    <Text style={styles.reportModalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.reportModalSubtitle}>
                  Please select a reason for reporting this post:
                </Text>

                <ScrollView 
                  style={styles.reportOptionsList}
                  showsVerticalScrollIndicator={false}
                >
                  {REPORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.reportOption,
                        selectedReportReason === option.key && styles.reportOptionSelected,
                      ]}
                      onPress={() => setSelectedReportReason(option.key)}
                    >
                      <Text style={styles.reportOptionIcon}>{option.icon}</Text>
                      <Text style={[
                        styles.reportOptionText,
                        selectedReportReason === option.key && styles.reportOptionTextSelected,
                      ]}>
                        {option.label}
                      </Text>
                      {selectedReportReason === option.key && (
                        <Text style={styles.reportOptionCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {selectedReportReason === REPORT_REASONS.OTHER && (
                  <TextInput
                    style={styles.reportOtherInput}
                    placeholder="Please provide additional details..."
                    placeholderTextColor="#999"
                    value={otherReportReason}
                    onChangeText={setOtherReportReason}
                    multiline
                    numberOfLines={3}
                  />
                )}

                <View style={styles.reportModalButtons}>
                  <TouchableOpacity
                    style={[styles.reportModalButton, styles.reportModalCancelButton]}
                    onPress={() => {
                      setIsReportModalVisible(false);
                      setSelectedPostForReport(null);
                      setSelectedReportReason(null);
                      setOtherReportReason('');
                    }}
                    disabled={isSubmittingReport}
                  >
                    <Text style={styles.reportModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reportModalButton, styles.reportModalSubmitButton]}
                    onPress={handleReportSubmit}
                    disabled={isSubmittingReport}
                  >
                    {isSubmittingReport ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.reportModalSubmitText}>Submit Report</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderPost = ({ item: post }: { item: any }) => {
    if (!post) return null;
    
    const isShared = sharedPosts.has(post.id);
    const shareCount = shareCounts[post.id] || 0;
    const isSharingPost = isSharing[post.id] || false;
    const isBlocked = post.user?.id ? isUserBlocked(post.user.id) : false;
    
    return (
      <PostCard
        post={post}
        user={user}
        token={token}
        groupId={groupId}
        onLike={handleLike}
        onCommentPress={handleCommentPress}
        onEditPost={handleEditPost}
        onDeletePost={handleDeletePost}
        onReportPost={handleReportPost}
        onBlockUser={handleBlockUser}
        activeMenu={activeMenu}
        onToggleMenu={handleToggleMenu}
        loadGroupPosts={loadGroupPosts}
        onSharePress={handleSharePress}
        isShared={isShared}
        shareCount={shareCount}
        isSharing={isSharingPost}
        isUserBlocked={isBlocked}
      />
    );
  };

  const getKeyExtractor = (item: any, index: number) => {
    if (item && item.id) {
      return item.id.toString();
    }
    return index.toString();
  };

  if (isLoading && posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={ASSETS.backIcon} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName}</Text>
        <TouchableOpacity 
          onPress={() => setIsMembersModalVisible(true)} 
          style={styles.membersButton}
        >
          <Image source={ASSETS.groupAvatar} style={styles.membersButtonText} />
        </TouchableOpacity>
      </View>

      {/* Group Info Banner */}
      {groupCover && (
        <Image source={{ uri: getFullImageUrl(groupCover) }} style={styles.coverImage} />
      )}
      <View style={styles.groupInfoRow}>
        <Image 
          source={groupLogo ? { uri: getFullImageUrl(groupLogo) } : require('../../assets/group_avatar.png')} 
          style={styles.groupLogo} 
        />
        <View style={styles.groupTextInfo}>
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.groupDesc} numberOfLines={2}>
            {groupDescription || 'No description available'}
          </Text>
        </View>
      </View>

      {/* Join/Leave Group Buttons - FIXED CONDITION */}
      {!isCheckingRole && !isMember && joinStatus !== 'pending' && (
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={handleJoinGroup}
        >
          <Text style={styles.joinButtonText}>Join Group</Text>
        </TouchableOpacity>
      )}

      {joinStatus === 'pending' && (
        <View style={styles.pendingContainer}>
          <Text style={styles.pendingText}>⏳ Join request pending admin approval</Text>
        </View>
      )}

      {!isCheckingRole && isMember && !isAdmin && (
        <TouchableOpacity 
          style={styles.leaveButton}
          onPress={handleLeaveGroup}
        >
          <Text style={styles.leaveButtonText}>Leave Group</Text>
        </TouchableOpacity>
      )}

      {!isCheckingRole && isAdmin && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>👑 You are an admin</Text>
        </View>
      )}

      {/* Create Post Input - Only for members */}
      {(isMember || isAdmin) && (
        <View style={styles.createPostSection}>
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={handleCreatePost}
          >
            <View style={styles.inputContainer}>
              <View style={styles.profileCircleSmall}>
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
              <TextInput 
                placeholder="What Are You Thinking About?" 
                placeholderTextColor="#666"
                style={styles.textInput}
                editable={false}
              />
              <TouchableOpacity>
                <Image source={ASSETS.imageIcon} style={styles.imagePickerIcon} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={getKeyExtractor}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              {(isMember || isAdmin) 
                ? 'Be the first to post in this group!' 
                : 'Join the group to see and create posts'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Report Modal */}
      {renderReportModal()}

      {/* Comment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCommentModalVisible}
        onRequestClose={() => {
          setIsCommentModalVisible(false);
          setModalComments([]);
          setCommentText('');
          setReplyText('');
          setSelectedCommentId(null);
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => {
                setIsCommentModalVisible(false);
                setModalComments([]);
                setCommentText('');
                setReplyText('');
                setSelectedCommentId(null);
              }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0E713E" />
              </View>
            ) : (
              <FlatList
                data={modalComments}
                renderItem={({ item }) => (
                  <View style={styles.modalCommentItem}>
                    <Image 
                      source={item.user?.profilePhoto ? { uri: getFullImageUrl(item.user.profilePhoto) } : ASSETS.userAvatar} 
                      style={styles.commentAvatar} 
                    />
                    <View style={styles.commentContent}>
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentUser}>{item.user?.displayname || item.user?.username || 'User'}</Text>
                        <Text style={styles.commentText}>{item.content}</Text>
                      </View>
                      <View style={styles.commentFooter}>
                        <Text style={styles.footerActionText}>{formatTimeAgo(item.created_at || item.createdAt)}</Text>
                        <TouchableOpacity onPress={() => handleLikeComment(item.id)}>
                          <Text style={styles.footerActionText}>
                            {item.commentLiked ? 'Unlike' : 'Like'} ({item.likeCount || 0})
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleReplyPress(item.id)}>
                          <Text style={styles.footerActionText}>Reply</Text>
                        </TouchableOpacity>
                        {item.user?.id === user?.id && (
                          <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                            <Text style={[styles.footerActionText, styles.deleteText]}>Delete</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {showReplyInput[item.id] && (
                        <View style={styles.replyInputContainer}>
                          <TextInput
                            style={styles.replyInput}
                            placeholder="Write a reply..."
                            placeholderTextColor="#999"
                            value={replyText}
                            onChangeText={setReplyText}
                            multiline
                          />
                          <TouchableOpacity style={styles.replyButton} onPress={handleAddReply}>
                            <Text style={styles.replyButtonText}>Post</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {item.replies && item.replies.length > 0 && (
                        <View style={styles.repliesContainer}>
                          {item.replies.map((reply: any) => (
                            <View key={reply.id} style={styles.replyItem}>
                              <Image 
                                source={reply.user?.profilePhoto ? { uri: getFullImageUrl(reply.user.profilePhoto) } : ASSETS.userAvatar} 
                                style={styles.replyAvatar} 
                              />
                              <View style={styles.replyContent}>
                                <View style={styles.replyBubble}>
                                  <Text style={styles.replyUser}>{reply.user?.displayname || reply.user?.username || 'User'}</Text>
                                  <Text style={styles.replyText}>{reply.content}</Text>
                                </View>
                                <View style={styles.replyFooter}>
                                  <Text style={styles.footerActionText}>{formatTimeAgo(reply.created_at || reply.createdAt)}</Text>
                                  <TouchableOpacity onPress={() => handleLikeReply(reply.id)}>
                                    <Text style={styles.footerActionText}>
                                      {reply.replyLiked ? 'Unlike' : 'Like'} ({reply.likeCount || 0})
                                    </Text>
                                  </TouchableOpacity>
                                  {reply.user?.id === user?.id && (
                                    <TouchableOpacity onPress={() => handleDeleteReply(reply.id)}>
                                      <Text style={[styles.footerActionText, styles.deleteText]}>Delete</Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                )}
                keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                style={styles.modalCommentsList}
                ListEmptyComponent={
                  <View style={styles.noCommentsContainer}>
                    <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
                  </View>
                }
              />
            )}

            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Write a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity style={styles.modalPostButton} onPress={handleAddComment}>
                <Text style={styles.modalPostButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Members Modal */}
      <GroupMembersModal
        visible={isMembersModalVisible}
        onClose={() => setIsMembersModalVisible(false)}
        groupId={groupId}
        groupName={groupName}
        currentUserId={user?.id}
        isAdmin={isAdmin}
      />
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
    paddingTop: Platform.OS === 'android' ? 50 : 75,
    paddingBottom: 15,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between'
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  backIcon: { width: 20, height: 20, tintColor: '#FFF', resizeMode: 'contain' },
  membersButton: { padding: 5 },
  membersButtonText: { height: 24, width: 24, tintColor: '#FFF', resizeMode: 'contain' },
  coverImage: { width: '100%', height: 100, resizeMode: 'cover' },
  groupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    backgroundColor: '#FFF',
  },
  groupLogo: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#0E713E' },
  groupTextInfo: { flex: 1, marginLeft: 15 },
  groupName: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  groupDesc: { fontSize: 12, color: '#666' },
  createPostSection: {
    backgroundColor: '#0E713E',
    paddingVertical: 15,
    paddingHorizontal: 25
  },
  inputContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    borderRadius: 30, 
    paddingRight: 20,
    alignItems: 'center'
  },
  profileCircleSmall: { width: 50, height: 50, borderRadius: 50, backgroundColor: '#4D3626', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: '#FFF', fontWeight: 'bold' },
  textInput: { flex: 1, marginHorizontal: 10, fontSize: 12, color: '#000' },
  imagePickerIcon: { width: 24, height: 24 },
  postCard: { backgroundColor: '#FFF', paddingVertical: 15, marginBottom: 10 },
  postHeader: { flexDirection: 'row', paddingHorizontal: 25, alignItems: 'center', marginBottom: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },
  headerInfo: { flex: 1, marginLeft: 10 },
  userName: { fontWeight: '900', fontSize: 16, color: '#000' },
  location: { color: '#666', fontSize: 10, marginTop: 2 },
  moreIcon: { width: 20, height: 20, tintColor: '#666', resizeMode: 'contain' },
  dropdown: {
    position: 'absolute',
    top: 25,
    right: 0,
    backgroundColor: '#0E713E',
    borderRadius: 10,
    width: 150,
    zIndex: 999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  postCaption: { paddingHorizontal: 25, marginBottom: 10, fontSize: 12, lineHeight: 20 },
  hashtag: { fontWeight: 'bold', color: '#0E713E' },
  mainPostImage: { width: '100%', height: POST_IMAGE_HEIGHT, resizeMode: 'cover' },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 25, 
    paddingVertical: 10, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#EEE',
    flexWrap: 'wrap',
  },
  statsText: { color: '#666', fontSize: 12 },
  actionButtons: { backgroundColor: '#0E713E', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 25, gap: 10 },
  actionBtn: { backgroundColor: '#FFFFFF', flex: 1, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', borderRadius: 20, justifyContent: 'center', minHeight: 36 },
  actionBtnText: { color: '#0E713E', fontWeight: 'bold', fontSize: 10 },
  actionBtnTextActive: { color: '#FF6B6B' },
  actionImage: { width: 14, height: 14, marginRight: 5, resizeMode: 'contain', tintColor: '#0E713E' },
  actionImageActive: { tintColor: '#FF6B6B' },
  sharedIndicator: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 25,
    paddingVertical: 6,
    marginBottom: 8,
  },
  sharedIndicatorText: {
    fontSize: 12,
    color: '#0E713E',
    fontWeight: '600',
  },
  listContent: { paddingBottom: 30 },
  emptyContainer: { alignItems: 'center', paddingTop: 50, paddingBottom: 50 },
  emptyText: { color: '#666', fontSize: 14, marginBottom: 8 },
  emptySubtext: { color: '#999', fontSize: 12, textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  modalClose: { fontSize: 20, color: '#666', padding: 5 },
  modalCommentsList: { padding: 20 },
  modalCommentItem: { flexDirection: 'row', marginBottom: 15 },
  modalInputContainer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#EEE', alignItems: 'center' },
  modalInput: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, fontSize: 14, marginRight: 10 },
  modalPostButton: { backgroundColor: '#0E713E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  modalPostButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  loaderContainer: { padding: 40, alignItems: 'center' },
  noCommentsContainer: { alignItems: 'center', paddingVertical: 40 },
  noCommentsText: { color: '#666', fontSize: 14, textAlign: 'center' },
  
  // Comment Styles
  commentAvatar: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10 },
  commentContent: { flex: 1 },
  commentBubble: { backgroundColor: '#AACEBC', padding: 10, borderRadius: 14 },
  commentUser: { fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
  commentText: { fontSize: 11, color: '#444', lineHeight: 16 },
  commentFooter: { flexDirection: 'row', gap: 15, marginTop: 5, paddingLeft: 5, flexWrap: 'wrap' },
  footerActionText: { fontSize: 10, color: '#888' },
  deleteText: { color: '#FF6B6B' },
  replyInputContainer: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  replyInput: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, marginRight: 10 },
  replyButton: { backgroundColor: '#0E713E', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  replyButtonText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  repliesContainer: { marginTop: 10, marginLeft: 20 },
  replyItem: { flexDirection: 'row', marginBottom: 10 },
  replyAvatar: { width: 25, height: 25, borderRadius: 12.5, marginRight: 8 },
  replyContent: { flex: 1 },
  replyBubble: { backgroundColor: '#E8E8E8', padding: 8, borderRadius: 12 },
  replyUser: { fontWeight: 'bold', fontSize: 11, marginBottom: 2 },
  replyText: { fontSize: 10, color: '#444', lineHeight: 14 },
  replyFooter: { flexDirection: 'row', gap: 12, marginTop: 4, paddingLeft: 5 },
  
  // Member Modal Styles
  modalContainerFull: { flex: 1, backgroundColor: '#FFF' },
  modalHeaderFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 25 : 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  closeButton: { padding: 5 },
  closeButtonText: { fontSize: 24, color: '#0E713E' },
  modalTitleFull: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  placeholder: { width: 30 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', position: 'relative' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#0E713E' },
  tabText: { fontSize: 14, color: '#666' },
  activeTabText: { color: '#0E713E', fontWeight: '600' },
  badge: { position: 'absolute', top: 8, right: 20, backgroundColor: '#FF6B6B', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  memberItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  requestItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  memberAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  memberType: { fontSize: 12, color: '#0E713E' },
  requestDate: { fontSize: 12, color: '#666' },
  requestActions: { flexDirection: 'row', gap: 10 },
  actionButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  acceptButton: { backgroundColor: '#0E713E' },
  acceptButtonText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  rejectButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FF6B6B' },
  rejectButtonText: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },
  removeButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FF6B6B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  removeButtonText: { color: '#FF6B6B', fontSize: 12 },
  listContentFull: { flexGrow: 1 },
  joinButton: { backgroundColor: '#0E713E', marginHorizontal: 20, marginVertical: 10, padding: 12, borderRadius: 25, alignItems: 'center' },
  joinButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  leaveButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FF6B6B', marginHorizontal: 20, marginVertical: 10, padding: 12, borderRadius: 25, alignItems: 'center' },
  leaveButtonText: { color: '#FF6B6B', fontSize: 16, fontWeight: '600' },
  pendingContainer: { backgroundColor: '#FFF3E0', marginHorizontal: 20, marginVertical: 10, padding: 12, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: '#FF9800' },
  pendingText: { color: '#FF9800', fontSize: 14, fontWeight: '500' },
  adminBadge: { backgroundColor: '#E8F5E9', marginHorizontal: 20, marginVertical: 5, padding: 5, borderRadius: 20, alignItems: 'center' },
  adminBadgeText: { color: '#0E713E', fontSize: 12, fontWeight: '500' },

  // Report Modal Styles
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reportModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  reportModalClose: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  reportModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  reportOptionsList: {
    maxHeight: 300,
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderRadius: 8,
  },
  reportOptionSelected: {
    backgroundColor: '#E8F5E9',
  },
  reportOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  reportOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  reportOptionTextSelected: {
    color: '#0E713E',
    fontWeight: '600',
  },
  reportOptionCheck: {
    color: '#0E713E',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportOtherInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reportModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  reportModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportModalCancelButton: {
    backgroundColor: '#F5F5F5',
  },
  reportModalSubmitButton: {
    backgroundColor: '#0E713E',
  },
  reportModalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  reportModalSubmitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupPostsScreen;