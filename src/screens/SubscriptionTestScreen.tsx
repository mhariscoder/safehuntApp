import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { useIAP, ErrorCode, finishTransaction } from 'react-native-iap';

const SUBSCRIPTION_IDS =
  Platform.OS === 'ios'
    ? ['SafeHuntSubscription']
    : ['safe_hunt_subscription_pro'];

const SubscriptionScreen = ({ navigation }: any) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const {
    connected,
    subscriptions, // Use subscriptions instead of products
    availablePurchases,
    activeSubscriptions,

    fetchProducts,
    requestPurchase,
    getActiveSubscriptions,
    finishTransaction: finishTransactionHook, // Rename to avoid conflict
  } = useIAP({
    onPurchaseSuccess: async purchase => {
      try {
        // Use the hook's finishTransaction instead of imported one
        await finishTransactionHook({
          purchase,
          isConsumable: false,
        });

        // Refresh subscriptions after successful purchase
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
        // User cancelled - no need to show error
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

  // Load subscriptions when component mounts or when connected
  useEffect(() => {
    if (connected) {
      loadSubscriptions();
    }
  }, [connected]);

  // Debug: Check active subscriptions
  useEffect(() => {
    if (activeSubscriptions.length > 0) {
      console.log('Active Subscriptions:', activeSubscriptions);
      Alert.alert(
        'Active Subscription Found',
        `You have an active subscription: ${activeSubscriptions[0].productId}`
      );
    }
  }, [activeSubscriptions]);

  const loadSubscriptions = async () => {
    try {
      // ✅ Correct: Use 'subs' type for subscriptions
      await fetchProducts({
        skus: SUBSCRIPTION_IDS,
        type: 'subs', // Important: Changed from 'in-app' to 'subs'
      });
      
      // Also check for active subscriptions
      await getActiveSubscriptions(SUBSCRIPTION_IDS);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      Alert.alert('Error', 'Failed to load subscription options');
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

  if (!connected) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0E713E" />
        <Text style={styles.loaderText}>Connecting to billing service...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#1D4D2F', '#183B24', '#0F1A13']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.title}>Safe Hunt Subscription</Text>
          
          <Text style={styles.subTitle}>
            Get unlimited access to all premium features
          </Text>

          {/* ✅ Correct: Map over subscriptions, not products */}
          {subscriptions.length === 0 ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#0E713E" />
              <Text style={styles.loadingText}>Loading subscription options...</Text>
            </View>
          ) : (
            subscriptions.map(item => {
              const isSelected = selectedPlanId === item.productId;
              
              return (
                <TouchableOpacity
                  key={item.productId}
                  onPress={() => setSelectedPlanId(item.productId)}
                  style={[
                    styles.card,
                    isSelected && styles.selectedCard,
                  ]}
                >
                  <Text style={styles.planName}>{item.title}</Text>
                  <Text style={styles.price}>
                    {item.localizedPrice || item.price}
                  </Text>
                  <Text style={styles.desc}>
                    {item.description || 'Monthly auto-renewing subscription'}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedText}>Selected</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            style={[
              styles.button,
              (!selectedPlanId || subscriptions.length === 0) && styles.buttonDisabled
            ]}
            onPress={handlePurchase}
            disabled={!selectedPlanId || subscriptions.length === 0}
          >
            <Text style={styles.buttonText}>
              Subscribe Now
            </Text>
          </TouchableOpacity>

          {/* Refresh button */}
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={loadSubscriptions}
          >
            <Text style={styles.secondaryButtonText}>
              Refresh Plans
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1A13',
  },
  loaderText: {
    marginTop: 10,
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subTitle: {
    color: '#ccc',
    marginBottom: 30,
    textAlign: 'center',
    fontSize: 14,
  },
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    position: 'relative',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#0E713E',
    backgroundColor: '#F0FFF4',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0E713E',
    marginBottom: 8,
  },
  desc: {
    color: '#666',
    fontSize: 14,
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#0E713E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#0E713E',
    padding: 16,
    borderRadius: 30,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0E713E',
  },
  secondaryButtonText: {
    color: '#0E713E',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SubscriptionScreen;