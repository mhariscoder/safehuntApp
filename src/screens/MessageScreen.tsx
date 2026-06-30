// MessageScreen.js - Updated with profile image/letter logic and admin functionality
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
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useFriends } from '../hooks/useFriends';
import { useGroups } from '../hooks/useGroups';
import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import BottomTabNav from '../components/BottomTabNav';
import { API_BASE_URL } from '../constants/config';
import {
  getGroupMembers,
  updateMemberStatus,
  removeMember,
} from '../features/groups/groupsActions';

const { width } = Dimensions.get('window');

const getFullImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  return `${API_BASE_URL}/public/uploads/${cleanPath}`;
};

// Avatar component that shows image or first letter
const Avatar = ({ imagePath, name, size = 65, textSize = 24 }) => {
  const imageUrl = getFullImageUrl(imagePath);
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  if (imageUrl) {
    return (
      <Image 
        source={{ uri: imageUrl }} 
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} 
      />
    );
  }

  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: textSize }]}>{initial}</Text>
    </View>
  );
};

// Admin Management Modal Component
const AdminManagementModal = ({ 
  visible, 
  onClose, 
  groupId, 
  groupName, 
  currentUserId, 
  isAdmin,
  onDeleteGroup 
}) => {
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

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to permanently delete "${groupName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteGroup(groupId);
              Alert.alert('Success', 'Group deleted successfully');
              onClose();
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to delete group');
            }
          }
        }
      ]
    );
  };

  const members = groupMembers?.filter(m => m.status === 'approved') || [];
  const pendingRequests = groupMembers?.filter(m => m.status === 'pending') || [];

  const renderMemberItem = ({ item }) => {
    const member = item.member || item;
    const memberId = item.memberId || member?.id;
    const isCurrentUser = memberId === currentUserId;
    const avatarUrl = member?.profilePhoto ? getFullImageUrl(member.profilePhoto) : null;

    return (
      <View style={styles.memberItem}>
        <Avatar 
          imagePath={member?.profilePhoto}
          name={member?.displayname || member?.username || 'User'}
          size={50}
          textSize={18}
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

  const renderRequestItem = ({ item }) => {
    const member = item.member || item;
    const memberId = item.memberId || member?.id;

    return (
      <View style={styles.requestItem}>
        <Avatar 
          imagePath={member?.profilePhoto}
          name={member?.displayname || member?.username || 'User'}
          size={50}
          textSize={18}
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
    <View style={styles.modalEmptyContainer}>
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
          <Text style={styles.modalTitleFull}>Manage {groupName}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.modalTabContainer}>
          <TouchableOpacity
            style={[styles.modalTab, activeTab === 'members' && styles.modalActiveTab]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.modalTabText, activeTab === 'members' && styles.modalActiveTabText]}>
              Members ({members.length})
            </Text>
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity
              style={[styles.modalTab, activeTab === 'requests' && styles.modalActiveTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.modalTabText, activeTab === 'requests' && styles.modalActiveTabText]}>
                Requests ({pendingRequests.length})
              </Text>
              {pendingRequests.length > 0 && (
                <View style={styles.modalBadge}>
                  <Text style={styles.modalBadgeText}>{pendingRequests.length}</Text>
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
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
            }
            contentContainerStyle={styles.modalListContent}
          >
            {activeTab === 'members' 
              ? members.map((item, index) => renderMemberItem({ item, index }))
              : pendingRequests.map((item, index) => renderRequestItem({ item, index }))
            }
            {((activeTab === 'members' && members.length === 0) || 
              (activeTab === 'requests' && pendingRequests.length === 0)) && 
              renderEmptyState()
            }
            
            {/* Delete Group Button - Only for admins */}
            {isAdmin && (
              <TouchableOpacity
                style={styles.deleteGroupButton}
                onPress={handleDeleteGroup}
              >
                <Text style={styles.deleteGroupButtonText}>🗑 Delete Group</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

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
  const { user, token } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
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
    deleteGroup,
  } = useGroups();

  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [recentChatsLoading, setRecentChatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [refreshing, setRefreshing] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Admin Management States
  const [isAdminModalVisible, setIsAdminModalVisible] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

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

      if (response.data && Array.isArray(response.data.data)) {
        setRecentChats(response.data.data);
      } else {
        setRecentChats([]);
      }
    } catch (error) {
      console.error('Error fetching inbox items from backend:', error);
      setRecentChats([]);
    } finally {
      setRecentChatsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      if (activeTab === 'recent') {
        await fetchRecentChatsFromApi();
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

  const handleRecentChatPress = (userId: number, displayname: string, profilePic: string) => {
    console.log('{ userId, displayname, profilePic }', { userId, displayname, profilePic })
    navigation.navigate('MessageDetail', { userId, displayname, profilePic });
  };

  const handleFriendPress = (userId: number, displayname: string, profilePic: string) => {
    console.log('{ userId, displayname, profilePic }', { userId, displayname, profilePic })
    navigation.navigate('MessageDetail', { userId, displayname, profilePic });
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

  const checkUserAdminStatus = async (groupId: number) => {
    try {
      const result = await dispatch(getGroupMembers(groupId)).unwrap();
      let membersArray = result;
      if (result && result.members) {
        membersArray = result.members;
      }
      
      const currentMember = membersArray.find((m: any) => {
        const memberId = m.memberId || m.member?.id;
        return memberId === currentUserId;
      });
      
      return currentMember?.type === 'Admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const handleManageGroup = async (groupId: number, groupName: string) => {
    setSelectedGroupId(groupId);
    setSelectedGroupName(groupName);
    const isUserAdmin = await checkUserAdminStatus(groupId);
    setIsAdmin(isUserAdmin);
    if (isUserAdmin) {
      setIsAdminModalVisible(true);
    } else {
      Alert.alert('Access Denied', 'Only group admins can manage members');
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      await deleteGroup(groupId);
      await getAllGroups(); // Refresh the groups list
    } catch (error: any) {
      throw error;
    }
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

  const filteredRecentChats = Array.isArray(recentChats) 
    ? recentChats.filter(chat => {
        const searchLower = searchQuery?.toLowerCase() || '';
        const displayName = chat?.user?.displayname || '';
        const msg = chat?.lastMessage || '';
        
        return displayName.toLowerCase().includes(searchLower) || 
              msg.toLowerCase().includes(searchLower);
      })
    : [];

  const filteredFriends = friends.filter(friend => {
    const searchLower = searchQuery.toLowerCase();
    return (friend.displayname || friend.username || '').toLowerCase().includes(searchLower) ||
           (friend.email || '').toLowerCase().includes(searchLower);
  });

  const filteredGroups = groups.filter(group => {
    const searchLower = searchQuery.toLowerCase();
    return (group.name || '').toLowerCase().includes(searchLower) ||
           (group.description || '').toLowerCase().includes(searchLower);
  });

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
          const numericUserId = chat.user?.id ? parseInt(chat.user.id, 10) : 0;

          return (
            <TouchableOpacity 
              key={chat.user?.id ? chat.user.id.toString() : `chat-${index}`} 
              style={[styles.chatItem, chat.isUnread && styles.unreadChatBackground]}
              onPress={() => handleRecentChatPress(numericUserId, receiverName, profilePic)}
            >
              <Avatar 
                imagePath={profilePic} 
                name={receiverName}
                size={65}
                textSize={24}
              />
              
              <View style={styles.textContainer}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{receiverName}</Text>
                  <Text style={styles.timeText}>{formatChatTime(chat.timestamp)}</Text>
                </View>
                <View style={styles.messageRow}>
                  <Text style={styles.messageText} numberOfLines={1}>
                    {chat.messageType === 'text' ? (chat.lastMessage || '') : `📁 Attached ${chat.messageType || 'file'}`}
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
            onPress={() => handleFriendPress(parseInt(friend.id), friend.displayname || friend.username, friend.profilePhoto)}
          >
            <Avatar 
              imagePath={friend.profilePhoto} 
              name={friend.displayname || friend.username}
              size={65}
              textSize={24}
            />
            
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
            <View key={group.id} style={styles.groupCard}>
              <TouchableOpacity 
                activeOpacity={isMember ? 0.7 : 1}
                onPress={() => {
                  if (isMember) {
                    handleGroupPress(group.id, group.name, group.logo, group.cover, group.description);
                  }
                }}
              >
                <View style={styles.groupHeader}>
                  <View style={styles.groupAvatarWrapper}>
                    {group.logo ? (
                      <Image 
                        source={{ uri: getFullImageUrl(group.logo)! }} 
                        style={[styles.groupAvatar, !isMember && styles.disabledAvatar]} 
                      />
                    ) : (
                      <View style={[styles.groupAvatarPlaceholder, !isMember && styles.disabledAvatar]}>
                        <Text style={styles.groupAvatarText}>
                          {group.name?.charAt(0)?.toUpperCase() || 'G'}
                        </Text>
                      </View>
                    )}
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
              </TouchableOpacity>
              
              {/* Group Action Buttons */}
              <View style={styles.groupActions}>
                {isMember && (
                  <TouchableOpacity 
                    style={styles.manageButton}
                    onPress={() => handleManageGroup(group.id, group.name)}
                  >
                    <Text style={styles.manageButtonText}>Manage</Text>
                  </TouchableOpacity>
                )}
                
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
              </View>
            </View>
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

      {/* --- Admin Management Modal --- */}
      <AdminManagementModal
        visible={isAdminModalVisible}
        onClose={() => {
          setIsAdminModalVisible(false);
          setSelectedGroupId(null);
          setSelectedGroupName('');
        }}
        groupId={selectedGroupId}
        groupName={selectedGroupName}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onDeleteGroup={handleDeleteGroup}
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
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 1,
    borderColor: '#0E713E',
  },
  avatarPlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#0E713E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0E713E',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  groupAvatarPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#0E713E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0E713E',
  },
  groupAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
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
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    flexWrap: 'wrap',
    gap: 10,
  },
  manageButton: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  manageButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  unreadChatBackground: {
    backgroundColor: '#AACEBC',
  },
  disabledAvatar: {
    opacity: 0.6,
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
    marginTop: 5,
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
  // Admin Modal Styles (preserved from original design)
  modalContainerFull: {
    flex: 1,
    backgroundColor: '#FFF',
  },
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
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#0E713E',
  },
  modalTitleFull: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 30,
  },
  modalTabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'relative',
  },
  modalActiveTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0E713E',
  },
  modalTabText: {
    fontSize: 14,
    color: '#666',
  },
  modalActiveTabText: {
    color: '#0E713E',
    fontWeight: '600',
  },
  modalBadge: {
    position: 'absolute',
    top: 8,
    right: 20,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  modalBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 15,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  memberType: {
    fontSize: 12,
    color: '#0E713E',
  },
  requestDate: {
    fontSize: 12,
    color: '#666',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  acceptButton: {
    backgroundColor: '#0E713E',
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  rejectButtonText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  removeButtonText: {
    color: '#FF6B6B',
    fontSize: 12,
  },
  deleteGroupButton: {
    backgroundColor: '#FF6B6B',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  deleteGroupButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalListContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalEmptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
});

export default MessageScreen;