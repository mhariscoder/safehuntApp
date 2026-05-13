import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';

const ASSETS = {
  backIcon: require('../../assets/back_white.png'),
  searchIcon: require('../../assets/search_icon.png'),
  locationIcon: require('../../assets/location_green.png'),
  weatherIcon: require('../../assets/weather_sun.png'),
  moreIcon: require('../../assets/more_vert.png'),
  addNoteIcon: require('../../assets/add_note_icon.png'),
};

const JournalEntry = ({
  id,
  title,
  date,
  description,
  location,
  temp,
  activeMenu,
  onToggleMenu,
}: {
  id: string;
  title: string;
  date: string;
  description: string;
  location: string;
  temp: string;
  activeMenu: string | null;
  onToggleMenu: (id: string) => void;
}) => {
  const isMenuVisible = activeMenu === id;

  return (
    <View style={styles.entryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardBody}>
          <Text style={styles.entryTitle}>{title}</Text>

          <Text style={styles.entryDate}>
            {date}{' '}
            <Text style={styles.entryDescSnippet}>
              {description}
            </Text>
          </Text>
        </View>

        <View style={{ position: 'relative' }}>
          <TouchableOpacity onPress={() => onToggleMenu(id)}>
            <Image source={ASSETS.moreIcon} style={styles.moreIcon} />
          </TouchableOpacity>

          {isMenuVisible && (
            <View style={styles.dropdown}>
              <TouchableOpacity style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>Share</Text>
              </TouchableOpacity>

              <View style={styles.dropdownDivider} />

              <TouchableOpacity style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Image source={ASSETS.locationIcon} style={styles.footerIcon} />
          <Text style={styles.footerText}>{location}</Text>
        </View>

        <View style={styles.footerItem}>
          <Image source={ASSETS.weatherIcon} style={styles.footerIcon} />
          <Text style={styles.footerText}>{temp}</Text>
        </View>
      </View>
    </View>
  );
};

const HuntingJournalScreen = () => {
  const navigation = useNavigation<any>();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleToggleMenu = (id: string) => {
    setActiveMenu(prev => (prev === id ? null : id));
  };

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
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Hunting Journal</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#999"
            style={styles.searchInput}
          />

          <TouchableOpacity style={styles.searchButton}>
            <Image source={ASSETS.searchIcon} style={styles.searchIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Previous 30 Days</Text>

        {[1, 2, 3].map(id => (
          <JournalEntry
            key={`30d-${id}`}
            id={`30d-${id}`}
            title="Deer Season"
            date="28/03/24"
            description="Lorem ipsum dolor sit amet..."
            location="Sierra National Forest"
            temp="31°"
            activeMenu={activeMenu}
            onToggleMenu={handleToggleMenu}
          />
        ))}

        <Text style={styles.sectionTitle}>January</Text>

        {[1, 2].map(id => (
          <JournalEntry
            key={`jan-${id}`}
            id={`jan-${id}`}
            title="Deer Season"
            date="28/03/24"
            description="Lorem ipsum dolor sit amet..."
            location="Sierra National Forest"
            temp="31°"
            activeMenu={activeMenu}
            onToggleMenu={handleToggleMenu}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FLOATING BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <Text style={styles.notesCount}>14 Notes</Text>

        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('NewNote')}>
          <Image source={ASSETS.addNoteIcon} style={styles.addIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },

  header: {
    backgroundColor: '#0E713E',
    padding: 25,
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
  },

  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },

  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 30,
    alignItems: 'center',
    paddingLeft: 20,
    height: 45,
  },

  searchInput: {
    flex: 1,
    fontSize: 10,
    color: '#000',
  },

  searchButton: {
    padding: 10,
    marginRight: 5,
  },

  searchIcon: {
    width: 20,
    height: 20,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
});

export default HuntingJournalScreen;