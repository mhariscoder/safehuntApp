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

const { width } = Dimensions.get('window');
// Define slider width based on your 90% container style
const SLIDER_WIDTH = width * 0.9 * 0.75; 

const HomeScreen = () => {
  // 1. Slider Logic State
  const pan = useRef(new Animated.ValueXY({ x: SLIDER_WIDTH / 2, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        // Calculate new X position relative to the container
        let newX = gestureState.moveX - (width - SLIDER_WIDTH) / 2;
        
        // Keep thumb within bounds
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <ImageBackground
        source={require('../../assets/topographic_map.png')} 
        style={styles.mapBase}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.overlayContainer}>
          
          <View style={styles.topControls}>
            <TouchableOpacity style={[styles.iconButton, styles.bgGreen]}>
              <Image style={styles.navIcon} source={require('../../assets/nav_1.png')} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.iconButton, styles.bgBrown]}>
              <Image style={styles.navIcon} source={require('../../assets/nav_2.png')} />
            </TouchableOpacity>
            
            <View style={styles.weatherBadge}>
              <Image style={styles.navIcon} source={require('../../assets/nav_3.png')} />
              <Text style={styles.weatherTemp}>31°</Text>
            </View>
            
            <TouchableOpacity style={styles.sosButton}>
              <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapFrame}>
            <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                    styles.sliderThumb,
                    {
                        transform: [{ translateX: pan.x }],
                    },
                    ]}
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

          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem}>
                <Image style={styles.navIcon} source={require('../../assets/tab_1.png')} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
                <Image style={styles.navIcon} source={require('../../assets/tab_2.png')} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
                <Image style={styles.navIcon} source={require('../../assets/tab_0.png')} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
                <Image style={styles.navIcon} source={require('../../assets/tab_3.png')} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
                <Image style={styles.navIcon} source={require('../../assets/tab_4.png')} />
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'red' },
  mapBase: { flex: 1 },
  overlayContainer: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 25 },
  topControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50 },
  iconButton: { width: 60, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  bgGreen: { backgroundColor: '#0E713E' },
  bgBrown: { backgroundColor: '#4D3626' },
  weatherBadge: { backgroundColor: '#FFF', flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center' },
  weatherTemp: { fontWeight: 'bold', color: '#333' },
  sosButton: { backgroundColor: '#FF0000', width: 65, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sosText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  mapFrame: { flex: 1, marginTop: 20, marginBottom: 80, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 30, backgroundColor: '#304e184b', justifyContent: 'center', alignItems: 'center' },
  
  sliderContainer: { position: 'absolute', bottom: -20, width: '90%', alignItems: 'center' },
  sliderTrack: { height: 4, backgroundColor: '#4D3626', width: '100%', borderRadius: 2, justifyContent: 'center' },
  sliderThumb: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    backgroundColor: '#FFF', 
    borderWidth: 2, 
    borderColor: '#0E713E', 
    position: 'absolute',
    marginLeft: -10, // Centers the thumb on the point
  },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8 },
  rangeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },

  bottomNav: { flexDirection: 'row', backgroundColor: '#4A9267', height: 50, borderRadius: 30, marginBottom: 25, alignItems: 'center', justifyContent: 'space-around' },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { height: 24, width: 24, resizeMode: 'contain' },
});

export default HomeScreen;