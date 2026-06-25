import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useHuntingJournal } from '../hooks/useHuntingJournal';
import Geolocation from '@react-native-community/geolocation';

const ASSETS = {
  backIcon: require('../../assets/back_white.png'),
  moreIcon: require('../../assets/more_vert_black.png'),
  locationIcon: require('../../assets/location_green.png'),
  weatherIcon: require('../../assets/weather_icon.png'),
  deleteIcon: require('../../assets/delete_icon.png'),
  saveIcon: require('../../assets/save_note_icon.png'),
  trashIconRed: require('../../assets/trash_red.png'),
};

// Google Weather API configuration (same as TopHeader)
const GOOGLE_WEATHER_API_KEY = 'AIzaSyDfERDiOAjbLmRs1XZYleJhmr7GJQ6lPaM';

const NewNoteScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { createJournal, updateJournal, deleteJournal } = useHuntingJournal();
  
  const journalParam = route.params?.journal;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weather, setWeather] = useState('');
  const [locationText, setLocationText] = useState('');
  
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const isEditing = !!journalParam;

  // -------------------------------
  // GET LOCATION NAME (OpenStreetMap) 
  // Same as TopHeader
  // -------------------------------
  const getLocationName = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://us1.locationiq.com/v1/reverse?key=pk.eb856481a602e04547d84550365ccece&lat=${lat}&lon=${lon}&format=json`
      );

      const data = await res.json();
      const a = data?.address || {};

      const city =
        a.city || a.town || a.village || a.suburb || a.county || '';

      const country = a.country || '';

      const locationName =
        city && country
          ? `${city}, ${country}`
          : data?.display_name || 'Unknown';

      setLocationText(locationName);
      return locationName;
    } catch (error) {
      console.warn('Failed to get location name:', error);
      setLocationText('Unknown Location');
      return 'Unknown Location';
    }
  };

  // -------------------------------
  // GOOGLE WEATHER (Same as TopHeader)
  // Returns temperature in Fahrenheit
  // -------------------------------
  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      setLoadingWeather(true);

      const url =
        `https://weather.googleapis.com/v1/currentConditions:lookup` +
        `?key=${GOOGLE_WEATHER_API_KEY}` +
        `&location.latitude=${lat}` +
        `&location.longitude=${lon}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error('Weather API failed');

      // Get temperature in Celsius from API
      const tempC = data?.temperature?.degrees ?? 0;
      // Convert to Fahrenheit
      const tempF = Math.round((tempC * 9) / 5 + 32);
      
      // Get weather condition from the API response
      const condition = data?.condition || 'Clear';

      // Format: "Clouds with temp : 72°F" - No icon code
      const formattedWeatherString = `${condition} with temp : ${tempF}°F`;
      
      setWeather(formattedWeatherString);
    } catch (error) {
      console.warn('Failed to fetch weather:', error);
      setWeather('Clear with temp : 72°F'); // Fallback structure with Fahrenheit
    } finally {
      setLoadingWeather(false);
    }
  };

  // -------------------------------
  // MAIN LOCATION & WEATHER FLOW
  // -------------------------------
  const getLocationAndWeather = () => {
    setLoadingWeather(true);

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);

        // Fetch both location name and weather in parallel
        await Promise.all([
          getLocationName(latitude, longitude),
          fetchWeatherData(latitude, longitude)
        ]);
      },
      (error) => {
        console.warn('Could not get GPS location:', error.message);
        setLoadingWeather(false);
        // Set fallback values with Fahrenheit
        setLocationText('Location unavailable');
        setWeather('Clear with temp : 72°F');
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    if (journalParam) {
      // Editing existing journal
      setTitle(journalParam.title || '');
      setDescription(journalParam.description || '');
      setWeather(journalParam.weather || '');
      setLocationText(journalParam.location?.locationText || '');
      setLatitude(journalParam.location?.latitude ?? null);
      setLongitude(journalParam.location?.longitude ?? null);
    } else {
      // New journal - fetch current location and weather
      getLocationAndWeather();
    }
  }, [journalParam]);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }

    setIsSaving(true);
    
    const journalData = {
      title: title.trim(),
      description: description.trim(),
      weather: weather.trim(),
      date: new Date().toISOString(),
      location: {
        locationText: locationText.trim() || 'Unknown Location',
        latitude: latitude ?? 0,   
        longitude: longitude ?? 0, 
      },
    };

    try {
      if (isEditing) {
        await updateJournal({ id: journalParam.id, ...journalData });
        Alert.alert('Success', 'Journal updated successfully');
      } else {
        await createJournal(journalData);
        Alert.alert('Success', 'Journal created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save journal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteModalVisible(false);
    setIsSaving(true);
    
    try {
      await deleteJournal(journalParam.id);
      Alert.alert('Success', 'Journal deleted successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete journal');
    } finally {
      setIsSaving(false);
    }
  };

  // Manual refresh for location and weather
  const handleRefreshWeather = () => {
    if (!isEditing && latitude && longitude) {
      fetchWeatherData(latitude, longitude);
      getLocationName(latitude, longitude);
    } else if (!isEditing) {
      getLocationAndWeather();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
          <Image source={ASSETS.backIcon} style={styles.iconBack} />
          <Text style={styles.headerTitle}>Hunting Journal</Text>
        </TouchableOpacity>
        {!isEditing && !loadingWeather && (
          <TouchableOpacity onPress={handleRefreshWeather} style={styles.refreshButton}>
            <Text style={styles.refreshText}>⟳</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          placeholderTextColor="#6D6A5B"
          value={title}
          onChangeText={setTitle}
          editable={!isSaving}
        />

        <TextInput
          style={styles.descriptionInput}
          placeholder="Description"
          placeholderTextColor="#6D6A5B"
          multiline
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
          editable={!isSaving}
        />

        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.weatherInput, { flex: 1 }]}
            placeholder="Weather configuration fetching..."
            placeholderTextColor="#6D6A5B"
            value={weather}
            onChangeText={setWeather}
            editable={!isSaving && !loadingWeather}
          />
          {loadingWeather && <ActivityIndicator size="small" color="#0E713E" style={{ marginRight: 10 }} />}
        </View>

        <TextInput
          style={styles.locationInput}
          placeholder="Location Name"
          placeholderTextColor="#6D6A5B"
          value={locationText}
          onChangeText={setLocationText}
          editable={!isSaving}
        />

        <View style={styles.dataContainer}>
          <View style={styles.dataRow}>
            <Image source={ASSETS.locationIcon} style={styles.dataIcon} />
            <View>
              <Text style={styles.dataText}>{locationText || 'Loading location...'}</Text>
              {latitude !== null && longitude !== null && (
                <Text style={styles.coordsText}>
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.dataRow}>
            <Image source={ASSETS.weatherIcon} style={styles.dataIcon} />
            <Text style={styles.dataText}>{weather || 'Loading weather...'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* --- FOOTER ACTIONS --- */}
      <View style={styles.footer}>
        {isEditing && (
          <TouchableOpacity onPress={() => setDeleteModalVisible(true)} disabled={isSaving}>
            <Image source={ASSETS.deleteIcon} style={styles.footerIcon} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={{marginLeft: 'auto'}} onPress={handleSave} disabled={isSaving || loadingWeather}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#0E713E" />
          ) : (
            <Image source={ASSETS.saveIcon} style={styles.footerIcon} />
          )}
        </TouchableOpacity>
      </View>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Image source={ASSETS.trashIconRed} style={styles.modalTrashIcon} />
              <Text style={styles.modalTitle}>
                Delete {title || 'this note'}?
              </Text>
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.modalMessage}>
              Are you sure you want to delete this journal entry?
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.confirmDeleteButton} 
                onPress={handleDelete}
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFAF0',
  },
  header: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 50 : 75,
    paddingBottom: 25,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between'
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBack: { width: 22, height: 22, marginRight: 15, resizeMode: 'contain' },
  iconMore: { width: 20, height: 20, resizeMode: 'contain' },
  refreshButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  refreshText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: { paddingHorizontal: 25, paddingTop: 10 },
  titleInput: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 20, padding: 0 },
  descriptionInput: { fontSize: 14, color: '#6D6A5B', minHeight: 100, marginBottom: 15, padding: 0 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 0, borderColor: '#eee' },
  weatherInput: { fontSize: 14, color: '#6D6A5B', padding: 0, display: 'none' },
  locationInput: { fontSize: 14, color: '#6D6A5B', marginBottom: 15, padding: 0, display: 'none' },
  dataContainer: { marginTop: 10 },
  dataRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dataIcon: { width: 18, height: 18, marginRight: 15, resizeMode: 'contain' },
  dataText: { fontSize: 10, color: '#333', fontWeight: '500' },
  coordsText: { fontSize: 9, color: '#777', marginTop: 2 },
  footer: { flexDirection: 'row', paddingHorizontal: 25, paddingVertical: 25, backgroundColor: '#FFFFFF' },
  footerIcon: { width: 24, height: 24, tintColor: '#0E713E', resizeMode: 'contain' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 113, 62, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTrashIcon: {
    width: 16,
    height: 16,
    marginRight: 10,
    resizeMode: 'contain',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 25,
  },
  modalMessage: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
    lineHeight: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  cancelButton: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#4A321F',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#4A321F',
    fontWeight: 'bold',
  },
  confirmDeleteButton: {
    flex: 1,
    height: 45,
    backgroundColor: '#4A321F',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default NewNoteScreen;