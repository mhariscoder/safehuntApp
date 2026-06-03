import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Alert,
  Linking,
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Region,
  LatLng,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');

// Define all marker images (only keeping the ones that exist)
const MARKER_IMAGES = {
  default: require('../../assets/about_icon.png'),
  currentLocation: require('../../assets/user_marker.png'),
};

// Define location types
interface LocationMarker {
  id: string;
  coordinate: LatLng;
  title: string;
  description: string;
  type: 'hunter' | 'animal' | 'safeZone' | 'dangerZone' | 'poi' | 'default';
  image?: any;
}

// Sample locations data
const SAMPLE_LOCATIONS: LocationMarker[] = [
  {
    id: '1',
    coordinate: { latitude: 24.8607, longitude: 67.0011 },
    title: 'Hunter Base',
    description: 'Main hunting camp',
    type: 'hunter',
  },
  {
    id: '2',
    coordinate: { latitude: 24.8620, longitude: 67.0030 },
    title: 'Deer Spotted',
    description: 'Recent animal sighting',
    type: 'animal',
  },
  {
    id: '3',
    coordinate: { latitude: 24.8590, longitude: 67.0000 },
    title: 'Safe Zone',
    description: 'Protected area',
    type: 'safeZone',
  },
  {
    id: '4',
    coordinate: { latitude: 24.8615, longitude: 67.0025 },
    title: 'Danger Area',
    description: 'High risk zone',
    type: 'dangerZone',
  },
  {
    id: '5',
    coordinate: { latitude: 24.8585, longitude: 67.0015 },
    title: 'Water Source',
    description: 'Fresh water location',
    type: 'poi',
  },
];

// Zoom options
const ZOOM_OPTIONS = [
  { label: '0.1km', value: 0.1, latitudeDelta: 0.001 },     // 100 meters view
  { label: '0.2km', value: 0.2, latitudeDelta: 0.002 },     // 200 meters view
  { label: '0.3km', value: 0.3, latitudeDelta: 0.003 },     // 300 meters view
  { label: '0.4km', value: 0.4, latitudeDelta: 0.004 },     // 400 meters view
  { label: '0.5km', value: 0.5, latitudeDelta: 0.005 },     // 500 meters view
];

