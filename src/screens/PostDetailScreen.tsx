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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import { getPostById, toggleLike, toggleLikeLocally } from '../features/posts/postsActions';
import { useComments } from '../hooks/useComments';
import { API_BASE_URL } from '../constants/config';

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
};

// Helper function to get full image URL
const getFullImageUrl = (imagePath: string | null | undefined, size?: string): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  const sizeParam = size ? `?size=${size}` : '';
  return `${API_BASE_URL}/uploads/${cleanPath}${sizeParam}`;
};

const PostDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  
  const { postId, groupId } = route.params || {};
  const { user } = useAppSelector((state) => state.auth);
  const { selectedPost, isLoading: postsLoading } = useAppSelector((state) => state.posts);
  
  const [isLiking, setIsLiking] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [showReplyInput, setShowReplyInput] = useState<{ [key: number]: boolean }>({});
  const [showAllReplies, setShowAllReplies] = useState<{ [key: number]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
        <View style={styles.headerRight} />
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
              <TouchableOpacity>
                <Text style={styles.moreIcon}>⋮</Text>
              </TouchableOpacity>
            </View>

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
                {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
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
              
              <TouchableOpacity style={styles.actionBtn}>
                <Image source={ASSETS.greenShare} resizeMode='contain' style={styles.actionImage} />
                <Text style={styles.actionBtnText}>Share</Text>
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
  headerRight: { width: 30 },
  
  // Post Card
  postCard: { backgroundColor: '#FFF', marginTop: 10, paddingVertical: 15, marginBottom: 5 },
  postHeader: { flexDirection: 'row', paddingHorizontal: 25, alignItems: 'center', marginBottom: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },
  headerInfo: { flex: 1, marginLeft: 10 },
  userName: { fontWeight: '900', fontSize: 16 },
  location: { color: '#666', fontSize: 10 },
  moreIcon: { fontSize: 20, color: '#666' },
  postCaption: { paddingHorizontal: 25, marginBottom: 10, fontSize: 14, lineHeight: 20 },
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
    justifyContent: 'center' 
  },
  actionBtnText: { color: '#0E713E', fontWeight: 'bold', fontSize: 12 },
  actionBtnTextActive: { color: '#FF6B6B' },
  actionImage: { width: 16, height: 16, marginRight: 5, resizeMode: 'contain', tintColor: '#0E713E' },
  actionImageActive: { tintColor: '#FF6B6B' },
  
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
});

export default PostDetailScreen;