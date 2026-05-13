import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native'; //

const { height } = Dimensions.get('window');

const ASSETS = {
  iconClose: require('./../../assets/close_icon.png'),
  iconMedia: require('./../../assets/media_icon.png'),
  iconLocation: require('./../../assets/location_icon.png'),
  iconTag: require('./../../assets/tag_icon.png'),
};

const ActionSheetItem = ({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress}>
    <View style={styles.iconContainer}>
      <Image source={icon} style={styles.actionIcon} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const CreatePostScreen = () => {
  const [postText, setPostText] = useState('');
  const navigation = useNavigation<any>(); //

  // Function to handle moving back to the feed
  const handleNavigateBack = () => {
    navigation.goBack(); // Or navigation.navigate('Feed') depending on your stack
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />

      {/* Header - Navigation added to both buttons */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleNavigateBack} // Close button navigation
        >
          <Image source={ASSETS.iconClose} style={styles.headerCloseIcon} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create a Post</Text>
        
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleNavigateBack} // Post button navigation
        >
          <Text style={styles.headerPostText}>Post</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.profileIndicator}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>W</Text>
          </View>
          <Text style={styles.profileName}>William jack</Text>
        </View>

        <TextInput
          style={styles.textInput}
          placeholder="What Are You Thinking About?"
          multiline
          placeholderTextColor="#666"
          value={postText}
          onChangeText={setPostText}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.actionSheetContainer}>
        <View style={styles.actionSheetPill}>
          <View style={styles.actionIndicator} />

          <View style={styles.actionSheetBody}>
            <ActionSheetItem
              icon={ASSETS.iconMedia}
              label="Media"
              onPress={() => {}}
            />
            <ActionSheetItem
              icon={ASSETS.iconLocation}
              label="Location"
              onPress={() => {}}
            />
            <ActionSheetItem
              icon={ASSETS.iconTag}
              label="Tag Hunters"
              onPress={() => {}}
            />
          </View>
        </View>
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
    height: 60,
    backgroundColor: '#0E713E', 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerButton: {
    padding: 5,
  },
  headerCloseIcon: {
    width: 22,
    height: 22,
    tintColor: '#FFFFFF',
  },
  headerPostText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4D3626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInitial: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    lineHeight: 22,
  },
  actionSheetContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  actionSheetPill: {
    backgroundColor: '#0E713E',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  actionIndicator: {
    width: 32,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 25,
  },
  actionSheetBody: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
  },
  iconContainer: {
    marginRight: 15,
  },
  actionIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  actionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', 
  },
});

export default CreatePostScreen;