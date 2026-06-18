import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios'; // ✅ Added Axios for network requests
import { useFriends } from '../hooks/useFriends';
import { useGroups } from '../hooks/useGroups';
import { useAppSelector } from '../app/store/hooks';
import BottomTabNav from '../components/BottomTabNav';
import { API_BASE_URL } from '../constants/config';

const { width } = Dimensions.get('window');

const getFullImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  return `${API_BASE_URL}/public/uploads/${cleanPath}`;
};

// ✅ Define an interface matching your NestJS messageService.getInbox response structure
interface RecentChat {
  id: string;
  user: {
    id: number;
    displayname: string;
    profilePhoto?: string;
  };
  lastMessage: string;
  messageType: 'text' | 'image' | 'file';
  timestamp: string;
  unreadCount: number;
  isUnread: boolean;
}

type TabType = 'recent' | 'people' | 'groups';

const MessageScreen = () => {
  const navigation = useNavigation<any>();
  const { user, token } = useAppSelector((state) => state.auth); // ✅ Grab token from auth slice
  const {
    friends,
    isLoading: friendsLoading,
    getFriends,
    currentUserId,
  } = useFriends();

  const {
    groups,
    isLoading: groupsLoading,
    getAllGroups,
    addMember,
  } = useGroups();

  const [recentChats, setRecentChats] = useState<RecentChat[]>([]); // ✅ State managing actual API response
  const [recentChatsLoading, setRecentChatsLoading] = useState(false); // ✅ Loader for inbox tab
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [refreshing, setRefreshing] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        loadData();
      }
    }, [currentUserId, activeTab])
  );

  const fetchRecentChatsFromApi = async () => {
    if (!token) return;
    try {
      if (recentChats.length === 0) setRecentChatsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/inbox`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ Crucial Fix: extract the embedded array from your envelope response structure
      if (response.data && Array.isArray(response.data.data)) {
        setRecentChats(response.data.data);
      } else {
        setRecentChats([]);
      }
    } catch (error) {
      console.error('Error fetching inbox items from backend:', error);
      setRecentChats([]); // Fallback to clear loading states
    } finally {
      setRecentChatsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      if (activeTab === 'recent') {
        await fetchRecentChatsFromApi(); // ✅ Fetch real history when on the recent tab
      } else if (activeTab === 'people') {
        await getFriends(currentUserId!);
      } else if (activeTab === 'groups') {
        await getAllGroups();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleRecentChatPress = (userId: number, displayname: string) => {
    // Navigates directly into details with active recipient parameters
    navigation.navigate('MessageDetail', { userId, displayname });
  };

  const handleFriendPress = (userId: number, displayname: string) => {
    navigation.navigate('MessageDetail', { userId, displayname });
  };

  const handleGroupPress = (groupId: number, groupName: string, groupLogo?: string, groupCover?: string, groupDescription?: string) => {
    navigation.navigate('GroupPosts', { 
      groupId, 
      groupName,
      groupLogo,
      groupCover,
      groupDescription
    });
  };

  const handleJoinGroup = async (groupId: number, groupName: string) => {
    if (!currentUserId) {
      Alert.alert('Error', 'Please login to join groups');
      return;
    }

    Alert.alert(
      'Join Group',
      `Are you sure you want to request to join "${groupName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            setJoiningGroupId(groupId);
            try {
              await addMember({
                groupId: groupId,
                memberId: currentUserId,
                type: 'Member'
              });
              Alert.alert('Success', 'Join request sent to group admin');
              await getAllGroups();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to join group');
            } finally {
              setJoiningGroupId(null);
            }
          }
        }
      ]
    );
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  // ✅ Maps custom queries across dynamic inbox users and messages
  // ✅ Safe check to ensure recentChats is an array before filtering
  const filteredRecentChats = Array.isArray(recentChats) 
    ? recentChats.filter(chat => {
        // Use optional chaining everywhere to prevent deep property crashes
        const searchLower = searchQuery?.toLowerCase() || '';
        const displayName = chat?.user?.displayname || '';
        const msg = chat?.lastMessage || '';
        
        return displayName.toLowerCase().includes(searchLower) || 
              msg.toLowerCase().includes(searchLower);
      })
    : []; // Fallback to an empty array if it's not ready or not an array

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend => {
    const searchLower = searchQuery.toLowerCase();
    return (friend.displayname || friend.username || '').toLowerCase().includes(searchLower) ||
           (friend.email || '').toLowerCase().includes(searchLower);
  });

  // Filter groups based on search query
  const filteredGroups = groups.filter(group => {
    const searchLower = searchQuery.toLowerCase();
    return (group.name || '').toLowerCase().includes(searchLower) ||
           (group.description || '').toLowerCase().includes(searchLower);
  });

  // ✅ Helper method to structure date parameters safely in list rows
  const formatChatTime = (timestampString: string) => {
    try {
      const date = new Date(timestampString);
      if (isNaN(date.getTime())) return '';
      
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const renderRecentChats = () => {
    if (recentChatsLoading && recentChats.length === 0) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0E713E" />
        </View>
      );
    }

    if (filteredRecentChats.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? `No recent chats matching "${searchQuery}"` : 'No recent chats'}
          </Text>
        </View>
      );
    }

    return (
      <>
        {filteredRecentChats.map((chat, index) => {
          const receiverName = chat.user?.displayname || 'Unknown User';
          const profilePic = chat.user?.profilePhoto;
          
          // Safely extract the raw string or format structural attachments
          const displayMessage = chat.messageType === 'text' ? (chat.lastMessage || '') : `📁 Attached ${chat.messageType || 'file'}`;
          
          // Generate a safe fallback key if list rows lack unique matching markers
          const itemKey = chat.user?.id ? chat.user.id.toString() : `chat-${index}`;
          const numericUserId = chat.user?.id ? parseInt(chat.user.id, 10) : 0;

          return (
            <TouchableOpacity 
              key={itemKey} 
              style={[styles.chatItem, chat.isUnread && styles.unreadChatBackground]}
              onPress={() => handleRecentChatPress(numericUserId, receiverName)}
            >
              <View style={styles.avatarWrapper}>
                <Image 
                  source={profilePic ? { uri: getFullImageUrl(profilePic)! } : require('../../assets/circle_profile.png')} 
                  style={styles.avatar} 
                />
              </View>
              
              <View style={styles.textContainer}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{receiverName}</Text>
                  <Text style={styles.timeText}>{formatChatTime(chat.timestamp)}</Text>
                </View>
                <View style={styles.messageRow}>
                  <Text style={styles.messageText} numberOfLines={1}>
                    {displayMessage}
                  </Text>
                  {chat.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{chat.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  const renderPeopleTab = () => {
    if (friendsLoading && friends.length === 0) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0E713E" />
        </View>
      );
    }

    if (filteredFriends.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? `No people found matching "${searchQuery}"` : 'No friends yet'}
          </Text>
          {!searchQuery && (
            <Text style={styles.emptySubtext}>Add friends to start chatting</Text>
          )}
        </View>
      );
    }

    return (
      <>
        {filteredFriends.map((friend: any) => (
          <TouchableOpacity 
            key={friend.id} 
            style={styles.chatItem}
            onPress={() => handleFriendPress(parseInt(friend.id), friend.displayname || friend.username)}
          >
            <View style={styles.avatarWrapper}>
              <Image 
                source={friend.profilePhoto ? { uri: getFullImageUrl(friend.profilePhoto)! } : require('../../assets/circle_profile.png')} 
                style={styles.avatar} 
              />
            </View>
            
            <View style={styles.textContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{friend.displayname || friend.username}</Text>
              </View>
              <View style={styles.messageRow}>
                <Text style={styles.messageText} numberOfLines={1}>
                  Tap to start conversation
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const renderGroupsTab = () => {
    if (groupsLoading && groups.length === 0) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0E713E" />
        </View>
      );
    }

    if (filteredGroups.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? `No groups found matching "${searchQuery}"` : 'No groups yet'}
          </Text>
          {!searchQuery && (
            <Text style={styles.emptySubtext}>Join or create groups to start group chats</Text>
          )}
        </View>
      );
    }

    return (
      <>
        {filteredGroups.map((group: any) => {
          const isMember = group.status === 'Joined';
          const isPending = group.status === 'Pending';
          const isNotMember = group.status === 'Not a Member';
          
          return (
            <TouchableOpacity 
              key={group.id} 
              style={styles.groupCard}
              activeOpacity={isMember ? 0.7 : 1}
              onPress={() => {
                if (isMember) {
                  handleGroupPress(group.id, group.name, group.logo, group.cover, group.description);
                }
              }}
            >
              <View style={styles.groupHeader}>
                <View style={styles.groupAvatarWrapper}>
                  <Image 
                    source={group.logo ? { uri: getFullImageUrl(group.logo)! } : require('../../assets/group_avatar.png')} 
                    style={[styles.groupAvatar, !isMember && styles.disabledAvatar]} 
                  />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupName, !isMember && styles.disabledText]}>
                    {group.name}
                  </Text>
                  {isPending && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                  )}
                  {isMember && (
                    <View style={styles.memberBadge}>
                      <Text style={styles.memberBadgeText}>Member</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <Text style={[styles.groupDescription, !isMember && styles.disabledText]} numberOfLines={2}>
                {group.description || 'No description available'}
              </Text>
              
              {isNotMember && (
                <TouchableOpacity 
                  style={styles.joinButton}
                  onPress={() => handleJoinGroup(group.id, group.name)}
                  disabled={joiningGroupId === group.id}
                >
                  {joiningGroupId === group.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.joinButtonText}>Join Group</Text>
                  )}
                </TouchableOpacity>
              )}
              
              {isPending && (
                <View style={styles.pendingContainer}>
                  <Text style={styles.pendingText}>Request sent to admin</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  const getTabCount = () => {
    switch (activeTab) {
      case 'recent':
        return filteredRecentChats.length;
      case 'people':
        return filteredFriends.length;
      case 'groups':
        return filteredGroups.length;
      default:
        return 0;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'recent':
        return renderRecentChats();
      case 'people':
        return renderPeopleTab();
      case 'groups':
        return renderGroupsTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Message</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.searchToggleButton}
              onPress={() => {
                setShowSearch(!showSearch);
                if (!showSearch) {
                  setSearchQuery('');
                }
              }}
            >
              <Image 
                source={require('../../assets/search_icon.png')} 
                style={styles.headerSearchIcon} 
              />
            </TouchableOpacity>
            {activeTab === 'groups' && (
              <TouchableOpacity style={styles.addButton} onPress={handleCreateGroup}>
                <Image 
                  source={require('../../assets/plus_icon.png')} 
                  style={styles.addIcon} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* --- SEARCH INPUT --- */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <Image source={require('../../assets/search_icon.png')} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab === 'recent' ? 'chats' : activeTab === 'people' ? 'people' : 'groups'}...`}
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

      {/* --- CHAT FILTER TABS --- */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'recent' ? styles.activeTab : styles.inactiveTab]}
          onPress={() => {
            setActiveTab('recent');
            setSearchQuery('');
          }}
        >
          <Text style={activeTab === 'recent' ? styles.activeTabText : styles.inactiveTabText}>
            Recent Chats
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'people' ? styles.activeTab : styles.inactiveTab]}
          onPress={() => {
            setActiveTab('people');
            setSearchQuery('');
          }}
        >
          <Text style={activeTab === 'people' ? styles.activeTabText : styles.inactiveTabText}>
            People
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'groups' ? styles.activeTab : styles.inactiveTab]}
          onPress={() => {
            setActiveTab('groups');
            setSearchQuery('');
          }}
        >
          <Text style={activeTab === 'groups' ? styles.activeTabText : styles.inactiveTabText}>
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- RESULTS COUNT --- */}
      {showSearch && searchQuery.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            Found {getTabCount()} {getTabCount() === 1 ? 'result' : 'results'} for "{searchQuery}"
          </Text>
        </View>
      )}

      {/* --- MESSAGE LIST --- */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
        }
      >
        {renderContent()}
      </ScrollView>

      {/* --- BOTTOM NAVIGATION --- */}
      <View style={styles.bottomNavContainer}>
        <BottomTabNav activeTab="Messages" />
      </View>
    </View>
  );
};

// Styles remain unchanged
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    width: 18,
    height: 18,
    tintColor: '#4D3626',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    marginTop: 5,
    marginBottom: 15,
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
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 5,
  },
  countText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 25,
    justifyContent: 'space-between',
    gap: 10,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
    position: 'relative',
    flex: 1
  },
  activeTab: {
    backgroundColor: '#0E713E',
  },
  inactiveTab: {
    backgroundColor: '#4D3626',
  },
  activeTabText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  inactiveTabText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '400',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  groupCard: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupAvatarWrapper: {
    marginRight: 15,
  },
  groupAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 1,
    borderColor: '#0E713E',
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  groupDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    lineHeight: 16,
  },
  unreadChatBackground: {
    backgroundColor: '#AACEBC',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 1,
    borderColor: '#0E713E',
  },
  disabledAvatar: {
    opacity: 0.6,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  disabledText: {
    opacity: 0.5,
  },
  timeText: {
    fontSize: 10,
    color: '#6D6A5B',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 10,
    color: '#6D6A5B',
    flex: 0.9,
  },
  unreadBadge: {
    backgroundColor: '#0E713E',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  pendingBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pendingBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
  memberBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  memberBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingContainer: {
    marginTop: 8,
  },
  pendingText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '500',
  },
  loaderContainer: {
    paddingTop: 50,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#CCC',
    textAlign: 'center',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
  },
});

export default MessageScreen;