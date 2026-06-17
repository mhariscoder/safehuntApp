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
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  LatLng,
} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions'; 
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import Slider from '@react-native-community/slider';

import { useDispatch, useSelector } from 'react-redux';
import { getMyJournals } from './../features/huntingJournal/huntingJournalActions'; // 🔥 Swapped to your custom active API action
import { sendFriendRequest } from './../features/friends/friendsActions'; 
import { updateLocation } from './../features/chat/chatActions'; 
import { connectSocket, disconnectSocket } from './../features/chat/chatActions'; 

import SideMenu from '../components/SideMenu';
import TopHeader from '../components/TopHeader';
import BottomTabNav from '../components/BottomTabNav';

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
  user?: {
    id: string;
    displayname: string;
    username: string;
    email: string;
    profilePhoto: string | null;
    io: string;
    huntingExperience: string;
    skills: string[];
  };
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
  
  const [locations, setLocations] = useState<LocationMarker[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationMarker | null>(null);
  const [showAllMarkers] = useState(true);
  const [filterType] = useState<string | null>(null);

  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);
  const watchIdRef = useRef<number | null>(null);
  const locationUpdateTimeoutRef = useRef<any>(null);

  // ✂️ Removed huntingJournal selectors completely
  const { isConnected: socketConnected } = useSelector((state: any) => state.chat || { isConnected: false });
  const currentUserId = useSelector((state: any) => state.auth?.user?.id);

  useEffect(() => {
    if (currentUserId) {
      console.log('🏠 HomeScreen: Initializing socket connection for user:', currentUserId);
      dispatch(connectSocket({ receiverUserId: currentUserId.toString() }));
    }

    return () => {
      console.log('🏠 HomeScreen: Cleaning up socket connection');
      if (locationUpdateTimeoutRef.current) {
        clearTimeout(locationUpdateTimeoutRef.current);
      }
      dispatch(disconnectSocket());
    };
  }, [currentUserId, dispatch]);

  useEffect(() => {
    const initializeApp = async () => {
      await requestLocationPermission();
      fetchMyJournalsData(); // 🔥 Call the updated API integration wrapper
    };
    initializeApp();

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const debouncedLocationUpdate = useCallback((location: LatLng) => {
    if (locationUpdateTimeoutRef.current) {
      clearTimeout(locationUpdateTimeoutRef.current);
    }

    locationUpdateTimeoutRef.current = setTimeout(() => {
      if (location && currentUserId && socketConnected) {
        console.log('📍 Sending location update:', location);
        dispatch(updateLocation({
          userId: Number(currentUserId), 
          latitude: location.latitude,
          longitude: location.longitude
        }))
        .unwrap()
        .then(() => console.log('✅ Live telemetry coordinates pushed successfully.'))
        .catch((err: any) => {
          console.log('⚠️ Telemetry push failed:', err?.message || err);
        });
      }
    }, 1000);
  }, [currentUserId, socketConnected, dispatch]);

  // useEffect(() => {
  //   if (currentLocation && currentUserId && socketConnected) {
  //     debouncedLocationUpdate(currentLocation);
  //   }
  // }, [currentLocation, currentUserId, socketConnected, debouncedLocationUpdate]);

  // 🔥 Dynamically loads maps parameters from your custom target getMyJournals payload structure
  const fetchMyJournalsData = () => {
    dispatch(getMyJournals({ page: 1, limit: 10 }))
      .unwrap()
      .then((res: any) => {
        const backendData = res?.data || res || [];
        console.log('Successfully synced My Journals API context records:', backendData.length);
        
        const parsedMarkers: LocationMarker[] = backendData.map((item: any) => ({
          id: String(item.id),
          coordinate: {
            latitude: parseFloat(item.location?.latitude || item.latitude || '0'),
            longitude: parseFloat(item.location?.longitude || item.longitude || '0'),
          },
          title: item.title || 'My Hunting Spot',
          description: item.description || '',
          type: item.type || 'default',
          weather: item.weather,
          user: item.user ? {
            id: String(item.user.id), 
            displayname: item.user.displayname,
            username: item.user.username,
            email: item.user.email,
            profilePhoto: item.user.profilePhoto,
            bio: item.user.bio,
            huntingExperience: item.user.huntingExperience,
            skills: item.user.skills || [],
          } : undefined
        }));
        
        setLocations(parsedMarkers);
      })
      .catch((err: any) => {
        console.error('Error executing custom journals call:', err);
      });
  };

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
          pitch: 55,       
          heading: 0,      
          altitude: 1000,  
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
              pitch: 55, heading: 0, altitude: 1000, zoom: 16.5
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
      pitch: 55,
      heading: 0,
      altitude: 1500,
      zoom: 15,
    });
    setLoading(false);
  };

  const getFilteredLocations = () => {
    if (!showAllMarkers) return [];
    if (filterType) {
      return locations.filter(loc => loc.type === filterType);
    }
    return locations;
  };

  const centerToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        pitch: 55, 
        zoom: 16.5,
        heading: 0,
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
          center: currentCamera.center,
          pitch: currentCamera.pitch ?? 55,
          heading: currentCamera.heading ?? 0,
          zoom: zoomOption.zoom,        
          altitude: zoomOption.altitude, 
        }, { duration: 200 });
      } catch (error) {
        if (currentLocation) {
          mapRef.current.animateCamera({
            center: currentLocation,
            pitch: 55,
            zoom: zoomOption.zoom,
            altitude: zoomOption.altitude,
          }, { duration: 200 });
        }
      }
    }
  };

  const handleSendFriendRequest = (recipientId: string | undefined, displayName: string) => {
    if (!recipientId) {
      Alert.alert('Error', 'Unable to resolve hunter identification context.');
      return;
    }

    setSendingRequestId(recipientId);

    dispatch(sendFriendRequest({ recipientId } as any))
      .unwrap()
      .then(() => {
        Alert.alert('Request Sent', `Friend request successfully sent to ${displayName}`);
      })
      .catch((errorMessage: string) => {
        Alert.alert('Failed to Send', errorMessage);
      })
      .finally(() => {
        setSendingRequestId(null);
      });
  };

  const getProfileImageUri = (profilePhotoPath: string | null | undefined) => {
    if (!profilePhotoPath) return require('../../assets/about_icon.png');
    const cleanPath = profilePhotoPath.replace(/^\.\/public\//, 'public/');
    return { uri: `${IMAGE_SERVER_BASE_URL}/${cleanPath}` };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
        <Text style={styles.loadingText}>Syncing hunt data & positions...</Text>
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
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialCamera={initialCamera} 
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true} 
            rotateEnabled={true}
          >
            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                title="You are here"
                description="Your current location"
              >
                <Image
                  source={require('../../assets/tab_0.png')}
                  style={{ width: 30, height: 30 }}
                  resizeMode="contain"
                />
              </Marker>
            )}
            
            {getFilteredLocations().map((location) => (
              <Marker
                key={location.id}
                coordinate={location.coordinate}
                title={location.title}
                description={location.description}
                onPress={() => {
                  setSelectedLocation(location);
                  setRouteDistance(null);
                  setRouteDuration(null);
                }}
              >
                <Image
                  source={require('../../assets/about_icon.png')}
                  style={{ width: 30, height: 30 }}
                  resizeMode="contain"
                />
              </Marker>
            ))}

            {currentLocation && selectedLocation && (
              <MapViewDirections
                origin={currentLocation}
                destination={selectedLocation.coordinate}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor="#0E713E"
                mode="DRIVING" 
                precision="high"
                onReady={(result) => {
                  setRouteDistance(`${result.distance.toFixed(1)} km`);
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
                      pitch: 50, 
                      altitude: targetAltitude,
                      heading: 0,
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

          {/* <View style={styles.mapFrame}> */}
            {selectedLocation && (
              <View style={styles.locationInfoCard}>
                <TouchableOpacity 
                  style={styles.cardCloseCornerBtn} 
                  onPress={() => {
                    setSelectedLocation(null);
                    setRouteDistance(null);
                    setRouteDuration(null);
                    
                    setTimeout(() => {
                      centerToCurrentLocation();
                    }, 50);
                  }}
                >
                  <Text style={styles.cardCloseCornerText}>✕</Text>
                </TouchableOpacity>

                <View style={styles.profileRow}>
                  {/* <Image 
                    source={getProfileImageUri(selectedLocation.user?.profilePhoto)} 
                    style={styles.profileAvatar}
                  /> */}
                  <View style={styles.profileTextContainer}>
                    {/* <Text style={styles.locationInfoTitle}>
                      {selectedLocation.user?.displayname || 'Anonymous Hunter'}
                    </Text> */}
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

                {/* <View style={styles.locationInfoActions}>
                  <TouchableOpacity 
                    style={[
                      styles.friendRequestBtn,
                      sendingRequestId === selectedLocation.user?.id && styles.friendRequestBtnDisabled
                    ]} 
                    disabled={sendingRequestId === selectedLocation.user?.id}
                    onPress={() => handleSendFriendRequest(
                      selectedLocation.user?.id, 
                      selectedLocation.user?.displayname || 'User'
                    )}
                  >
                    {sendingRequestId === selectedLocation.user?.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.friendRequestBtnText}>Send Friend Request</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.centerBtn} 
                    onPress={() => {
                      if (mapRef.current) {
                        mapRef.current.animateCamera({
                          center: selectedLocation.coordinate,
                          pitch: 60, 
                          heading: 45, 
                          zoom: 16.5, 
                        }, { duration: 600 });
                      }
                    }}
                  >
                    <Text style={styles.centerBtnText}>Focus Spot</Text>
                  </TouchableOpacity>
                </View> */}
              </View>
            )}

          <View style={{ marginTop: 'auto', marginBottom: 10, width: '100%' }}>
            <View style={styles.sliderContainer}>
              {/* <Text style={styles.zoomLabel}>Map Range Metric: {currentZoomLabel}</Text> */}
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
          {/* </View> */}

          <BottomTabNav containerStyle={{ marginBottom: 15 }}/>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  loadingText: { color: '#FFF', marginTop: 10, fontSize: 14 },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  overlayContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', paddingHorizontal: 20 },
  mapFrame: { flex: 1, marginBottom: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 30, backgroundColor: 'rgba(48, 78, 24, 0.15)', justifyContent: 'flex-end', alignItems: 'center', padding: 15, position: 'relative' },
  sliderContainer: { 
    width: '100%', 
    alignItems: 'center', 
    // backgroundColor: 'rgba(0,0,0,0.75)', 
    borderRadius: 12, 
    // paddingVertical: 8, 
    // paddingHorizontal: 12, 
    // marginBottom: 10 
  },
  zoomLabel: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  zoomPresets: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 0, gap: 8 },
  zoomPresetButton: { flex: 1, borderRadius: 8, alignItems: 'center' },
  zoomPresetButtonActive: { 
    // backgroundColor: '#0E713E' 
  },
  zoomPresetText: { color: '#4D3626', fontSize: 14 },
  zoomPresetTextActive: { fontWeight: 'bold' },
  locationInfoCard: {
    backgroundColor: 'rgba(15, 15, 15, 0.98)',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#0E713E',
    // position: 'absolute',
    top: 15,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
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
  profileAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#222',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#0E713E',
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
  locationInfoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  friendRequestBtn: {
    flex: 2,
    backgroundColor: '#0E713E',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  friendRequestBtnDisabled: {
    backgroundColor: '#1E462F',
    opacity: 0.8,
  },
  friendRequestBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerBtn: {
    flex: 1,
    backgroundColor: '#4D3626',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  centerBtnText: {
    color: '#FFF',
    fontSize: 12,
  },
});

export default HomeScreen;