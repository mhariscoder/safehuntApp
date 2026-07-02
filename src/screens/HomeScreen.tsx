import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Alert,
  FlatList,
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  LatLng,
} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import Slider from '@react-native-community/slider';

import { useDispatch, useSelector } from 'react-redux';
import { getMyJournals, getSharedWithMeJournals } from './../features/huntingJournal/huntingJournalActions';
import { sendFriendRequest } from './../features/friends/friendsActions';
import { updateLocation } from './../features/chat/chatActions';
import { connectSocket, disconnectSocket } from './../features/chat/chatActions';

import SideMenu from '../components/SideMenu';
import TopHeader from '../components/TopHeader';
import BottomTabNav from '../components/BottomTabNav';
import ChatService from '../features/chat/chatService';

const { width, height } = Dimensions.get('window');

const IMAGE_SERVER_BASE_URL = 'https://your-api-domain.com';
const GOOGLE_MAPS_APIKEY = 'AIzaSyDfERDiOAjbLmRs1XZYleJhmr7GJQ6lPaM';

interface LocationMarker {
  id: string;
  coordinate: LatLng;
  title: string;
  description: string;
  type: string;
  weather?: string;
  isJournal?: boolean;
  user?: {
    id: string;
    displayname: string;
    username: string;
    email: string;
    profilePhoto: string | null;
    bio: string;
    huntingExperience: string;
    skills: string[];
  };
  isSharedJournal: boolean
}

interface NearbyUser {
  id: string;
  displayname: string;
  username: string;
  profilePicture?: string;
  currentLatitude: number;
  currentLongitude: number;
  distance?: number;
  friendRequestStatus?: 'pending' | 'accepted' | 'none';
}