const MapTestScreen = () => {
  const [mapReady, setMapReady] = useState(false);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useGoogleProvider, setUseGoogleProvider] = useState(true);
  const [lastTap, setLastTap] = useState<LatLng | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [is3DEnabled, setIs3DEnabled] = useState(false);
  const [pitchAngle, setPitchAngle] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(0.3);
  const [currentZoomLabel, setCurrentZoomLabel] = useState('0.3km');
  const [locations, setLocations] = useState<LocationMarker[]>(SAMPLE_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<LocationMarker | null>(null);
  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);
  
  const mapRef = useRef<MapView>(null);
  const locationTimeoutRef = useRef<any>(null);
  const is3DOperationRef = useRef(false);

  useEffect(() => {
    const initLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        getCurrentLocationWithRetry();
      } else {
        setError('Location permission denied. Please enable location in settings.');
        setLoading(false);
      }
    };
    
    initLocation();

    return () => {
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Safe Hunt needs access to your location to show nearby hunters.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const getCurrentLocationWithRetry = () => {
    setError(null);
    setLoading(true);
    
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }
    
    locationTimeoutRef.current = setTimeout(() => {
      if (loading && !locationLoaded) {
        console.log('Location request timeout, retrying...');
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          getCurrentLocationWithRetry();
        } else {
          setError('Unable to get your location. Please check your GPS settings.');
          setLoading(false);
          showLocationSettingsAlert();
        }
      }
    }, 15000);
    
    getCurrentLocation();
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      Geolocation.getCurrentPosition(
        position => {
          if (locationTimeoutRef.current) {
            clearTimeout(locationTimeoutRef.current);
          }

          const { latitude, longitude } = position.coords;

          console.log('LOCATION SUCCESS:', position);

          const zoomOption = ZOOM_OPTIONS.find(
            item => item.value === 0.3,
          );

          const region = {
            latitude,
            longitude,
            latitudeDelta: zoomOption?.latitudeDelta ?? 0.003,
            longitudeDelta: zoomOption?.latitudeDelta ?? 0.003,
          };

          setCurrentLocation({ latitude, longitude });
          setInitialRegion(region);
          setLocationLoaded(true);
          setRetryCount(0);
          setCurrentZoom(0.3);
          setCurrentZoomLabel('0.3km');
          setLoading(false);
        },
        error => {
          console.log(
            'LOCATION ERROR:',
            JSON.stringify(error, null, 2),
          );

          setLoading(false);

          switch (error.code) {
            case 1:
              setError('Location permission denied');
              break;

            case 2:
              setError(
                'Location unavailable. Enable GPS and try again.',
              );
              break;

            case 3:
              setError('Location request timed out');
              break;

            default:
              setError(error.message || 'Unknown location error');
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000,
          distanceFilter: 0,
        },
      );
    } catch (e) {
      console.log('LOCATION EXCEPTION:', e);
      setLoading(false);
      setError('Failed to get current location');
    }
  };

  const showLocationSettingsAlert = () => {
    Alert.alert(
      'Location Required',
      'Please enable location services to use this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        }},
      ]
    );
  };

  // Get marker color based on type (using colored circles instead of images)
  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'hunter':
        return '#FF6B6B';
      case 'animal':
        return '#4ECDC4';
      case 'safeZone':
        return '#45B7D1';
      case 'dangerZone':
        return '#FF4757';
      case 'poi':
        return '#FFA502';
      default:
        return '#747d8c';
    }
  };

  // Get marker emoji based on type
  const getMarkerEmoji = (type: string) => {
    switch (type) {
      case 'hunter':
        return '🏹';
      case 'animal':
        return '🦌';
      case 'safeZone':
        return '✓';
      case 'dangerZone':
        return '⚠️';
      case 'poi':
        return '📍';
      default:
        return '📍';
    }
  };

  // Filter locations based on selected type
  const getFilteredLocations = () => {
    if (!showAllMarkers) return [];
    if (filterType) {
      return locations.filter(loc => loc.type === filterType);
    }
    return locations;
  };

  // Add new location
  const addLocation = (coordinate: LatLng, type: LocationMarker['type'], title: string) => {
    const newLocation: LocationMarker = {
      id: Date.now().toString(),
      coordinate,
      title,
      description: `Added on ${new Date().toLocaleString()}`,
      type,
    };
    setLocations([...locations, newLocation]);
    Alert.alert('Location Added', `${title} has been added to the map.`);
  };

  // Remove location
  const removeLocation = (id: string) => {
    Alert.alert(
      'Remove Location',
      'Are you sure you want to remove this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setLocations(locations.filter(loc => loc.id !== id));
            if (selectedLocation?.id === id) {
              setSelectedLocation(null);
            }
          }
        }
      ]
    );
  };

  // Center to specific location
  const centerToLocation = (coordinate: LatLng) => {
    if (mapRef.current) {
      const zoomOption = ZOOM_OPTIONS.find(opt => opt.value === currentZoom);
      const region = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: zoomOption?.latitudeDelta || 0.003,
        longitudeDelta: zoomOption?.latitudeDelta || 0.003,
      };
      mapRef.current.animateToRegion(region, 500);
    }
  };

  // Zoom control functions
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

  const setZoomLevel = (zoomValue: number, zoomLabel: string) => {
    setCurrentZoom(zoomValue);
    setCurrentZoomLabel(zoomLabel);
    
    if (mapRef.current && currentLocation) {
      const zoomOption = ZOOM_OPTIONS.find(opt => opt.value === zoomValue);
      if (zoomOption) {
        const newRegion = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: zoomOption.latitudeDelta,
          longitudeDelta: zoomOption.latitudeDelta,
        };
        
        mapRef.current.animateToRegion(newRegion, 300);
      }
    }
  };

  const centerToCurrentLocation = () => {
    if (currentLocation) {
      is3DOperationRef.current = true;
      
      setIs3DEnabled(false);
      setPitchAngle(0);
      
      const zoomOption = ZOOM_OPTIONS.find(opt => opt.value === currentZoom);
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: zoomOption?.latitudeDelta || 0.003,
        longitudeDelta: zoomOption?.latitudeDelta || 0.003,
      };
      
      setInitialRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
      
      setTimeout(() => {
        is3DOperationRef.current = false;
      }, 600);
    } else {
      setRetryCount(0);
      getCurrentLocationWithRetry();
    }
  };

  const retryLocation = () => {
    setRetryCount(0);
    setError(null);
    getCurrentLocationWithRetry();
  };

  // 3D View Functions
  const enable3DView = (angle: number = 60) => {
    if (mapRef.current && currentLocation) {
      is3DOperationRef.current = true;
      setIs3DEnabled(true);
      setPitchAngle(angle);
      
      const zoomOption = ZOOM_OPTIONS.find(opt => opt.value === currentZoom);
      const zoom = Math.log2(360 / (zoomOption?.latitudeDelta || 0.003));
      
      const camera = {
        center: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        pitch: angle,
        heading: 0,
        zoom: zoom,
      };
      
      mapRef.current.animateCamera(camera, { duration: 800 });
      
      setTimeout(() => {
        is3DOperationRef.current = false;
      }, 900);
    } else {
      Alert.alert('Location Required', 'Please wait for location to load first.');
    }
  };

  const disable3DView = () => {
    if (mapRef.current && currentLocation) {
      is3DOperationRef.current = true;
      setIs3DEnabled(false);
      setPitchAngle(0);
      
      const zoomOption = ZOOM_OPTIONS.find(opt => opt.value === currentZoom);
      const region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: zoomOption?.latitudeDelta || 0.003,
        longitudeDelta: zoomOption?.latitudeDelta || 0.003,
      };
      
      mapRef.current.animateToRegion(region, 800);
      
      setTimeout(() => {
        is3DOperationRef.current = false;
      }, 900);
    }
  };

  const rotateView = (heading: number) => {
    if (mapRef.current && currentLocation && is3DEnabled) {
      mapRef.current.getCamera().then(currentCamera => {
        const zoomOption = ZOOM_OPTIONS.find(opt => opt.value === currentZoom);
        const zoom = Math.log2(360 / (zoomOption?.latitudeDelta || 0.003));
        const camera = {
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          pitch: pitchAngle,
          heading: heading,
          zoom: zoom,
        };
        mapRef.current?.animateCamera(camera, { duration: 500 });
      });
    } else if (!is3DEnabled) {
      Alert.alert('Enable 3D First', 'Please enable 3D view first.');
    }
  };

  const increasePitch = () => {
    if (is3DEnabled && pitchAngle < 85) {
      const newPitch = Math.min(pitchAngle + 15, 85);
      setPitchAngle(newPitch);
      
      mapRef.current?.getCamera().then(currentCamera => {
        const zoomOption = ZOOM_OPTIONS.find(opt => opt.value === currentZoom);
        const zoom = Math.log2(360 / (zoomOption?.latitudeDelta || 0.003));
        const camera = {
          center: {
            latitude: currentLocation!.latitude,
            longitude: currentLocation!.longitude,
          },
          pitch: newPitch,
          heading: currentCamera.heading || 0,
          zoom: zoom,
        };
        mapRef.current?.animateCamera(camera, { duration: 400 });
      });
    } else if (!is3DEnabled) {
      Alert.alert('Enable 3D First', 'Please enable 3D view first.');
    }
  };

  const decreasePitch = () => {
    if (is3DEnabled && pitchAngle > 0) {
      const newPitch = Math.max(pitchAngle - 15, 0);
      setPitchAngle(newPitch);
      
      if (newPitch === 0) {
        disable3DView();
      } else {
        mapRef.current?.getCamera().then(currentCamera => {
          const zoomOption = ZOOM_OPTIONS.find(opt => opt.value === currentZoom);
          const zoom = Math.log2(360 / (zoomOption?.latitudeDelta || 0.003));
          const camera = {
            center: {
              latitude: currentLocation!.latitude,
              longitude: currentLocation!.longitude,
            },
            pitch: newPitch,
            heading: currentCamera.heading || 0,
            zoom: zoom,
          };
          mapRef.current?.animateCamera(camera, { duration: 400 });
        });
      }
    }
  };

  const formatCoordinate = (coord: number | undefined): string => {
    if (coord === undefined || coord === null) return '--';
    return coord.toFixed(6);
  };

  const setDefaultLocation = () => {
    const defaultLoc = { latitude: 24.8607, longitude: 67.0011 };
    setCurrentLocation(defaultLoc);
    setLocationLoaded(true);
    const defaultZoom = ZOOM_OPTIONS.find(opt => opt.value === 0.3);
    const newRegion = {
      ...defaultLoc,
      latitudeDelta: defaultZoom?.latitudeDelta || 0.003,
      longitudeDelta: defaultZoom?.latitudeDelta || 0.003,
    };
    setInitialRegion(newRegion);
    setCurrentZoom(0.3);
    setCurrentZoomLabel('0.3km');
    setLoading(false);
    setError(null);
    Alert.alert('Using Default Location', 'Using Karachi as default location for testing.');
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    if (!is3DOperationRef.current) {
      setInitialRegion(newRegion);
    }
  };

  if (loading && !locationLoaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Getting your location...</Text>
        <Text style={styles.loadingSubText}>Attempt {retryCount + 1} of 3</Text>
        {retryCount >= 2 && (
          <TouchableOpacity style={styles.defaultLocationButton} onPress={setDefaultLocation}>
            <Text style={styles.defaultLocationButtonText}>Use Default Location</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map Test</Text>
        <Text style={[
          styles.headerSubtitle,
          error ? styles.headerError : locationLoaded ? styles.headerReady : styles.headerLoading
        ]}>
          {error ? '⚠️ Location Error' : locationLoaded ? '✓ Location Ready' : '⏳ Getting Location...'}
        </Text>
        {locationLoaded && currentLocation && (
          <Text style={styles.locationText}>
            📍 {formatCoordinate(currentLocation.latitude)}, {formatCoordinate(currentLocation.longitude)}
          </Text>
        )}
        {is3DEnabled && (
          <Text style={styles.view3DText}>🎯 3D Mode Active (Pitch: {pitchAngle}°)</Text>
        )}
        {error && (
          <TouchableOpacity style={styles.retryButton} onPress={retryLocation}>
            <Text style={styles.retryButtonText}>Retry Location</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mapContainer}>
        {error && !loading && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorIcon}>📍</Text>
            <Text style={styles.errorTitle}>Location Error</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.troubleshootButton} onPress={retryLocation}>
              <Text style={styles.troubleshootButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.defaultButton} onPress={setDefaultLocation}>
              <Text style={styles.defaultButtonText}>Use Default Location</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {initialRegion && !error && (
          <MapView
            key={useGoogleProvider ? 'google_map_engine' : 'native_system_engine'}
            ref={mapRef}
            provider={useGoogleProvider ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={initialRegion}
            onRegionChangeComplete={handleRegionChangeComplete}
            onMapReady={() => {
              console.log('Map ready!');
              setMapReady(true);
            }}
            mapType={mapType}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsBuildings={true}
            showsIndoors={true}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
          >
            {/* Current Location Marker */}
            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                title="You are here"
                description="Your current location"
                pinColor="#4CAF50"
              />
            )}

            {/* Alternative: Custom markers with images */}
            {getFilteredLocations().map((location) => (
              <Marker
                key={location.id}
                coordinate={location.coordinate}
                title={location.title}
                description={location.description}
                onPress={() => setSelectedLocation(location)}
              >
                {/* Use a custom image marker */}
                <Image
                  source={require('../../assets/about_icon.png')} // Make sure this exists
                  style={{ width: 30, height: 30 }}
                  resizeMode="contain"
                />
              </Marker>
            ))}
          </MapView>
        )}
      </View>

      {locationLoaded && !error && (
        <>
          <TouchableOpacity style={styles.locationButton} onPress={centerToCurrentLocation}>
            <Image source={require('../../assets/location_icon.png')} style={styles.locationIcon} />
          </TouchableOpacity>
          
          {/* 3D View Button */}
          {!is3DEnabled && (
            <TouchableOpacity style={styles.view3DButton} onPress={() => enable3DView(60)}>
              <Text style={styles.view3DButtonText}>3D View</Text>
            </TouchableOpacity>
          )}
          
          {is3DEnabled && (
            <TouchableOpacity style={styles.view2DButton} onPress={disable3DView}>
              <Text style={styles.view2DButtonText}>2D View</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <ScrollView style={styles.controlPanel} showsVerticalScrollIndicator={false}>
        {/* Zoom Control Section */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>🔍 Zoom Control:</Text>
          
          <View style={styles.zoomIndicator}>
            <Text style={styles.currentZoomText}>View Radius: {currentZoomLabel}</Text>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={0.5}
            step={0.1}
            value={currentZoom}
            onValueChange={handleZoomChange}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#3a3a3a"
            thumbTintColor="#4CAF50"
          />
          
          <View style={styles.zoomOptionsRow}>
            {ZOOM_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.zoomOptionButton,
                  currentZoom === option.value && styles.zoomOptionButtonActive
                ]}
                onPress={() => setZoomLevel(option.value, option.label)}
              >
                <Text style={[
                  styles.zoomOptionText,
                  currentZoom === option.value && styles.zoomOptionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location Filters */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>📍 Location Filters:</Text>
          
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, !filterType && styles.filterButtonActive]}
              onPress={() => setFilterType(null)}
            >
              <Text style={styles.filterButtonText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'hunter' && styles.filterButtonActive]}
              onPress={() => setFilterType('hunter')}
            >
              <Text style={styles.filterButtonText}>🏹 Hunters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'animal' && styles.filterButtonActive]}
              onPress={() => setFilterType('animal')}
            >
              <Text style={styles.filterButtonText}>🦌 Animals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'safeZone' && styles.filterButtonActive]}
              onPress={() => setFilterType('safeZone')}
            >
              <Text style={styles.filterButtonText}>✓ Safe Zones</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'dangerZone' && styles.filterButtonActive]}
              onPress={() => setFilterType('dangerZone')}
            >
              <Text style={styles.filterButtonText}>⚠️ Danger</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.toggleMarkersButton}
            onPress={() => setShowAllMarkers(!showAllMarkers)}
          >
            <Text style={styles.toggleMarkersButtonText}>
              {showAllMarkers ? 'Hide All Markers' : 'Show All Markers'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Location Info */}
        {selectedLocation && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>📍 Selected Location</Text>
            <Text style={styles.infoText}>Type: {selectedLocation.type}</Text>
            <Text style={styles.infoText}>Title: {selectedLocation.title}</Text>
            <Text style={styles.infoText}>Description: {selectedLocation.description}</Text>
            <View style={styles.selectedLocationButtons}>
              <TouchableOpacity 
                style={styles.centerButton}
                onPress={() => centerToLocation(selectedLocation.coordinate)}
              >
                <Text style={styles.centerButtonText}>Center to Location</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeLocation(selectedLocation.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>🗺️ Map Provider:</Text>
          <View style={styles.providerButtons}>
            <TouchableOpacity
              style={[styles.providerButton, useGoogleProvider && styles.providerButtonActive]}
              onPress={() => setUseGoogleProvider(true)}
            >
              <Text style={[styles.providerButtonText, useGoogleProvider && styles.providerButtonTextActive]}>
                Google Maps
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerButton, !useGoogleProvider && styles.providerButtonActive]}
              onPress={() => setUseGoogleProvider(false)}
            >
              <Text style={[styles.providerButtonText, !useGoogleProvider && styles.providerButtonTextActive]}>
                Default
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>🖼️ Map Type:</Text>
          <View style={styles.mapTypeButtons}>
            {(['standard', 'satellite', 'hybrid'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.mapTypeButton, mapType === type && styles.mapTypeButtonActive]}
                onPress={() => setMapType(type)}
              >
                <Text style={styles.mapTypeButtonText}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3D View Controls Section */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>🎯 3D View Controls:</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.smallButton} onPress={() => enable3DView(45)}>
              <Text style={styles.smallButtonText}>3D 45°</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallButton} onPress={() => enable3DView(60)}>
              <Text style={styles.smallButtonText}>3D 60°</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallButton} onPress={() => enable3DView(75)}>
              <Text style={styles.smallButtonText}>3D 75°</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.smallButton} onPress={disable3DView}>
              <Text style={styles.smallButtonText}>2D</Text>
            </TouchableOpacity>
          </View>
          
          {is3DEnabled && (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.smallButton} onPress={decreasePitch}>
                  <Text style={styles.smallButtonText}>− Pitch</Text>
                </TouchableOpacity>
                <Text style={styles.pitchText}>Pitch: {pitchAngle}°</Text>
                <TouchableOpacity style={styles.smallButton} onPress={increasePitch}>
                  <Text style={styles.smallButtonText}>+ Pitch</Text>
                </TouchableOpacity>
              </View>
            
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.smallButton} onPress={() => rotateView(0)}>
                  <Text style={styles.smallButtonText}>⬆️ North</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => rotateView(90)}>
                  <Text style={styles.smallButtonText}>➡️ East</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => rotateView(180)}>
                  <Text style={styles.smallButtonText}>⬇️ South</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => rotateView(270)}>
                  <Text style={styles.smallButtonText}>⬅️ West</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>📍 Location Controls:</Text>
          <TouchableOpacity style={styles.locationControlButton} onPress={centerToCurrentLocation}>
            <Text style={styles.locationControlButtonText}>Center to My Location</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>📊 Statistics:</Text>
          <Text style={styles.infoText}>Total Markers: {locations.length}</Text>
          <Text style={styles.infoText}>Hunters: {locations.filter(l => l.type === 'hunter').length}</Text>
          <Text style={styles.infoText}>Animals: {locations.filter(l => l.type === 'animal').length}</Text>
          <Text style={styles.infoText}>Safe Zones: {locations.filter(l => l.type === 'safeZone').length}</Text>
          <Text style={styles.infoText}>Danger Zones: {locations.filter(l => l.type === 'dangerZone').length}</Text>
          <Text style={styles.infoText}>POIs: {locations.filter(l => l.type === 'poi').length}</Text>
        </View>

        {lastTap && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Last Tap Location:</Text>
            <Text style={styles.infoText}>
              Lat: {formatCoordinate(lastTap.latitude)}{'\n'}
              Lon: {formatCoordinate(lastTap.longitude)}
            </Text>
            <TouchableOpacity 
              style={styles.addMarkerButton}
              onPress={() => {
                Alert.alert(
                  'Add Marker',
                  'What type of marker would you like to add?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Hunter', onPress: () => addLocation(lastTap, 'hunter', 'Hunter Location') },
                    { text: 'Animal', onPress: () => addLocation(lastTap, 'animal', 'Animal Sighting') },
                    { text: 'Safe Zone', onPress: () => addLocation(lastTap, 'safeZone', 'Safe Zone') },
                    { text: 'Danger Zone', onPress: () => addLocation(lastTap, 'dangerZone', 'Danger Zone') },
                    { text: 'POI', onPress: () => addLocation(lastTap, 'poi', 'Point of Interest') },
                  ]
                );
              }}
            >
              <Text style={styles.addMarkerButtonText}>➕ Add Marker Here</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  header: { paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 10, paddingHorizontal: 20, backgroundColor: '#2a2a2a', borderBottomWidth: 1, borderBottomColor: '#3a3a3a' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 12, marginTop: 4 },
  headerReady: { color: '#4CAF50' },
  headerLoading: { color: '#FF9800' },
  headerError: { color: '#F44336' },
  locationText: { fontSize: 10, color: '#4CAF50', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  view3DText: { fontSize: 10, color: '#2196F3', marginTop: 4, fontWeight: 'bold' },
  retryButton: { marginTop: 8, backgroundColor: '#F44336', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 5, alignSelf: 'flex-start' },
  retryButtonText: { color: '#FFF', fontSize: 12 },
  mapContainer: { height: height * 0.45, backgroundColor: '#f0f0f0', position: 'relative' },
  map: { flex: 1 },
  loadingText: { color: '#FFF', marginTop: 10, fontSize: 16 },
  loadingSubText: { color: '#CCC', marginTop: 5, fontSize: 12 },
  errorOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1, padding: 20 },
  errorIcon: { fontSize: 48, marginBottom: 20 },
  errorTitle: { color: '#F44336', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  errorMessage: { color: '#FFF', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  troubleshootButton: { backgroundColor: '#4CAF50', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, marginBottom: 10 },
  troubleshootButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  defaultButton: { backgroundColor: '#FF9800', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  defaultButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  defaultLocationButton: { marginTop: 20, backgroundColor: '#FF9800', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  defaultLocationButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  locationButton: {
    position: 'absolute',
    bottom: height * 0.45 + 80,
    right: 20,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  locationIcon: { width: 24, height: 24, tintColor: '#0E713E' },
  view3DButton: {
    position: 'absolute',
    bottom: height * 0.45 + 20,
    right: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  view3DButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  view2DButton: {
    position: 'absolute',
    bottom: height * 0.45 + 20,
    right: 20,
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  view2DButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  controlPanel: { flex: 1, padding: 15 },
  controlGroup: { marginBottom: 20, backgroundColor: '#2a2a2a', padding: 15, borderRadius: 10 },
  controlLabel: { color: '#FFF', fontSize: 14, marginBottom: 10, fontWeight: '500' },
  providerButtons: { flexDirection: 'row', gap: 10 },
  providerButton: { flex: 1, paddingVertical: 10, backgroundColor: '#3a3a3a', borderRadius: 5, alignItems: 'center' },
  providerButtonActive: { backgroundColor: '#4CAF50' },
  providerButtonText: { color: '#FFF', fontSize: 12 },
  providerButtonTextActive: { fontWeight: 'bold' },
  mapTypeButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  mapTypeButton: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#3a3a3a', borderRadius: 5, minWidth: 80, alignItems: 'center' },
  mapTypeButtonActive: { backgroundColor: '#4CAF50' },
  mapTypeButtonText: { color: '#FFF', fontSize: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 8 },
  smallButton: { backgroundColor: '#2196F3', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5, alignItems: 'center', minWidth: 65 },
  smallButtonText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  pitchText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  locationControlButton: { backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  locationControlButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  infoContainer: { backgroundColor: '#2a2a2a', padding: 15, borderRadius: 10, marginBottom: 20 },
  infoTitle: { color: '#FFF', fontWeight: 'bold', marginBottom: 5, fontSize: 14 },
  infoText: { color: '#CCC', fontSize: 12, marginBottom: 3 },
  // Zoom styles
  zoomIndicator: { alignItems: 'center', marginBottom: 10 },
  currentZoomText: { color: '#4CAF50', fontSize: 18, fontWeight: 'bold' },
  slider: { width: '100%', height: 40, marginVertical: 10 },
  zoomOptionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  zoomOptionButton: { flex: 1, backgroundColor: '#3a3a3a', paddingVertical: 8, borderRadius: 5, alignItems: 'center' },
  zoomOptionButtonActive: { backgroundColor: '#4CAF50' },
  zoomOptionText: { color: '#FFF', fontSize: 12, fontWeight: '500' },
  zoomOptionTextActive: { fontWeight: 'bold' },
  // Filter styles
  filterButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  filterButton: { backgroundColor: '#3a3a3a', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 5 },
  filterButtonActive: { backgroundColor: '#4CAF50' },
  filterButtonText: { color: '#FFF', fontSize: 12 },
  toggleMarkersButton: { backgroundColor: '#FF9800', paddingVertical: 8, borderRadius: 5, alignItems: 'center', marginTop: 5 },
  toggleMarkersButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  // Selected location styles
  selectedLocationButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  centerButton: { flex: 1, backgroundColor: '#4CAF50', paddingVertical: 8, borderRadius: 5, alignItems: 'center' },
  centerButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  removeButton: { flex: 1, backgroundColor: '#F44336', paddingVertical: 8, borderRadius: 5, alignItems: 'center' },
  removeButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  addMarkerButton: { backgroundColor: '#2196F3', paddingVertical: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  addMarkerButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  // Marker styles
  customMarker: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  markerText: { fontSize: 18 },
  // Add to your styles object
  calloutContainer: {
    padding: 10,
    minWidth: 150,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 5,
    color: '#000',
  },
  calloutDescription: {
    fontSize: 12,
    marginBottom: 3,
    color: '#666',
  },
  calloutType: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 3,
  },
});

export default MapTestScreen;