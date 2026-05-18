import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useUserEquipment } from '../hooks/useUserEquipment';

const ASSETS = {
  pistolIcon: require('../../assets/pistol_icon.png'),
  bowIcon: require('../../assets/bow_icon.png'),
  knifeIcon: require('../../assets/knife_icon.png'),
  defaultEquipment: require('../../assets/equipment_placeholder.png'),
};

const UserEquipmentScreen = () => {
  const {
    userEquipments,
    isLoading,
    error,
    assignEquipment,
    getUserEquipments,
    removeEquipment,
  } = useUserEquipment();

  useEffect(() => {
    loadUserEquipments();
  }, []);

  const loadUserEquipments = async () => {
    try {
      await getUserEquipments();
    } catch (error) {
      console.error('Error loading equipments:', error);
    }
  };

  const handleAssignEquipment = async () => {
    // Example: Assign equipment with ID 1
    try {
      await assignEquipment(1);
      Alert.alert('Success', 'Equipment assigned successfully');
      loadUserEquipments();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to assign equipment');
    }
  };

  const handleRemoveEquipment = (equipmentId: number) => {
    Alert.alert(
      'Remove Equipment',
      'Are you sure you want to remove this equipment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeEquipment(equipmentId);
          },
        },
      ]
    );
  };

  const getEquipmentImage = (imageUrl?: string) => {
    if (imageUrl) {
      return { uri: imageUrl };
    }
    // Return default equipment icon based on type or name
    return ASSETS.defaultEquipment;
  };

  const renderEquipmentItem = ({ item }: any) => (
    <View style={styles.equipmentCard}>
      <Image 
        source={getEquipmentImage(item.equipment?.imageUrl)} 
        style={styles.equipmentImage} 
      />
      <View style={styles.equipmentInfo}>
        <Text style={styles.equipmentId}>Equipment ID: {item.equipment?.id}</Text>
        <Text style={styles.assignedDate}>
          Assigned: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveEquipment(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && userEquipments.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserEquipments}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Equipment</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAssignEquipment}>
          <Text style={styles.addButtonText}>+ Add Equipment</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={userEquipments}
        renderItem={renderEquipmentItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No equipment assigned yet</Text>
            <TouchableOpacity style={styles.assignButton} onPress={handleAssignEquipment}>
              <Text style={styles.assignButtonText}>Assign Equipment</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0E713E',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#0E713E',
    fontWeight: '600',
    fontSize: 12,
  },
  listContent: {
    padding: 15,
  },
  equipmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  equipmentImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    resizeMode: 'contain',
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  assignedDate: {
    fontSize: 10,
    color: '#999',
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 20,
  },
  assignButton: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  assignButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#0E713E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default UserEquipmentScreen;