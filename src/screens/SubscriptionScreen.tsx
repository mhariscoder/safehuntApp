import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const SubscriptionScreen = ({ navigation }: any) => {
  // Defaulting to annual selection as per your reference image
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Dark Forest Gradient */}
      <LinearGradient
        colors={['#1D4D2F', '#183B24', '#0F1A13']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.content}>
            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image source={require('../../assets/back_arrow.png')} style={styles.backArrow} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Safe Hunt Subscription</Text>
                <View style={{ width: 40 }} /> 
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Hero Image */}
            <View style={styles.heroWrapper}>
                <Image
                    source={require('../../assets/hunter_hero.png')} 
                    style={styles.heroImage}
                    resizeMode="cover"
                />
            </View>

            {/* White Card Content */}
            <View style={styles.whiteCard}>
                <Text style={styles.mainTitle}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore 
                </Text>

                {/* Feature List */}
                <View style={styles.featureContainer}>
                <FeatureRow text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." />
                <FeatureRow text="Lorem ipsum dolor sit amet, consectetur adipiscing elit," />
                <FeatureRow text="Lorem ipsum dolor sit amet" />
                </View>

                {/* $500 Plan - Now with Checkmark */}
                <TouchableOpacity 
                activeOpacity={0.9}
                style={[styles.planBox, selectedPlan === 'monthly' && styles.selectedPlanBorder]} 
                onPress={() => setSelectedPlan('monthly')}
                >
                <View style={styles.radioCircle}>
                    {selectedPlan === 'monthly' && (
                    <Text style={styles.checkIconText}>✓</Text>
                    )}
                </View>
                <View>
                    <Text style={styles.priceText}>$500</Text>
                    <Text style={styles.subText}>1 Month</Text>
                </View>
                </TouchableOpacity>

                {/* $1000 Plan - With Checkmark */}
                <TouchableOpacity 
                activeOpacity={0.9}
                style={[styles.planBox, selectedPlan === 'annual' && styles.selectedPlanBorder]} 
                onPress={() => setSelectedPlan('annual')}
                >
                <View style={styles.radioCircle}>
                    {selectedPlan === 'annual' && (
                    <Text style={styles.checkIconText}>✓</Text>
                    )}
                </View>
                <View>
                    <Text style={styles.priceText}>$1000</Text>
                    <Text style={styles.subText}>12 Month</Text>
                </View>
                </TouchableOpacity>

                {/* Proceed Button */}
                <TouchableOpacity 
                style={styles.proceedButton}
                onPress={() => navigation.navigate('Home')}
                >
                <Text style={styles.proceedText}>Proceed</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const FeatureRow = ({ text }: { text: string }) => (
  <View style={styles.featureRow}>
    <Text style={styles.checkMark}>✓</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 25
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 50,
  },
  backButton: {
    //  padding: 10 
  },
  backArrow: { width: 21, height: 21, resizeMode: 'contain' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  scrollContent: { paddingBottom: 40 },
  heroWrapper: {
    alignItems: 'center',
    marginTop: 50,
    zIndex: 10,
    elevation: 10,
    transform: [{ scale: 1.25 }],
  },
  heroImage: {
    width: '100%',
    height: 250,
    borderRadius: 30,
  },
  whiteCard: {
    backgroundColor: '#FFF',
    marginTop: -40,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    paddingHorizontal: 30,
    paddingBottom: 30,
    paddingTop: 50,
  },
  mainTitle: {
    fontFamily: 'Montserrat-Bold', 
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 17,        
    letterSpacing: 0,
    color: '#000000',
    marginBottom: 20,
  },
  featureContainer: { marginBottom: 0 },
  featureRow: { flexDirection: 'row', marginBottom: 15 },
  checkMark: { color: '#1D4D2F', marginRight: 10, fontSize: 18, fontWeight: 'bold' },
  featureText: {
    fontFamily: 'Montserrat-Regular', 
    fontWeight: '400',              
    fontSize: 12,
    lineHeight: 14.4,               
    letterSpacing: 0,
    color: '#4E2D18',
  },
  planBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D3D3D3',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlanBorder: {
    borderColor: '#1D4D2F',
  },
  radioCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D4D2F',
  },
  checkIconText: {
    color: '#1D4D2F',
    fontWeight: '900',
    fontSize: 22,
    lineHeight: 24,
    textAlign: 'center',
  },
  priceText: { fontSize: 24, fontWeight: '900', color: '#1D4D2F' },
  subText: { fontSize: 12, color: '#999' },
  proceedButton: {
    backgroundColor: '#0E713E',
    borderRadius: 35,
    paddingVertical: 13,
    alignItems: 'center'
  },
  proceedText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});

export default SubscriptionScreen;