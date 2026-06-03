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
  Region,
  LatLng,
} from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import Slider from '@react-native-community/slider';
import SideMenu from '../components/SideMenu';
import TopHeader from '../components/TopHeader';
import BottomTabNav from '../components/BottomTabNav';

const { width, height } = Dimensions.get('window');

interface LocationMarker {
  id: string;
  coordinate: LatLng;
  title: string;
  description: string;
  type: 'hunter' | 'animal' | 'safeZone' | 'dangerZone' | 'poi' | 'default';
}

const SAMPLE_LOCATIONS: LocationMarker[] = [
  {
    id: '1',
    coordinate: { latitude: 24.868207, longitude: 67.057658 },
    title: 'Your Current Position',
    description: 'Your current location',
    type: 'default',
  },
  {
    id: '2',
    coordinate: { latitude: 24.869500, longitude: 67.058800 },
    title: 'Hunting Spot Alpha',
    description: 'Good hunting area with recent tracks',
    type: 'default',
  },
  {
    id: '3',
    coordinate: { latitude: 24.870000, longitude: 67.056500 },
    title: 'Water Source',
    description: 'Fresh water location for animals',
    type: 'default',
  },
];

const ZOOM_OPTIONS = [
  { label: '0.1km', value: 0.1, latitudeDelta: 0.001 },
  { label: '0.2km', value: 0.2, latitudeDelta: 0.002 },
  { label: '0.3km', value: 0.3, latitudeDelta: 0.003 },
  { label: '0.4km', value: 0.4, latitudeDelta: 0.004 },
  { label: '0.5km', value: 0.5, latitudeDelta: 0.005 },
];

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(0.3);
  const [currentZoomLabel, setCurrentZoomLabel] = useState('0.3km');
  const [locations] = useState<LocationMarker[]>(SAMPLE_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationMarker | null>(null);
  const [showAllMarkers] = useState(true);
  const [filterType] = useState<string | null>(null);
  
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

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
        console.log(`✅ Location Fetched (HighAccuracy=${highAccuracy}):`, latitude, longitude);
        
        setCurrentLocation({ latitude, longitude });
        setLocationLoaded(true);
        
        const region = {
          latitude,
          longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        };
        setInitialRegion(region);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.log(`❌ Location Error (HighAccuracy=${highAccuracy}):`, err.code, err.message);
        
        if (highAccuracy) {
          console.log('🔄 Attempting cellular location fallback tracker...');
          getCurrentLocation(false);
        } else {
          setError(`Unable to get location: ${err.message}`);
          setLoading(false);
          setDefaultLocation();
        }
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 10000 : 20000,
        maximumAge: 5000,
      }
    );
  };

  const setDefaultLocation = () => {
    const defaultLoc = { latitude: 24.8607, longitude: 67.0011 };
    setCurrentLocation(defaultLoc);
    setLocationLoaded(true);
    setInitialRegion({
      latitude: defaultLoc.latitude,
      longitude: defaultLoc.longitude,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
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
      const region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      };
      mapRef.current.animateToRegion(region, 500);
    }
  };

  const handleZoomChange = (value: number) => {
    const roundedValue = Math.round(value * 10) / 10;
    const zoomOption = ZOOM_OPTIONS.find(opt => opt.value === roundedValue);
    
    if (zoomOption && mapRef.current && currentLocation) {
      setCurrentZoom(roundedValue);
      setCurrentZoomLabel(zoomOption.label);
      
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: zoomOption.latitudeDelta,
        longitudeDelta: zoomOption.latitudeDelta,
      };
      
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <View style={styles.mapContainer}>
        {initialRegion && (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={initialRegion}
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
                onPress={() => setSelectedLocation(location)}
              >
                <Image
                  source={require('../../assets/about_icon.png')}
                  style={{ width: 30, height: 30 }}
                  resizeMode="contain"
                />
              </Marker>
            ))}
          </MapView>
        )}

        <View style={styles.overlayContainer}>
          <TopHeader 
            onMenuPress={() => setMenuOpen(true)}
            onSearchPress={() => navigation.navigate('HuntingJournal')}
            containerStyle={{ marginTop: 40, backgroundColor: 'transparent' }}
          />

          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              {currentLocation ? 
                `📍 ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` : 
                '📍 Waiting for location...'}
            </Text>
            {error && <Text style={styles.errorDebugText}>⚠️ {error}</Text>}
          </View>

          <View style={styles.mapFrame}>
            <View style={styles.sliderContainer}>
              <Text style={styles.zoomLabel}>Zoom: {currentZoomLabel}</Text>
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

            {selectedLocation && (
              <View style={styles.locationInfoCard}>
                <Text style={styles.locationInfoTitle}>{selectedLocation.title}</Text>
                <Text style={styles.locationInfoDesc}>{selectedLocation.description}</Text>
                <View style={styles.locationInfoActions}>
                  <TouchableOpacity style={styles.centerBtn} onPress={centerToCurrentLocation}>
                    <Text style={styles.centerBtnText}>Center</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedLocation(null)}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <BottomTabNav containerStyle={{ marginBottom: 30 }}/>
        </View>

        <TouchableOpacity style={styles.locationButton} onPress={centerToCurrentLocation}>
          <Image source={require('../../assets/location_icon.png')} style={styles.locationIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  loadingText: { color: '#FFF', marginTop: 10, fontSize: 16 },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  overlayContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', paddingHorizontal: 25 },
  debugContainer: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 8, borderRadius: 10, marginTop: 100, alignItems: 'center' },
  debugText: { color: '#4CAF50', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  errorDebugText: { color: '#F44336', fontSize: 10, marginTop: 4 },
  mapFrame: { flex: 1, marginBottom: 80, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 30, backgroundColor: 'rgba(48, 78, 24, 0.3)', justifyContent: 'flex-end', alignItems: 'center', padding: 15 },
  sliderContainer: { width: '100%', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 15, padding: 15, marginBottom: 10 },
  zoomLabel: { color: '#FFF', fontSize: 12, marginBottom: 5 },
  zoomPresets: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10, gap: 8 },
  zoomPresetButton: { flex: 1, backgroundColor: '#4D3626', paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  zoomPresetButtonActive: { backgroundColor: '#0E713E' },
  zoomPresetText: { color: '#FFF', fontSize: 10 },
  zoomPresetTextActive: { fontWeight: 'bold' },
  locationInfoCard: { backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: 15, padding: 12, marginTop: 10, width: '100%' },
  locationInfoTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  locationInfoDesc: { color: '#CCC', fontSize: 11, marginTop: 4 },
  locationInfoActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 10 },
  centerBtn: { backgroundColor: '#0E713E', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  centerBtnText: { color: '#FFF', fontSize: 11 },
  closeBtn: { backgroundColor: '#F44336', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  closeBtnText: { color: '#FFF', fontSize: 11 },
  locationButton: { position: 'absolute', bottom: 100, right: 30, backgroundColor: '#FFF', padding: 12, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, zIndex: 10 },
  locationIcon: { width: 24, height: 24, tintColor: '#0E713E' },
});

export default HomeScreen;