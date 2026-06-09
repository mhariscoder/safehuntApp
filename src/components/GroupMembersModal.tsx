import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import {
  getGroupMembers,
  updateMemberStatus,
  removeMember,
} from '../store/groups/groupsActions';
import { API_BASE_URL } from '../constants/config';

const getFullImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  return `${API_BASE_URL}/public/uploads/${cleanPath}`;
};

interface GroupMembersModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
  currentUserId?: number;
  isAdmin?: boolean;
}

const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  visible,
  onClose,
  groupId,
  groupName,
  currentUserId,
  isAdmin = false,
}) => {
  const dispatch = useAppDispatch();
  const { groupMembers, isLoading } = useAppSelector((state) => state.groups);
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
  const [refreshing, setRefreshing] = useState(false);

  const loadMembers = async () => {
    await dispatch(getGroupMembers(groupId));
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

  const members = groupMembers.filter(m => m.status === 'approved');
  const pendingRequests = groupMembers.filter(m => m.status === 'pending');

  const renderMemberItem = ({ item }: { item: any }) => {
    const member = item.member;
    const isCurrentUser = member?.id === currentUserId;
    const avatarUrl = member?.profilePhoto ? getFullImageUrl(member.profilePhoto) : null;

    return (
      <View style={styles.memberItem}>
        <Image
          source={avatarUrl ? { uri: avatarUrl } : require('../../assets/circle_profile.png')}
          style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member?.displayname || member?.username || 'User'}</Text>
          <Text style={styles.memberType}>{item.type === 'Admin' ? 'Admin' : 'Member'}</Text>
        </View>
        {isAdmin && !isCurrentUser && item.type !== 'Admin' && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item.memberId, member?.displayname || 'this member')}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    const member = item.member;
    const avatarUrl = member?.profilePhoto ? getFullImageUrl(member.profilePhoto) : null;

    return (
      <View style={styles.requestItem}>
        <Image
          source={avatarUrl ? { uri: avatarUrl } : require('../../assets/circle_profile.png')}
          style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member?.displayname || member?.username || 'User'}</Text>
          <Text style={styles.requestDate}>
            Requested to join
          </Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(item.memberId)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectRequest(item.memberId)}
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
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Group Members</Text>
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
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
            }
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 30,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0E713E',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#0E713E',
    fontWeight: '600',
  },
  badge: {
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
  badgeText: {
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
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  memberInfo: {
    flex: 1,
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
});

export default GroupMembersModal;