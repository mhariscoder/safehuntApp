import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const CardDetailScreen = ({ navigation }: any) => {
  const [saveCard, setSaveCard] = useState(true);

  return (
    <View style={styles.container}>
      {/* Status Bar for a clean notch look */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Brand Gradient */}
      <LinearGradient
        colors={['#1D4D2F', '#183B24', '#0F1A13']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>〈</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Card Details</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Frosted Glass Card Representation */}
            <View style={styles.cardContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)']}
                style={styles.visualCard}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.primaryBadge}>
                    <Text style={styles.badgeText}>Primary</Text>
                  </View>
                  <Text style={styles.cardBrandText}>Mastercard</Text>
                </View>
                
                <View style={styles.cardNumberDisplay}>
                  <Text style={styles.cardDots}>•••••</Text>
                  <Text style={styles.lastFour}>1184</Text>
                </View>
              </LinearGradient>
              {/* This view creates the soft white glow under the card shown in your Figma */}
              <View style={styles.cardShadowGlow} />
            </View>

            {/* Input Form Section */}
            <View style={styles.whiteFormCard}>
              <TextInput 
                style={styles.inputField} 
                placeholder="Card Number" 
                placeholderTextColor="#888"
                keyboardType="numeric"
              />

              <View style={styles.inputRow}>
                <TextInput 
                  style={[styles.inputField, { width: '47%' }]} 
                  placeholder="MM/YY" 
                  placeholderTextColor="#888"
                />
                <TextInput 
                  style={[styles.inputField, { width: '47%' }]} 
                  placeholder="CVC" 
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  secureTextEntry
                />
              </View>

              <TextInput 
                style={styles.inputField} 
                placeholder="Name Of The Card Holder" 
                placeholderTextColor="#888"
              />

              {/* Checkbox Section */}
              <TouchableOpacity 
                style={styles.checkboxWrapper} 
                onPress={() => setSaveCard(!saveCard)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxBase, saveCard && styles.checkboxSelected]}>
                  {saveCard && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>
                  Save This Card For a Faster Checkout Next Time
                </Text>
              </TouchableOpacity>

              {/* Action Button */}
              <TouchableOpacity 
                style={styles.doneBtn} 
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
            
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 60,
  },
  backButton: { padding: 10 },
  backArrow: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: '#FFF', fontSize: 26, fontWeight: '700' },
  
  scrollContent: { paddingBottom: 40 },

  cardContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    zIndex: 10, // Keeps the card above the white section
  },
  visualCard: {
    height: 190,
    borderRadius: 25,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryBadge: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  cardBrandText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  cardNumberDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardDots: { color: '#3D2B1F', fontSize: 40, marginRight: 12 },
  lastFour: { color: '#3D2B1F', fontSize: 32, fontWeight: '900', marginTop: 10 },
  
  cardShadowGlow: {
    position: 'absolute',
    bottom: -15,
    left: 45,
    right: 45,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 30,
    zIndex: -1,
    // Add shadow props for iOS/Android glow effect
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },

  whiteFormCard: {
    backgroundColor: '#FFFFFF',
    marginTop: -50, // Overlap effect
    marginHorizontal: 10,
    borderRadius: 45,
    paddingHorizontal: 25,
    paddingTop: 85, // Extra padding to account for the card overlap
    paddingBottom: 40,
  },
  inputField: {
    backgroundColor: '#E0E0E0',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 25,
    marginBottom: 20,
    fontSize: 16,
    color: '#000',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    paddingRight: 20,
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0E713E',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#FFF' },
  checkMark: { color: '#0E713E', fontSize: 14, fontWeight: 'bold' },
  checkboxText: { fontSize: 13, color: '#777', flexShrink: 1 },
  
  doneBtn: {
    backgroundColor: '#0E713E',
    borderRadius: 35,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  doneBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});

export default CardDetailScreen;