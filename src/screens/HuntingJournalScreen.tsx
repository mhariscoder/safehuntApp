import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useHuntingJournal } from '../hooks/useHuntingJournal';
import { useAppSelector } from '../app/store/hooks';

const ASSETS = {
  backIcon: require('../../assets/back_white.png'),
  searchIcon: require('../../assets/search_icon.png'),
  locationIcon: require('../../assets/location_green.png'),
  weatherIcon: require('../../assets/weather_sun.png'),
  moreIcon: require('../../assets/more_vert.png'),
  addNoteIcon: require('../../assets/add_note_icon.png'),
  closeIcon: require('../../assets/close_icon.png'), // Added close asset path
};

const JournalEntry = ({
  id,
  title,
  date,
  description,
  location,
  weather,
  onEdit,
  onDelete,
  activeMenu,
  onToggleMenu,
}: {
  id: number;
  title: string;
  date: string;
  description: string;
  location: string;
  weather: string;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  activeMenu: number | null;
  onToggleMenu: (id: number) => void;
}) => {
  const isMenuVisible = activeMenu === id;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <View style={styles.entryCard}>
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

        <View style={{ position: 'relative' }}>
          <TouchableOpacity onPress={() => onToggleMenu(id)}>
            <Image source={ASSETS.moreIcon} style={styles.moreIcon} />
          </TouchableOpacity>

          {isMenuVisible && (
            <View style={styles.dropdown}>
              <TouchableOpacity 
                style={styles.dropdownItem} 
                onPress={() => {
                  onToggleMenu(id);
                  onEdit(id);
                }}
              >
                <Text style={styles.dropdownText}>Edit</Text>
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
      </View>
    </View>
  );
};

const HuntingJournalScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);
  const {
    journals = [],
    isLoading,
    getMyJournals,
    deleteJournal,
  } = useHuntingJournal();

  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false); // Toggle visibility state
  const [refreshing, setRefreshing] = useState(false);
  const [groupedJournals, setGroupedJournals] = useState<{ [key: string]: any[] }>({});

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadJournals();
      }
    }, [user?.id])
  );

  const loadJournals = async () => {
    try {
      await getMyJournals(1, 100);
    } catch (error) {
      console.error('Error loading journals:', error);
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

  React.useEffect(() => {
    if (journals && journals.length > 0) {
      setGroupedJournals(groupByMonth(journals));
    } else {
      setGroupedJournals({});
    }
  }, [journals, searchQuery]);

  // Log journals to debug
  React.useEffect(() => {
    console.log('Journals data:', JSON.stringify(journals, null, 2));
  }, [journals]);

  const showLoadingInList = isLoading && journals.length === 0;
  const hasFilteredResults = Object.keys(groupedJournals).length > 0;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Image source={ASSETS.backIcon} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Hunting Journal</Text>
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
            <Image source={ASSETS.searchIcon} style={styles.headerSearchIcon} />
          </TouchableOpacity>
        </View>

        {/* CONDITIONALLY RENDERED SEARCH INPUT */}
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
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0E713E"]} />
        }
      >
        {showLoadingInList ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0E713E" />
            <Text style={styles.loadingText}>Loading your journals...</Text>
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    activeMenu={activeMenu}
                    onToggleMenu={handleToggleMenu}
                  />
                ))}
              </View>
            ))
          ) : (
            /* FALLBACK FOR NO FILTER MATCHES */
            <View style={styles.emptyContainer}>
              <Image source={ASSETS.searchIcon} style={[styles.emptyIcon, { tintColor: '#CCC' }]} />
              <Text style={styles.emptyText}>No entries found</Text>
              <Text style={styles.emptySubtext}>
                No results matching "{searchQuery}"
              </Text>
            </View>
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No journal entries yet</Text>
            <Text style={styles.emptySubtext}>
              Start documenting your hunting adventures!
            </Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FLOATING BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <Text style={styles.notesCount}>{journals?.length || 0} Notes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('NewNote')}>
          <Image source={ASSETS.addNoteIcon} style={styles.addIcon} />
        </TouchableOpacity>
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
    paddingTop: Platform.OS === 'android' ? 0 : 50
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
  loadingContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 50 
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    marginTop: 10,
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
    backgroundColor: '#FFF',
    borderRadius: 30,
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 45,
    marginTop: 5,
    marginBottom: 15,
  },
  inlineSearchIcon: {
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  entryCard: {
    backgroundColor: '#AACEBC',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  cardBody: {
    flex: 1,
    paddingRight: 20,
  },
  entryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  entryDate: {
    fontSize: 8,
    color: '#333',
    marginTop: 2,
  },
  entryDescSnippet: {
    fontWeight: '400',
    color: '#555',
  },
  moreIcon: {
    width: 4,
    height: 20,
    tintColor: '#000',
    resizeMode: 'contain',
  },
  dropdown: {
    position: 'absolute',
    top: 25,
    right: 0,
    backgroundColor: '#0E713E',
    borderRadius: 10,
    width: 130,
    zIndex: 999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
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
  cardFooter: {
    flexDirection: 'row',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  footerIcon: {
    width: 14,
    height: 14,
    marginRight: 5,
  },
  footerText: {
    fontSize: 8,
    color: '#333',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 60,
    backgroundColor: 'rgba(14, 113, 62, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  notesCount: {
    color: '#004925',
    fontSize: 8,
    fontWeight: '500',
  },
  addButton: {
    position: 'absolute',
    right: 20,
  },
  addIcon: {
    width: 24,
    height: 24,
  },
  emptyContainer: { alignItems: 'center', paddingTop: 50 },
  emptyIcon: { width: 40, height: 40, marginBottom: 15 },
  emptyText: { fontSize: 16, color: '#999', marginBottom: 8 },
  emptySubtext: { fontSize: 12, color: '#CCC', textAlign: 'center' },
});

export default HuntingJournalScreen;