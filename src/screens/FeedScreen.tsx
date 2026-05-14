import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TopHeader from '../components/TopHeader';
import SideMenu from '../components/SideMenu';
import BottomTabNav from '../components/BottomTabNav';

const ASSETS = {
  profileHeader: require('../../assets/tab_2.png'),
  postImage: require('../../assets/post_image.png'),
  userHenry: require('../../assets/circle_profile.png'),
  userAkari: require('../../assets/circle_profile.png'),
  iconMenu: require('../../assets/nav_1.png'),
  iconSearch: require('../../assets/nav_2.png'),
  tabFeed: require('../../assets/tab_2.png'),
  tabNotif: require('../../assets/tab_3.png'),
  tabMap: require('../../assets/tab_0.png'),
  tabMsg: require('../../assets/tab_1.png'),
  tabSettings: require('../../assets/tab_4.png'),
};

const COMMENTS_DATA = [
  {
    id: '1',
    user: 'Juba Tal',
    avatar: ASSETS.userHenry,
    text: 'wow, love it.',
    time: '20m',
  },
  {
    id: '2',
    user: 'Akari Edward',
    avatar: ASSETS.userAkari,
    text: 'Impressive harvest! How was the experience out in the wild?',
    time: '15m',
  },
  {
    id: '3',
    user: 'Charles',
    avatar: ASSETS.userHenry,
    text: 'A skilled hunter in action! Wishing you many more fulfilling outings.',
    time: '15m',
  },
  {
    id: '4',
    user: 'Benjamin',
    avatar: ASSETS.userHenry,
    text: 'Impressive harvest! How was the experience out in the wild?',
    time: '15m',
  },
];

