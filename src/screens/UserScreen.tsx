import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  RefreshControl,
  TouchableWithoutFeedback,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import { useUserEquipment } from '../hooks/useUserEquipment';
import { useBlock } from '../hooks/useBlock';
import { usePosts } from '../hooks/usePosts';
import { useComments } from '../hooks/useComments';
import { getUsersByIds } from '../features/auth/authActions';
import { sendFriendRequest, acceptFriendRequest } from '../features/friends/friendsActions';
import { API_BASE_URL } from '../constants/config';
import axios from 'axios';

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
  arrowDown: require('../../assets/arrow_down.png'),
  arrowUp: require('../../assets/arrow_up.png'),
  moreVert: require('../../assets/more_vert.png'),
};

// Report Reasons
const REPORT_REASONS = {
  ABUSIVE_LANGUAGE: 'Abusive Language',
  HARASSMENT: 'Harassment or Bullying',
  SPAM: 'Spam or Scam',
  INAPPROPRIATE_CONTENT: 'Inappropriate Content',
  HATE_SPEECH: 'Hate Speech or Discrimination',
  OTHER: 'Other',
};

const REPORT_OPTIONS = [
  { key: REPORT_REASONS.ABUSIVE_LANGUAGE, label: REPORT_REASONS.ABUSIVE_LANGUAGE, icon: '⚠️' },
  { key: REPORT_REASONS.HARASSMENT, label: REPORT_REASONS.HARASSMENT, icon: '👊' },
  { key: REPORT_REASONS.SPAM, label: REPORT_REASONS.SPAM, icon: '📧' },
  { key: REPORT_REASONS.INAPPROPRIATE_CONTENT, label: REPORT_REASONS.INAPPROPRIATE_CONTENT, icon: '🔞' },
  { key: REPORT_REASONS.HATE_SPEECH, label: REPORT_REASONS.HATE_SPEECH, icon: '🚫' },
  { key: REPORT_REASONS.OTHER, label: REPORT_REASONS.OTHER, icon: '📝' },
];

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

