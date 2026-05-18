import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFriends } from '../hooks/useFriends';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ASSETS = {
  iconBack: require('../../assets/back_white.png'),
  iconSearch: require('../../assets/search_icon.png'),
  profilePic: require('../../assets/friend.png'),
  friendsIcon: require('../../assets/friends_icon_white.png'),
  messageIcon: require('../../assets/message_icon_white.png'),
  moreIcon: require('../../assets/more_dots_grey.png'),
  acceptIcon: require('../../assets/accept_icon.png'),
  declineIcon: require('../../assets/decline_icon.png'),
  searchIcon: require('../../assets/search_icon.png'),
};

const FriendsScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'
  
  const {
    friends,
    pendingRequests,
    isLoading,
    getFriends,
    getPendingRequests,
    acceptFriendRequest,
    declineFriendRequest,
    unfriend,
    currentUserId,
  } = useFriends();

  useEffect(() => {
    if (currentUserId) {
      loadData();
    }
  }, [currentUserId]);

  const loadData = async () => {
    try {
      console.log('Loading data for user:', currentUserId);
      const friendsResult = await getFriends(currentUserId!);
      console.log('Friends API Response:', JSON.stringify(friendsResult, null, 2));
      
      const requestsResult = await getPendingRequests();
      console.log('Requests API Response:', JSON.stringify(requestsResult, null, 2));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAccept = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept request');
    }
  };

  const handleDecline = async (requestId: number) => {
    try {
      await declineFriendRequest(requestId);
      Alert.alert('Success', 'Friend request declined');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline request');
    }
  };

  const handleUnfriend = (friendId: number, friendName: string) => {
    Alert.alert(
      'Unfriend',
      `Are you sure you want to unfriend ${friendName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: async () => {
            try {
              await unfriend(friendId);
              Alert.alert('Success', 'Friend removed');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unfriend');
            }
          },
        },
      ]
    );
  };

  const filteredFriends = friends.filter(friend => 
    friend.displayname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriendCard = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.friendCard}
      onPress={() => navigation.navigate('Profile', { userId: item.id })}
    >
      <Image 
        source={item.profilePhoto ? { uri: item.profilePhoto } : ASSETS.profilePic} 
        style={styles.friendImage} 
      />
      <View style={styles.friendLabel}>
        <Text style={styles.friendName} numberOfLines={1}>
          {item.displayname || item.username}
        </Text>
        <TouchableOpacity 
          style={styles.unfriendButton}
          onPress={() => handleUnfriend(parseInt(item.id), item.displayname || item.username)}
        >
          <Text style={styles.unfriendText}>Unfriend</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderRequestCard = ({ item }: any) => (
    <View style={styles.requestCard}>
      <Image 
        source={item.requester?.profilePhoto ? { uri: item.requester.profilePhoto } : ASSETS.profilePic} 
        style={styles.requestImage} 
      />
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>
          {item.requester?.displayname || item.requester?.username}
        </Text>
        <Text style={styles.requestEmail} numberOfLines={1}>
          {item.requester?.email}
        </Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAccept(item.id)}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.declineButton}
          onPress={() => handleDecline(item.id)}
        >
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && friends.length === 0 && pendingRequests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image source={ASSETS.iconBack} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Friends</Text>
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Image source={ASSETS.searchIcon} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
        }
      >
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends ({friends.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Requests ({pendingRequests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'friends' ? (
          <View style={styles.friendsGrid}>
            {filteredFriends.length > 0 ? (
              filteredFriends.map((item) => (
                <View key={item.id}>
                  {renderFriendCard({ item })}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No friends found' : 'No friends yet'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.requestsContainer}>
            {pendingRequests.length > 0 ? (
              pendingRequests.map((item) => (
                <View key={item.id}>
                  {renderRequestCard({ item })}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No pending friend requests</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  header: {
    // height: 120,
    backgroundColor: '#0E713E',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 25,
    paddingBottom: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0E713E',
    paddingHorizontal: 25
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginRight: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFF',
  },
  tabText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  friendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 25,
    justifyContent: 'space-between',
  },
  friendCard: {
    width: (width - 75) / 2,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  friendImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  friendLabel: {
    padding: 12,
    alignItems: 'center',
  },
  friendName: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  unfriendButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  unfriendText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  requestsContainer: {
    padding: 25,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
  },
  requestImage: {
    width: 55,
    height: 55,
    borderRadius: 28,
    marginRight: 15,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  requestEmail: {
    fontSize: 12,
    color: '#666',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  acceptText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  declineText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default FriendsScreen;