const FeedScreen = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* --- TOP HEADER --- */}
      <View style={styles.header}>

        <TopHeader 
            onMenuPress={() => setMenuOpen(true)}
            containerStyle={{ 
              marginTop: 30,
              marginBottom: 20,
              backgroundColor: 'transparent' 
            }}
        />

        {/* --- POST INPUT AREA --- */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('CreatePost')}
        >
          <View style={styles.inputContainer}>
            <View style={styles.profileCircleSmall}>
              <Text style={styles.profileInitial}>W</Text>
            </View>
            <TextInput 
              placeholder="What Are You Thinking About?" 
              placeholderTextColor="#666"
              style={styles.textInput}
            />
            <TouchableOpacity>
              <Image source={require('../../assets/image.png')} style={styles.imagePickerIcon} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* --- FEED POST --- */}
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <Image source={ASSETS.userHenry} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <Text style={styles.userName}>Henry</Text>
              <Text style={styles.location}>1h • Sierra National Forest</Text>
            </View>
            <TouchableOpacity><Text style={styles.moreIcon}>⋮</Text></TouchableOpacity>
          </View>

          <Text style={styles.postCaption}>
            Embracing The Wild, One Hunt At A Time. <Text style={styles.hashtag}>#DeerSeason 🦌🌿</Text>
          </Text>

          <Image source={ASSETS.postImage} style={styles.mainPostImage} />

          <View style={styles.statsRow}>
            <Text style={styles.statsText}>❤️ Robert and 214 Other</Text>
            <Text style={styles.statsText}>25 Comments</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionBtn}>
              <Image source={require('../../assets/green_heart.png')} resizeMode='contain' style={styles.actionImage} />
              <Text style={styles.actionBtnText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Image source={require('../../assets/green_comment.png')} resizeMode='contain' style={styles.actionImage} />
               <Text style={styles.actionBtnText}>Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Image source={require('../../assets/green_share.png')} resizeMode='contain' style={styles.actionImage} />
               <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* COMMENTS SECTION */}
          <View style={styles.commentsSection}>
            <TouchableOpacity style={styles.commentDropdown}>
              <Text style={styles.allCommentsText}>All Comments</Text>
              <Image source={require('../../assets/arrow_down.png')} resizeMode='contain' style={styles.dropdownArrow} />
            </TouchableOpacity>

            {COMMENTS_DATA.map((item) => (
              <View key={item.id} style={styles.commentItem}>
                <Image source={item.avatar} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUser}>{item.user}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                  <View style={styles.commentFooter}>
                    <Text style={styles.footerActionText}>{item.time}</Text>
                    <TouchableOpacity><Text style={styles.footerActionText}>Like</Text></TouchableOpacity>
                    <TouchableOpacity><Text style={styles.footerActionText}>Reply</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
        </View>
        </View>
      </ScrollView>

    <View style={styles.bottomTabContainer}>
      <BottomTabNav containerStyle={{ marginBottom: 30 }} />
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#0E713E', paddingHorizontal: 20, paddingBottom: 20 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  whiteBtn: { backgroundColor: '#FFF', width: 60, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  brownBtn: { backgroundColor: '#4D3626', width: 60, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sosButton: { backgroundColor: '#FF0000', width: 65, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sosText: { color: '#FFF', fontWeight: 'bold' },
  navIconGreen: { width: 20, height: 20, tintColor: '#0E713E' },
  navIconWhite: { width: 20, height: 20, tintColor: '#FFF' },
  
  inputContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    borderRadius: 30, 
    paddingRight: 20,
    alignItems: 'center'
  },
  profileCircleSmall: { width: 50, height: 50, borderRadius: 50, backgroundColor: '#4D3626', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: '#FFF', fontWeight: 'bold' },
  textInput: { flex: 1, marginHorizontal: 10, fontSize: 12 },
  imagePickerIcon: { width: 24, height: 24 },

  postCard: { marginTop: 10, paddingVertical: 15 },
  postHeader: { flexDirection: 'row', paddingHorizontal: 25, alignItems: 'center', marginBottom: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },
  headerInfo: { flex: 1, marginLeft: 10 },
  userName: { fontWeight: '900', fontSize: 20 },
  location: { color: '#666', fontSize: 10 },
  moreIcon: { fontSize: 20, color: '#666' },
  
  postCaption: { paddingHorizontal: 25, marginBottom: 10, fontSize: 12, lineHeight: 20 },
  hashtag: { fontWeight: 'bold' },
  mainPostImage: { width: '100%', height: 300, resizeMode: 'cover' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  statsText: { color: '#666', fontSize: 12 },
  
  actionButtons: { backgroundColor: '#0E713E', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 25, gap: 10 },
  actionBtn: { backgroundColor: '#FFFFFF', flex:1, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', borderRadius: 20, justifyContent: 'center' },
  actionBtnText: { color: '#0E713E', fontWeight: 'bold', fontSize: 10 },
  actionImage: { width: 14, height: 14, marginRight: 5, resizeMode: 'contain' },
  bottomTabContainer: { paddingHorizontal: 25 },
  bottomNav: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(74, 146, 103, 0.9)', 
    height: 60, 
    borderRadius: 30, 
    alignItems: 'center', 
    justifyContent: 'space-around' 
  },
  tabIcon: { width: 24, height: 24, tintColor: 'rgba(255,255,255,0.6)' },
  tabIconActive: { width: 24, height: 24, tintColor: '#FFF' },

  commentsSection: { paddingHorizontal: 25, marginTop: 10 },
  commentDropdown: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  allCommentsText: { fontSize: 12, fontWeight: '700', color: '#333' },
  dropdownArrow: { width: 12, height: 12, marginTop: 5, marginLeft: 5 },
  commentItem: { flexDirection: 'row', marginBottom: 15 },
  commentAvatar: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10 },
  commentContent: {},
  commentBubble: { 
    backgroundColor: '#AACEBC', 
    padding: 10, 
    borderRadius: 14,
    minWidth: '40%',
    maxWidth: '80%',
  },
  commentUser: { fontWeight: 'bold', fontSize: 12, marginBottom: 2 },
  commentText: { fontSize: 11, color: '#444', lineHeight: 16,  },
  commentFooter: { flexDirection: 'row', gap: 15, marginTop: 5, paddingLeft: 5 },
  footerActionText: { fontSize: 10, color: '#888' },
});

export default FeedScreen;