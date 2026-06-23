import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../hooks/useNotifications';
import BottomTabNav from '../components/BottomTabNav';
import { API_BASE_URL } from '../constants/config';

const { width } = Dimensions.get('window');

// Helper function to get full image URL
const getFullImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  return `${API_BASE_URL}/uploads/${cleanPath}`;
};

// Map notification type to icon
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'postLike':
      return require('../../assets/heart_icon.png');
    case 'postComment':
      return require('../../assets/comment_icon.png');
    case 'friendRequest':
      return require('../../assets/friend_icon.png');
    default:
      return require('../../assets/bell_icon.png');
  }
};

// Format time ago
const formatTimeAgo = (dateString: string) => {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

// Get notification text based on type
const getNotificationText = (notification: any) => {
  const { type, title, description } = notification;
  
  switch (type) {
    case 'postLike':
      return {
        user: title?.split(' liked')[0] || 'Someone',
        action: 'liked your post',
        fullText: description || `${title?.split(' liked')[0]} liked your post`
      };
    case 'postComment':
      if (description?.includes('replied')) {
        return {
          user: title?.split(' replied')[0] || 'Someone',
          action: 'replied to your comment',
          fullText: description
        };
      } else if (description?.includes('commented')) {
        return {
          user: title?.split(' commented')[0] || 'Someone',
          action: 'commented on your post',
          fullText: description
        };
      } else if (description?.includes('liked your comment')) {
        return {
          user: title?.split(' liked')[0] || 'Someone',
          action: 'liked your comment',
          fullText: description
        };
      } else {
        return {
          user: title?.split(' ')[0] || 'Someone',
          action: title || description,
          fullText: description || title
        };
      }
    case 'friendRequest':
      return {
        user: title?.split(' ')[0] || 'Someone',
        action: 'sent you a friend request',
        fullText: description || `${title} sent you a friend request`
      };
    default:
      return {
        user: title?.split(' ')[0] || 'Someone',
        action: title || description,
        fullText: description || title
      };
  }
};

const NotificationScreen = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markNotificationAsRead,
    refreshNotifications,
    currentUserId,
  } = useNotifications();

  useEffect(() => {
    if (currentUserId) {
      refreshNotifications();
    }
  }, [currentUserId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    
    if (notification.postId && notification.postId !== 'null') {
      navigation.navigate('PostDetail', { postId: notification.postId });
    }

    if (notification.type === 'friendRequest') {
      navigation.navigate('Friends');
    }
  };

  // Filter notifications based on search query
  const filteredNotifications = notifications.filter(notification => {
    const searchLower = searchQuery.toLowerCase();
    const notificationText = getNotificationText(notification);
    return (
      notificationText.user.toLowerCase().includes(searchLower) ||
      notificationText.action.toLowerCase().includes(searchLower) ||
      notificationText.fullText.toLowerCase().includes(searchLower) ||
      notification.type?.toLowerCase().includes(searchLower)
    );
  });

  const renderNotification = (item: any) => {
    const notificationText = getNotificationText(item);
    const isUnread = !item.isRead;
    const avatarUrl = getFullImageUrl(item.sender?.profilePhoto);
    
    return (
      <TouchableOpacity 
        key={item.id} 
        style={[styles.notificationItem, isUnread && styles.unreadBackground]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={avatarUrl ? { uri: avatarUrl } : require('../../assets/circle_profile.png')} 
            style={styles.avatar} 
          />
          <View style={styles.typeIconBadge}>
            <Image 
              source={getNotificationIcon(item.type)} 
              style={styles.typeIcon} 
            />
          </View>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.notificationText}>
            <Text style={styles.userName}>{notificationText.user} </Text>
            {notificationText.action}
          </Text>
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  // if (isLoading && notifications.length === 0) {
  //   return (
  //     <View style={styles.container}>
  //       <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
  //       <View style={styles.header}>
  //         <TouchableOpacity 
  //           style={styles.backButton}
  //           onPress={() => navigation.goBack()}
  //         >
  //           <Image source={require('../../assets/back_white.png')} style={styles.headerIcon} />
  //           <Text style={styles.headerTitle}>Notifications</Text>
  //         </TouchableOpacity>
          
  //         <TouchableOpacity 
  //           style={styles.searchToggleButton}
  //           onPress={() => setShowSearch(!showSearch)}
  //         >
  //           <Image source={require('../../assets/search_icon.png')} style={styles.headerSearchIcon} />
  //         </TouchableOpacity>
  //       </View>
  //       <View style={styles.centerContainer}>
  //         <ActivityIndicator size="large" color="#0E713E" />
  //       </View>
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image source={require('../../assets/back_white.png')} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.searchToggleButton}
            onPress={() => {
              setShowSearch(!showSearch);
              if (!showSearch) {
                setSearchQuery('');
              }
            }}
          >
            <Image source={require('../../assets/search_icon.png')} style={styles.headerSearchIcon} />
          </TouchableOpacity>
        </View>
        
        {/* --- SEARCH INPUT --- */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Image source={require('../../assets/search_icon.png')} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notifications..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Image source={require('../../assets/close_icon.png')} style={styles.clearIcon} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* --- NOTIFICATION LIST --- */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
        }
      >
        {/* Count Display */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredNotifications.length} {filteredNotifications.length === 1 ? 'Notification' : 'Notifications'}
          </Text>
          {unreadCount > 0 && !showSearch && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadCount} unread</Text>
            </View>
          )}
        </View>

        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(renderNotification)
        ) : (
          <View style={styles.emptyContainer}>
            <Image 
              source={require('../../assets/bell_icon.png')} 
              style={styles.emptyIcon} 
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No notifications found' : 'No notifications yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? `No results matching "${searchQuery}"` 
                : 'When you receive notifications, they will appear here'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* --- BOTTOM NAVIGATION --- */}
      <View style={styles.bottomTabContainer}>
        <BottomTabNav activeTab="Notifications" />
      </View>
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
    paddingTop: Platform.OS === 'android' ? 25 : 50
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
  searchToggleButton: {
    padding: 8,
  },
  headerSearchIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFF',
    resizeMode: 'contain',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    marginTop: 5,
    marginBottom: 25
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: '#999',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  clearIcon: {
    width: 18,
    height: 18,
    tintColor: '#999',
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 10,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  unreadCountBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadCountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2DDBE',
    alignItems: 'center',
  },
  unreadBackground: {
    backgroundColor: '#AACEBC',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 1,
    borderColor: '#0E713E',
  },
  typeIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0E713E',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  typeIcon: {
    width: 10,
    height: 10,
    tintColor: '#FFF',
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  notificationText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  userName: {
    fontWeight: '900',
  },
  timeText: {
    fontSize: 10,
    color: '#6D6A5B',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0E713E',
    marginLeft: 10,
  },
  bottomTabContainer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 30,
    height: 30,
    tintColor: '#CCC',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationScreen;