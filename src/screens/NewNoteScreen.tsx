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
  backIcon: require('../../assets/back_black.png'),
  moreIcon: require('../../assets/more_vert_black.png'),
  locationIcon: require('../../assets/location_green.png'),
  weatherIcon: require('../../assets/weather_icon.png'),
  deleteIcon: require('../../assets/delete_icon.png'),
  saveIcon: require('../../assets/save_note_icon.png'),
  trashIconRed: require('../../assets/trash_red.png'),
};

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

  // Helper function to fetch weather and format it exactly like your payload format
  const fetchLiveWeatherPayload = async (lat: number, lon: number) => {
    try {
      setLoadingWeather(true);
      const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HuntingApp/1.0 (contact: [email protected])',
        },
      });

      const data = await response.json();
      const current = data.properties.timeseries[0];
      
      // 1. Get raw numeric temperature value
      const rawTemp = Math.round(current.data.instant.details.air_temperature);
      
      // 2. Get symbol code (e.g., "cloudy" or "partlycloudy_day")
      const symbolCode = current.data.next_1_hours?.summary?.symbol_code || 'clearsky_day';
      
      // 3. Extract the icon suffix code name (e.g., "04n", "01d")
      // MET Norway symbols often end with parts like _day, _night, or raw numbers
      let iconCode = '01d'; 
      if (symbolCode.includes('cloud')) iconCode = '04n';
      else if (symbolCode.includes('rain')) iconCode = '09d';
      else if (symbolCode.includes('snow')) iconCode = '13d';
      else if (symbolCode.includes('clear')) iconCode = '01d';

      // 4. Transform string token words to matching visual summaries (e.g., "partlycloudy_day" -> "Clouds")
      let conditionText = 'Clear';
      if (symbolCode.toLowerCase().includes('cloud')) conditionText = 'Clouds';
      else if (symbolCode.toLowerCase().includes('rain')) conditionText = 'Rain';
      else if (symbolCode.toLowerCase().includes('snow')) conditionText = 'Snow';

      // FORMAT RECONSTRUCTION MATCHING: "Clouds with temp : 2°,04n"
      const formattedWeatherString = `${conditionText} with temp : ${rawTemp}°,${iconCode}`;
      setWeather(formattedWeatherString);
    } catch (error) {
      console.warn("Failed to generate custom weather payload format string:", error);
      setWeather('Clear with temp : 0°,01d'); // Fallback structure safety match
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    if (journalParam) {
      setTitle(journalParam.title || '');
      setDescription(journalParam.description || '');
      setWeather(journalParam.weather || '');
      setLocationText(journalParam.location?.locationText || '');
      setLatitude(journalParam.location?.latitude ?? null);
      setLongitude(journalParam.location?.longitude ?? null);
    } else {
      Geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          
          // Trigger the weather api calculation automatically on location response
          fetchLiveWeatherPayload(lat, lon);
        },
        (error) => {
          console.warn("Could not tag fine GPS point context to new entry:", error.message);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
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
      weather: weather.trim(), // Saves your custom formatted weather string string data payload
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeft}>
          <Image source={ASSETS.backIcon} style={styles.iconBack} />
          <Text style={styles.headerTitle}>Hunting Journal</Text>
        </TouchableOpacity>
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
              <Text style={styles.dataText}>{locationText || 'Sierra National Forest'}</Text>
              {latitude !== null && longitude !== null && (
                <Text style={styles.coordsText}>
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.dataRow}>
            <Image source={ASSETS.weatherIcon} style={styles.dataIcon} />
            <Text style={styles.dataText}>{weather || 'Not specified'}</Text>
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
        
        <TouchableOpacity onPress={handleSave} disabled={isSaving || loadingWeather}>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 60, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerTitle: { color: '#000000', fontSize: 16, fontWeight: '900' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBack: { width: 22, height: 22, marginRight: 15, resizeMode: 'contain' },
  iconMore: { width: 20, height: 20, resizeMode: 'contain' },
  scrollContent: { paddingHorizontal: 25, paddingTop: 10 },
  titleInput: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 20, padding: 0 },
  descriptionInput: { fontSize: 14, color: '#6D6A5B', minHeight: 100, marginBottom: 15, padding: 0 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 0, borderColor: '#eee' },
  weatherInput: { fontSize: 14, color: '#6D6A5B', padding: 0 },
  locationInput: { fontSize: 14, color: '#6D6A5B', marginBottom: 15, padding: 0 },
  dataContainer: { marginTop: 10 },
  dataRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dataIcon: { width: 18, height: 18, marginRight: 15, resizeMode: 'contain' },
  dataText: { fontSize: 10, color: '#333', fontWeight: '500' },
  coordsText: { fontSize: 9, color: '#777', marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, paddingVertical: 20, backgroundColor: '#FFFFFF' },
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