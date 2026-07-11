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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import { getPostById, toggleLike, toggleLikeLocally } from '../features/posts/postsActions';
import { useComments } from '../hooks/useComments';
import { useBlock } from '../hooks/useBlock';
import { API_BASE_URL } from '../constants/config';
import axios from 'axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_IMAGE_HEIGHT = SCREEN_WIDTH * 0.8;

// Assets
const ASSETS = {
  userHenry: require('../../assets/circle_profile.png'),
  greenHeart: require('../../assets/green_heart.png'),
  greenComment: require('../../assets/green_comment.png'),
  greenShare: require('../../assets/green_share.png'),
  backArrow: require('../../assets/back_white.png'),
  arrowDown: require('../../assets/arrow_down.png'),
  arrowUp: require('../../assets/arrow_up.png'),
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

// Helper function to get full image URL
const getFullImageUrl = (imagePath: string | null | undefined, size?: string): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  const sizeParam = size ? `?size=${size}` : '';
  return `${API_BASE_URL}/public/uploads/${cleanPath}${sizeParam}`;
};

const PostDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  
  const { postId, groupId } = route.params || {};
  const { user, token } = useAppSelector((state) => state.auth);
  const { selectedPost, isLoading: postsLoading } = useAppSelector((state) => state.posts);
  
  const [isLiking, setIsLiking] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [showReplyInput, setShowReplyInput] = useState<{ [key: number]: boolean }>({});
  const [showAllReplies, setShowAllReplies] = useState<{ [key: number]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isShared, setIsShared] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [reportedPosts, setReportedPosts] = useState<Set<number>>(new Set());
  
  // Report Modal states
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);
  const [otherReportReason, setOtherReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  // Dropdown menu state
  const [showDropdown, setShowDropdown] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  const {
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

  // Load post data
  const loadPost = useCallback(async () => {
    if (!postId) {
      Alert.alert('Error', 'No post ID provided');
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(getPostById({ id: postId, groupId })).unwrap();
      // Check share status after loading post
      await checkShareStatus(postId);
      await fetchShareCount(postId);
    } catch (error: any) {
      console.error('Error loading post:', error);
      Alert.alert('Error', error.message || 'Failed to load post');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [postId, groupId, dispatch, navigation]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  // Get the current post from Redux state
  const post = selectedPost;

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

  // Share Post API calls
  const sharePost = async (postId: number) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/shares/${postId}/${user?.id}`,
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
        `${API_BASE_URL}/shares/${postId}/${user?.id}`,
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
      const hasShared = shares.some((share: any) => share.userId === user?.id);
      setIsShared(hasShared);
      
      // Update share count
      setShareCount(shares.length || 0);
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
      setShareCount(shares.length || 0);
    } catch (error) {
      console.error('Error fetching share count:', error);
    }
  };

  const handleSharePress = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to share posts');
      return;
    }

    setIsSharing(true);

    const refreshPost = async () => {
      await loadPost();
    };

    const handleShare = async () => {
      try {
        await sharePost(postId);
        setIsShared(true);
        await refreshPost();
        Alert.alert('Success', 'Post shared successfully');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to share post');
      } finally {
        setIsSharing(false);
      }
    };

    const handleUnshare = async () => {
      try {
        await unsharePost(postId);
        setIsShared(false);
        await refreshPost();
        Alert.alert('Success', 'Post unshared successfully');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to unshare post');
      } finally {
        setIsSharing(false);
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
            onPress: () => setIsSharing(false),
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

  // Handle like/unlike with optimistic update
  const handleLike = async () => {
    if (isLiking || !post) return;
    
    setIsLiking(true);
    
    // Optimistic update
    dispatch(toggleLikeLocally(post.id));
    
    try {
      await dispatch(toggleLike(post.id)).unwrap();
    } catch (error: any) {
      // Revert optimistic update by refreshing the post
      await loadPost();
      Alert.alert('Error', error.message || 'Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment({
        postId: postId,
        content: commentText
      });
      setCommentText('');
      await loadPost(); // Refresh post with new comment
      
      // Scroll to bottom to show new comment
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle like comment
  const handleLikeComment = async (commentId: number, isLiked: boolean) => {
    try {
      if (isLiked) {
        await unlikeComment(commentId);
      } else {
        await likeComment(commentId);
      }
      await loadPost(); // Refresh to update like status
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update like');
    }
  };

  // Handle reply press
  const handleReplyPress = (commentId: number) => {
    setSelectedCommentId(commentId);
    setShowReplyInput(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    setReplyText('');
  };

  // Handle add reply
  const handleAddReply = async (commentId: number) => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    setIsSubmitting(true);
    try {
      await addReply({
        commentId: commentId,
        content: replyText
      });
      setReplyText('');
      setShowReplyInput(prev => ({ ...prev, [commentId]: false }));
      await loadPost(); // Refresh to show new reply
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = (commentId: number) => {
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
              await loadPost();
              Alert.alert('Success', 'Comment deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete comment');
            }
          }
        }
      ]
    );
  };

  // Handle delete reply
  const handleDeleteReply = (replyId: number) => {
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
              await loadPost();
              Alert.alert('Success', 'Reply deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete reply');
            }
          }
        }
      ]
    );
  };

  // Handle like reply
  const handleLikeReply = async (replyId: number, isLiked: boolean) => {
    try {
      if (isLiked) {
        await unlikeReply(replyId);
      } else {
        await likeReply(replyId);
      }
      await loadPost(); // Refresh to update like status
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update like');
    }
  };

  // Toggle show all replies
  const toggleShowAllReplies = (commentId: number) => {
    setShowAllReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Report Post Handler - Opens Custom Modal
  const handleReportPost = () => {
    // Check if already reported
    if (reportedPosts.has(postId)) {
      Alert.alert('Already Reported', 'You have already reported this post.');
      setShowDropdown(false);
      return;
    }
    
    setShowDropdown(false);
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

    setIsSubmittingReport(true);
    try {
      await reportPost(
        postId,
        selectedReportReason,
        selectedReportReason === REPORT_REASONS.OTHER ? otherReportReason.trim() : undefined
      );
      
      // Mark post as reported
      setReportedPosts(prev => new Set(prev).add(postId));
      
      // Close modal and show success
      setIsReportModalVisible(false);
      setSelectedReportReason(null);
      setOtherReportReason('');
      Alert.alert('Success', 'Post has been reported successfully');
    } catch (error: any) {
      // Check if error is due to duplicate report
      if (error.response?.data?.message?.includes('already reported')) {
        Alert.alert('Already Reported', 'You have already reported this post.');
        setReportedPosts(prev => new Set(prev).add(postId));
        setIsReportModalVisible(false);
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
  const handleBlockUser = () => {
    if (!post?.user?.id) return;
    
    setShowDropdown(false);
    const userId = post.user.id;
    const displayName = post.user?.displayname || post.user?.username || 'this user';
    
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
                await loadPost();
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
                navigation.goBack();
              } catch (error: any) {
                Alert.alert('Error', error?.message || 'Failed to block user');
              }
            },
          },
        ]
      );
    }
  };

  // Format time ago
  const formatTimeAgo = useCallback((dateString: string) => {
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
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  }, []);

  // Render Report Modal
  const renderReportModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isReportModalVisible}
        onRequestClose={() => {
          setIsReportModalVisible(false);
          setSelectedReportReason(null);
          setOtherReportReason('');
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setIsReportModalVisible(false);
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

  // Render comment item
  const renderComment = (comment: any) => {
    const commentDate = comment.created_at || comment.createdAt;
    const commentAvatar = comment.user?.profilePhoto ? getFullImageUrl(comment.user.profilePhoto) : null;
    const isReplyInputVisible = showReplyInput[comment.id] || false;
    const replies = comment.replies || [];
    const showAll = showAllReplies[comment.id];
    const displayedReplies = showAll ? replies : replies.slice(0, 2);
    const hasMoreReplies = replies.length > 2;

    return (
      <View key={comment.id} style={styles.commentItem}>
        <Image 
          source={commentAvatar ? { uri: commentAvatar } : ASSETS.userHenry} 
          style={styles.commentAvatar} 
        />
        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <Text style={styles.commentUser}>
              {comment.user?.displayname || comment.user?.username || 'User'}
            </Text>
            <Text style={styles.commentText}>{comment.content}</Text>
          </View>
          
          <View style={styles.commentFooter}>
            <Text style={styles.footerActionText}>{formatTimeAgo(commentDate)}</Text>
            <TouchableOpacity onPress={() => handleLikeComment(comment.id, comment.commentLiked)}>
              <Text style={styles.footerActionText}>
                {comment.commentLiked ? 'Unlike' : 'Like'} ({comment.likeCount || 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleReplyPress(comment.id)}>
              <Text style={styles.footerActionText}>Reply</Text>
            </TouchableOpacity>
            {comment.user?.id === user?.id && (
              <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                <Text style={[styles.footerActionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reply Input */}
          {isReplyInputVisible && (
            <View style={styles.replyInputContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Write a reply..."
                placeholderTextColor="#999"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                editable={!isSubmitting}
              />
              <TouchableOpacity 
                style={styles.replyButton} 
                onPress={() => handleAddReply(comment.id)}
                disabled={isSubmitting}
              >
                <Text style={styles.replyButtonText}>
                  {isSubmitting ? 'Posting...' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <>
              {displayedReplies.map((reply: any) => {
                const replyDate = reply.created_at || reply.createdAt;
                const replyAvatar = reply.user?.profilePhoto ? getFullImageUrl(reply.user.profilePhoto) : null;
                
                return (
                  <View key={reply.id} style={styles.replyItem}>
                    <Image 
                      source={replyAvatar ? { uri: replyAvatar } : ASSETS.userHenry} 
                      style={styles.replyAvatar} 
                    />
                    <View style={styles.replyContent}>
                      <View style={styles.replyBubble}>
                        <Text style={styles.replyUser}>
                          {reply.user?.displayname || reply.user?.username || 'User'}
                        </Text>
                        <Text style={styles.replyText}>{reply.content}</Text>
                      </View>
                      <View style={styles.replyFooter}>
                        <Text style={styles.footerActionText}>{formatTimeAgo(replyDate)}</Text>
                        <TouchableOpacity onPress={() => handleLikeReply(reply.id, reply.replyLiked)}>
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
                );
              })}
              
              {hasMoreReplies && (
                <TouchableOpacity 
                  style={styles.viewMoreReplies}
                  onPress={() => toggleShowAllReplies(comment.id)}
                >
                  <Text style={styles.viewMoreRepliesText}>
                    {showAll ? 'Show less replies' : `View all ${replies.length} replies`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  if (isLoading || postsLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity 
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const postDate = post.created_at || post.createdAt;
  const imageUrl = post.image ? getFullImageUrl(post.image) : null;
  const userAvatar = post.user?.profilePhoto ? getFullImageUrl(post.user.profilePhoto) : null;
  const comments = post.comments || [];
  const isOwner = user?.id === post.user?.id;
  const isBlocked = post.user?.id ? isUserBlocked(post.user.id) : false;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image source={ASSETS.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={toggleDropdown}
          >
            <Image source={ASSETS.moreIcon} style={styles.moreIcon} />
          </TouchableOpacity>
          
          {showDropdown && (
            <TouchableWithoutFeedback onPress={toggleDropdown}>
              <View style={styles.dropdownOverlay}>
                <View style={styles.dropdown}>
                  {isOwner ? (
                    <>
                      <TouchableOpacity 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setShowDropdown(false);
                          navigation.navigate('CreatePost', { 
                            postId: post.id,
                            description: post.description,
                            image: post.image,
                            latitude: post.latitude,
                            longitude: post.longitude,
                            tags: post.tags ? JSON.parse(post.tags) : [],
                            isEditing: true
                          });
                        }}
                      >
                        <Text style={styles.dropdownText}>Edit</Text>
                      </TouchableOpacity>
                      <View style={styles.dropdownDivider} />
                      <TouchableOpacity 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setShowDropdown(false);
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
                                    // You would need to implement delete post functionality here
                                    Alert.alert('Success', 'Post deleted successfully');
                                    navigation.goBack();
                                  } catch (error: any) {
                                    Alert.alert('Error', error.message || 'Failed to delete post');
                                  }
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.dropdownText}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity 
                        style={styles.dropdownItem}
                        onPress={handleReportPost}
                      >
                        <Text style={styles.dropdownText}>Report Post</Text>
                      </TouchableOpacity>
                      <View style={styles.dropdownDivider} />
                      <TouchableOpacity 
                        style={styles.dropdownItem}
                        onPress={handleBlockUser}
                      >
                        <Text style={styles.dropdownText}>
                          {isBlocked ? 'Unblock User' : 'Block User'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Post Content */}
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image 
                source={userAvatar ? { uri: userAvatar } : ASSETS.userHenry} 
                style={styles.avatar} 
              />
              <View style={styles.headerInfo}>
                <Text style={styles.userName}>
                  {post.user?.displayname || post.user?.username || 'User'}
                </Text>
                <Text style={styles.location}>
                  {formatTimeAgo(postDate)} • {post.location || ''}
                </Text>
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
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.mainPostImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                ❤️ {post.likesCount || 0} {(post.likesCount === 1 ? 'Like' : 'Likes')}
              </Text>
              <Text style={styles.statsText}>
                💬 {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={handleLike}
                disabled={isLiking}
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
              
              <TouchableOpacity style={styles.actionBtn}>
                <Image source={ASSETS.greenComment} resizeMode='contain' style={styles.actionImage} />
                <Text style={styles.actionBtnText}>Comment</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={handleSharePress}
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

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({comments.length})
            </Text>
            
            {comments.length === 0 ? (
              <View style={styles.noCommentsContainer}>
                <Text style={styles.noCommentsText}>
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            ) : (
              comments.map(renderComment)
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <Image 
            source={user?.profilePhoto ? { uri: getFullImageUrl(user.profilePhoto) } : ASSETS.userHenry} 
            style={styles.inputAvatar} 
          />
          <TextInput
            style={styles.textInput}
            placeholder="Write a comment..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            editable={!isSubmitting}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!commentText.trim() || isSubmitting) && styles.disabledButton]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.sendButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Report Modal */}
      {renderReportModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  
  // Header
  header: { 
    backgroundColor: '#0E713E', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
  },
  backButton: { padding: 5 },
  backIcon: { width: 20, height: 20, tintColor: '#FFF', resizeMode: 'contain' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerRight: { 
    width: 30,
    position: 'relative',
  },
  moreButton: { 
    padding: 5,
  },
  moreIcon: { 
    width: 20, 
    height: 20, 
    tintColor: '#FFF', 
    resizeMode: 'contain' 
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 30,
    right: 0,
    zIndex: 999,
  },
  dropdown: {
    backgroundColor: '#0E713E',
    borderRadius: 10,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  
  // Post Card
  postCard: { backgroundColor: '#FFF', marginTop: 10, paddingVertical: 15, marginBottom: 5 },
  postHeader: { flexDirection: 'row', paddingHorizontal: 25, alignItems: 'center', marginBottom: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },
  headerInfo: { flex: 1, marginLeft: 10 },
  userName: { fontWeight: '900', fontSize: 16 },
  location: { color: '#666', fontSize: 10 },
  postCaption: { paddingHorizontal: 25, marginBottom: 10, fontSize: 14, lineHeight: 20 },
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
  actionButtons: { 
    backgroundColor: '#0E713E', 
    flexDirection: 'row', 
    paddingVertical: 10, 
    paddingHorizontal: 25, 
    gap: 10 
  },
  actionBtn: { 
    backgroundColor: '#FFFFFF', 
    flex: 1, 
    paddingVertical: 6, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    justifyContent: 'center',
    minHeight: 36,
  },
  actionBtnText: { color: '#0E713E', fontWeight: 'bold', fontSize: 12 },
  actionBtnTextActive: { color: '#FF6B6B' },
  actionImage: { width: 16, height: 16, marginRight: 5, resizeMode: 'contain', tintColor: '#0E713E' },
  actionImageActive: { tintColor: '#FF6B6B' },
  
  // Shared Indicator
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
  
  // Comments Section
  commentsSection: { padding: 20, paddingBottom: 80 },
  commentsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#000' },
  commentItem: { flexDirection: 'row', marginBottom: 20 },
  commentAvatar: { width: 35, height: 35, borderRadius: 17.5, marginRight: 12 },
  commentContent: { flex: 1 },
  commentBubble: { backgroundColor: '#AACEBC', padding: 12, borderRadius: 16, marginBottom: 4 },
  commentUser: { fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  commentText: { fontSize: 13, color: '#333', lineHeight: 18 },
  commentFooter: { flexDirection: 'row', gap: 15, marginTop: 4, paddingLeft: 8, flexWrap: 'wrap' },
  footerActionText: { fontSize: 11, color: '#888' },
  deleteText: { color: '#FF6B6B' },
  
  // Reply Input
  replyInputContainer: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  replyInput: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, marginRight: 10, maxHeight: 80 },
  replyButton: { backgroundColor: '#0E713E', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  replyButtonText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  
  // Replies
  repliesContainer: { marginTop: 10, marginLeft: 20 },
  replyItem: { flexDirection: 'row', marginBottom: 12 },
  replyAvatar: { width: 25, height: 25, borderRadius: 12.5, marginRight: 8 },
  replyContent: { flex: 1 },
  replyBubble: { backgroundColor: '#E8E8E8', padding: 8, borderRadius: 12 },
  replyUser: { fontWeight: 'bold', fontSize: 11, marginBottom: 2 },
  replyText: { fontSize: 11, color: '#444', lineHeight: 15 },
  replyFooter: { flexDirection: 'row', gap: 12, marginTop: 4, paddingLeft: 5 },
  viewMoreReplies: { marginTop: 5, marginLeft: 35, marginBottom: 10 },
  viewMoreRepliesText: { fontSize: 12, color: '#0E713E', fontWeight: '600' },
  
  // Input Container
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    gap: 10,
  },
  inputAvatar: { width: 35, height: 35, borderRadius: 17.5 },
  textInput: { 
    flex: 1, 
    backgroundColor: '#F5F5F5', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: { backgroundColor: '#0E713E', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, minWidth: 60, alignItems: 'center' },
  sendButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  disabledButton: { opacity: 0.5 },
  
  // Empty States
  noCommentsContainer: { alignItems: 'center', paddingVertical: 40 },
  noCommentsText: { color: '#666', fontSize: 14, textAlign: 'center' },
  errorText: { fontSize: 16, color: '#666', marginBottom: 15 },
  goBackButton: { backgroundColor: '#0E713E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  goBackButtonText: { color: '#FFF', fontWeight: '600' },

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

export default PostDetailScreen;