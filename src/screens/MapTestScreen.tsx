import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Region,
  LatLng,
  PROVIDER_DEFAULT,
} from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 24.8607,
  longitude: 67.0011,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const FALLBACK_REGIONS = [
  { name: 'Karachi', region: { latitude: 24.8607, longitude: 67.0011, latitudeDelta: 0.0922, longitudeDelta: 0.0421 } },
  { name: 'New York', region: { latitude: 40.7128, longitude: -74.0060, latitudeDelta: 0.0922, longitudeDelta: 0.0421 } },
  { name: 'London', region: { latitude: 51.5074, longitude: -0.1278, latitudeDelta: 0.0922, longitudeDelta: 0.0421 } },
  { name: 'Tokyo', region: { latitude: 35.6762, longitude: 139.6503, latitudeDelta: 0.0922, longitudeDelta: 0.0421 } },
];

interface MarkerData {
  id: number;
  coordinate: LatLng;
  title: string;
  description: string;
  pinColor: string;
}

const TEST_MARKERS: MarkerData[] = [
  {
    id: 1,
    coordinate: { latitude: 24.8607, longitude: 67.0011 },
    title: 'Center Point',
    description: 'This is the main location context configuration testing parameters.',
    pinColor: '#FF0000',
  },
  {
    id: 2,
    coordinate: { latitude: 24.8650, longitude: 67.0050 },
    title: 'North East Spot',
    description: 'Great hunting area for signals and connectivity benchmarking.',
    pinColor: '#00FF00',
  },
];

