import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBlock } from '../hooks/useBlock';
import { API_BASE_URL } from '../constants/config';

const getFullImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  return `${API_BASE_URL}/uploads/${cleanPath}`;
};

const BlockedUsersScreen = () => {
  const navigation = useNavigation<any>();
  const {
    blockedUsers,
    isLoading,
    pagination,
    getBlockedUsers,
    unblockUser,
  } = useBlock();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async (page: number = 1) => {
    try {
      await getBlockedUsers(page, 10);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBlockedUsers(1);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || !pagination.hasMore) return;
    setLoadingMore(true);
    await loadBlockedUsers(pagination.page + 1);
    setLoadingMore(false);
  };

  const handleUnblock = (userId: number, userName: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: async () => {
            try {
              await unblockUser(userId);
              Alert.alert('Success', `${userName} has been unblocked`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unblock user');
            }
          },
        },
      ]
    );
  };

  const renderBlockedUser = ({ item }: { item: any }) => {
    const blockedUser = item.blocked;
    const userAvatar = blockedUser?.profilePhoto ? getFullImageUrl(blockedUser.profilePhoto) : null;
    
    return (
      <View style={styles.blockedItem}>
        <View style={styles.userInfo}>
          <Image 
            source={userAvatar ? { uri: userAvatar } : require('../../assets/circle_profile.png')} 
            style={styles.avatar} 
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{blockedUser?.displayname || blockedUser?.username}</Text>
            <Text style={styles.userEmail}>{blockedUser?.email}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.unblockButton}
          onPress={() => handleUnblock(blockedUser?.id, blockedUser?.displayname || blockedUser?.username)}
        >
          <Text style={styles.unblockButtonText}>Unblock</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No blocked users</Text>
      <Text style={styles.emptySubtext}>Users you block will appear here</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0E713E" />
      </View>
    );
  };

  if (isLoading && blockedUsers.length === 0) {
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
          <Image source={require('../../assets/back_white.png')} style={styles.headerIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={blockedUsers}
        renderItem={renderBlockedUser}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: 60,
    backgroundColor: '#0E713E', 
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    fontSize: 16,
    fontWeight: '900',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  blockedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
  },
  unblockButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unblockButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#CCC',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default BlockedUsersScreen;