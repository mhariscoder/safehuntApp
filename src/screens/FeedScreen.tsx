// FeedScreen.js - With Share Functionality
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { usePosts } from '../hooks/usePosts';
import { useComments } from '../hooks/useComments';
import { useAppSelector } from '../app/store/hooks';
import TopHeader from '../components/TopHeader';
import SideMenu from '../components/SideMenu';
import BottomTabNav from '../components/BottomTabNav';
import { API_BASE_URL } from '../constants/config';
import { Post } from '../features/posts/postsTypes';
import axios from 'axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_IMAGE_HEIGHT = SCREEN_WIDTH * 0.8;

// Assets
const ASSETS = {
  userHenry: require('../../assets/circle_profile.png'),
  greenHeart: require('../../assets/green_heart.png'),
  greenComment: require('../../assets/green_comment.png'),
  greenShare: require('../../assets/green_share.png'),
  arrowDown: require('../../assets/arrow_down.png'),
  arrowUp: require('../../assets/arrow_up.png'),
  moreIcon: require('../../assets/more_vert.png'),
};

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

// Memoized Post Component with fixed dropdown positioning
const PostCard = memo(({ 
  post, 
  onLike, 
  onCommentPress, 
  onSharePress,
  onToggleComments, 
  showAllComments, 
  formatTimeAgo, 
  user,
  onLikeComment,
  onReplyPress,
  onDeleteComment,
  onAddReply,
  onDeleteReply,
  onLikeReply,
  replyText,
  showReplyInput,
  setReplyText,
  navigation,
  onEditPost,
  onDeletePost,
  activeMenu,
  onToggleMenu,
  isShared,
  shareCount,
}) => {
  const postDate = post.created_at || post.createdAt;
  const imageUrl = post.image ? getFullImageUrl(post.image) : null;
  const userAvatar = post.user?.profilePhoto ? getFullImageUrl(post.user.profilePhoto) : null;
  const displayComments = showAllComments ? post.comments : post.comments?.slice(0, 2);
  const isOwner = user?.id === post.user?.id;
  const isMenuVisible = activeMenu === post.id;

  const handlePostPress = () => {
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

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('User', { userId: post.user?.id })}
          style={styles.postHeaderTouchable}
        >
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
              {formatTimeAgo(postDate)} • {post.location || ''}
            </Text>
          </View>
        </TouchableOpacity>
        {isOwner && (
          <View style={styles.moreButtonWrapper}>
            <TouchableOpacity 
              onPress={() => onToggleMenu(post.id)}
              style={styles.moreButton}
            >
              <Image source={ASSETS.moreIcon} style={styles.moreIcon} />
            </TouchableOpacity>

            {isMenuVisible && (
              <View style={styles.dropdown}>
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
              </View>
            )}
          </View>
        )}
      </View>

      {/* Show shared indicator if post is shared */}
      {isShared && (
        <View style={styles.sharedIndicator}>
          <Text style={styles.sharedIndicatorText}>🔁 Shared Post</Text>
        </View>
      )}

      <TouchableOpacity onPress={handlePostPress}>
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
    </View>
  );
});

