import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import TopHeader from '../components/TopHeader';
import SideMenu from '../components/SideMenu';
import BottomTabNav from '../components/BottomTabNav';

// Standardized Asset Mapping (Ensure paths match your local structure)
const ASSETS = {
  profileHeader: require('../../assets/tab_2.png'), // The 'W' icon
  postImage: require('../../assets/tab_2.png'), // Henry's hunting photo
  userHenry: require('../../assets/tab_2.png'),
  userAkari: require('../../assets/tab_2.png'),
  iconMenu: require('../../assets/nav_1.png'), // Menu icon from previous screens
  iconSearch: require('../../assets/nav_2.png'),
  tabFeed: require('../../assets/tab_2.png'),
  tabNotif: require('../../assets/tab_3.png'),
  tabMap: require('../../assets/tab_0.png'),
  tabMsg: require('../../assets/tab_1.png'),
  tabSettings: require('../../assets/tab_4.png'),
};

const FeedScreen = () => {
    const [menuOpen, setMenuOpen] = useState(false);
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* --- TOP HEADER --- */}
      <View style={styles.header}>
        {/* <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.whiteBtn}>
             <Image source={ASSETS.iconMenu} style={styles.navIconGreen} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.brownBtn}>
             <Image source={ASSETS.iconSearch} style={styles.navIconWhite} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sosButton}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View> */}

        <TopHeader 
            onMenuPress={() => setMenuOpen(true)}
            containerStyle={{ 
              marginTop: 30,
              marginBottom: 20,
              backgroundColor: 'transparent' 
            }}
        />

        {/* --- POST INPUT AREA --- */}
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
               <Text style={styles.actionBtnText}>❤️ Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
               <Text style={styles.actionBtnText}>💬 Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
               <Text style={styles.actionBtnText}>🚀 Share</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Repeating for Akari Edward as seen in design */}
        <View style={styles.postCard}>
             <View style={styles.postHeader}>
                <Image source={ASSETS.userAkari} style={styles.avatar} />
                <View style={styles.headerInfo}>
                    <Text style={styles.userName}>Akari Edward</Text>
                    <Text style={styles.location}>5h • Black Hills</Text>
                </View>
                <TouchableOpacity><Text style={styles.moreIcon}>⋮</Text></TouchableOpacity>
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
  profileCircleSmall: { width: 55, height: 55, borderRadius: 55, backgroundColor: '#4D3626', justifyContent: 'center', alignItems: 'center' },
  profileInitial: { color: '#FFF', fontWeight: 'bold' },
  textInput: { flex: 1, marginHorizontal: 10, fontSize: 14 },
  imagePickerIcon: { width: 24, height: 24 },

  postCard: { backgroundColor: '#FFF', marginTop: 10, paddingVertical: 15 },
  postHeader: { flexDirection: 'row', paddingHorizontal: 15, alignItems: 'center', marginBottom: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },
  headerInfo: { flex: 1, marginLeft: 10 },
  userName: { fontWeight: 'bold', fontSize: 16 },
  location: { color: '#666', fontSize: 12 },
  moreIcon: { fontSize: 20, color: '#666' },
  
  postCaption: { paddingHorizontal: 15, marginBottom: 10, fontSize: 14, lineHeight: 20 },
  hashtag: { fontWeight: 'bold' },
  mainPostImage: { width: '100%', height: 300, resizeMode: 'cover' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  statsText: { color: '#666', fontSize: 12 },
  
  actionButtons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
  actionBtn: { paddingVertical: 5 },
  actionBtnText: { color: '#0E713E', fontWeight: 'bold' },

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
});

export default FeedScreen;