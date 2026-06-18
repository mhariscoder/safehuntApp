import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
import { useNavigation } from '@react-navigation/native';

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

const GOOGLE_WEATHER_API_KEY = 'AIzaSyDfERDiOAjbLmRs1XZYleJhmr7GJQ6lPaM';

type WeatherState = {
  temp: string;
  icon: string;
  loading: boolean;
  coords: { latitude: number; longitude: number } | null;
  locationName: string;
};

const TopHeader: React.FC<TopHeaderProps> = ({
  onMenuPress,
  onSearchPress,
  onSOSPress,
  containerStyle,
}) => {
  const navigation = useNavigation<any>();

  const [weather, setWeather] = useState<WeatherState>({
    temp: '',
    icon: '',
    loading: true,
    coords: null,
    locationName: '',
  });

  // -------------------------------
  // LOCATION NAME (OpenStreetMap)
  // -------------------------------
  const getLocationName = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();

      const a = data?.address;

      const city = a?.city || a?.town || a?.village || a?.suburb;
      const country = a?.country;

      return city && country ? `${city}, ${country}` : data?.display_name || 'Unknown';
    } catch {
      return 'Unknown Location';
    }
  };

  // -------------------------------
  // GOOGLE WEATHER
  // -------------------------------
  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setWeather(prev => ({ ...prev, loading: true }));

      const url =
        `https://weather.googleapis.com/v1/currentConditions:lookup` +
        `?key=${GOOGLE_WEATHER_API_KEY}` +
        `&location.latitude=${lat}` +
        `&location.longitude=${lon}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error('Weather API failed');

      const tempC = data?.temperature?.degrees ?? 0;
      const tempF = Math.round((tempC * 9) / 5 + 32);

      const icon = data?.iconBaseUri
        ? `${data.iconBaseUri}.png`
        : '';

      setWeather(prev => ({
        ...prev,
        temp: `${tempF}°F`,
        icon,
        loading: false,
        coords: { latitude: lat, longitude: lon },
      }));
    } catch (e) {
      console.log('Weather Error:', e);

      setWeather(prev => ({
        ...prev,
        temp: '--',
        icon: '',
        loading: false,
      }));
    }
  };

  // -------------------------------
  // MAIN LOCATION FLOW
  // -------------------------------
  const getLocationAndFetchWeather = () => {
    setWeather(prev => ({ ...prev, loading: true }));

    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;

        const locationName = await getLocationName(latitude, longitude);
        console.log('locationName', locationName)

        await fetchWeather(latitude, longitude);

        setWeather(prev => ({
          ...prev,
          locationName,
        }));
      },
      error => {
        console.log(error);

        setWeather(prev => ({
          ...prev,
          loading: false,
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  };

  // -------------------------------
  // WINDY SCREEN
  // -------------------------------
  const openWindy = () => {
    if (weather.coords) {
      navigation.navigate('Windy', weather.coords);
    } else {
      Geolocation.getCurrentPosition(pos => {
        navigation.navigate('Windy', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      });
    }
  };

  useEffect(() => {
    getLocationAndFetchWeather();
  }, []);

  return (
    <View style={[styles.topControls, containerStyle]}>
      <TouchableOpacity style={[styles.iconButton, styles.bgGreen]} onPress={onMenuPress}>
        <Image style={styles.navIcon} source={ASSETS.nav1} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.iconButton, styles.bgBrown]} onPress={onSearchPress}>
        <Image style={styles.navIcon} source={ASSETS.nav2} />
      </TouchableOpacity>

      {/* WEATHER */}
      <View style={styles.weatherBadge}>
        {weather.loading ? (
          <ActivityIndicator size="small" color="#4D3626" />
        ) : weather.temp ? (
          <TouchableOpacity onPress={openWindy} style={styles.row}>
            {weather.icon ? (
              <Image style={styles.weatherIconImage} source={{ uri: weather.icon }} />
            ) : null}

            <Text style={styles.weatherTemp}>{weather.temp}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={getLocationAndFetchWeather} style={styles.retryButton}>
            <Image style={styles.refreshIcon} source={ASSETS.refresh} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.sosButton} onPress={onSOSPress}>
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
    paddingVertical: 10,
  },
  iconButton: {
    width: '20%',
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgGreen: { backgroundColor: '#0E713E' },
  bgBrown: { backgroundColor: '#4D3626' },
  navIcon: { height: 22, width: 22, resizeMode: 'contain' },

  weatherBadge: {
    backgroundColor: '#FFF',
    width: '20%',
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  row: { flexDirection: 'row', alignItems: 'center' },

  weatherIconImage: { height: 24, width: 24 },

  weatherTemp: {
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
  },

  retryButton: { flexDirection: 'row', alignItems: 'center' },

  refreshIcon: { width: 16, height: 16, marginRight: 4 },

  retryText: { fontSize: 12, fontWeight: '600' },

  sosButton: {
    backgroundColor: '#FF0000',
    width: '20%',
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sosText: { color: '#FFF', fontWeight: 'bold' },
});

export default TopHeader;