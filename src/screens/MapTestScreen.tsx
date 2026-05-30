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
  Linking,
  NativeModules,
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Callout,
  Polyline,
  Polygon,
  Circle,
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

// Fallback region with different coordinates to test
const FALLBACK_REGIONS = [
  { name: 'Karachi', region: { latitude: 24.8607, longitude: 67.0011, latitudeDelta: 0.0922, longitudeDelta: 0.0421 } },
  { name: 'New York', region: { latitude: 40.7128, longitude: -74.0060, latitudeDelta: 0.0922, longitudeDelta: 0.0421 } },
  { name: 'London', region: { latitude: 51.5074, longitude: -0.1278, latitudeDelta: 0.0922, longitudeDelta: 0.0421 } },
  { name: 'Tokyo', region: { latitude: 35.6762, longitude: 139.6503, latitudeDelta: 0.0922, longitudeDelta: 0.0421 } },
];

const TEST_MARKERS = [
  {
    id: 1,
    coordinate: { latitude: 24.8607, longitude: 67.0011 },
    title: 'Center Point',
    description: 'This is the main location',
    pinColor: '#FF0000',
  },
  {
    id: 2,
    coordinate: { latitude: 24.8650, longitude: 67.0050 },
    title: 'North East Spot',
    description: 'Great hunting area',
    pinColor: '#00FF00',
  },
];

