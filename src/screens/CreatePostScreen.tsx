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
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePosts } from '../hooks/usePosts';
import { useAppSelector } from '../app/store/hooks';
import { launchImageLibrary } from 'react-native-image-picker';

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
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const { user } = useAppSelector((state) => state.auth);
  const { createPost } = usePosts();

  const handleSelectImage = () => {
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
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
        });
      }
    });
  };

  const handleCreatePost = async () => {
    if (!postText.trim() && !selectedImage) {
      Alert.alert('Error', 'Please add some content to your post');
      return;
    }

    setLoading(true);
    try {
      const postData: any = {
        description: postText,
      };
      
      if (selectedImage) {
        postData.image = selectedImage;
      }
      
      await createPost(postData);
      
      Alert.alert('Success', 'Post created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
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
        
        <Text style={styles.headerTitle}>Create a Post</Text>
        
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleCreatePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.headerPostText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileIndicator}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>
              {user?.displayname?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.displayname || user?.username}</Text>
        </View>

        <TextInput
          style={styles.textInput}
          placeholder="What Are You Thinking About?"
          multiline
          placeholderTextColor="#666"
          value={postText}
          onChangeText={setPostText}
          textAlignVertical="top"
          editable={!loading}
        />

        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.actionSheetContainer}>
        <View style={styles.actionSheetPill}>
          <View style={styles.actionIndicator} />

          <View style={styles.actionSheetBody}>
            <ActionSheetItem
              icon={ASSETS.iconMedia}
              label="Media"
              onPress={handleSelectImage}
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
    fontSize: 14,
    color: '#000',
    lineHeight: 22,
    minHeight: 150,
  },
  imagePreviewContainer: {
    marginTop: 15,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
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
    tintColor: '#FFF',
  },
  actionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', 
  },
});

export default CreatePostScreen;