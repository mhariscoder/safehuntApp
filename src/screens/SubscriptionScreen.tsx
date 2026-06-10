import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useIAP, ErrorCode } from 'react-native-iap';

const { width } = Dimensions.get('window');

const SUBSCRIPTION_IDS =
  Platform.OS === 'ios'
    ? ['SafeHuntSubscription']
    : ['safe_hunt_subscription_pro'];

const SubscriptionScreen = ({ navigation }: any) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const {
    connected,
    subscriptions,
    activeSubscriptions,
    fetchProducts,
    requestPurchase,
    getActiveSubscriptions,
    finishTransaction: finishTransactionHook,
  } = useIAP({
    onPurchaseSuccess: async purchase => {
      try {
        await finishTransactionHook({
          purchase,
          isConsumable: false,
        });

        await getActiveSubscriptions(SUBSCRIPTION_IDS);
        
        Alert.alert(
          'Success',
          'Subscription activated successfully!',
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      } catch (error) {
        console.log('Finish Transaction Error:', error);
        Alert.alert('Error', 'Failed to complete transaction');
      }
    },

    onPurchaseError: error => {
      if (error.code === ErrorCode.UserCancelled) {
        return;
      }
      Alert.alert(
        'Purchase Failed',
        error.message || 'Something went wrong. Please try again.',
      );
    },
    
    onError: error => {
      console.error('IAP Error:', error);
      Alert.alert('Error', error.message);
    },
  });

  // Load subscriptions when connected status turns true
  useEffect(() => {
    if (connected) {
      loadSubscriptions();
    }
  }, [connected]);

  // FIXED: Accessing item.id to match your Google Play response object structure
  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      const firstProductId = subscriptions[0].id || subscriptions[0].productId;
      if (firstProductId) {
        setSelectedPlanId(firstProductId);
      }
    } else if (connected) {
      setSelectedPlanId(SUBSCRIPTION_IDS[0]);
    }
  }, [subscriptions, connected]);

  const loadSubscriptions = async () => {
    try {
      await fetchProducts({
        skus: SUBSCRIPTION_IDS,
        type: 'subs',
      });
      await getActiveSubscriptions(SUBSCRIPTION_IDS);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      Alert.alert('Error', 'Failed to load subscription options from store');
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlanId) {
      Alert.alert('Select Subscription', 'Please select a plan first');
      return;
    }

    if (!connected) {
      Alert.alert('Not Connected', 'Billing service is not available');
      return;
    }

    try {
      await requestPurchase({
        request: {
          ios: { sku: selectedPlanId },
          android: { skus: [selectedPlanId] },
        },
        type: 'subs',
      });
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Error',
        error.message || 'Failed to start purchase process'
      );
    }
  };

  // Loading Screen while connecting to Store Billing System
  if (!connected) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={['#1D4D2F', '#183B24', '#0F1A13']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#0E713E" />
        <Text style={styles.loaderText}>Connecting to billing service...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Dark Forest Gradient */}
      <LinearGradient
        colors={['#1D4D2F', '#183B24', '#0F1A13']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
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

              {/* Dynamic Subscriptions mapping */}
              {subscriptions.length === 0 ? (
                <View style={styles.loadingPlansCard}>
                  <ActivityIndicator size="small" color="#0E713E" />
                  <Text style={styles.loadingPlansText}>Loading subscription options...</Text>
                </View>
              ) : (
                subscriptions.map(item => {
                  // FIXED: Fallback checklist to catch .id instead of missing .productId field
                  const currentId = item.id || item.productId;
                  const isSelected = selectedPlanId === currentId;

                  return (
                    <TouchableOpacity 
                      key={currentId}
                      activeOpacity={0.9}
                      style={[styles.planBox, isSelected && styles.selectedPlanBorder]} 
                      onPress={() => setSelectedPlanId(currentId)}
                    >
                      <View style={styles.radioCircle}>
                        {isSelected && (
                          <Text style={styles.checkIconText}>✓</Text>
                        )}
                      </View>
                      <View style={styles.planInfo}>
                        <Text style={styles.priceText}>
                          {item.displayPrice || item.localizedPrice || item.price}
                        </Text>
                        <Text style={styles.subText}>
                          {item.title || 'Premium Access'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* DEBUGGER ELEMENT */}
              <Text style={styles.debugText}>
                [DEBUG] Count: {subscriptions.length} | ID Selected: {selectedPlanId || 'None'}
              </Text>

              {/* Proceed Button */}
              <TouchableOpacity 
                style={[
                  styles.proceedButton,
                  (!selectedPlanId || subscriptions.length === 0) && styles.buttonDisabled
                ]}
                onPress={handlePurchase}
                disabled={!selectedPlanId || subscriptions.length === 0}
              >
                <Text style={styles.proceedText}>Proceed</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 15,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
  featureContainer: { marginBottom: 20 },
  featureRow: { flexDirection: 'row', marginBottom: 15 },
  checkMark: { color: '#1D4D2F', marginRight: 10, fontSize: 18, fontWeight: 'bold' },
  featureText: {
    fontFamily: 'Montserrat-Regular', 
    fontWeight: '400',              
    fontSize: 12,
    lineHeight: 14.4,               
    letterSpacing: 0,
    color: '#4E2D18',
    flex: 1,
  },
  loadingPlansCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  loadingPlansText: {
    color: '#1D4D2F',
    marginTop: 8,
    fontSize: 14,
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
    backgroundColor: '#EAF2EC'
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
  planInfo: {
    flex: 1,
  },
  priceText: { fontSize: 24, fontWeight: '900', color: '#1D4D2F' },
  subText: { fontSize: 12, color: '#555', marginTop: 2 },
  proceedButton: {
    backgroundColor: '#0E713E',
    borderRadius: 35,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  proceedText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  debugText: {
    color: 'red',
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: '600'
  }
});

export default SubscriptionScreen;