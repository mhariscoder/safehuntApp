import React, { useState, useRef, useEffect } from 'react';
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
import { getAllJournals } from './../features/huntingJournal/huntingJournalActions'; 
// ADDED: Import your friend action thunk
import { sendFriendRequest } from './../features/friends/friendsActions'; 

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
    bio: string;
    huntingExperience: string;
    skills: string[];
  };
}

const ZOOM_OPTIONS = [
  { label: '0.1km', value: 0.1, altitude: 300, zoom: 18.5 },
  { label: '0.2km', value: 0.2, altitude: 600, zoom: 17.5 },
  { label: '0.3km', value: 0.3, altitude: 1000, zoom: 16.5 },
  { label: '0.4km', value: 0.4, altitude: 1500, zoom: 15.5 },
  { label: '0.5km', value: 0.5, altitude: 2200, zoom: 14.5 },
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
  
  // ADDED: Inline UI loading indicator targeting only the targeted request button
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);

  const { journals, loading: journalsLoading } = useSelector((state: any) => state.huntingJournal || { journals: [], loading: false });

  useEffect(() => {
    const initializeApp = async () => {
      await requestLocationPermission();
      fetchBackendJournals();
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (journals && journals.length > 0) {
      const parsedMarkers: LocationMarker[] = journals.map((item: any) => ({
        id: String(item.id),
        coordinate: {
          latitude: parseFloat(item.location?.latitude || '0'),
          longitude: parseFloat(item.location?.longitude || '0'),
        },
        title: item.title || 'Untitled Spot',
        description: item.description || '',
        type: item.type || 'default',
        weather: item.weather,
        user: item.user ? {
          id: String(item.user.id), // Managed as a string reference matching interface
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
    }
  }, [journals]);

  const fetchBackendJournals = () => {
    dispatch(getAllJournals())
      .unwrap()
      .then((res: any) => {
        const recordCount = res?.data?.length ?? res?.length ?? 0;
        console.log('Successfully synced API records count:', recordCount);
      })
      .catch((err: any) => {
        console.error('Error fetching journals:', err);
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
          getCurrentLocation(true);
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
      getCurrentLocation(true);
    }
  };

  const getCurrentLocation = (highAccuracy: boolean) => {
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
        if (highAccuracy) {
          getCurrentLocation(false);
        } else {
          setError(`Unable to get location: ${err.message}`);
          setLoading(false);
          setDefaultLocation();
        }
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 5000,
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

  // FIXED: Integrated dynamic handling logic executing dispatch parameters using async thunks
  const handleSendFriendRequest = (recipientId: string | undefined, displayName: string) => {
    if (!recipientId) {
      Alert.alert('Error', 'Unable to resolve specific hunter identification context.');
      return;
    }

    setSendingRequestId(recipientId);

    // Dispatching request dynamic payload parameter mapping to expected thunk configuration
    dispatch(sendFriendRequest({ recipientId }))
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

  if (loading || journalsLoading) {
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
                pinColor="#0E713E"
              />
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

          <View style={styles.mapFrame}>
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
                  <Image 
                    source={getProfileImageUri(selectedLocation.user?.profilePhoto)} 
                    style={styles.profileAvatar}
                  />
                  <View style={styles.profileTextContainer}>
                    <Text style={styles.locationInfoTitle}>
                      {selectedLocation.user?.displayname || 'Anonymous Hunter'}
                    </Text>
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

                <View style={styles.locationInfoActions}>
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
                </View>
              </View>
            )}

            <Slider
              style={{width: '100%', height: 40}} 
              minimumValue={0.1}
              maximumValue={0.5}
              step={0.1}
              value={currentZoom}
              onValueChange={handleZoomChange}
              minimumTrackTintColor="#0E713E"
              maximumTrackTintColor="#4D3626"
              thumbTintColor="#FFF"
            />
            
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

          <BottomTabNav containerStyle={{ marginBottom: 30 }}/>
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
  overlayContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', paddingHorizontal: 25 },
  mapFrame: { flex: 1, marginBottom: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 30, backgroundColor: 'rgba(48, 78, 24, 0.15)', justifyContent: 'flex-end', alignItems: 'center', padding: 15, position: 'relative' },
  sliderContainer: { width: '100%', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 15, padding: 15, marginBottom: 10 },
  zoomLabel: { color: '#FFF', fontSize: 12, marginBottom: 5 },
  zoomPresets: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 0, gap: 8 },
  zoomPresetButton: { flex: 1, backgroundColor: '#4D3626', paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  zoomPresetButtonActive: { backgroundColor: '#0E713E' },
  zoomPresetText: { color: '#FFF', fontSize: 10 },
  zoomPresetTextActive: { fontWeight: 'bold' },
  locationInfoCard: {
    backgroundColor: 'rgba(15, 15, 15, 0.98)',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#0E713E',
    position: 'absolute',
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
  locationButton: { 
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 30, 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 3.84, 
    zIndex: 10,
    alignSelf: 'flex-end',
    marginRight: 5,
    marginBottom: 5,
  },
  locationIcon: { width: 24, height: 24, tintColor: '#0E713E' },
});

export default HomeScreen;