const MapTestScreen = () => {
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
  
  const mapRef = useRef<MapView>(null);

  // Check API key status on mount
  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = () => {
    if (Platform.OS === 'android') {
      // For Android, check if Google Play Services is available
      // This is a heuristic check
      setApiKeyStatus('API Key must be configured in AndroidManifest.xml');
      console.log('Android: Check android/app/src/main/AndroidManifest.xml for com.google.android.geo.API_KEY');
    } else if (Platform.OS === 'ios') {
      setApiKeyStatus('API Key must be configured in AppDelegate.m');
      console.log('iOS: Check AppDelegate.m for [GMSServices provideAPIKey:]');
    }
  };

  // Try different regions if one doesn't work
  const tryDifferentRegion = (regionData: typeof FALLBACK_REGIONS[0]) => {
    setRegion(regionData.region);
    mapRef.current?.animateToRegion(regionData.region, 1000);
    Alert.alert('Changing Region', `Trying ${regionData.name} region`);
  };

  // Handle map errors with detailed logging
  const handleMapError = (error: any) => {
    console.log('=== MAP ERROR DETAILS ===');
    console.log('Error object:', error);
    console.log('Error message:', error?.message);
    console.log('Error code:', error?.code);
    console.log('Platform:', Platform.OS);
    
    let errorMessage = 'Unknown error';
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    setError(`Map Error: ${errorMessage}`);
    setLoading(false);
    
    // Provide specific troubleshooting based on error message
    let troubleshootingSteps = '';
    if (errorMessage.includes('API_KEY') || errorMessage.includes('API Key')) {
      troubleshootingSteps = '1. Check your API key is correct\n2. Ensure API key is added to AndroidManifest.xml or AppDelegate.m\n3. Make sure Maps SDK is enabled in Google Cloud Console';
    } else if (errorMessage.includes('billing')) {
      troubleshootingSteps = '1. Enable billing on your Google Cloud project\n2. Even free tier requires billing enabled';
    } else if (errorMessage.includes('network') || errorMessage.includes('internet')) {
      troubleshootingSteps = '1. Check your internet connection\n2. Ensure device has network access';
    } else {
      troubleshootingSteps = '1. Check your API key configuration\n2. Enable Maps SDK in Google Cloud Console\n3. Enable billing on your Google Cloud project\n4. Check internet connection';
    }
    
    Alert.alert(
      'Map Loading Error',
      `Error: ${errorMessage}\n\nPossible fixes:\n${troubleshootingSteps}\n\nWould you like to see detailed setup instructions?`,
      [
        { text: 'OK', onPress: () => console.log('Error acknowledged') },
        { text: 'Setup Guide', onPress: () => Linking.openURL('https://github.com/react-native-maps/react-native-maps/blob/master/docs/installation.md') }
      ]
    );
  };

  // Toggle between Google and default provider
  const toggleProvider = () => {
    setUseGoogleProvider(!useGoogleProvider);
    setLoading(true);
    setError(null);
    setMapReady(false);
  };

  // Retry loading map
  const retryMap = () => {
    setLoading(true);
    setError(null);
    setMapReady(false);
    // Small delay to force remount
    setTimeout(() => {
      mapRef.current?.setNativeProps({});
    }, 100);
  };

  // Show API key setup instructions
  const showApiKeyInstructions = () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        'Android API Key Setup',
        '1. Open android/app/src/main/AndroidManifest.xml\n\n' +
        '2. Add inside <application> tag:\n' +
        '<meta-data\n' +
        '  android:name="com.google.android.geo.API_KEY"\n' +
        '  android:value="YOUR_API_KEY_HERE"/>\n\n' +
        '3. Also add:\n' +
        '<uses-permission android:name="android.permission.INTERNET"/>\n\n' +
        '4. Rebuild: npx react-native run-android',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'iOS API Key Setup',
        '1. Open ios/YourApp/AppDelegate.m\n\n' +
        '2. Add import:\n' +
        '#import <GoogleMaps/GoogleMaps.h>\n\n' +
        '3. In didFinishLaunchingWithOptions:\n' +
        '[GMSServices provideAPIKey:@"YOUR_API_KEY_HERE"];\n\n' +
        '4. Run: cd ios && pod install\n\n' +
        '5. Rebuild: npx react-native run-ios',
        [{ text: 'OK' }]
      );
    }
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
            <Text style={styles.loadingSubText}>Make sure API key is configured</Text>
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
            <TouchableOpacity 
              style={[styles.troubleshootButton, { marginTop: 10, backgroundColor: '#2196F3' }]} 
              onPress={showApiKeyInstructions}
            >
              <Text style={styles.troubleshootButtonText}>Show API Key Setup</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <MapView
          ref={mapRef}
          provider={useGoogleProvider ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          style={styles.map}
          region={region}
          onRegionChangeComplete={(newRegion: Region) => setRegion(newRegion)}
          onMapReady={() => {
            console.log('=== MAP READY ===');
            console.log('Map loaded successfully!');
            console.log('Provider:', useGoogleProvider ? 'Google' : 'Default');
            console.log('Region:', region);
            setMapReady(true);
            setLoading(false);
            setError(null);
          }}
          onError={handleMapError}
          mapType={mapType}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          zoomEnabled={true}
          zoomControlEnabled={false}
          scrollEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setLastTap({ latitude, longitude });
            console.log('Map pressed at:', { latitude, longitude });
            Alert.alert('Map Pressed', `Lat: ${latitude.toFixed(4)}\nLon: ${longitude.toFixed(4)}`);
          }}
        >
          {mapReady && showMarkers && TEST_MARKERS.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              pinColor={marker.pinColor}
            />
          ))}
        </MapView>
      </View>

      <ScrollView style={styles.controlPanel} showsVerticalScrollIndicator={false}>
        {/* Provider Toggle - Important for debugging */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Map Provider:</Text>
          <View style={styles.providerButtons}>
            <TouchableOpacity
              style={[
                styles.providerButton,
                useGoogleProvider && styles.providerButtonActive,
              ]}
              onPress={toggleProvider}
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
              onPress={toggleProvider}
            >
              <Text style={[
                styles.providerButtonText,
                !useGoogleProvider && styles.providerButtonTextActive,
              ]}>Default (Apple/System)</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>
            {useGoogleProvider ? 
              '⚠️ Using Google Maps - Requires API key. If white screen, API key is missing/invalid.' : 
              '✅ Using system default - Should work without API key'}
          </Text>
        </View>

        {/* Quick Test Instruction */}
        <View style={[styles.controlGroup, { backgroundColor: '#2196F3', opacity: 0.9 }]}>
          <Text style={[styles.controlLabel, { color: '#FFF', textAlign: 'center' }]}>
            🔧 QUICK TEST
          </Text>
          <Text style={[styles.helpText, { color: '#FFF', textAlign: 'center' }]}>
            Tap "Default (Apple/System)" button above. If map appears, your Google API key is the problem.
          </Text>
        </View>

        {/* API Key Setup Button */}
        <View style={styles.controlGroup}>
          <TouchableOpacity style={styles.setupButton} onPress={showApiKeyInstructions}>
            <Text style={styles.setupButtonText}>📖 Show API Key Setup Instructions</Text>
          </TouchableOpacity>
        </View>

        {/* Map Type Selector */}
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

        {/* Region Test Buttons */}
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

        {/* Toggle Switches */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Overlays (only if map loads):</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.controlLabel}>Show Markers</Text>
            <Switch value={showMarkers} onValueChange={setShowMarkers} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.controlLabel}>Show Polyline</Text>
            <Switch value={showPolyline} onValueChange={setShowPolyline} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.controlLabel}>Show Polygon</Text>
            <Switch value={showPolygon} onValueChange={setShowPolygon} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.controlLabel}>Show Circle</Text>
            <Switch value={showCircle} onValueChange={setShowCircle} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  apiKeyStatus: {
    fontSize: 10,
    color: '#FF9800',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headerReady: {
    color: '#4CAF50',
  },
  headerLoading: {
    color: '#FF9800',
  },
  headerError: {
    color: '#F44336',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#F44336',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 12,
  },
  mapContainer: {
    height: height * 0.4,
    backgroundColor: '#f0f0f0',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 16,
  },
  loadingSubText: {
    color: '#CCC',
    marginTop: 5,
    fontSize: 12,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1,
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  errorTitle: {
    color: '#F44336',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorMessage: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  troubleshootButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  troubleshootButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controlPanel: {
    flex: 1,
    padding: 15,
  },
  controlGroup: {
    marginBottom: 20,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
  },
  controlLabel: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '500',
  },
  providerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  providerButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#3a3a3a',
    borderRadius: 5,
    alignItems: 'center',
  },
  providerButtonActive: {
    backgroundColor: '#4CAF50',
  },
  providerButtonText: {
    color: '#FFF',
    fontSize: 12,
  },
  providerButtonTextActive: {
    fontWeight: 'bold',
  },
  helpText: {
    color: '#888',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  setupButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  setupButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mapTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mapTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#3a3a3a',
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  mapTypeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  mapTypeButtonText: {
    color: '#FFF',
    fontSize: 12,
  },
  regionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  regionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#3a3a3a',
    borderRadius: 5,
  },
  regionButtonText: {
    color: '#FFF',
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    color: '#CCC',
    fontSize: 12,
  },
});

export default MapTestScreen;