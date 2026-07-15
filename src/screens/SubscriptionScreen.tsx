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
import { useIAP, ErrorCode, type Purchase, getReceiptIOS } from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import { store } from '../app/store';

const { width } = Dimensions.get('window');

// iOS: safeHuntSubscriptionPro (from App Store Connect)
// Android: safe_hunt_subscription_pro (from Google Play Console)
const SUBSCRIPTION_IDS =
  Platform.OS === 'ios'
    ? ['safeHuntSubscriptionPro']
    : ['safe_hunt_subscription_pro'];

const SubscriptionScreen = ({ navigation }: any) => {
  const state = store.getState();
  const token = state.auth.token;
  const subscriptionStatus = state.auth.user?.subscriptionStatus;

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verify Google Play subscription (Android)
  const verifyGoogleSubscription = async (purchase: Purchase) => {
    try {
      const token = purchase?.purchaseToken || purchase?.transactionId;
      const packageName = 'com.safehunt.app';
      const productId = purchase?.productId;

      const response = await fetch(
        `${API_BASE_URL}/in-app-purchase/verify-google-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            token,
            packageName,
            productId,
          }),
        },
      );

      return await response.json();
    } catch (error) {
      console.log('Verify API Error:', error);
      throw error;
    }
  };

  // Verify Apple App Store subscription (iOS)
  const verifyAppleSubscription = async () => {
    const receipt = await getReceiptIOS();

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    const response = await fetch(
      `${API_BASE_URL}/in-app-purchase/verify-apple-subscription`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: receipt,
        }),
      },
    );

    return response.json();
  };

  const {
    connected,
    subscriptions,
    activeSubscriptions,
    fetchProducts,
    requestPurchase,
    getActiveSubscriptions,
    finishTransaction: finishTransactionHook,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        console.log('✅ Purchase successful:', purchase);

        // Finish the transaction
        await finishTransactionHook({
          purchase,
          isConsumable: false,
        });

        // Verify subscription with backend based on platform
        if (Platform.OS === 'android') {
          const result = await verifyGoogleSubscription(purchase);
          console.log('Google verify result:', result);
        } else {
          const result = await verifyAppleSubscription(purchase);
          console.log('Apple verify result:', result);
        }

        // Refresh active subscriptions
        await getActiveSubscriptions(SUBSCRIPTION_IDS);

        setIsPurchasing(false);
        
        Alert.alert(
          '🎉 Success',
          'Subscription activated successfully! You now have full access to Safe Hunt.',
          [
            { 
              text: 'Continue', 
              onPress: () => navigation.navigate('Home') 
            }
          ]
        );
      } catch (error) {
        console.log('Finish Transaction Error:', error);
        setIsPurchasing(false);
        Alert.alert('Error', 'Failed to complete transaction. Please contact support.');
      }
    },

    onPurchaseError: (error) => {
      setIsPurchasing(false);
      
      if (error.code === ErrorCode.UserCancelled) {
        console.log('User cancelled purchase');
        return;
      }
      
      Alert.alert(
        'Purchase Failed',
        error.message || 'Something went wrong. Please try again.',
      );
    },
    
    onError: (error) => {
      console.error('IAP Error:', error);
      setIsPurchasing(false);
      setErrorMessage(error.message || 'An unexpected error occurred');
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    },
  });

  // Load subscriptions when connected
  useEffect(() => {
    if (connected) {
      loadSubscriptions();
    }
  }, [connected]);

  // Set default selected plan when subscriptions load
  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      const firstProductId = subscriptions[0]?.productId || subscriptions[0]?.id;
      if (firstProductId) {
        setSelectedPlanId(firstProductId);
        setErrorMessage(null);
      }
    } else if (connected && !loadingProducts) {
      // If connected but no subscriptions, show error
      setErrorMessage('No subscription products found. Please check your product configuration.');
    }
  }, [subscriptions, connected, loadingProducts]);

  // Load subscription products from store with better error handling
  const loadSubscriptions = async () => {
    try {
      setLoadingProducts(true);
      setErrorMessage(null);
      
      console.log('📱 Loading subscriptions for platform:', Platform.OS);
      console.log('📦 Subscription IDs:', SUBSCRIPTION_IDS);
      console.log('🔗 Connected status:', connected);
      
      // First, check if the store is ready
      if (!connected) {
        console.warn('⚠️ Store not connected yet');
        return;
      }

      // Try to fetch products with error handling
      try {
        await fetchProducts({
          skus: SUBSCRIPTION_IDS,
          type: 'subs',
        });
        console.log('✅ Products fetched successfully:', subscriptions.length);
      } catch (fetchError) {
        console.error('❌ Fetch products error:', fetchError);
        // Try alternative approach for Android
        if (Platform.OS === 'android') {
          console.log('🔄 Trying alternative approach for Android...');
          try {
            await fetchProducts({
              skus: SUBSCRIPTION_IDS,
              type: 'inapp', // Try as in-app for Android
            });
            console.log('✅ Alternative approach succeeded');
          } catch (altError) {
            console.error('❌ Alternative approach failed:', altError);
            throw altError;
          }
        } else {
          throw fetchError;
        }
      }
      
      // Check if user already has active subscriptions
      try {
        const active = await getActiveSubscriptions(SUBSCRIPTION_IDS);
        console.log('Active subscriptions:', active);
        
        if (active && active.length > 0) {
          console.log('User already has active subscription');
          // navigation.navigate('Home');
        }
      } catch (activeError) {
        console.warn('Could not fetch active subscriptions:', activeError);
      }
      
    } catch (error) {
      console.error('❌ Error loading subscriptions:', error);
      setErrorMessage(`Failed to load subscriptions: ${error.message || 'Unknown error'}`);
      Alert.alert(
        'Error Loading Subscriptions',
        'Failed to load subscription options. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: loadSubscriptions },
          { text: 'Continue to Trial', onPress: handleContinueTrial }
        ]
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle purchase request
  const handlePurchase = async () => {
    if (!selectedPlanId) {
      Alert.alert('Select Subscription', 'Please select a plan first');
      return;
    }

    if (!connected) {
      Alert.alert('Not Connected', 'Billing service is not available');
      return;
    }

    if (isPurchasing) {
      return;
    }

    try {
      setIsPurchasing(true);
      console.log('🛒 Starting purchase for:', selectedPlanId);
      console.log('📱 Platform:', Platform.OS);
      
      // Build purchase request
      const purchaseRequest: any = {
        type: 'subs',
        request: {},
      };

      if (Platform.OS === 'ios') {
        purchaseRequest.request.ios = { 
          sku: selectedPlanId 
        };
        console.log('🍎 iOS purchase request:', purchaseRequest);
      } else if (Platform.OS === 'android') {
        purchaseRequest.request.android = { 
          skus: [selectedPlanId] 
        };
        console.log('🤖 Android purchase request:', purchaseRequest);
      }

      await requestPurchase(purchaseRequest);
      console.log('✅ Purchase request sent successfully');
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      setIsPurchasing(false);
      
      Alert.alert(
        'Purchase Error',
        error.message || 'Failed to start purchase process. Please try again.'
      );
    }
  };

  const handleContinueTrial = async () => {
    try {
      console.log('📝 Starting trial...');
      await AsyncStorage.setItem('HAS_STARTED_TRIAL', 'true');
      console.log('✅ Trial status saved');
      
      // Method 1: Try global refresh first
      // @ts-ignore
      if (global.refreshNavigation) {
        console.log('🔄 Using global refresh...');
        // @ts-ignore
        await global.refreshNavigation();
        return;
      }
      
      // Method 2: Pop to top and navigate
      console.log('🔄 Using navigation fallback...');
      navigation.popToTop();
      
      // Method 3: Reset navigation completely
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }, 300);
      
    } catch (error) {
      console.log('Error saving trial state:', error);
      Alert.alert('Error', 'Failed to start trial. Please try again.');
    }
  };

  // Handle restore purchases (iOS specific)
  const handleRestorePurchases = async () => {
    try {
      console.log('🔄 Restoring purchases...');
      const active = await getActiveSubscriptions(SUBSCRIPTION_IDS);
      
      if (active && active.length > 0) {
        Alert.alert(
          'Success', 
          'Your subscriptions have been restored!',
          [
            { 
              text: 'Continue', 
              onPress: () => navigation.navigate('Home') 
            }
          ]
        );
      } else {
        Alert.alert('No Subscriptions', 'No active subscriptions found to restore.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  // Loading Screen
  if (!connected || loadingProducts) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={['#1D4D2F', '#183B24', '#0F1A13']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#0E713E" />
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

      <View style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleContinueTrial} 
              style={styles.backButton}
              disabled={isPurchasing}
            >
              <Image source={require('../../assets/back_arrow.png')} style={styles.backArrow} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Safe Hunt Subscription</Text>
            <View style={{ width: 40 }} /> 
          </View>

          <View style={styles.heroWrapper}>
            <Image
              source={require('../../assets/hunter_hero.png')} 
              style={styles.heroImage}
            />
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero Image */}
            

            {/* White Card Content */}
            <View style={styles.whiteCard}>
              <Text style={styles.title}>
                Hunter Pro Pack
              </Text>

              <Text style={styles.mainTitle}>
                Stay Connected without linits! Start your FREE 7 day trail today.
              </Text>

              <Text style={styles.mainDesc}>
                SafeHuntPro not only eases your mind in the outdoors but also when trying to choose the right features for you . We hve simplified our options to an all inclusive subscription package that allows each user to get the full Safe Hunt Pro experience.
              </Text>

              {/* Feature List */}
              <View style={styles.featureContainer}>
                <Text style={styles.mainTitle}>
                  Premier Features
                </Text>
                
                <FeatureRow text="User location and notification" />
                <FeatureRow text="Social Media interaction" />
                <FeatureRow text="Offline mapping" />
                <FeatureRow text="Weather" />
                <FeatureRow text="Hunting Journal" />
              </View>

              {subscriptionStatus === 'SUBSCRIBED' ? (
                <>
                  {/* ================= SUBSCRIBED USER ================= */}

                  <View style={styles.subscribedContainer}>
                    <Text style={styles.subscribedIcon}>🎉</Text>

                    <Text style={styles.subscribedTitle}>
                      You're Already a Safe Hunt Pro Member
                    </Text>

                    <Text style={styles.subscribedDescription}>
                      Your subscription is currently active. Enjoy unlimited access to all
                      premium Safe Hunt features.
                    </Text>

                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>
                        ✓ ACTIVE SUBSCRIPTION
                      </Text>
                    </View>
                  </View>
                </>
              ) : (<>
              
                {/* Error Message */}
                {errorMessage && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                    <TouchableOpacity 
                      style={styles.retryButton} 
                      onPress={loadSubscriptions}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Dynamic Subscriptions mapping */}
                {subscriptions.length === 0 && !errorMessage ? (
                  <View style={styles.loadingPlansCard}>
                    <ActivityIndicator size="small" color="#0E713E" />
                    <Text style={styles.loadingPlansText}>Loading subscription options...</Text>
                  </View>
                ) : subscriptions.length === 0 && errorMessage ? (
                  <View style={styles.noPlansCard}>
                    <Text style={styles.noPlansEmoji}>📦</Text>
                    <Text style={styles.noPlansTitle}>No Subscription Plans Available</Text>
                    <Text style={styles.noPlansText}>
                      Please check your product configuration in App Store Connect or Google Play Console.
                    </Text>
                  </View>
                ) : (
                  subscriptions.map((item) => {
                    const currentId = item.productId || item.id;
                    const isSelected = selectedPlanId === currentId;

                    return (
                      <TouchableOpacity 
                        key={currentId}
                        activeOpacity={0.9}
                        style={[styles.planBox, isSelected && styles.selectedPlanBorder]} 
                        onPress={() => setSelectedPlanId(currentId)}
                        disabled={isPurchasing}
                      >
                        <View style={styles.radioCircle}>
                          {isSelected && (
                            <Text style={styles.checkIconText}>✓</Text>
                          )}
                        </View>
                        <View style={styles.planInfo}>
                          <Text style={styles.priceText}>
                            {item.displayPrice || item.localizedPrice || item.price || 'Price Unavailable'}
                          </Text>
                          <Text style={styles.subText}>
                            {item.title || item.description || 'Premium Access'}
                          </Text>
                          <Text style={styles.platformTag}>
                            {Platform.OS === 'ios' ? '🍎 Apple App Store' : '🤖 Google Play Store'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                {/* Proceed Button */}
                <TouchableOpacity 
                  style={[
                    styles.proceedButton,
                    (!selectedPlanId || subscriptions.length === 0 || isPurchasing) && styles.buttonDisabled
                  ]}
                  onPress={handlePurchase}
                  disabled={!selectedPlanId || subscriptions.length === 0 || isPurchasing}
                >
                  {isPurchasing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.proceedText}>Subscribe Now</Text>
                  )}
                </TouchableOpacity>

                {/* Continue to Trial Link */}
                <TouchableOpacity
                  style={styles.trialLinkContainer}
                  onPress={handleContinueTrial}
                  disabled={isPurchasing}
                >
                  <Text style={styles.trialLinkText}>
                    Continue with Free Trial
                  </Text>
                </TouchableOpacity>

                {/* Restore Purchases (iOS specific) */}
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleRestorePurchases}
                    disabled={isPurchasing}
                  >
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                  </TouchableOpacity>
                )}

                {/* Debug Info */}
                <View style={styles.debugContainer}>
                  <Text style={styles.debugText}>
                    Platform: {Platform.OS}
                  </Text>
                  <Text style={styles.debugText}>
                    Product IDs: {SUBSCRIPTION_IDS.join(', ')}
                  </Text>
                  <Text style={styles.debugText}>
                    Subscriptions found: {subscriptions.length}
                  </Text>
                  <Text style={styles.debugText}>
                    Connected: {connected ? 'Yes' : 'No'}
                  </Text>
                </View>
              
              </>)}

              
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

// Feature Row Component
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
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backArrow: { width: 21, height: 21, resizeMode: 'contain' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  scrollContent: { paddingBottom: 40, position: 'relative' },
  heroWrapper: {
    alignItems: 'center',
  },
  heroImage: {
    height: 250,
    backgroundColor: 'transparent',
    resizeMode: 'contain',
  },
  whiteCard: {
    backgroundColor: '#FFF',
    position: 'relative',
    borderRadius: 30,
    paddingHorizontal: 25,
    paddingBottom: 30,
    paddingTop: 30,
    width: '100%'
  },
  title: {
    fontFamily: 'Montserrat-Regular',
    fontWeight: '900',
    fontSize: 24,
    color: '#000000',
    marginBottom: 20,
  },
  mainTitle: {
    fontFamily: 'Montserrat-Bold',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 17,
    color: '#000000',
    marginBottom: 20,
  },
  mainDesc: {
    fontFamily: 'Montserrat-Bold',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: '#000000',
    marginBottom: 20,
  },
  featureContainer: { marginBottom: 20 },
  featureRow: { flexDirection: 'row', marginBottom: 12 },
  checkMark: { color: '#1D4D2F', marginRight: 10, fontSize: 18, fontWeight: 'bold' },
  featureText: {
    fontFamily: 'Montserrat-Regular',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 14.4,
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
  errorContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  errorText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noPlansCard: {
    padding: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  noPlansEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noPlansTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noPlansText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  planBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D3D3D3',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
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
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1D4D2F',
  },
  checkIconText: {
    color: '#1D4D2F',
    fontWeight: '900',
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  planInfo: {
    flex: 1,
  },
  priceText: { fontSize: 22, fontWeight: '900', color: '#1D4D2F' },
  subText: { fontSize: 12, color: '#555', marginTop: 2 },
  platformTag: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  proceedButton: {
    backgroundColor: '#0E713E',
    borderRadius: 35,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  proceedText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  trialLinkContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  trialLinkText: {
    fontSize: 14,
    color: '#0E713E',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  restoreButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  subscribedContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  subscribedIcon: {
    fontSize: 60,
    marginBottom: 15,
  },

  subscribedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0E713E',
    textAlign: 'center',
    marginBottom: 10,
  },

  subscribedDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },

  activeBadge: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 25,
  },

  activeBadgeText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default SubscriptionScreen;