const FeedScreen = () => {
  const [menuOpen, setMenuOpen] = useState(false);
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
  const [sharedPosts, setSharedPosts] = useState<Set<number>>(new Set());
  const [shareCounts, setShareCounts] = useState<{ [key: number]: number }>({});
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const navigation = useNavigation<any>();
  const { user, token } = useAppSelector((state) => state.auth);
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

  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      if (posts.length === 0) {
        loadInitialPosts();
      }
    }, [posts.length])
  );

  const loadInitialPosts = async () => {
    if (isLoading) return;
    try {
      setPage(1);
      setHasMore(true);
      const result = await getAllPosts({ page: 1, limit: 20 });
      if (result && result.posts && result.posts.length < 20) {
        setHasMore(false);
      }
      // Check share status for each post
      if (result && result.posts) {
        result.posts.forEach((post: any) => {
          checkShareStatus(post.id);
          fetchShareCount(post.id);
        });
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadMorePosts = async () => {
    if (isLoadingMore || isLoading || !hasMore || posts.length === 0) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const result = await getAllPosts({ page: nextPage, limit: 20 });
      
      if (result && (!result.posts || result.posts.length < 20)) {
        setHasMore(false);
      }
      setPage(nextPage);
      
      // Check share status for each new post
      if (result && result.posts) {
        result.posts.forEach((post: any) => {
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
    await loadInitialPosts();
    setRefreshing(false);
  };

  const handleToggleMenu = (postId: number) => {
    setActiveMenu(prev => (prev === postId ? null : postId));
  };

  const handleLike = useCallback(async (postId: number) => {
    try {
      await toggleLike(postId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update like');
    }
  }, [toggleLike]);

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
      // Check if user has shared this post
      const response = await axios.get(
        `${API_BASE_URL}/shares/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Check if current user's ID is in the shares list
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
      
      // Update share count
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
    if (!user) {
      Alert.alert('Error', 'Please login to share posts');
      return;
    }

    const postId = post.id;
    const isShared = sharedPosts.has(postId);

    const refreshFeed = async () => {
      await loadInitialPosts();
    };

    const handleShare = async () => {
      try {
        await sharePost(postId);
        await refreshFeed();
        Alert.alert('Success', 'Post shared successfully');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to share post');
      }
    };

    const handleUnshare = async () => {
      try {
        await unsharePost(postId);
        await refreshFeed();
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
              Alert.alert('Success', 'Post deleted successfully');
              await loadInitialPosts();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete post');
            }
          }
        }
      ]
    );
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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like reply');
    }
  };

  const toggleShowAllComments = useCallback((postId: number) => {
    setShowAllComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  }, []);

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
    return `${diffDays}d`;
  }, []);

  const renderPostItem = useCallback(({ item }: { item: Post }) => {
    const isShared = sharedPosts.has(item.id);
    const shareCount = shareCounts[item.id] || 0;
    
    return (
      <PostCard
        post={item}
        onLike={handleLike}
        onCommentPress={handleCommentPress}
        onSharePress={handleSharePress}
        onToggleComments={toggleShowAllComments}
        showAllComments={showAllComments[item.id]}
        formatTimeAgo={formatTimeAgo}
        user={user}
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
        activeMenu={activeMenu}
        onToggleMenu={handleToggleMenu}
        isShared={isShared}
        shareCount={shareCount}
      />
    );
  }, [showAllComments, handleLike, handleCommentPress, toggleShowAllComments, formatTimeAgo, user, handleLikeComment, handleReplyPress, handleDeleteComment, handleAddReply, handleDeleteReply, handleLikeReply, replyText, showReplyInput, activeMenu, sharedPosts, shareCounts]);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0E713E" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No posts yet</Text>
      <TouchableOpacity 
        style={styles.createPostButton}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Text style={styles.createPostButtonText}>Create Your First Post</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.header}>
        <TopHeader 
          onMenuPress={() => setMenuOpen(true)}
          onSearchPress={() => navigation.navigate('HuntingJournal')}
          containerStyle={{ marginTop: 40, backgroundColor: 'transparent' }}
        />

        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('CreatePost')}
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
              <Image source={require('../../assets/image.png')} style={styles.imagePickerIcon} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
        }
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      <View style={styles.bottomNavContainer}>
        <BottomTabNav />
      </View>

      {/* Comment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCommentModalVisible}
        onRequestClose={() => {
          setIsCommentModalVisible(false);
          setModalComments([]);
          setCommentText('');
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
                      source={item.user?.profilePhoto ? { uri: getFullImageUrl(item.user.profilePhoto) } : ASSETS.userHenry} 
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
                                source={reply.user?.profilePhoto ? { uri: getFullImageUrl(reply.user.profilePhoto) } : ASSETS.userHenry} 
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 0 : 25,
    paddingBottom: 20
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
  textInput: { flex: 1, marginHorizontal: 10, fontSize: 12 },
  imagePickerIcon: { width: 24, height: 24 },
  postCard: { backgroundColor: '#FFF', paddingVertical: 15 },
  postHeader: { 
    flexDirection: 'row', 
    paddingHorizontal: 25, 
    alignItems: 'center', 
    marginBottom: 10,
    justifyContent: 'space-between'
  },
  postHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },
  headerInfo: { flex: 1, marginLeft: 10 },
  userName: { fontWeight: '900', fontSize: 16 },
  location: { color: '#666', fontSize: 10 },
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
    width: 130,
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
  postCaption: { paddingHorizontal: 25, marginBottom: 10, fontSize: 12, lineHeight: 20 },
  hashtag: { fontWeight: 'bold', color: '#0E713E' },
  mainPostImage: { width: '100%', height: POST_IMAGE_HEIGHT, resizeMode: 'cover' },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 25, 
    paddingVertical: 10, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#EEE' 
  },
  statsText: { color: '#666', fontSize: 12 },
  actionButtons: { backgroundColor: '#0E713E', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 25, gap: 10 },
  actionBtn: { backgroundColor: '#FFFFFF', flex: 1, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', borderRadius: 20, justifyContent: 'center' },
  actionBtnText: { color: '#0E713E', fontWeight: 'bold', fontSize: 10 },
  actionBtnTextActive: { color: '#FF6B6B' },
  actionImage: { width: 14, height: 14, marginRight: 5, resizeMode: 'contain', tintColor: '#0E713E' },
  actionImageActive: { tintColor: '#FF6B6B' },
  sharedIndicator: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 25,
    marginBottom: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sharedIndicatorText: {
    fontSize: 10,
    color: '#0E713E',
    fontWeight: '600',
  },
  bottomTabContainer: { paddingHorizontal: 25, position: 'absolute', bottom: 30, left: 0, right: 0 },
  bottomNavContainer: { position: 'absolute', bottom: 15, left: 20, right: 20 },
  commentsSection: { paddingHorizontal: 25, marginTop: 10 },
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
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 50, paddingBottom: 50 },
  emptyText: { color: '#666', fontSize: 14, marginBottom: 15 },
  createPostButton: { backgroundColor: '#0E713E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  createPostButtonText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  loaderContainer: { padding: 40, alignItems: 'center' },
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
});

export default FeedScreen;