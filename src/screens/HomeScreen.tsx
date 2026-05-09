import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  PanResponder,
  Animated,
} from 'react-native';
import SideMenu from '../components/SideMenu';
import TopHeader from '../components/TopHeader';
import BottomTabNav from '../components/BottomTabNav';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width * 0.9 * 0.75;

// Static mapping for this screen
const ASSETS = {
  map: require('../../assets/topographic_map.png'),
  nav1: require('../../assets/nav_1.png'),
  nav2: require('../../assets/nav_2.png'),
  nav3: require('../../assets/nav_3.png'),
  tab0: require('../../assets/tab_0.png'),
  tab1: require('../../assets/tab_1.png'),
  tab2: require('../../assets/tab_2.png'),
  tab3: require('../../assets/tab_3.png'),
  tab4: require('../../assets/tab_4.png'),
};

const HomeScreen = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const pan = useRef(new Animated.ValueXY({ x: SLIDER_WIDTH / 2, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        let newX = gestureState.moveX - (width - SLIDER_WIDTH) / 2;
        if (newX < 0) newX = 0;
        if (newX > SLIDER_WIDTH) newX = SLIDER_WIDTH;
        pan.x.setValue(newX);
      },
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <ImageBackground source={ASSETS.map} style={styles.mapBase} resizeMode="cover">
        <View style={styles.overlayContainer}>
          
          <TopHeader 
            onMenuPress={() => setMenuOpen(true)}
            
            containerStyle={{ 
              marginTop: 30, 
              backgroundColor: 'transparent' 
            }}
          />

          <View style={styles.mapFrame}>
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[styles.sliderThumb, { transform: [{ translateX: pan.x }] }]}
                />
              </View>
              <View style={styles.sliderLabels}>
                <Text style={styles.rangeText}>5m</Text>
                <Text style={styles.rangeText}>10m</Text>
                <Text style={styles.rangeText}>50m</Text>
                <Text style={styles.rangeText}>100m</Text>
              </View>
            </View>
          </View>

          <BottomTabNav containerStyle={{ marginBottom: 30 }}/>

        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  mapBase: { flex: 1 },
  overlayContainer: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 25 },
  topControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  iconButton: { width: 60, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bgGreen: { backgroundColor: '#0E713E' },
  bgBrown: { backgroundColor: '#4D3626' },
  weatherBadge: { backgroundColor: '#FFF', flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center' },
  weatherTemp: { fontWeight: 'bold', color: '#333' },
  sosButton: { backgroundColor: '#FF0000', width: 65, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sosText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  mapFrame: { flex: 1, marginTop: 20, marginBottom: 80, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 30, backgroundColor: 'rgba(48, 78, 24, 0.3)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30 },
  sliderContainer: { width: '90%', alignItems: 'center' },
  sliderTrack: { height: 4, backgroundColor: '#4D3626', width: '100%', borderRadius: 2, justifyContent: 'center' },
  sliderThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#0E713E', position: 'absolute', left: -11 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8 },
  rangeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#4A9267', height: 60, borderRadius: 30, marginBottom: 25, alignItems: 'center', justifyContent: 'space-around' },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { height: 24, width: 24, resizeMode: 'contain' },
});

export default HomeScreen;