const ZOOM_OPTIONS = [
  { label: '0.1m', value: 0.1, altitude: 300, zoom: 18.5 },
  { label: '0.2m', value: 0.2, altitude: 600, zoom: 17.5 },
  { label: '0.3m', value: 0.3, altitude: 1000, zoom: 16.5 },
  { label: '0.4m', value: 0.4, altitude: 1500, zoom: 15.5 },
  { label: '0.5m', value: 0.5, altitude: 2200, zoom: 14.5 },
];

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();

  const [menuOpen, setMenuOpen] = useState(false);
  const [initialCamera, setInitialCamera] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(0.3);
  const [currentZoomLabel, setCurrentZoomLabel] = useState('0.3km');

  // State for markers (journals)
  const [journalMarkers, setJournalMarkers] = useState<LocationMarker[]>([]);
  // State for nearby users
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [selectedLocation, setSelectedLocation] = useState<LocationMarker | null>(null);
  const [selectedNearbyUser, setSelectedNearbyUser] = useState<NearbyUser | null>(null);
  const [showAllMarkers] = useState(true);
  const [filterType] = useState<string | null>(null);

  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);

  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [routeOrigin, setRouteOrigin] = useState<any>(null);
  const [showMyLocationButton, setShowMyLocationButton] = useState(true);

  const mapRef = useRef<MapView>(null);
  const watchIdRef = useRef<number | null>(null);
  const locationUpdateTimeoutRef = useRef<any>(null);

  const { isConnected: socketConnected } = useSelector((state: any) => state.chat || { isConnected: false });
  const currentUserId = useSelector((state: any) => state.auth?.user?.id);

  // Initialize socket connection
  // useEffect(() => {
  //   if (currentUserId) {
  //     console.log('🏠 HomeScreen: Initializing socket connection for user:', currentUserId);
  //     dispatch(connectSocket({ receiverUserId: currentUserId.toString() }));

  //     // Set up socket listeners for nearby users and friend requests
  //     setupSocketListeners();
  //   }

  //   return () => {
  //     console.log('🏠 HomeScreen: Cleaning up socket connection');
  //     if (locationUpdateTimeoutRef.current) {
  //       clearTimeout(locationUpdateTimeoutRef.current);
  //     }
  //     cleanupSocketListeners();
  //     dispatch(disconnectSocket());
  //   };
  // }, [currentUserId, dispatch]);

  useEffect(() => {
    if (currentUserId) {
      console.log('🏠 HomeScreen: Initializing socket connection for user:', currentUserId);
      dispatch(connectSocket({ receiverUserId: currentUserId.toString() }));

      // Set up socket listeners for nearby users and friend requests
      setupSocketListeners();
    }

    return () => {
      console.log('🏠 HomeScreen: Cleaning up screen layout variables');
      if (locationUpdateTimeoutRef.current) {
        clearTimeout(locationUpdateTimeoutRef.current);
      }
      // 1. Remove layout event listeners so we don't handle map updates when screen is gone
      cleanupSocketListeners();
      
      // 2. 🚨 REMOVED dispatch(disconnectSocket()) FROM HERE!
      // Keeping connection alive globally across layout variations.
    };
  }, [currentUserId, dispatch]);

  // Set up socket listeners
  const setupSocketListeners = () => {
    const chatService = ChatService;

    // Listen for user info updates (contains nearbyUsers)
    chatService.listen('userInfo', (data) => {
      console.log('📨 User info received in HomeScreen:', data);
      
      if (data) {
        if (data.me) {
          setCurrentUser(data.me);
        }
        
        if (data.nearbyUsers && data.nearbyUsers.length > 0) {
          console.log(`📍 Found ${data.nearbyUsers.length} nearby users`);
          setNearbyUsers(data.nearbyUsers);
        }
      }
    });

    // Listen for friend request responses
    chatService.listen('friendRequestSent', (data) => {
      console.log('📨 Friend request sent:', data);
      if (data.success) {
        // Update nearby users status
        setNearbyUsers(prev => 
          prev.map(user => 
            user.id === data.receiverId 
              ? { ...user, friendRequestStatus: 'pending' }
              : user
          )
        );
        Alert.alert('Success', 'Friend request sent successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to send friend request');
      }
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.receiverId);
        return newSet;
      });
    });

    chatService.listen('friendRequestReceived', (data) => {
      console.log('📨 Friend request received:', data);
      // Refresh nearby users
      if (currentLocation && currentUserId) {
        ChatService.updateLocation(
          parseInt(currentUserId),
          currentLocation.latitude,
          currentLocation.longitude
        );
      }
    });

    chatService.listen('friendRequestAccepted', (data) => {
      console.log('📨 Friend request accepted:', data);
      setNearbyUsers(prev => 
        prev.map(user => 
          user.id === data.requesterId 
            ? { ...user, friendRequestStatus: 'accepted' }
            : user
        )
      );
      Alert.alert('Success', 'Friend request accepted!');
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.requesterId);
        return newSet;
      });
    });

    chatService.listen('friendRequestRejected', (data) => {
      console.log('📨 Friend request rejected:', data);
      setNearbyUsers(prev => 
        prev.map(user => 
          user.id === data.requesterId 
            ? { ...user, friendRequestStatus: 'none' }
            : user
        )
      );
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.requesterId);
        return newSet;
      });
    });
  };

  const cleanupSocketListeners = () => {
    const chatService = ChatService;
    chatService.off('userInfo');
    chatService.off('friendRequestSent');
    chatService.off('friendRequestReceived');
    chatService.off('friendRequestAccepted');
    chatService.off('friendRequestRejected');
  };

  // Initialize app and fetch data
  useEffect(() => {
    const initializeApp = async () => {
      await requestLocationPermission();
      fetchMyJournalsData();
    };
    initializeApp();

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('📍 HomeScreen focused - fetching journals...');
      fetchMyJournalsData();
    }, [])
  );

  // Debounced location update
  const debouncedLocationUpdate = useCallback((location: LatLng) => {
    if (locationUpdateTimeoutRef.current) {
      clearTimeout(locationUpdateTimeoutRef.current);
    }

    locationUpdateTimeoutRef.current = setTimeout(() => {
      if (location && currentUserId && socketConnected) {
        console.log('📍 Sending location update:', location);
        const chatService = ChatService;
        chatService.updateLocation(
          Number(currentUserId),
          location.latitude,
          location.longitude
        );
      }
    }, 1000);
  }, [currentUserId, socketConnected]);

  useEffect(() => {
    if (currentLocation && currentUserId && socketConnected) {
      debouncedLocationUpdate(currentLocation);
    }
  }, [currentLocation, currentUserId, socketConnected, debouncedLocationUpdate]);

  // Fetch my journals
  // Combined fetch for personal and shared journals
  const fetchMyJournalsData = async () => {
    try {
      const parsedMarkers: LocationMarker[] = [];

      // 1. Fetch My Journals
      const myJournalsRes = await dispatch(getMyJournals({ page: 1, limit: 50 })).unwrap();
      const myJournalsData = myJournalsRes?.data || myJournalsRes || [];
      myJournalsData.forEach((item: any) => {
        parsedMarkers.push({
          id: `mine_${item.id}`,
          coordinate: {
            latitude: parseFloat(item.location?.latitude || item.latitude || '0'),
            longitude: parseFloat(item.location?.longitude || item.longitude || '0'),
          },
          title: item.title || 'My Hunting Spot',
          description: item.description || '',
          type: item.type || 'default',
          weather: item.weather,
          isJournal: true,
          isSharedJournal: false,
        });
      });

      // 2. Fetch Shared With Me Journals
      const sharedJournalsRes = await dispatch(getSharedWithMeJournals({ page: 1, limit: 50 })).unwrap();
      const sharedJournalsData = sharedJournalsRes?.data || sharedJournalsRes || [];
      sharedJournalsData.forEach((item: any) => {
        parsedMarkers.push({
          id: `shared_${item.id}`,
          coordinate: {
            latitude: parseFloat(item.location?.latitude || item.latitude || '0'),
            longitude: parseFloat(item.location?.longitude || item.longitude || '0'),
          },
          title: item.title ? `🤝 ${item.title}` : 'Shared Hunting Spot',
          description: item.description || '',
          type: item.type || 'default',
          weather: item.weather,
          isJournal: true,
          isSharedJournal: true,
        });
      });

      setJournalMarkers(parsedMarkers);
      console.log(`✅ Synced markers: Total: ${parsedMarkers.length}`);
    } catch (err) {
      console.error('Error fetching data logs:', err);
    }
  };

  // Location permission and tracking
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          startLocationTracking();
        } else {
          setError('Location permission denied');
          setLoading(false);
          setDefaultLocation();
        }
      } catch (err) {
        console.warn(err);
        setError('Permission error');
        setLoading(false);
      }
    } else {
      startLocationTracking();
    }
  };

  const startLocationTracking = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setLocationLoaded(true);
        
        setInitialCamera({
          center: { latitude, longitude },
          // pitch: 55,
          // heading: 0,
          // altitude: 1000,
          zoom: 16.5
        });
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('High accuracy error, falling back...', err);
        Geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setCurrentLocation({ latitude, longitude });
            setLocationLoaded(true);
            setInitialCamera({
              center: { latitude, longitude },
              // pitch: 55, heading: 0, altitude: 1000, 
              zoom: 16.5
            });
            setLoading(false);
          },
          (fallbackErr) => {
            setError(`Unable to get location: ${fallbackErr.message}`);
            setLoading(false);
            setDefaultLocation();
          },
          { enableHighAccuracy: false, timeout: 15000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
      },
      (err) => console.log('Background telemetry watch warning:', err),
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 10000,
        fastestInterval: 5000
      }
    );
  };

  const setDefaultLocation = () => {
    const defaultLoc = { latitude: 34.958854, longitude: -92.374599 };
    setCurrentLocation(defaultLoc);
    setLocationLoaded(true);
    setInitialCamera({
      center: defaultLoc,
      // pitch: 55,
      // heading: 0,
      // altitude: 1500,
      zoom: 15,
    });
    setLoading(false);
  };

  // Get all markers (journals + nearby users)
  const getAllMarkers = (): LocationMarker[] => {
    const markers: LocationMarker[] = [];

    // Add journal markers
    markers.push(...journalMarkers);

    // Add nearby user markers
    nearbyUsers.forEach(user => {
      if (!user.currentLatitude || !user.currentLongitude) return;

      let distance = user.distance;

      if (!distance && currentLocation) {
        distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          user.currentLatitude,
          user.currentLongitude
        );
      }

      markers.push({
        id: `user_${user.id}`,
        coordinate: {
          latitude: user.currentLatitude,
          longitude: user.currentLongitude,
        },
        title: user.displayname || user.username,
        description: distance
          ? `${(distance * 0.621371).toFixed(1)} mi away`
          : 'Distance unavailable',
        type: 'user',
        isJournal: false,
        isSharedJournal: false,
        user: {
          id: user.id,
          displayname: user.displayname,
          username: user.username,
          email: '',
          profilePhoto: user.profilePicture || null,
          bio: '',
          huntingExperience: '',
          skills: [],
        }
      });
    });

    return markers;
  };

  const centerToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        // pitch: 55,
        // zoom: 16.5,
        // heading: 0,
      }, { duration: 600 });
    }
  };

  const handleZoomChange = async (value: number) => {
    const roundedValue = Math.round(value * 10) / 10;
    const zoomOption = ZOOM_OPTIONS.find(opt => opt.value === roundedValue);
    
    if (zoomOption && mapRef.current) {
      setCurrentZoom(roundedValue);
      setCurrentZoomLabel(zoomOption.label);
      
      try {
        const currentCamera = await mapRef.current.getCamera();
        mapRef.current.animateCamera({
          // center: currentCamera.center,
          // pitch: currentCamera.pitch ?? 55,
          // heading: currentCamera.heading ?? 0,
          zoom: zoomOption.zoom,
          // altitude: zoomOption.altitude,
        }, { duration: 200 });
      } catch (error) {
        if (currentLocation) {
          mapRef.current.animateCamera({
            center: currentLocation,
            // pitch: 55,
            zoom: zoomOption.zoom,
            // altitude: zoomOption.altitude,
          }, { duration: 200 });
        }
      }
    }
  };

  // Handle friend request
  // const handleSendFriendRequest = (recipientId: string | undefined, displayName: string) => {
  //   if (!recipientId) {
  //     Alert.alert('Error', 'Unable to identify user.');
  //     return;
  //   }

  //   setProcessingRequests(prev => new Set(prev).add(recipientId));
    
  //   const chatService = ChatService;
  //   chatService.emitEvent({
  //     eventName: 'sendFriendRequest',
  //     eventParameters: { receiverId: recipientId }
  //   });
  // };

  const handleSendFriendRequest = async (
    recipientId: string | undefined,
    displayName: string
  ) => {
    if (!recipientId) {
      Alert.alert('Error', 'Unable to identify user.');
      return;
    }

    try {
      setProcessingRequests(prev => new Set(prev).add(recipientId));

      const result = await dispatch(
        sendFriendRequest({ recipientId: Number(recipientId) })
      ).unwrap();

      console.log('✅ Friend request sent:', result);

      // update UI instantly
      setNearbyUsers(prev =>
        prev.map(user =>
          user.id === recipientId
            ? { ...user, friendRequestStatus: 'pending' }
            : user
        )
      );

      Alert.alert('Success', 'Friend request sent successfully!');
    } catch (error: any) {
      console.log('❌ Friend request error:', error);
      Alert.alert('Error', error || 'Failed to send friend request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipientId);
        return newSet;
      });
    }
  };

  // Handle accepting friend request
  const handleAcceptFriendRequest = (requesterId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requesterId));
    const chatService = ChatService;
    chatService.emitEvent({
      eventName: 'acceptFriendRequest',
      eventParameters: { requesterId }
    });
  };

  // Handle rejecting friend request
  const handleRejectFriendRequest = (requesterId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requesterId));
    const chatService = ChatService;
    chatService.emitEvent({
      eventName: 'rejectFriendRequest',
      eventParameters: { requesterId }
    });
  };

  // Check friend status for a user
  const getFriendStatus = (userId: string): 'accepted' | 'pending' | 'none' => {
    if (!currentUser) return 'none';

    const isFriend = currentUser.receivedFriendRequests?.some(
      (req: any) => req.requester.id === userId && req.status === 'accepted'
    );
    if (isFriend) return 'accepted';

    const isRequestSent = currentUser.sentFriendRequests?.some(
      (req: any) => req.receiverId === userId && req.status === 'pending'
    );
    if (isRequestSent) return 'pending';

    const isRequestReceived = currentUser.receivedFriendRequests?.some(
      (req: any) => req.requester.id === userId && req.status === 'pending'
    );
    if (isRequestReceived) return 'pending';

    return 'none';
  };

  // Render friend request button
  const renderFriendRequestButton = (userId: string) => {
    const status = getFriendStatus(userId);
    const isProcessing = processingRequests.has(userId);

    switch (status) {
      case 'accepted':
        return (
          <View style={styles.friendBadge}>
            <Text style={styles.friendBadgeText}>✓ Friends</Text>
          </View>
        );

      case 'pending':
        const isReceived = currentUser?.receivedFriendRequests?.some(
          (req: any) => req.requester.id === userId && req.status === 'pending'
        );
        
        if (isReceived) {
          return (
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptFriendRequest(userId)}
                disabled={isProcessing}
              >
                <Text style={styles.actionButtonText}>
                  {isProcessing ? '...' : 'Accept'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRejectFriendRequest(userId)}
                disabled={isProcessing}
              >
                <Text style={styles.actionButtonText}>
                  {isProcessing ? '...' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }
        
        return (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>⏳ Pending</Text>
          </View>
        );

      default:
        return (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSendFriendRequest(userId, 'User')}
            disabled={isProcessing}
          >
            <Text style={styles.addButtonText}>
              {isProcessing ? '...' : 'Add Friend'}
            </Text>
          </TouchableOpacity>
        );
    }
  };

  // Handle marker press - FIXED to properly show friend card
  const handleMarkerPress = (location: LocationMarker) => {
    console.log('📍 Marker pressed:', location);

    if (currentLocation) {
      setRouteOrigin(currentLocation);
    }

    if (location.isJournal) {
      setSelectedLocation(location);
      setSelectedNearbyUser(null);
    } else {
      const user = nearbyUsers.find(u => u.id === location.user?.id);

      if (user) {
        setSelectedNearbyUser(user);

        // 🔥 KEY FIX: create route destination
        setSelectedLocation({
          id: `route_user_${user.id}`,
          coordinate: {
            latitude: user.currentLatitude,
            longitude: user.currentLongitude,
          },
          title: user.displayname || user.username,
          description: 'Nearby hunter',
          type: 'user',
          isJournal: false,
          isSharedJournal: false, // Add this missing property
        });

        // Smooth camera focus
        // mapRef.current?.animateCamera({
        //   center: {
        //     latitude: user.currentLatitude,
        //     longitude: user.currentLongitude,
        //   },
        //   pitch: 45,
        //   zoom: 16,
        // }, { duration: 500 });
        mapRef.current?.animateToRegion({
          latitude: user.currentLatitude,
          longitude: user.currentLongitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    }

    setRouteDistance(null);
    setRouteDuration(null);
  };


  const getProfileImageUri = (profilePhotoPath: string | null | undefined) => {
    if (!profilePhotoPath) return require('../../assets/about_icon.png');
    const cleanPath = profilePhotoPath.replace(/^\.\/public\//, 'public/');
    return { uri: `${IMAGE_SERVER_BASE_URL}/${cleanPath}` };
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRad = (value: number) => (value * Math.PI) / 180;

    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const getUserDistance = (user: NearbyUser) => {
    if (user.distance) return user.distance;

    if (currentLocation) {
      return calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        user.currentLatitude,
        user.currentLongitude
      );
    }

    return null;
  };

  const handleMyLocationPress = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
        {/* <Text style={styles.loadingText}>Syncing hunt data & positions...</Text> */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.mapContainer}>
        {initialCamera && (
          <MapView
            // ref={mapRef}
            // provider={PROVIDER_GOOGLE}
            // style={styles.map}
            // initialCamera={initialCamera}
            // showsUserLocation={true}
            // showsMyLocationButton={false}
            // showsCompass={true}
            // zoomEnabled={true}
            // scrollEnabled={true}
            // pitchEnabled={true}
            // rotateEnabled={true}
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            mapType="terrain"
            initialRegion={{
              latitude: initialCamera.center.latitude,
              longitude: initialCamera.center.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}

            showsUserLocation={false}
            showsMyLocationButton={true}
            showsCompass={true}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                title="You are here"
                description="Your current location"
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={true}
              >
                <Image
                  source={require('../../assets/tab_0.png')}
                  style={{ width: 30, height: 30 }}
                  resizeMode="contain"
                />
              </Marker>
            )}
            
            {/* Render all markers (journals + nearby users) */}
            {/* Render all markers (journals + nearby users) */}
            {getAllMarkers().map((location) => (
              <Marker
                key={location.id}
                coordinate={location.coordinate}
                title={location.title}
                description={location.description}
                onPress={() => handleMarkerPress(location)}
                tracksViewChanges={true}
              >
                {location.isJournal ? (
                  // JOURNAL ICON
                  <Image
                    source={require('../../assets/about_icon.png')} // Your journal icon
                    style={{ width: 35, height: 35 }}
                    resizeMode="contain"
                  />
                ) : (
                  // NEARBY USER ICON
                  <Image
                    source={require('../../assets/people_hunt.png')} // Your user icon
                    style={{ width: 35, height: 35 }}
                    resizeMode="contain"
                  />
                )}
              </Marker>
            ))}

            {currentLocation && selectedLocation && (
              <MapViewDirections
                origin={routeOrigin}
                destination={selectedLocation.coordinate}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor="#0E713E"
                mode="DRIVING"
                precision="high"
                onReady={(result) => {
                  const miles = result.distance * 0.621371;
                  setRouteDistance(`${miles.toFixed(1)} mi`);
                  setRouteDuration(`${Math.ceil(result.duration)} mins`);

                  mapRef.current?.fitToCoordinates(result.coordinates, {
                    edgePadding: {
                      right: width / 10,
                      bottom: height / 3.0,
                      left: width / 10,
                      top: height / 6,
                    },
                    animated: false,
                  });

                  const midLat = (currentLocation.latitude + selectedLocation.coordinate.latitude) / 2;
                  const midLng = (currentLocation.longitude + selectedLocation.coordinate.longitude) / 2;

                  const latDelta = Math.abs(currentLocation.latitude - selectedLocation.coordinate.latitude);
                  const lngDelta = Math.abs(currentLocation.longitude - selectedLocation.coordinate.longitude);
                  const maxDelta = Math.max(latDelta, lngDelta);
                  
                  const targetAltitude = Math.max(1100, maxDelta * 135000);

                  setTimeout(() => {
                    mapRef.current?.animateCamera({
                      center: { latitude: midLat, longitude: midLng },
                      // pitch: 50,
                      // altitude: targetAltitude,
                      // heading: 0,
                    }, { duration: 600 });
                  }, 60);
                }}
                onError={(errorMessage) => {
                  console.error('Google Directions API Error: ', errorMessage);
                }}
              />
            )}
          </MapView>
        )}

        <View style={styles.overlayContainer}>
          <TopHeader 
            onMenuPress={() => setMenuOpen(true)}
            onSearchPress={() => navigation.navigate('HuntingJournal')}
            containerStyle={{ marginTop: 40, backgroundColor: 'transparent' }}
          />

          {/* Journal Info Card */}
          {selectedLocation && (
            <View style={styles.locationInfoCard}>
              <TouchableOpacity 
                style={styles.cardCloseCornerBtn} 
                onPress={() => {
                  setSelectedLocation(null);
                  setRouteDistance(null);
                  setRouteDuration(null);
                  setTimeout(() => centerToCurrentLocation(), 50);
                }}
              >
                <Text style={styles.cardCloseCornerText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.profileRow}>
                <View style={styles.profileTextContainer}>
                  <Text style={styles.journalSpotTitle}>
                    📍 {selectedLocation.title}
                  </Text>
                  
                  {routeDistance && routeDuration && (
                    <Text style={styles.routeDistanceBadge}>
                      🚗 {routeDistance} ({routeDuration}) away via road
                    </Text>
                  )}

                  <Text style={styles.locationInfoDesc} numberOfLines={2}>
                    "{selectedLocation.description || 'No description recorded.'}"
                  </Text>
                  {selectedLocation.weather && (
                    <Text style={styles.weatherInfoText}>
                      🌤️ {selectedLocation.weather}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Nearby User Info Card - FIXED to show properly */}
          {selectedNearbyUser && (
            <View style={[styles.locationInfoCard, styles.userInfoCard]}>
              <TouchableOpacity 
                style={styles.cardCloseCornerBtn} 
                onPress={() => {
                  setSelectedNearbyUser(null);
                  setTimeout(() => centerToCurrentLocation(), 50);
                }}
              >
                <Text style={styles.cardCloseCornerText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.profileRow}>
                <View style={styles.nearbyUserAvatarLarge}>
                  {selectedNearbyUser.profilePicture ? (
                    <Image 
                      source={{ uri: selectedNearbyUser.profilePicture }} 
                      style={styles.nearbyUserImageLarge} 
                    />
                  ) : (
                    <View style={styles.nearbyUserInitialLarge}>
                      <Text style={styles.nearbyUserInitialTextLarge}>
                        {selectedNearbyUser.displayname?.charAt(0) || selectedNearbyUser.username?.charAt(0) || '?'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.profileTextContainer}>
                  <Text style={styles.locationInfoTitle}>
                    {selectedNearbyUser.displayname || selectedNearbyUser.username}
                  </Text>
                  {/* <Text style={styles.userDistanceText}>
                    📍 {selectedNearbyUser.distance?.toFixed(1)}km away
                  </Text> */}
                  <Text style={styles.userDistanceText}>
                  📍 {(() => {
                    const d = getUserDistance(selectedNearbyUser);
                    return d ? `${(d * 0.621371).toFixed(1)} mi away` : 'Distance unavailable';
                  })()}
                </Text>
                  <Text style={styles.userLocationText}>
                    Lat: {selectedNearbyUser.currentLatitude.toFixed(4)}, Lng: {selectedNearbyUser.currentLongitude.toFixed(4)}
                  </Text>
                  <View style={styles.friendActionContainer}>
                    {renderFriendRequestButton(selectedNearbyUser.id)}
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={{ marginTop: 'auto', marginBottom: 10, width: '100%' }}>
            <View style={styles.sliderContainer}>
              <Slider
                style={{ width: '100%', height: 30 }}
                minimumValue={0.1}
                maximumValue={0.5}
                step={0.1}
                value={currentZoom}
                onValueChange={handleZoomChange}
                minimumTrackTintColor="#0E713E"
                maximumTrackTintColor="#4D3626"
                thumbTintColor="#4D3626"
              />
            </View>
            
            <View style={styles.zoomPresets}>
              {ZOOM_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.zoomPresetButton,
                    currentZoom === option.value && styles.zoomPresetButtonActive
                  ]}
                  onPress={() => handleZoomChange(option.value)}
                >
                  <Text style={[
                    styles.zoomPresetText,
                    currentZoom === option.value && styles.zoomPresetTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.myLocationButton}
            onPress={handleMyLocationPress}
          >
            <Image 
              source={require('../../assets/location_green.png')} // Add your own icon
              style={styles.myLocationIcon}
            />
          </TouchableOpacity>

          <BottomTabNav containerStyle={{ marginBottom: 15 }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#0E713E', marginTop: 10, fontSize: 14 },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  overlayContainer: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  sliderContainer: { 
    width: '100%', 
    alignItems: 'center',
  },
  zoomPresets: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    marginTop: 0, 
    gap: 8 
  },
  zoomPresetButton: { 
    flex: 1, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  zoomPresetButtonActive: {},
  zoomPresetText: { 
    color: '#4D3626', 
    fontSize: 14 
  },
  zoomPresetTextActive: { 
    fontWeight: 'bold' 
  },
  locationInfoCard: {
    backgroundColor: 'rgba(15, 15, 15, 0.98)',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#0E713E',
    top: 15,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  userInfoCard: {
    borderColor: '#007AFF', // Different border color for user cards
  },
  cardCloseCornerBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 100,
    padding: 4,
  },
  cardCloseCornerText: {
    color: '#999',
    fontSize: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingRight: 20,
  },
  profileTextContainer: {
    flex: 1,
  },
  locationInfoTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  journalSpotTitle: {
    color: '#0E713E',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  routeDistanceBadge: {
    color: '#FFF',
    backgroundColor: '#0E713E',
    fontSize: 11,
    fontWeight: '700',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 5,
    overflow: 'hidden',
  },
  locationInfoDesc: {
    color: '#CCC',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  weatherInfoText: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  userDistanceText: {
    color: '#0E713E',
    fontSize: 12,
    marginTop: 4,
  },
  userLocationText: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  friendActionContainer: {
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  friendBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  friendBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  nearbyUsersContainer: {
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#0E713E',
  },
  nearbyUsersTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  nearbyUserCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    width: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nearbyUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: '#222',
  },
  nearbyUserImage: {
    width: 50,
    height: 50,
  },
  nearbyUserInitial: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0E713E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyUserInitialText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  nearbyUserName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  nearbyUserDistance: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  nearbyUserAction: {
    marginTop: 6,
  },
  nearbyUserAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: '#222',
  },
  nearbyUserImageLarge: {
    width: 60,
    height: 60,
  },
  nearbyUserInitialLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0E713E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyUserInitialTextLarge: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  myLocationButton: {
    position: 'absolute',
    right: 20,
    bottom: 180, // Adjust based on your layout
    backgroundColor: '#FFF',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  myLocationIcon: {
    width: 24,
    height: 24,
    tintColor: '#0E713E',
  },
});

export default HomeScreen;