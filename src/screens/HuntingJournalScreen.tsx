import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { useHuntingJournal } from '../hooks/useHuntingJournal';
import { useAppSelector } from '../app/store/hooks';
import { useFriends } from '../hooks/useFriends';
import { API_BASE_URL } from '../constants/config';
import axios from 'axios';

const ASSETS = {
  backIcon: require('../../assets/back_white.png'),
  searchIcon: require('../../assets/search_icon.png'),
  locationIcon: require('../../assets/location_green.png'),
  weatherIcon: require('../../assets/weather_sun.png'),
  moreIcon: require('../../assets/more_vert.png'),
  addNoteIcon: require('../../assets/add_note_icon.png'),
  closeIcon: require('../../assets/close_icon.png'),
  iconCheck: require('./../../assets/accept_icon.png'), // Added from your assets
};

const getFullImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace('./public/uploads/', '').replace('public/uploads/', '');
  return `${API_BASE_URL}/public/uploads/${cleanPath}`;
};

// --- NEW SINGLE-SELECT SHARE MODAL ---
const ShareJournalModal = ({ visible, onClose, onShareConfirm, journalId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    friends, 
    isLoading: friendsLoading, 
    getFriends,
    currentUserId 
  } = useFriends();

  useEffect(() => {
    if (visible && currentUserId) {
      loadFriends();
    }
  }, [visible, currentUserId]);

  const loadFriends = async () => {
    setIsLoading(true);
    try {
      await getFriends(currentUserId);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedUserId) {
      onShareConfirm(journalId, selectedUserId);
      setSelectedUserId(null);
      onClose();
    }
  };

  const filteredFriends = friends.filter(friend => {
    const searchLower = searchQuery.toLowerCase();
    return (friend.displayname || friend.username || '').toLowerCase().includes(searchLower) ||
           (friend.email || '').toLowerCase().includes(searchLower);
  });

  const renderFriendItem = ({ item }) => {
    const isSelected = selectedUserId === item.id;
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => setSelectedUserId(isSelected ? null : item.id)}
      >
        <View style={styles.friendInfo}>
          <View style={styles.profileCircle}>
            {item.profilePhoto ? (
              <Image 
                source={{ uri: getFullImageUrl(item.profilePhoto) || undefined }} 
                style={styles.profileImage} 
              />
            ) : (
              <Text style={styles.profileInitial}>
                {(item.displayname || item.username || 'U').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.displayname || item.username}</Text>
            <Text style={styles.friendEmail}>{item.email || ''}</Text>
          </View>
        </View>
        {isSelected && (
          <Image source={ASSETS.iconCheck} style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, styles.tagModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Share Journal Entry</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Image source={ASSETS.closeIcon} style={styles.modalCloseIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.tagSearchContainer}>
            <Image source={ASSETS.searchIcon} style={styles.searchIcon} />
            <TextInput
              style={styles.tagSearchInput}
              placeholder="Search friends..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {(friendsLoading || isLoading) && friends.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0E713E" />
              <Text style={styles.loadingText}>Loading friends...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderFriendItem}
              contentContainerStyle={styles.friendsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? `No friends found matching "${searchQuery}"` : 'No friends available'}
                  </Text>
                </View>
              }
            />
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalConfirmButton, !selectedUserId && styles.disabledButton]}
              onPress={handleConfirm}
              disabled={!selectedUserId}
            >
              <Text style={styles.modalConfirmButtonText}>Share Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- JOURNAL CARD COMPONENT ---
const JournalEntry = ({
  id,
  title,
  date,
  description,
  location,
  weather,
  shareCount = 0,
  isSharedView,
  onEdit,
  onDelete,
  onShare,
  onShareDelete,
  activeMenu,
  onToggleMenu,
  onCloseMenu,
}: {
  id: number;
  title: string;
  date: string;
  description: string;
  location: string;
  weather: string;
  shareCount?: number;
  isSharedView: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onShare: (id: number) => void;
  onShareDelete: (id: number) => void;
  activeMenu: number | null;
  onToggleMenu: (id: number) => void;
  onCloseMenu: () => void;
}) => {
  const isMenuVisible = activeMenu === id;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <TouchableOpacity
      onPress={() => {
        if (!isSharedView && onEdit) {
          onEdit(id);
        }
        onCloseMenu(); // ✅ Close menu when card is pressed
      }} 
      disabled={isSharedView}
    >
      <View style={[styles.entryCard, { zIndex: id }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardBody}>
            <Text style={styles.entryTitle}>{title || 'Untitled'}</Text>
            <Text style={styles.entryDate}>
              {formatDate(date)}{' '}
              <Text style={styles.entryDescSnippet}>
                {description?.length > 50 ? description.substring(0, 50) + '...' : description || ''}
              </Text>
            </Text>
          </View>

          <View style={{ position: 'relative', zIndex: 999 }}>
            <TouchableOpacity onPress={() => onToggleMenu(id)}>
              <Image source={ASSETS.moreIcon} style={styles.moreIcon} />
            </TouchableOpacity>

            {isMenuVisible && (
              <View style={styles.dropdown}>
                {!isSharedView ? (
                  <>
                    {/* <TouchableOpacity 
                      style={styles.dropdownItem} 
                      onPress={() => {
                        onToggleMenu(id);
                        onEdit(id);
                      }}
                    >
                      <Text style={styles.dropdownText}>Edit</Text>
                    </TouchableOpacity> */}

                    <View style={styles.dropdownDivider} />

                    <TouchableOpacity 
                      style={styles.dropdownItem} 
                      onPress={() => {
                        onToggleMenu(id);
                        onShare(id);
                      }}
                    >
                      <Text style={styles.dropdownText}>Share</Text>
                    </TouchableOpacity>

                    <View style={styles.dropdownDivider} />

                    <TouchableOpacity 
                      style={styles.dropdownItem} 
                      onPress={() => {
                        onToggleMenu(id);
                        onDelete(id);
                      }}
                    >
                      <Text style={styles.dropdownText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.dropdownItem}>
                    <TouchableOpacity 
                      style={styles.dropdownItem} 
                      onPress={() => {onToggleMenu(id);onShareDelete(id);}}
                    >
                      <Text style={styles.dropdownText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  // <></>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Image source={ASSETS.locationIcon} style={styles.footerIcon} />
            <Text style={styles.footerText}>{location || 'Unknown Location'}</Text>
          </View>
          <View style={styles.footerItem}>
            <Image source={ASSETS.weatherIcon} style={styles.footerIcon} />
            <Text style={styles.footerText}>{weather || 'Not specified'}</Text>
          </View>
          {!isSharedView && shareCount > 0 && (
            <View style={styles.footerItem}>
              <Text style={[styles.footerText, { color: '#0E713E', fontWeight: 'bold' }]}>Shared: {shareCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- MAIN SCREEN ---
const HuntingJournalScreen = () => {
  const navigation = useNavigation<any>();
  const { user, token } = useAppSelector((state) => state.auth);
  const {
    journals = [],
    isLoading,
    getMyJournals,
    deleteJournal,
    shareJournal,
    getSharedWithMeJournals,
  } = useHuntingJournal();

  const [activeTab, setActiveTab] = useState<'mine' | 'shared'>('mine');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [groupedJournals, setGroupedJournals] = useState<{ [key: string]: any[] }>({});
  const [tabSwitchLoading, setTabSwitchLoading] = useState(false);
  
  // Modal tracking states
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);

  const handleCloseMenu = () => {
    setActiveMenu(null);
  };

  useEffect(() => {
    // Close menu when component unmounts or tab changes
    return () => {
      setActiveMenu(null);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadJournals();
      }
    }, [user?.id, activeTab])
  );

  const loadJournals = async () => {
    try {
      if (activeTab === 'mine') {
        await getMyJournals(1, 100);
      } else {
        await getSharedWithMeJournals(1, 100);
      }
    } catch (error) {
      console.error('Error loading journals:', error);
    } finally {
      setTabSwitchLoading(false); 
    }
  };

  const handleTabChange = (tab: 'mine' | 'shared') => {
    if (tab !== activeTab) {
      setTabSwitchLoading(true);
      setGroupedJournals({});
      setActiveTab(tab);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJournals();
    setRefreshing(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleToggleMenu = (id: number) => {
    setActiveMenu(prev => (prev === id ? null : id));
  };

  const handleEdit = (id: number) => {
    const journal = journals.find(j => j?.id === id);
    navigation.navigate('NewNote', { journal });
  };

  const handleShareTrigger = (id: number) => {
    setSelectedJournalId(id);
    setIsShareModalVisible(true);
  };

  const handleExecuteShare = async (journalId: number, friendId: number) => {
    try {
      await shareJournal(journalId, friendId);
      Alert.alert('Success', 'Journal entry shared successfully!');
      loadJournals();
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to share journal entry');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Journal',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournal(id);
              loadJournals();
              Alert.alert('Success', 'Journal entry deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete journal');
            }
          },
        },
      ]
    );
  };

  const filterJournals = (journal: any) => {
    if (!searchQuery) return true;
    return (
      journal?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journal?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journal?.location?.locationText?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const groupByMonth = (journalsList: any[]) => {
    if (!journalsList || journalsList.length === 0) return {};
    const grouped: { [key: string]: any[] } = {};
    
    journalsList.filter(filterJournals).forEach((journal) => {
      if (!journal) return;
      const date = new Date(journal.date || journal.createdAt);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(journal);
    });
    return grouped;
  };

  const handleRemoveShared = (id: number) => {
    Alert.alert(
      'Remove Shared Entry',
      'Are you sure you want to remove this shared entry from your list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `${API_BASE_URL}/hunting-journal/${id}/share`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              loadJournals(); // Reload the UI to instantly wipe the card element
              Alert.alert('Removed', 'Shared journal entry removed from your view.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove shared entry');
            }
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    if (!tabSwitchLoading && journals && journals.length > 0) {
      setGroupedJournals(groupByMonth(journals));
    } else {
      setGroupedJournals({});
    }
  }, [journals, searchQuery, activeTab, tabSwitchLoading]);

  const showLoadingInList = tabSwitchLoading || (isLoading && journals.length === 0);
  const hasFilteredResults = Object.keys(groupedJournals).length > 0;

  return (
    <TouchableWithoutFeedback
      onPress={handleCloseMenu}
      accessible={false}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={ASSETS.backIcon} style={styles.headerIcon} />
              <Text style={styles.headerTitle}>Hunting Journal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.searchToggleButton}
              onPress={() => {
                setShowSearch(!showSearch);
                if (!showSearch) setSearchQuery('');
              }}
            >
              <Image source={ASSETS.searchIcon} style={styles.headerSearchIcon} />
            </TouchableOpacity>
          </View>

          {showSearch && (
            <View style={styles.searchContainer}>
              <Image source={ASSETS.searchIcon} style={styles.inlineSearchIcon} />
              <TextInput
                placeholder="Search journals..."
                placeholderTextColor="#999"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch}>
                  <Image source={ASSETS.closeIcon} style={styles.clearIcon} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* TABS CONTAINER */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'mine' && styles.activeTabButton]} 
              onPress={() => handleTabChange('mine')}
            >
              <Text style={[styles.tabText, activeTab === 'mine' && styles.activeTabText]}>My Journals</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'shared' && styles.activeTabButton]} 
              onPress={() => handleTabChange('shared')}
            >
              <Text style={[styles.tabText, activeTab === 'shared' && styles.activeTabText]}>Shared With Me</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
          }
          onScrollBeginDrag={handleCloseMenu}
        >
          {showLoadingInList ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0E713E" />
              <Text style={styles.loadingText}>Loading journals...</Text>
            </View>
          ) : journals && journals.length > 0 ? (
            hasFilteredResults ? (
              Object.entries(groupedJournals).map(([month, monthJournals]) => (
                <View key={month}>
                  <Text style={styles.sectionTitle}>{month}</Text>
                  {monthJournals.map((journal) => (
                    <JournalEntry
                      key={journal?.id?.toString() || Math.random().toString()}
                      id={journal?.id || 0}
                      title={journal?.title || 'Untitled'}
                      date={journal?.date || journal?.createdAt || new Date().toISOString()}
                      description={journal?.description || ''}
                      location={journal?.location?.locationText || 'Unknown Location'}
                      weather={journal?.weather || 'Not specified'}
                      shareCount={journal?.shareCount}
                      isSharedView={activeTab === 'shared'}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onShare={handleShareTrigger}
                      onShareDelete={handleRemoveShared}
                      activeMenu={activeMenu}
                      onToggleMenu={handleToggleMenu}
                      onCloseMenu={handleCloseMenu}
                    />
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Image source={ASSETS.searchIcon} style={[styles.emptyIcon, { tintColor: '#CCC' }]} />
                <Text style={styles.emptyText}>No entries found</Text>
              </View>
            )
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'mine' ? 'No journal entries yet' : 'No shared journals found'}
              </Text>
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FLOATING BOTTOM BAR */}
        <View style={styles.bottomBar}>
          <Text style={styles.notesCount}>{journals?.length || 0} Notes</Text>
          {activeTab === 'mine' && (
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('NewNote')}>
              <Image source={ASSETS.addNoteIcon} style={styles.addIcon} />
            </TouchableOpacity>
          )}
        </View>

        {/* SHARE MODAL ATTACHMENT */}
        <ShareJournalModal
          visible={isShareModalVisible}
          journalId={selectedJournalId}
          onClose={() => {
            setIsShareModalVisible(false);
            setSelectedJournalId(null);
          }}
          onShareConfirm={handleExecuteShare}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

// --- STYLES INTEGRATION ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFAF0' },
  header: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 25 : 50
  },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { width: 20, height: 20, marginRight: 10, resizeMode: 'contain', tintColor: '#FFF' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, marginTop: 10 },
  searchToggleButton: { padding: 8 },
  headerSearchIcon: { width: 20, height: 20, tintColor: '#FFF', resizeMode: 'contain' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 30, alignItems: 'center', paddingHorizontal: 15, height: 45, marginBottom: 15 },
  inlineSearchIcon: { width: 18, height: 18, tintColor: '#999', marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#000' },
  clearIcon: { width: 18, height: 18, tintColor: '#999' },
  tabContainer: { flexDirection: 'row', marginBottom: 15, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 3 },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
  activeTabButton: { backgroundColor: '#FFF' },
  tabText: { color: '#BAE6CE', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#0E713E' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  entryCard: { backgroundColor: '#AACEBC', borderRadius: 12, paddingVertical: 20, paddingHorizontal: 20, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  cardBody: { flex: 1, paddingRight: 20 },
  entryTitle: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  entryDate: { fontSize: 11, color: '#333', marginTop: 2 },
  entryDescSnippet: { fontWeight: '400', color: '#555' },
  moreIcon: { width: 20, height: 20, tintColor: '#000', resizeMode: 'contain' },
  dropdown: { position: 'absolute', top: 25, right: 0, backgroundColor: '#0E713E', borderRadius: 10, width: 130, zIndex: 999, elevation: 5 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16 },
  dropdownText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  dropdownDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap' },
  footerItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20, marginVertical: 5 },
  footerIcon: { width: 14, height: 14, marginRight: 5 },
  footerText: { fontSize: 11, color: '#333' },
  bottomBar: { position: 'absolute', bottom: 0, width: '100%', height: 80, backgroundColor: 'rgba(14, 113, 62, 0.9)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  notesCount: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  addButton: { position: 'absolute', right: 20 },
  addIcon: { width: 24, height: 24 },
  emptyContainer: { alignItems: 'center', paddingTop: 50 },
  emptyIcon: { width: 40, height: 40, marginBottom: 15 },
  emptyText: { fontSize: 16, color: '#999', marginBottom: 8 },
  
  // --- POPUP MODAL STYLES ADDED FROM CREATE POST ---
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  tagModalContent: { height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalCloseButton: { padding: 4 },
  modalCloseIcon: { width: 24, height: 24, tintColor: '#333' },
  tagSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', margin: 16, paddingHorizontal: 12, borderRadius: 8 },
  searchIcon: { width: 20, height: 20, marginRight: 8, tintColor: '#666' },
  tagSearchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#333' },
  friendsList: { paddingHorizontal: 16, paddingBottom: 16 },
  friendItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  friendItemSelected: { backgroundColor: '#F0F9F4', borderRadius: 8, paddingHorizontal: 12 },
  friendInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profileCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4D3626', justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
  profileImage: { width: 44, height: 44, borderRadius: 22 },
  profileInitial: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
  friendDetails: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: '500', color: '#333' },
  friendEmail: { fontSize: 13, color: '#666', marginTop: 2 },
  checkIcon: { width: 24, height: 24, tintColor: '#0E713E' },
  modalFooter: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  modalCancelButton: { flex: 1, padding: 12, marginRight: 8, borderRadius: 8, backgroundColor: '#F5F5F5', alignItems: 'center' },
  modalCancelButtonText: { color: '#666', fontSize: 16, fontWeight: '500' },
  modalConfirmButton: { flex: 2, padding: 12, marginLeft: 8, borderRadius: 8, backgroundColor: '#0E713E', alignItems: 'center' },
  modalConfirmButtonText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  disabledButton: { backgroundColor: '#A0C4B0' },
});

export default HuntingJournalScreen;