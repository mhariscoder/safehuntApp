import React, { useState, useEffect, useRef } from 'react';
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
import { useIAP, ErrorCode, type Purchase, getReceiptIOS, validateReceiptIos } from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import { RootState } from '../app/store';
import { useAppDispatch } from '../app/store/hooks';
import { logout } from '../features/auth/authActions';
import { resetAndNavigate } from '../navigation/navigationRef';
import { updateUserLocal } from '../features/auth/authSlice';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

// iOS: safeHuntSubscriptionPro (from App Store Connect)
// Android: safe_hunt_subscription_pro (from Google Play Console)
const SUBSCRIPTION_IDS =
  Platform.OS === 'ios'
    ? ['safeHuntSubscriptionPro']
    : ['safe_hunt_subscription_pro'];

const SubscriptionScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();

  // const state = store.getState();
  // const user = state.auth.user;
  // const accesstoken = state.auth.token;
  // const subscriptionStatus = state.auth.user?.subscriptionStatus;

  const user = useSelector((state: RootState) => state.auth.user);
  const accesstoken = useSelector((state: RootState) => state.auth.token);
  const subscriptionStatus = user?.subscriptionStatus;


  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const purchaseInProgress = useRef(false);


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
            Authorization: `Bearer ${accesstoken}`,
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
  const verifyAppleSubscription = async (purchase: Purchase) => {
    try {
      console.log('🍎 Getting iOS receipt...');
      
      // Wait a bit for receipt to be available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const receipt = await getReceiptIOS();

      if (!receipt) {
        throw new Error('Receipt not found - please try again');
      }

      console.log('✅ Receipt found, length:', receipt.length);

      // Validate receipt with Apple directly first (optional but recommended)
      try {
        // const validationResult = await validateReceiptIos({
        //   receiptBody: {
        //     'receipt-data': receipt,
        //     'password': 'YOUR_APP_SPECIFIC_SHARED_SECRET' // Optional
        //   },
        //   isTest: true, // or false for production
        // });
        // console.log('Apple validation result:', validationResult);
      } catch (validateError) {
        console.log('Apple direct validation failed:', validateError);
        // Continue with your backend validation
      }

      // Send to your backend
      const response = await fetch(
        `${API_BASE_URL}/in-app-purchase/verify-apple-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accesstoken}`,
          },
          body: JSON.stringify({
            token: receipt,
            transactionId: purchase.transactionId,
            productId: purchase.productId,
          }),
        },
      );

      const result = await response.json();

      console.log('Apple Verify Result:', result);

      return result;
    } catch (error) {
      console.error('Apple verification error:', error);
      throw error;
    }
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
      console.log('====================================');
      console.log('✅ PURCHASE RECEIVED');
      console.log('====================================');
      console.log(JSON.stringify(purchase, null, 2));

      // CRITICAL FIX: Check if already processing
      if (purchaseInProgress.current) {
        console.log('⚠️ Purchase already in progress, skipping...');
        return;
      }

      purchaseInProgress.current = true;
      setIsPurchasing(true);

      try {
        let verifyResult: any = null;

        console.log('🚀 STEP 1: Starting verification...');

        if (Platform.OS === 'ios') {
          let retries = 3;
          while (retries > 0) {
            try {
              verifyResult = await verifyAppleSubscription(purchase);
              break;
            } catch (error) {
              retries--;
              console.log(`⚠️ Receipt verification attempt failed, ${retries} retries left`);
              if (retries === 0) throw error;
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          console.log('✅ Apple verification success');
          console.log(verifyResult);
        } else {
          verifyResult = await verifyGoogleSubscription(purchase);
          console.log('✅ Google verification success');
          console.log(verifyResult);
        }

        console.log('🚀 STEP 2: Finishing transaction...');

        try {
          await finishTransactionHook({
            purchase,
            isConsumable: false,
          });
          console.log('✅ Transaction finished successfully');
        } catch (finishError) {
          console.error('⚠️ Finish transaction error:', finishError);
        }

        // Update Redux
        dispatch(
          updateUserLocal({
            subscriptionStatus: 'SUBSCRIBED',
          }),
        );

        console.log('✅ Redux updated');

        // Refresh subscriptions
        try {
          console.log('🚀 STEP 3: Refreshing subscriptions...');
          const active = await getActiveSubscriptions(SUBSCRIPTION_IDS);
          console.log('✅ Active subscriptions:', active);
        } catch (e) {
          console.log('⚠️ Failed to refresh subscriptions:', e);
        }

        // CRITICAL FIX: Reset states before showing alert
        purchaseInProgress.current = false;
        setIsPurchasing(false);

        Alert.alert(
          '🎉 Success',
          'Subscription activated successfully!',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Home'),
            },
          ],
        );
      } catch (error: any) {
        console.log('====================================');
        console.log('❌ PURCHASE FAILED');
        console.log('====================================');
        console.log(error);

        // Reset states
        purchaseInProgress.current = false;
        setIsPurchasing(false);

        // Try to finish transaction even on error
        try {
          console.log('🔄 Attempting to finish transaction after error...');
          await finishTransactionHook({
            purchase,
            isConsumable: false,
          });
        } catch (finishError) {
          console.log('⚠️ Could not finish transaction after error:', finishError);
        }

        Alert.alert(
          'Purchase Error',
          error?.message || 'Failed to complete the purchase. Please try again.',
        );
      }
    },

    onPurchaseError: (error) => {
      console.log('Purchase error:', error);
      purchaseInProgress.current = false;
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
      purchaseInProgress.current = false;
      setIsPurchasing(false);
      setErrorMessage(error.message || 'An unexpected error occurred');
      
      if (error.code === 'E_USER_CANCELLED' || error.code === 'E_SERVICE_ERROR') {
        console.log('Skipping alert for:', error.code);
        return;
      }
      
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
      
      if (!connected) {
        console.warn('⚠️ Store not connected yet');
        return;
      }

      try {
        await fetchProducts({
          skus: SUBSCRIPTION_IDS,
          type: 'subs',
        });
        console.log('✅ Products fetched successfully:', subscriptions.length);
      } catch (fetchError) {
        console.error('❌ Fetch products error:', fetchError);
        
        // CRITICAL FIX: Handle Android differently
        if (Platform.OS === 'android') {
          console.log('🔄 Trying alternative approach for Android...');
          try {
            await fetchProducts({
              skus: SUBSCRIPTION_IDS,
              type: 'inapp',
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
      
      try {
        const active = await getActiveSubscriptions(SUBSCRIPTION_IDS);
        console.log('Active subscriptions:', active);
        
        if (active && active.length > 0) {
          console.log('User already has active subscription');
        }
      } catch (activeError) {
        console.warn('Could not fetch active subscriptions:', activeError);
      }
      
    } catch (error: any) {
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

  const handlePurchase = async () => {
    if (!selectedPlanId) {
      Alert.alert('Select Subscription', 'Please select a plan first');
      return;
    }

    if (!connected) {
      Alert.alert('Not Connected', 'Billing service is not available');
      return;
    }

    // Check both state and ref
    if (isPurchasing || purchaseInProgress.current) {
      Alert.alert('Processing', 'Please wait for the current purchase to complete');
      return;
    }

    try {
      setIsPurchasing(true);
      console.log('🛒 Starting purchase for:', selectedPlanId);
      console.log('📱 Platform:', Platform.OS);
      
      if (Platform.OS === 'ios') {
        const purchaseRequest = {
          request: {
            ios: {
              sku: selectedPlanId,
              andDangerouslyFinishTransactionAutomaticallyIOS: false,
            }
          },
          type: 'subs' as const,
        };
        console.log('🍎 iOS purchase request:', JSON.stringify(purchaseRequest, null, 2));
        await requestPurchase(purchaseRequest);
      } else {
        const purchaseRequest = {
          request: {
            android: {
              skus: [selectedPlanId],
              andDangerouslyFinishTransactionAutomaticallyAndroid: false,
            }
          },
          type: 'subs' as const,
        };
        console.log('🤖 Android purchase request:', JSON.stringify(purchaseRequest, null, 2));
        await requestPurchase(purchaseRequest);
      }
      
      console.log('✅ Purchase request sent successfully');
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      setIsPurchasing(false);
      
      if (error.message?.toLowerCase().includes('cancelled')) {
        console.log('User cancelled purchase');
        return;
      }
      
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
      
      if (global.refreshNavigation) {
        console.log('🔄 Using global refresh...');
        await global.refreshNavigation();
        return;
      }
      
      console.log('🔄 Using navigation fallback...');
      navigation.popToTop();
      
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
        dispatch(updateUserLocal({
          subscriptionStatus: 'SUBSCRIBED'
        }));

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

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
              resetAndNavigate('Auth', { screen: 'Login' });
              Alert.alert('Success', 'Logged out successfully');
            } catch (error: any) {
              console.error('Logout error:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to logout. Please try again.'
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
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
      
      <LinearGradient
        colors={['#1D4D2F', '#183B24', '#0F1A13']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            {user?.subscriptionStatus !== 'CANCELLED' && (
              <TouchableOpacity 
                onPress={handleContinueTrial} 
                style={styles.backButton}
                disabled={isPurchasing}
              >
                <Image source={require('../../assets/back_arrow.png')} style={styles.backArrow} />
              </TouchableOpacity>
            )}
            <Text style={[styles.headerTitle, {flex:1,textAlign: 'center'}]}>Safe Hunt Subscription</Text>
            {user?.subscriptionStatus === 'CANCELLED' && (
              <TouchableOpacity 
                onPress={handleLogout} 
                style={styles.backButton}
                disabled={isPurchasing}
              >
                <Text style={{color: '#fff', fontStyle: 'italic'}}>Logout</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.heroWrapper}>
              <Image
                source={require('../../assets/hunter_hero.png')} 
                style={styles.heroImage}
              />
            </View>

            <View style={styles.whiteCard}>
              <Text style={styles.title}>
                Hunter Pro Pack
              </Text>

              <Text style={styles.mainTitle}>
                Stay Connected without limits! Start your FREE 7 day trail today.
              </Text>

              <Text style={styles.mainDesc}>
                Safe Hunt Pro not only eases your mind in the outdoors but also when trying to choose the right features for you. We have simplified our options to an all inclusive subscription package that allows each user to get the full Safe Hunt Pro experience.
              </Text>

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
                <View style={styles.subscribedContainer}>
                  <Text style={styles.subscribedIcon}>🎉</Text>
                  <Text style={styles.subscribedTitle}>
                    You're Already a Safe Hunt Pro Member
                  </Text>
                  <Text style={styles.subscribedDescription}>
                    Your subscription is currently active. Enjoy unlimited access to all premium Safe Hunt features.
                  </Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>
                      ✓ ACTIVE SUBSCRIPTION
                    </Text>
                  </View>
                </View>
              ) : (
                <>
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

                  {user?.subscriptionStatus === 'CANCELLED' ? (
                    <Text style={[styles.trialLinkText, {marginTop: 15}]}>
                      You Must Require To Subscribe Now
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={[styles.trialLinkContainer]}
                      onPress={handleContinueTrial}
                      disabled={isPurchasing}
                    >
                      <Text style={styles.trialLinkText}>
                        Continue with Free Trial
                      </Text>
                    </TouchableOpacity>
                  )}

                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.restoreButton}
                      onPress={handleRestorePurchases}
                      disabled={isPurchasing}
                    >
                      <Text style={styles.restoreText}>Restore Purchases</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
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
    width: '100%',
    top: -40
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