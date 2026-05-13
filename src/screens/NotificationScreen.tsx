import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import BottomTabNav from '../components/BottomTabNav';

const NOTIFICATIONS = [
  {
    id: '1',
    user: 'Henry',
    action: 'has posted 1 photo on sunday.',
    time: '1 Hour Ago',
    avatar: require('../../assets/circle_profile.png'),
    typeIcon: require('../../assets/image_icon.png'), // Small icon on avatar
    isUnread: false,
  },
  {
    id: '2',
    user: 'Juba tal',
    action: 'sent you a friend request.',
    time: 'Fri At 1:36 AM',
    avatar: require('../../assets/circle_profile.png'),
    typeIcon: require('../../assets/friend_icon.png'),
    isUnread: true,
  },
  {
    id: '3',
    user: "It's Akari Edward's Birthday today. let her know you're thinking about her!",
    action: '',
    time: '2 Hours Ago',
    avatar: require('../../assets/circle_profile.png'),
    typeIcon: require('../../assets/cake_icon.png'),
    isUnread: true,
  },
  {
    id: '4',
    user: 'Charles',
    action: 'commented on Akari Edward post.',
    time: '2 Hours Ago',
    avatar: require('../../assets/circle_profile.png'),
    typeIcon: require('../../assets/comment_icon.png'),
    isUnread: true,
  },
  {
    id: '5',
    user: 'Benjamin,',
    action: 'kory westerhold and 5 other people reacted to your post.',
    time: '3 Hours Ago',
    avatar: require('../../assets/circle_profile.png'),
    typeIcon: require('../../assets/heart_icon.png'),
    isUnread: true,
  },
  {
    id: '6',
    user: 'Henry',
    action: 'has posted 1 photo on sunday.',
    time: '1 Hour Ago',
    avatar: require('../../assets/circle_profile.png'),
    typeIcon: require('../../assets/image_icon.png'),
    isUnread: true,
  },
];

const NotificationScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.searchCircle}>
          <Image 
            source={require('../../assets/search_icon.png')} 
            style={styles.searchIcon} 
          />
        </TouchableOpacity>
      </View>

      {/* --- NOTIFICATION LIST --- */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {NOTIFICATIONS.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.notificationItem, item.isUnread && styles.unreadBackground]}
          >
            <View style={styles.avatarContainer}>
              <Image source={item.avatar} style={styles.avatar} />
              <View style={styles.typeIconBadge}>
                <Image source={item.typeIcon} style={styles.typeIcon} />
              </View>
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.notificationText}>
                <Text style={styles.userName}>{item.user} </Text>
                {item.action}
              </Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* --- BOTTOM NAVIGATION --- */}
      <View style={styles.bottomTabContainer}>
        <BottomTabNav activeTab="Notifications" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFAF0',
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
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  searchCircle: {
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#4D3626',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2DDBE',
    alignItems: 'center',
  },
  unreadBackground: {
    backgroundColor: '#AACEBC', // Sage Green Highlight
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 1,
    borderColor: '#0E713E',
  },
  typeIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0E713E',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  typeIcon: {
    width: 8,
    height: 8,
    tintColor: '#FFF',
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  notificationText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 20,
  },
  userName: {
    fontWeight: '900',
  },
  timeText: {
    fontSize: 10,
    color: '#6D6A5B',
    marginTop: 4,
  },
  bottomTabContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
});

export default NotificationScreen;