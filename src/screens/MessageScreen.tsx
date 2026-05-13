import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BottomTabNav from '../components/BottomTabNav';

const CHATS = [
  {
    id: '1',
    user: 'Henry',
    message: 'Please Take A Look At The Images.',
    time: '18:31',
    unreadCount: 5,
    statusColor: '#FFD700',
    avatar: require('../../assets/circle_profile.png'),
    isUnread: true,
  },
  {
    id: '2',
    user: 'Juba tal',
    message: 'Hello William We Have Discussed About...',
    time: '16:04',
    unreadCount: 0,
    avatar: require('../../assets/circle_profile.png'),
    isUnread: false,
  },
  {
    id: '3',
    user: 'Akari Edward',
    message: "Yes, That's Gonna Work, Hopefully.",
    time: '06:12',
    unreadCount: 0,
    statusColor: '#00FF00', // Green
    avatar: require('../../assets/circle_profile.png'),
    isUnread: false,
  },
  {
    id: '4',
    user: 'Amelia',
    message: 'Thanks Dude 😉',
    time: 'Yesterday',
    unreadCount: 0,
    avatar: require('../../assets/circle_profile.png'),
    isUnread: false,
  },
  {
    id: '5',
    user: 'Charles',
    message: "I'm Happy This Lion Has Such Grea...",
    time: 'Yesterday',
    unreadCount: 0,
    avatar: require('../../assets/circle_profile.png'),
    isUnread: false,
  },
];
 
const MessageScreen = () => {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
            
            {/* --- HEADER --- */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Message</Text>
                <TouchableOpacity style={styles.searchCircle}>
                    <Image 
                        source={require('../../assets/search_icon.png')} 
                        style={styles.searchIcon} 
                    />
                </TouchableOpacity>
            </View>

            {/* --- CHAT FILTER TABS --- */}
            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
                    <Text style={styles.activeTabText}>Recent Chats</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, styles.inactiveTab]}>
                    <Text style={styles.inactiveTabText}>People</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, styles.inactiveTab]}>
                    <Text style={styles.inactiveTabText}>Message Request</Text>
                </TouchableOpacity>
            </View>

            {/* --- MESSAGE LIST --- */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {CHATS.map((chat) => (
                <TouchableOpacity 
                    key={chat.id} 
                    style={[styles.chatItem, chat.isUnread && styles.unreadChatBackground]}
                    onPress={() => navigation.navigate('MessageDetail', { chatId: chat.id })}
                >
                    <View style={styles.avatarWrapper}>
                    <Image source={chat.avatar} style={styles.avatar} />
                    {chat.statusColor && (
                        <View style={[styles.statusDot, { backgroundColor: chat.statusColor }]} />
                    )}
                    </View>
                    
                    <View style={styles.textContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.userName}>{chat.user}</Text>
                        <Text style={styles.timeText}>{chat.time}</Text>
                    </View>
                    <View style={styles.messageRow}>
                        <Text style={styles.messageText} numberOfLines={1}>
                        {chat.message}
                        </Text>
                        {chat.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{chat.unreadCount}</Text>
                        </View>
                        )}
                    </View>
                    </View>
                </TouchableOpacity>
                ))}
            </ScrollView>

            {/* --- BOTTOM NAVIGATION --- */}
            <View style={styles.bottomNavContainer}>
                <BottomTabNav activeTab="Messages" />
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
  tabContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 25,
    justifyContent: 'space-between',
    gap: 10,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#0E713E',
  },
  inactiveTab: {
    backgroundColor: '#4D3626',
  },
  activeTabText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  inactiveTabText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '400',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  unreadChatBackground: {
    backgroundColor: '#AACEBC',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 1,
    borderColor: '#0E713E',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  timeText: {
    fontSize: 10,
    color: '#6D6A5B',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 10,
    color: '#6D6A5B',
    flex: 0.9,
  },
  unreadBadge: {
    backgroundColor: '#0E713E',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
});

export default MessageScreen;