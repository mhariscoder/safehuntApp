import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
} from 'react-native';
import { WebView } from 'react-native-webview';

import SideMenu from '../components/SideMenu';
import TopHeader from '../components/TopHeader';
import BottomTabNav from '../components/BottomTabNav';

export default function WindyScreen({ route, navigation }: any) {
  const { latitude, longitude } = route.params;

  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const windyUrl =
    `https://www.windy.com/${latitude}/${longitude}` +
    `?${latitude},${longitude},10`;

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {/* Windy Map */}
      <WebView
        source={{ uri: windyUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />

      {/* Overlay UI */}
      <View style={styles.overlayContainer}>
        {/* <TopHeader 
            onMenuPress={() => setMenuOpen(true)}
            onSearchPress={() => navigation.navigate('HuntingJournal')}
            containerStyle={{ marginTop: 40, backgroundColor: 'transparent' }}
        /> */}
        <View></View>

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0E713E" />
            <Text style={styles.loadingText}>
              Loading Windy Forecast...
            </Text>
          </View>
        )}

        <BottomTabNav
          containerStyle={{
            marginBottom: 15,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  webview: {
    flex: 1,
  },

  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    pointerEvents: 'box-none',
  },

  loadingCard: {
    alignSelf: 'center',
    marginTop: 100,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#0E713E',
  },

  loadingText: {
    color: '#FFF',
    marginTop: 10,
    textAlign: 'center',
  },
});