const MapTestScreen = () => {
  // 1-12: Standard Core States
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState(INITIAL_REGION);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showPolyline, setShowPolyline] = useState(true);
  const [showPolygon, setShowPolygon] = useState(true);
  const [showCircle, setShowCircle] = useState(true);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useGoogleProvider, setUseGoogleProvider] = useState(true);
  const [lastTap, setLastTap] = useState<LatLng | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('checking...');
  
  // 13-14: Modal States grouped strictly up top alongside other state instances
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  
  // 15: Refs grouped cleanly after all state descriptors
  const mapRef = useRef<MapView>(null);

  // 16: Life-Cycle Operations
  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = () => {
    if (Platform.OS === 'android') {
      setApiKeyStatus('API Key must be configured in AndroidManifest.xml');
    } else if (Platform.OS === 'ios') {
      setApiKeyStatus('API Key must be configured in AppDelegate.m');
    }
  };

  const tryDifferentRegion = (regionData: typeof FALLBACK_REGIONS[0]) => {
    setRegion(regionData.region);
    mapRef.current?.animateToRegion(regionData.region, 1000);
    Alert.alert('Changing Region', `Trying ${regionData.name} region`);
  };

  const handleMapError = (error: any) => {
    console.log('=== MAP ERROR DETAILS ===', error);
    let errorMessage = error?.message || (typeof error === 'string' ? error : 'Unknown error');
    setError(`Map Error: ${errorMessage}`);
    setLoading(false);
  };

  const toggleProvider = () => {
    setLoading(true);
    setMapReady(false);
    setError(null);
    
    setTimeout(() => {
      setUseGoogleProvider((prev) => !prev);
    }, 150);
  };

  const retryMap = () => {
    setLoading(true);
    setError(null);
    setMapReady(false);
    setTimeout(() => {
      mapRef.current?.setNativeProps({});
    }, 100);
  };

  const handleMarkerPress = (marker: MarkerData) => {
    setSelectedMarker(marker);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map Testing Screen</Text>
        <Text style={[
          styles.headerSubtitle,
          error ? styles.headerError : mapReady ? styles.headerReady : styles.headerLoading
        ]}>
          {error ? '⚠️ Error' : mapReady ? '✓ Map Ready' : '⏳ Loading...'}
        </Text>
        <Text style={styles.apiKeyStatus}>
          📋 API Key: {apiKeyStatus}
        </Text>
        {error && (
          <TouchableOpacity style={styles.retryButton} onPress={retryMap}>
            <Text style={styles.retryButtonText}>Retry Map</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mapContainer}>
        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Initializing Map...</Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorIcon}>🗺️</Text>
            <Text style={styles.errorTitle}>Map Failed to Load</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.troubleshootButton} onPress={retryMap}>
              <Text style={styles.troubleshootButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <MapView
          key={useGoogleProvider ? 'google_map_engine' : 'native_system_engine'}
          ref={mapRef}
          provider={useGoogleProvider ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          style={styles.map}
          region={region}
          onRegionChangeComplete={(newRegion: Region) => setRegion(newRegion)}
          onMapReady={() => {
            setMapReady(true);
            setLoading(false);
            setError(null);
          }}
          onError={handleMapError}
          mapType={mapType}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          zoomEnabled={true}
          scrollEnabled={true}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setLastTap({ latitude, longitude });
          }}
        >
          {mapReady && showMarkers && TEST_MARKERS.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              pinColor={marker.pinColor}
              onPress={(e) => {
                e.stopPropagation();
                handleMarkerPress(marker);
              }}
            />
          ))}
        </MapView>
      </View>

      <ScrollView style={styles.controlPanel} showsVerticalScrollIndicator={false}>
        {/* Provider Switch Control Group */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Map Provider:</Text>
          <View style={styles.providerButtons}>
            <TouchableOpacity
              style={[
                styles.providerButton,
                useGoogleProvider && styles.providerButtonActive,
              ]}
              onPress={useGoogleProvider ? undefined : toggleProvider}
            >
              <Text style={[
                styles.providerButtonText,
                useGoogleProvider && styles.providerButtonTextActive,
              ]}>Google Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.providerButton,
                !useGoogleProvider && styles.providerButtonActive,
              ]}
              onPress={!useGoogleProvider ? undefined : toggleProvider}
            >
              <Text style={[
                styles.providerButtonText,
                !useGoogleProvider && styles.providerButtonTextActive,
              ]}>Default (Apple/System)</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>
            {useGoogleProvider ? 
              '⚠️ Using Google Maps - Requires valid setup key configuration.' : 
              '✅ Using system default - Runs on standard system rendering instances directly.'}
          </Text>
        </View>

        {/* Map Rendering Layer Customizations */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Map Type:</Text>
          <View style={styles.mapTypeButtons}>
            {(['standard', 'satellite', 'hybrid'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.mapTypeButton,
                  mapType === type && styles.mapTypeButtonActive,
                ]}
                onPress={() => setMapType(type)}
              >
                <Text style={styles.mapTypeButtonText}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Geographic Core Coordinates Relocators */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Test Different Regions:</Text>
          <View style={styles.regionButtons}>
            {FALLBACK_REGIONS.map((loc) => (
              <TouchableOpacity
                key={loc.name}
                style={styles.regionButton}
                onPress={() => tryDifferentRegion(loc)}
              >
                <Text style={styles.regionButtonText}>{loc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Overlays Toggle Switches */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Overlays (only if map loads):</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show Markers</Text>
            <Switch 
              value={showMarkers} 
              onValueChange={setShowMarkers} 
              trackColor={{ false: '#3a3a3a', true: '#4CAF50' }}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show Polyline</Text>
            <Switch 
              value={showPolyline} 
              onValueChange={setShowPolyline} 
              trackColor={{ false: '#3a3a3a', true: '#4CAF50' }}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show Polygon</Text>
            <Switch 
              value={showPolygon} 
              onValueChange={setShowPolygon} 
              trackColor={{ false: '#3a3a3a', true: '#4CAF50' }}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show Circle</Text>
            <Switch 
              value={showCircle} 
              onValueChange={setShowCircle} 
              trackColor={{ false: '#3a3a3a', true: '#4CAF50' }}
            />
          </View>
        </View>

        {lastTap && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Last Tap Location:</Text>
            <Text style={styles.infoText}>
              Lat: {lastTap.latitude.toFixed(6)}{'\n'}
              Lon: {lastTap.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Marker Details Dialog Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={[styles.markerIndicator, { backgroundColor: selectedMarker?.pinColor || '#FFF' }]} />
              <Text style={styles.modalTitle}>{selectedMarker?.title}</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>{selectedMarker?.description}</Text>
              
              <View style={styles.coordBox}>
                <Text style={styles.coordText}>
                  📍 Latitude: <Text style={styles.coordValue}>{selectedMarker?.coordinate.latitude.toFixed(6)}</Text>
                </Text>
                <Text style={styles.coordText}>
                  📍 Longitude: <Text style={styles.coordValue}>{selectedMarker?.coordinate.longitude.toFixed(6)}</Text>
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Dismiss View</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: { paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 10, paddingHorizontal: 20, backgroundColor: '#2a2a2a', borderBottomWidth: 1, borderBottomColor: '#3a3a3a' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 12, marginTop: 4 },
  apiKeyStatus: { fontSize: 10, color: '#FF9800', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  headerReady: { color: '#4CAF50' },
  headerLoading: { color: '#FF9800' },
  headerError: { color: '#F44336' },
  retryButton: { marginTop: 8, backgroundColor: '#F44336', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 5, alignSelf: 'flex-start' },
  retryButtonText: { color: '#FFF', fontSize: 12 },
  mapContainer: { height: height * 0.4, backgroundColor: '#f0f0f0' },
  map: { flex: 1 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1 },
  loadingText: { color: '#FFF', marginTop: 10, fontSize: 16 },
  errorOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1, padding: 20 },
  errorIcon: { fontSize: 48, marginBottom: 20 },
  errorTitle: { color: '#F44336', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  errorMessage: { color: '#FFF', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  troubleshootButton: { backgroundColor: '#4CAF50', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  troubleshootButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  controlPanel: { flex: 1, padding: 15 },
  controlGroup: { marginBottom: 20, backgroundColor: '#2a2a2a', padding: 15, borderRadius: 10 },
  controlLabel: { color: '#FFF', fontSize: 14, marginBottom: 10, fontWeight: '500' },
  providerButtons: { flexDirection: 'row', gap: 10 },
  providerButton: { flex: 1, paddingVertical: 10, backgroundColor: '#3a3a3a', borderRadius: 5, alignItems: 'center' },
  providerButtonActive: { backgroundColor: '#4CAF50' },
  providerButtonText: { color: '#FFF', fontSize: 12 },
  providerButtonTextActive: { fontWeight: 'bold' },
  helpText: { color: '#888', fontSize: 11, marginTop: 8, textAlign: 'center' },
  mapTypeButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  mapTypeButton: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#3a3a3a', borderRadius: 5, minWidth: 80, alignItems: 'center' },
  mapTypeButtonActive: { backgroundColor: '#4CAF50' },
  mapTypeButtonText: { color: '#FFF', fontSize: 12 },
  regionButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  regionButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#3a3a3a', borderRadius: 5 },
  regionButtonText: { color: '#FFF', fontSize: 12 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  toggleLabel: { color: '#CCC', fontSize: 13 },
  infoContainer: { backgroundColor: '#2a2a2a', padding: 15, borderRadius: 10, marginBottom: 20 },
  infoTitle: { color: '#FFF', fontWeight: 'bold', marginBottom: 5 },
  infoText: { color: '#CCC', fontSize: 12 },
  
  // Modal Layout Styling
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalContent: { width: '100%', backgroundColor: '#2a2a2a', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#3a3a3a', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 5 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  markerIndicator: { width: 14, height: 14, borderRadius: 7 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', flex: 1 },
  modalBody: { marginBottom: 20 },
  modalDescription: { color: '#CCC', fontSize: 14, lineHeight: 20, marginBottom: 15 },
  coordBox: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, gap: 6 },
  coordText: { color: '#888', fontSize: 12 },
  coordValue: { color: '#4CAF50', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: 'bold' },
  modalCloseButton: { backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalCloseButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});

export default MapTestScreen;