// Memoized Post Component
const PostCard = memo(({ 
  post, 
  onLike, 
  onCommentPress, 
  onSharePress,
  showAllComments, 
  formatTimeAgo, 
  user,
  navigation,
  onEditPost,
  onDeletePost,
  onReportPost,
  onBlockUser,
  activeMenu,
  onToggleMenu,
  isShared,
  shareCount,
  onToggleComments,
  onLikeComment,
  onReplyPress,
  onDeleteComment,
  onAddReply,
  onDeleteReply,
  onLikeReply,
  replyText,
  showReplyInput,
  setReplyText,
  isUserBlocked,
}: {
  post: any, 
  onLike: any, 
  onCommentPress: any, 
  onSharePress: any,
  showAllComments: any, 
  formatTimeAgo: any, 
  user: any,
  navigation: any,
  onEditPost: any,
  onDeletePost: any,
  onReportPost: any,
  onBlockUser: any,
  activeMenu: any,
  onToggleMenu: any,
  isShared: any,
  shareCount: any,
  onToggleComments: any,
  onLikeComment: any,
  onReplyPress: any,
  onDeleteComment: any,
  onAddReply: any,
  onDeleteReply: any,
  onLikeReply: any,
  replyText: any,
  showReplyInput: any,
  setReplyText: any,
  isUserBlocked: boolean,
}) => {
  const postDate = post.created_at || post.createdAt;
  const imageUrl = post.image ? getFullImageUrl(post.image) : null;
  const userAvatar = post.user?.profilePhoto ? getFullImageUrl(post.user.profilePhoto) : null;
  const isOwner = user?.id === post.user?.id;
  const isMenuVisible = activeMenu === post.id;
  const displayComments = showAllComments ? post.comments : post.comments?.slice(0, 2);

  const handlePostPress = () => {
    if (isMenuVisible) {
      onToggleMenu(post.id);
    }
    navigation.navigate('PostDetail', { postId: post.id, groupId: post.groupId });
  };

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

  const handleOutsidePress = () => {
    if (isMenuVisible) {
      onToggleMenu(post.id);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => {
              if (isMenuVisible) {
                onToggleMenu(post.id);
              }
              navigation.navigate('User', { userId: post.user?.id });
            }}
            style={styles.postHeaderTouchable}
          >
            <View style={styles.profileCircleSmall}>
              {userAvatar ? (
                <Image 
                  source={{ uri: getFullImageUrl(userAvatar) || undefined }} 
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
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
                {formatTimeAgo(postDate)} • {post.location || ''}
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.moreButtonWrapper}>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                onToggleMenu(post.id);
              }}
              style={styles.moreButton}
            >
              <Image source={ASSETS.moreVert} style={styles.moreIcon} />
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

        {isShared && (
          <View style={styles.sharedIndicator}>
            <Text style={styles.sharedIndicatorText}>🔁 Shared Post</Text>
          </View>
        )}

        <TouchableOpacity 
          onPress={handlePostPress}
          activeOpacity={0.7}
        >
          <Text style={styles.postCaption}>
            {post.description}
            {post.tags && <Text style={styles.hashtag}> {post.tags}</Text>}
          </Text>

          {imageUrl && (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.mainPostImage}
              resizeMode="cover"
              progressiveRenderingEnabled={true}
            />
          )}
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>❤️ {post.likesCount || 0} {(post.likesCount === 1 ? 'Like' : 'Likes')}</Text>
          <Text style={styles.statsText}>{post.comments?.length || 0} Comments</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => {
              if (isMenuVisible) onToggleMenu(post.id);
              onLike(post.id);
            }}
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
            onPress={() => {
              if (isMenuVisible) onToggleMenu(post.id);
              onCommentPress(post);
            }}
          >
            <Image source={ASSETS.greenComment} resizeMode='contain' style={styles.actionImage} />
            <Text style={styles.actionBtnText}>Comment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => {
              if (isMenuVisible) onToggleMenu(post.id);
              onSharePress(post);
            }}
          >
            <Image 
              source={ASSETS.greenShare} 
              resizeMode='contain' 
              style={[styles.actionImage, isShared && styles.actionImageActive]} 
            />
            <Text style={[styles.actionBtnText, isShared && styles.actionBtnTextActive]}>
              {isShared ? 'Shared' : 'Share'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {/* {post.comments && post.comments.length > 0 && (
          <View style={styles.commentsSection}>
            {post.comments.length > 2 && (
              <TouchableOpacity 
                style={styles.commentDropdown} 
                onPress={() => onToggleComments(post.id)}
              >
                <Text style={styles.allCommentsText}>
                  {showAllComments ? 'Hide comments' : `View all ${post.comments.length} comments`}
                </Text>
                <Image 
                  source={showAllComments ? ASSETS.arrowUp : ASSETS.arrowDown} 
                  style={styles.dropdownArrow} 
                />
              </TouchableOpacity>
            )}
            
            {displayComments?.map((comment: any) => (
              <View key={comment.id} style={styles.commentItem}>
                <Image 
                  source={comment.user?.profilePhoto ? { uri: getFullImageUrl(comment.user.profilePhoto) } : ASSETS.profilePic} 
                  style={styles.commentAvatar} 
                />
                <View style={styles.commentContent}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUser}>{comment.user?.displayname || comment.user?.username || 'User'}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                  <View style={styles.commentFooter}>
                    <Text style={styles.footerActionText}>{formatTimeAgo(comment.created_at || comment.createdAt)}</Text>
                    <TouchableOpacity onPress={() => onLikeComment(comment.id)}>
                      <Text style={styles.footerActionText}>
                        {comment.commentLiked ? 'Unlike' : 'Like'} ({comment.likeCount || 0})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onReplyPress(comment.id)}>
                      <Text style={styles.footerActionText}>Reply</Text>
                    </TouchableOpacity>
                    {comment.user?.id === user?.id && (
                      <TouchableOpacity onPress={() => onDeleteComment(comment.id)}>
                        <Text style={[styles.footerActionText, styles.deleteText]}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {showReplyInput[comment.id] && (
                    <View style={styles.replyInputContainer}>
                      <TextInput
                        style={styles.replyInput}
                        placeholder="Write a reply..."
                        placeholderTextColor="#999"
                        value={replyText}
                        onChangeText={setReplyText}
                        multiline
                      />
                      <TouchableOpacity style={styles.replyButton} onPress={onAddReply}>
                        <Text style={styles.replyButtonText}>Post</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                      {comment.replies.map((reply: any) => (
                        <View key={reply.id} style={styles.replyItem}>
                          <Image 
                            source={reply.user?.profilePhoto ? { uri: getFullImageUrl(reply.user.profilePhoto) } : ASSETS.profilePic} 
                            style={styles.replyAvatar} 
                          />
                          <View style={styles.replyContent}>
                            <View style={styles.replyBubble}>
                              <Text style={styles.replyUser}>{reply.user?.displayname || reply.user?.username || 'User'}</Text>
                              <Text style={styles.replyText}>{reply.content}</Text>
                            </View>
                            <View style={styles.replyFooter}>
                              <Text style={styles.footerActionText}>{formatTimeAgo(reply.created_at || reply.createdAt)}</Text>
                              <TouchableOpacity onPress={() => onLikeReply(reply.id)}>
                                <Text style={styles.footerActionText}>
                                  {reply.replyLiked ? 'Unlike' : 'Like'} ({reply.likeCount || 0})
                                </Text>
                              </TouchableOpacity>
                              {reply.user?.id === user?.id && (
                                <TouchableOpacity onPress={() => onDeleteReply(reply.id)}>
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
            ))}
          </View>
        )} */}
      </View>
    </TouchableWithoutFeedback>
  );
});

const UserScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  
  const { userId } = route.params || {};
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Posts');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isAcceptingRequest, setIsAcceptingRequest] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');
  const [refreshing, setRefreshing] = useState(false);

  // Comment related states
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
  const [sharedPosts, setSharedPosts] = useState<Set<number>>(new Set());
  const [shareCounts, setShareCounts] = useState<{ [key: number]: number }>({});
  const [reportedPosts, setReportedPosts] = useState<Set<number>>(new Set());

  // Report Modal states
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [selectedPostForReport, setSelectedPostForReport] = useState<any>(null);
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);
  const [otherReportReason, setOtherReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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
    userPosts: userPosts,
    isLoading: postsLoading,
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
    likeReply,
    unlikeComment,
    unlikeReply,
  } = useComments();

  // Check if a user is blocked
  const isUserBlocked = useCallback((userId: number) => {
    return blockedUserIds.has(userId);
  }, [blockedUserIds]);

  useEffect(() => {
    blockUser({ page: 1, limit: 100 });
  }, []);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadUserPosts(1);
    }
  }, [userId]);

  useEffect(() => {
    if (userData?.id) {
      getUserEquipments(parseInt(userData.id));
    }
  }, [userData?.id]);

  useEffect(() => {
    if (userPosts && userPosts.length > 0) {
      userPosts.forEach((post: any) => {
        checkShareStatus(post.id);
        fetchShareCount(post.id);
      });
    }
  }, [userPosts]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const result = await dispatch(getUsersByIds({ 
        ids: [parseInt(userId)], 
        currentUserId: currentUser?.id 
      })).unwrap();

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

  const loadUserPosts = async (pageNum: number = 1) => {
    try {
      await getPostsByUserId(parseInt(userId), { page: pageNum, limit: 20 });
    } catch (error) {
      console.error('Error loading user posts:', error);
    }
  };

  const loadMorePosts = async () => {
    if (isLoadingMore || postsLoading || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      await getPostsByUserId(parseInt(userId), { page: nextPage, limit: 20 });
      setPage(nextPage);
      
      // Check share status for each new post
      if (userPosts) {
        userPosts.forEach((post: any) => {
          checkShareStatus(post.id);
          fetchShareCount(post.id);
        });
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setActiveMenu(null);
    setPage(1);
    setHasMore(true);
    await loadUserPosts(1);
    await loadUserData();
    setRefreshing(false);
  };

  const handleToggleMenu = (postId: number) => {
    setActiveMenu(prev => (prev === postId ? null : postId));
  };

  const handleLike = async (postId: number) => {
    try {
      await toggleLike(postId);
      await loadUserPosts(page);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update like');
    }
  };

  const toggleShowAllComments = useCallback((postId: number) => {
    setShowAllComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  }, []);

  // Share Post API calls
  const sharePost = async (postId: number) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/shares/${postId}/${currentUser?.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
        `${API_BASE_URL}/shares/${postId}/${currentUser?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
        }
      );
      
      const shares = response.data || [];
      const hasShared = shares.some((share: any) => share.userId === currentUser?.id);
      
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
    if (!currentUser) {
      Alert.alert('Error', 'Please login to share posts');
      return;
    }

    const postId = post.id;
    const isShared = sharedPosts.has(postId);

    const refreshPosts = async () => {
      await loadUserPosts(page);
    };

    const handleShare = async () => {
      try {
        await sharePost(postId);
        await refreshPosts();
        Alert.alert('Success', 'Post shared successfully');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to share post');
      }
    };

    const handleUnshare = async () => {
      try {
        await unsharePost(postId);
        await refreshPosts();
        Alert.alert('Success', 'Post unshared successfully');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to unshare post');
      }
    };

    if (isShared) {
      Alert.alert(
        'Unshare Post',
        'Are you sure you want to remove your share of this post?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
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

  // Report Post
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

  const handleReportPost = (post: any) => {
    if (reportedPosts.has(post.id)) {
      Alert.alert('Already Reported', 'You have already reported this post.');
      return;
    }
    
    setSelectedPostForReport(post);
    setSelectedReportReason(null);
    setOtherReportReason('');
    setIsReportModalVisible(true);
  };

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
      
      setReportedPosts(prev => new Set(prev).add(selectedPostForReport.id));
      
      setIsReportModalVisible(false);
      setSelectedPostForReport(null);
      setSelectedReportReason(null);
      setOtherReportReason('');
      Alert.alert('Success', 'Post has been reported successfully');
    } catch (error: any) {
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

  // Block User
  const handleBlockUser = (userId: number, userName?: string) => {
    if (!userId) return;
    
    const displayName = userName || 'this user';
    
    if (isUserBlocked(userId)) {
      Alert.alert(
        'Unblock User',
        `Are you sure you want to unblock ${displayName}?`,
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
                await loadUserPosts(page);
              } catch (error: any) {
                Alert.alert('Error', error?.message || 'Failed to unblock user');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Block User',
        `Are you sure you want to block ${displayName}?`,
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
                await loadUserPosts(page);
              } catch (error: any) {
                Alert.alert('Error', error?.message || 'Failed to block user');
              }
            },
          },
        ]
      );
    }
  };

  // Comment Handlers
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
      await loadUserPosts(page);
      Alert.alert('Success', 'Comment added successfully');
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
      await loadUserPosts(page);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like comment');
    }
  };

  const handleReplyPress = (commentId: number) => {
    setSelectedCommentId(commentId);
    setShowReplyInput(prev => ({ ...prev, [commentId]: !prev[commentId] }));
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
      await loadUserPosts(page);
      Alert.alert('Success', 'Reply added successfully');
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
              }
              await loadUserPosts(page);
              Alert.alert('Success', 'Comment deleted successfully');
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
              await loadUserPosts(page);
              Alert.alert('Success', 'Reply deleted successfully');
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
      await loadUserPosts(page);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like reply');
    }
  };

  const handleEditPost = (post: any) => {
    navigation.navigate('CreatePost', { 
      postId: post.id,
      description: post.description,
      image: post.image,
      latitude: post.latitude,
      longitude: post.longitude,
      tags: post.tags ? JSON.parse(post.tags) : [],
      isEditing: true
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
              await deletePost(postId);
              await loadUserPosts(page);
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete post');
            }
          }
        }
      ]
    );
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
                Alert.alert('Error', e.message || 'Failed to unblock user');
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
                Alert.alert('Error', e.message || 'Failed to block user');
              }
            },
          },
        ]
      );
    }
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

  const renderPostItem = useCallback(({ item }: { item: any }) => {
    const isShared = sharedPosts.has(item.id);
    const shareCount = shareCounts[item.id] || 0;
    const isBlocked = item.user?.id ? isUserBlocked(item.user.id) : false;
    
    return (
      <PostCard
        post={item}
        onLike={handleLike}
        onCommentPress={handleCommentPress}
        onSharePress={handleSharePress}
        onToggleComments={toggleShowAllComments}
        showAllComments={showAllComments[item.id]}
        formatTimeAgo={formatTimeAgo}
        user={currentUser}
        onLikeComment={handleLikeComment}
        onReplyPress={handleReplyPress}
        onDeleteComment={handleDeleteComment}
        onAddReply={handleAddReply}
        onDeleteReply={handleDeleteReply}
        onLikeReply={handleLikeReply}
        replyText={replyText}
        showReplyInput={showReplyInput}
        setReplyText={setReplyText}
        navigation={navigation}
        onEditPost={handleEditPost}
        onDeletePost={handleDeletePost}
        onReportPost={handleReportPost}
        onBlockUser={handleBlockUser}
        activeMenu={activeMenu}
        onToggleMenu={handleToggleMenu}
        isShared={isShared}
        shareCount={shareCount}
        isUserBlocked={isBlocked}
      />
    );
  }, [showAllComments, handleLike, handleCommentPress, toggleShowAllComments, currentUser, handleLikeComment, handleReplyPress, handleDeleteComment, handleAddReply, handleDeleteReply, handleLikeReply, replyText, showReplyInput, activeMenu, sharedPosts, shareCounts, isUserBlocked]);

  const renderPosts = () => {
    if (postsLoading && userPosts.length === 0) {
      return (
        <View style={styles.postsLoaderContainer}>
          <ActivityIndicator size="large" color="#0E713E" />
        </View>
      );
    }

    if (userPosts && userPosts.length > 0) {
      return (
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
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#0E713E" />
              </View>
            ) : null
          }
        />
      );
    }

    return (
      <View style={styles.noPostsContainer}>
        <Text style={styles.noPostsText}>No posts yet</Text>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Posts':
        return (
          <View style={styles.postsContainer}>
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            {renderPosts()}
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

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Bio</Text>
              <Text style={styles.detailValue}>{userData?.bio || 'No bio available'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Hunting Experiences</Text>
              <Text style={styles.detailValue}>{userData?.huntingExperience || 'Not specified'}</Text>
            </View>
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
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
        }
      >
        <View style={styles.headerContainer}>
          <Image 
            source={coverPhotoUrl ? { uri: coverPhotoUrl } : ASSETS.coverImage}
            style={styles.coverImage} 
          />

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
          {['Posts', 'Details'].map((tab) => (
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
          setActiveMenu(null);
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
                setActiveMenu(null);
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
                      source={item.user?.profilePhoto ? { uri: getFullImageUrl(item.user.profilePhoto) } : ASSETS.profilePic} 
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
                        {item.user?.id === currentUser?.id && (
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
                                source={reply.user?.profilePhoto ? { uri: getFullImageUrl(reply.user.profilePhoto) } : ASSETS.profilePic} 
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
                                  {reply.user?.id === currentUser?.id && (
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
                keyExtractor={(item) => item.id.toString()}
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
  btnIcon: { width: 14, height: 14, resizeMode: 'contain', marginRight: 8, tintColor: '#FFF' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
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
  tabPlaceholder: { padding: 40, alignItems: 'center' },
  placeholderText: { color: '#999', fontStyle: 'italic' },
  postsContainer: { paddingHorizontal: 25, paddingVertical: 15 },
  postsLoaderContainer: { padding: 40, alignItems: 'center' },
  noPostsContainer: { alignItems: 'center', paddingVertical: 40 },
  noPostsText: { color: '#999', fontSize: 14, marginBottom: 15 },
  errorText: { fontSize: 16, color: '#666', marginBottom: 15 },
  goBackButton: { backgroundColor: '#0E713E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  goBackButtonText: { color: '#FFF', fontWeight: '600' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },

  // Post Card Styles
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
  postHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15,
    justifyContent: 'space-between'
  },
  postHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
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
  postActionButtons: { 
    flexDirection: 'row', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    gap: 10,
    backgroundColor: '#0E713E',
  },
  postActionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 6, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20 
  },
  postActionBtnText: { color: '#0E713E', fontSize: 10, fontWeight: '600', marginLeft: 5 },
  postActionBtnTextActive: { color: '#FF6B6B' },
  postActionImage: { width: 14, height: 14, tintColor: '#0E713E' },
  postActionImageActive: { tintColor: '#FF6B6B' },

  // Shared Indicator
  sharedIndicator: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 15,
    marginBottom: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sharedIndicatorText: {
    fontSize: 10,
    color: '#0E713E',
    fontWeight: '600',
  },

  // Comments Section
  commentsSection: { paddingHorizontal: 15, marginTop: 10, marginBottom: 10 },
  commentDropdown: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  allCommentsText: { fontSize: 12, fontWeight: '700', color: '#333' },
  dropdownArrow: { width: 12, height: 12, marginLeft: 5 },
  commentItem: { flexDirection: 'row', marginBottom: 15 },
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

  // More Button Dropdown
  moreButtonWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  moreButton: {
    padding: 5,
  },
  moreIcon: { width: 20, height: 20, tintColor: '#666', resizeMode: 'contain' },
  dropdown: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: '#0E713E',
    borderRadius: 10,
    width: 150,
    zIndex: 9999,
    elevation: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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

  // Modal Styles
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
  noCommentsContainer: { alignItems: 'center', paddingVertical: 40 },
  noCommentsText: { color: '#666', fontSize: 14, textAlign: 'center' },
  loaderContainer: { padding: 40, alignItems: 'center' },

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

  // Additional styles
  profileCircleSmall: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#4D3626', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileInitial: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  headerInfo: { flex: 1, marginLeft: 10 },
  userName: { fontWeight: '900', fontSize: 16, color: '#000' },
  location: { color: '#666', fontSize: 10 },
  mainPostImage: { width: '100%', height: 200, resizeMode: 'cover' },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#EEE' 
  },
  statsText: { color: '#666', fontSize: 10 },
  actionButtons: { 
    backgroundColor: '#0E713E', 
    flexDirection: 'row', 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    gap: 10 
  },
  actionBtn: { 
    backgroundColor: '#FFFFFF', 
    flex: 1, 
    paddingVertical: 6, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    justifyContent: 'center' 
  },
  actionBtnText: { color: '#0E713E', fontWeight: 'bold', fontSize: 10 },
  actionBtnTextActive: { color: '#FF6B6B' },
  actionImage: { width: 14, height: 14, marginRight: 5, resizeMode: 'contain', tintColor: '#0E713E' },
  actionImageActive: { tintColor: '#FF6B6B' },
});

export default UserScreen;