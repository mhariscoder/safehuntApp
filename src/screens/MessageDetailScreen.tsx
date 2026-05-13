import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const MessageDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { chatId } = route.params || {};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image source={require('../../assets/back_white.png')} style={styles.headerIcon} />
          </TouchableOpacity>
          <View style={styles.headerProfile}>
            <Image 
              source={require('../../assets/circle_profile.png')} 
              style={styles.avatar} 
            />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerName}>Henry</Text>
            <Text style={styles.headerStatus}>Typing</Text>
          </View>
        </View>
        <TouchableOpacity>
           <Image 
            source={require('../../assets/more_vert.png')} 
            style={styles.moreIcon} 
          />
        </TouchableOpacity>
      </View>

      {/* --- CHAT MESSAGES --- */}
      <ScrollView contentContainerStyle={styles.messageList}>
        
        {/* Received Text Message */}
        <View style={styles.receivedContainer}>
          <View style={styles.sageBubble}>
            <Text style={styles.senderName}>Henry</Text>
            <Text style={styles.messageText}>
              Lorem Ipsum Dolor Sit Amet, Consectetur Adipiscing Elit, Sed Do Eiusmod Tempor Incididunt Ut Labore Et Dolore Magna Aliqua. Ut Enim Ad Minim Veniam, Quis Nostrud Exercitation Ullamco Quis Nostrud Exercitation Ullamco
            </Text>
            <Text style={styles.timestamp}>18:30</Text>
          </View>
        </View>

        {/* Shared Images Grid */}
        <View style={styles.imageGallery}>
          <Image 
            source={require('../../assets/forest_large.jpg')} 
            style={styles.largeGalleryImage} 
          />
          <View style={styles.imageRow}>
            <Image 
              source={require('../../assets/hunter_small.jpg')} 
              style={styles.smallGalleryImage} 
            />
            <Image 
              source={require('../../assets/normal_forest.png')} 
              style={styles.smallGalleryImage} 
            />
          </View>
        </View>

        {/* Received Message with Profile Icon */}
        <View style={styles.receivedWithAvatar}>
          <Image 
            source={require('../../assets/circle_profile.png')} 
            style={styles.miniAvatar} 
          />
          <View style={styles.sageBubble}>
            <Text style={styles.senderName}>Henry</Text>
            <Text style={styles.messageText}>Please Take A Look At The Images.</Text>
            <Text style={styles.timestamp}>18:31</Text>
          </View>
        </View>
      </ScrollView>

      {/* --- INPUT BAR --- */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconButton}>
           <Image source={require('../../assets/emoji_icon.png')} style={styles.inputIcon} />
        </TouchableOpacity>
        
        <TextInput 
          style={styles.textInput}
          placeholder="Write A Message......."
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

        <TouchableOpacity style={styles.iconButton}>
           <Image source={require('../../assets/attachment_icon.png')} style={styles.inputIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 60,
    backgroundColor: '#0E713E', 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: 'bold',
  },
  backIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  headerProfile: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700', // Matches yellow dot in
    borderWidth: 1.5,
    borderColor: '#0E713E',
  },
  headerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
  moreIcon: {
    width: 13,
    height: 17,
    tintColor: '#FFF',
    resizeMode: 'contain',
  },
  messageList: {
    padding: 25,
  },
  receivedContainer: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    marginBottom: 15,
    marginLeft: 45, // Aligned for message without avatar
  },
  receivedWithAvatar: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    maxWidth: '85%',
    marginBottom: 15,
  },
  miniAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
    alignSelf: 'flex-end',
  },
  sageBubble: {
    backgroundColor: '#AACEBC', // Sage green bubble
    borderRadius: 12,
    padding: 12,
  },
  senderName: {
    fontWeight: 'bold',
    color: '#0E713E',
    marginBottom: 5,
    fontSize: 12,
  },
  messageText: {
    color: '#333',
    lineHeight: 15,
    fontSize: 10,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  imageGallery: {
    width: '85%',
    marginBottom: 15,
    marginLeft: 45,
  },
  largeGalleryImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallGalleryImage: {
    width: '48%',
    height: 100,
    borderRadius: 8,
  },
  inputContainer: {
    backgroundColor: '#0E713E',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 10,
    marginHorizontal: 10,
  },
  inputIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFF',
    resizeMode: 'contain',
  },
  iconButton: {
    padding: 5,
  },
});

export default MessageDetailScreen;