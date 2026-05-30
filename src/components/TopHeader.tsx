import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ViewStyle,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

const ASSETS = {
  nav1: require('../../assets/nav_1.png'),
  nav2: require('../../assets/nav_2.png'),
  refresh: require('../../assets/nav_3.png'), 
};

interface TopHeaderProps {
  onMenuPress: () => void;
  onSearchPress?: () => void;
  onSOSPress?: () => void;
  containerStyle?: ViewStyle;
}

const TopHeader: React.FC<TopHeaderProps> = ({ 
  onMenuPress, 
  onSearchPress, 
  onSOSPress, 
  containerStyle 
}) => {
  const [weather, setWeather] = useState({
    temp: '',
    icon: '',
    loading: true,
  });

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setWeather(prev => ({ ...prev, loading: true }));
      // MET Norway API requires 2 decimal places for better compatibility
      const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HuntingApp/1.0 (contact: [email protected])',
        },
      });

      const text = await response.text();
      if (text.startsWith('<')) throw new Error("API returned HTML (Access Denied)");

      const data = JSON.parse(text);
      const current = data.properties.timeseries[0];
      const symbol = current.data.next_1_hours?.summary?.symbol_code || 'clearsky_day';

      setWeather({
        temp: `${Math.round(current.data.instant.details.air_temperature)}°`,
        icon: `https://raw.githubusercontent.com/metno/weathericons/master/weather/png/${symbol}.png`,
        loading: false,
      });
    } catch (error) {
      console.error("Weather Fetch Error:", error);
      setWeather({ temp: '', icon: '', loading: false });
    }
  };

  const getLocation = async () => {
    setWeather(prev => ({ ...prev, loading: true }));
    
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          // If permission is denied, use a default fallback (Karachi)
          // fetchWeather(24.86, 67.00);
          return;
        }
      } catch (err) {
        setWeather({ temp: '', icon: '', loading: false });
        return;
      }
    }

    Geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn("Geolocation Error:", error.message);
        // FIX: If it times out or fails, use fallback coordinates instead of just showing error
        // This ensures the user always sees weather info
        // fetchWeather(24.86, 67.00); 
      },
      { 
        enableHighAccuracy: false, // Set to false for faster results on Emulators
        timeout: 20000,           // Increased timeout to 20 seconds
        maximumAge: 3600000       // Accept cached location from the last hour
      }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <View style={[styles.topControls, containerStyle]}>
      <TouchableOpacity 
        style={[styles.iconButton, styles.bgGreen]} 
        onPress={onMenuPress}
        activeOpacity={0.7}
      >
        <Image style={styles.navIcon} source={ASSETS.nav1} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.iconButton, styles.bgBrown]} 
        onPress={onSearchPress}
        activeOpacity={0.7}
      >
        <Image style={styles.navIcon} source={ASSETS.nav2} />
      </TouchableOpacity>
      
      <View style={styles.weatherBadge}>
        {weather.loading ? (
          <ActivityIndicator size="small" color="#4D3626" />
        ) : weather.temp ? (
          <TouchableOpacity onPress={getLocation} style={styles.row} activeOpacity={0.6}>
            {weather.icon && <Image style={styles.weatherIconImage} source={{ uri: weather.icon }} />}
            <Text style={styles.weatherTemp}>{weather.temp}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={getLocation} style={styles.retryButton}>
             <Image style={styles.refreshIcon} source={ASSETS.refresh} />
             <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.sosButton} 
        onPress={onSOSPress}
        activeOpacity={0.8}
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%', 
    paddingVertical: 10 
  },
  iconButton: { 
    width: 60, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  bgGreen: { backgroundColor: '#0E713E' },
  bgBrown: { backgroundColor: '#4D3626' },
  navIcon: { height: 22, width: 22, resizeMode: 'contain' },
  weatherBadge: {
    backgroundColor: '#FFF',
    minWidth: 85,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  weatherIconImage: { height: 24, width: 24, resizeMode: 'contain' },
  weatherTemp: { fontWeight: 'bold', color: '#333', marginLeft: 4, fontSize: 14 },
  retryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  refreshIcon: { width: 16, height: 16, tintColor: '#4D3626', marginRight: 4 },
  retryText: { fontSize: 12, color: '#4D3626', fontWeight: '600' },
  sosButton: { 
    backgroundColor: '#FF0000', 
    width: 65, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sosText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

export default TopHeader;