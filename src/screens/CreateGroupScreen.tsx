import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGroups } from '../hooks/useGroups';
import { useAppSelector } from '../app/store/hooks';
import { launchImageLibrary } from 'react-native-image-picker';

const ASSETS = {
  iconClose: require('./../../assets/close_icon.png'),
  iconMedia: require('./../../assets/media_icon.png'),
  iconCamera: require('./../../assets/camera_icon.png'),
  iconGroup: require('./../../assets/group_avatar.png'),
};

const CreateGroupScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedCover, setSelectedCover] = useState<any>(null);
  const [selectedLogo, setSelectedLogo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);
  const { createGroup } = useGroups();

  const handleSelectCover = () => {
    const options: any = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, (response: any) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to select cover image');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedCover({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `cover_${Date.now()}.jpg`,
        });
      }
    });
  };

  const handleSelectLogo = () => {
    const options: any = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, (response: any) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to select logo image');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedLogo({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `logo_${Date.now()}.jpg`,
        });
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!groupDescription.trim()) {
      Alert.alert('Error', 'Please enter a group description');
      return;
    }

    setLoading(true);
    try {
      const groupData: any = {
        name: groupName,
        description: groupDescription,
      };
      
      if (selectedCover) {
        groupData.cover = selectedCover;
      }
      
      if (selectedLogo) {
        groupData.logo = selectedLogo;
      }
      
      await createGroup(groupData);
      
      Alert.alert('Success', 'Group created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCover = () => {
    setSelectedCover(null);
  };

  const handleRemoveLogo = () => {
    setSelectedLogo(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Image source={ASSETS.iconClose} style={styles.headerCloseIcon} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create Group</Text>
        
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleCreateGroup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.headerPostText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Indicator */}
        <View style={styles.profileIndicator}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>
              {user?.displayname?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.displayname || user?.username}</Text>
            <Text style={styles.profileSubtext}>Group Creator</Text>
          </View>
        </View>

        {/* Group Name Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Group Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Group Name"
            placeholderTextColor="#666"
            value={groupName}
            onChangeText={setGroupName}
            editable={!loading}
          />
        </View>

        {/* Group Description Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter Group Description"
            placeholderTextColor="#666"
            value={groupDescription}
            onChangeText={setGroupDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Cover Image Upload */}
        <View style={styles.imageUploadSection}>
          <Text style={styles.inputLabel}>Upload Group Cover</Text>
          <TouchableOpacity 
            style={styles.imageUploadContainer}
            onPress={handleSelectCover}
            disabled={loading}
          >
            {selectedCover ? (
              <>
                <Image source={{ uri: selectedCover.uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveCover}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Image source={ASSETS.iconMedia} style={styles.imageIcon} />
                <Text style={styles.imagePlaceholderText}>Tap to upload cover image</Text>
                <Text style={styles.imagePlaceholderSubtext}>Recommended size: 1200 x 400</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Logo Image Upload */}
        <View style={styles.imageUploadSection}>
          <Text style={styles.inputLabel}>Upload Group Logo</Text>
          <TouchableOpacity 
            style={[styles.imageUploadContainer, styles.logoUploadContainer]}
            onPress={handleSelectLogo}
            disabled={loading}
          >
            {selectedLogo ? (
              <>
                <Image source={{ uri: selectedLogo.uri }} style={styles.logoPreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveLogo}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.logoPlaceholder}>
                <Image source={ASSETS.iconCamera} style={styles.logoIcon} />
                <Text style={styles.logoPlaceholderText}>Tap to upload logo</Text>
                <Text style={styles.imagePlaceholderSubtext}>Recommended size: 200 x 200</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            💡 Note: You will be the admin of this group. Other users can request to join.
          </Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
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
  profileSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageUploadSection: {
    marginBottom: 20,
  },
  imageUploadContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
  logoUploadContainer: {
    height: 180,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: '#F5F5F5',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  imageIcon: {
    width: 40,
    height: 40,
    tintColor: '#999',
    marginBottom: 10,
  },
  logoIcon: {
    width: 50,
    height: 50,
    tintColor: '#999',
    marginBottom: 10,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  imagePlaceholderSubtext: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
  logoPlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  removeImageText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoNote: {
    backgroundColor: '#F0F7F0',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 30,
  },
  infoNoteText: {
    fontSize: 12,
    color: '#0E713E',
    lineHeight: 18,
  },
});

export default CreateGroupScreen;