import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Asset mapping based on the provided UI
const ASSETS = {
  backIcon: require('../../assets/back_arrow_black.png'),
  moreIcon: require('../../assets/more_options_black.png'),
  locationIcon: require('../../assets/location_marker_green.png'),
  weatherIcon: require('../../assets/weather_sun_icon.png'),
  deleteIcon: require('../../assets/delete_bin_green.png'),
  editNoteIcon: require('../../assets/edit_note_icon.png'),
  deleteBinIcon: require('../../assets/delete_bin_brown.png'), // Brown bin for modal
};

const NoteOpenScreen = () => {
  const navigation = useNavigation<any>();
  const [modalVisible, setModalVisible] = useState(false);

  const handleDelete = () => {
    setModalVisible(false);
    console.log('Note Deleted');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- DELETE MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Image source={ASSETS.deleteBinIcon} style={styles.modalHeaderIcon} />
              <Text style={styles.modalHeaderText}>Delete Deer Season?</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalBodyText}>
                Are You Sure You Want To Delete This Dear Season?
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerLeft} 
          onPress={() => navigation.goBack()}
        >
          <Image source={ASSETS.backIcon} style={styles.backIcon} />
          <Text style={styles.headerTitle}>Hunting Journal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Image source={ASSETS.moreIcon} style={styles.moreIcon} />
        </TouchableOpacity>
      </View>

      {/* --- NOTE CONTENT --- */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.noteTitle}>Deer Season</Text>

        <Text style={styles.descriptionParagraph}>
          Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do Eiusmod Tempor Incididunt Ut Labore Et Dolore Magna Aliqua. Ut Enim Ad Minim Veniam, Quis Nostrud Exercitation Ullamco Laboris Nisi Ut Aliquip Ex Ea Commodo Consequat.
        </Text>

        <Text style={styles.descriptionParagraph}>
          Duis Aute Irure Dolor In Reprehenderit In Voluptate Velit Esse Cillum Dolore Eu Fugiat Nulla Pariatur. Excepteur Sint Occaecat Cupidatat Non Proident, Sunt In Culpa Qui Officia Deserunt Mollit Anim Id Est Laborum.
        </Text>

        <Text style={styles.descriptionParagraph}>
          Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do Eiusmod Tempor Incididunt Ut Labore Et Dolore Magna Aliqua.
        </Text>

        {/* --- METADATA SECTION --- */}
        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <Image source={ASSETS.locationIcon} style={styles.metaIcon} />
            {/* <Text style={styles.metaText}>Sierra National Forest</Text> */}
          </View>

          <View style={styles.metaRow}>
            <Image source={ASSETS.weatherIcon} style={styles.metaIcon} />
            <Text style={styles.metaText}>Breezy with hazy sun Hi: 31°</Text>
          </View>
        </View>
      </ScrollView>

      {/* --- FOOTER ACTIONS --- */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image source={ASSETS.deleteIcon} style={styles.footerIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => console.log('Edit Note')}>
          <Image source={ASSETS.editNoteIcon} style={styles.footerIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    width: 22,
    height: 22,
    marginRight: 15,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  moreIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 40,
  },
  noteTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 25,
  },
  descriptionParagraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 20,
    textAlign: 'justify',
  },
  metaSection: {
    marginTop: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  metaIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
    resizeMode: 'contain',
  },
  metaText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  footerIcon: {
    width: 28,
    height: 28,
    tintColor: '#0E713E',
    resizeMode: 'contain',
  },
  /* --- MODAL STYLES --- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 113, 62, 0.7)', // Greenish transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    paddingBottom: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalHeaderIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
    resizeMode: 'contain',
  },
  modalHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  modalBody: {
    padding: 30,
    alignItems: 'center',
  },
  modalBodyText: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  cancelButton: {
    width: 140,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#4A321F', // Brown border
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4A321F',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    width: 140,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#4A321F', // Brown background
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NoteOpenScreen;