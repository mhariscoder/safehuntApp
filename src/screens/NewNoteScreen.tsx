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
  const journalParam = route.params?.journal;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weather, setWeather] = useState('');
  const [locationText, setLocationText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  const { createJournal, updateJournal, deleteJournal } = useHuntingJournal();
  
  const isEditing = !!journalParam;

  useEffect(() => {
    if (journalParam) {
      setTitle(journalParam.title || '');
      setDescription(journalParam.description || '');
      setWeather(journalParam.weather || '');
      setLocationText(journalParam.location?.locationText || '');
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
      weather: weather.trim() || 'Not specified',
      date: new Date().toISOString(),
      location: {
        locationText: locationText.trim() || 'Unknown Location',
        latitude: 0,
        longitude: 0,
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

        <TextInput
          style={styles.weatherInput}
          placeholder="Weather (e.g., Sunny, Rainy, Cloudy)"
          placeholderTextColor="#6D6A5B"
          value={weather}
          onChangeText={setWeather}
          editable={!isSaving}
        />

        <TextInput
          style={styles.locationInput}
          placeholder="Location"
          placeholderTextColor="#6D6A5B"
          value={locationText}
          onChangeText={setLocationText}
          editable={!isSaving}
        />

        <View style={styles.dataContainer}>
          <View style={styles.dataRow}>
            <Image source={ASSETS.locationIcon} style={styles.dataIcon} />
            <Text style={styles.dataText}>{locationText || 'Sierra National Forest'}</Text>
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
        
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
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
  weatherInput: { fontSize: 14, color: '#6D6A5B', marginBottom: 15, padding: 0 },
  locationInput: { fontSize: 14, color: '#6D6A5B', marginBottom: 15, padding: 0 },
  dataContainer: { marginTop: 10 },
  dataRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dataIcon: { width: 18, height: 18, marginRight: 15, resizeMode: 'contain' },
  dataText: { fontSize: 10, color: '#333', fontWeight: '500' },
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