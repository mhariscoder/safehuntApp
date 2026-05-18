import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../app/store/hooks';
import { useUserEquipment } from '../hooks/useUserEquipment';

const ASSETS = {
  iconBack: require('../../assets/back_white.png'),
  pistolIcon: require('../../assets/pistol_icon.png'),
  bowIcon: require('../../assets/bow_icon.png'),
  knifeIcon: require('../../assets/knife_icon.png'),
};

// Mock equipment data - replace with actual API call
const AVAILABLE_EQUIPMENT = [
  { id: 1, name: 'Pistol', image: ASSETS.pistolIcon },
  { id: 2, name: 'Bow', image: ASSETS.bowIcon },
  { id: 3, name: 'Knife', image: ASSETS.knifeIcon },
  { id: 4, name: 'Rifle', image: ASSETS.pistolIcon },
  { id: 5, name: 'Shotgun', image: ASSETS.pistolIcon },
  { id: 6, name: 'Crossbow', image: ASSETS.bowIcon },
];

const AvailableEquipmentScreen = () => {
  const navigation = useNavigation();
  const { assignEquipment, getUserEquipments } = useUserEquipment();
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState(AVAILABLE_EQUIPMENT);

  const handleAssignEquipment = async (equipmentId: number, equipmentName: string) => {
    Alert.alert(
      'Add Equipment',
      `Are you sure you want to add ${equipmentName} to your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            setLoading(true);
            try {
              await assignEquipment(equipmentId);
              await getUserEquipments();
              Alert.alert('Success', `${equipmentName} added successfully!`);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to add equipment');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderEquipmentItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.equipmentCard}
      onPress={() => handleAssignEquipment(item.id, item.name)}
      disabled={loading}
    >
      <Image source={item.image} style={styles.equipmentImage} />
      <Text style={styles.equipmentName}>{item.name}</Text>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={ASSETS.iconBack} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Equipment</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={equipment}
        renderItem={renderEquipmentItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No equipment available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    height: 60,
    backgroundColor: '#0E713E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: { padding: 10 },
  backIcon: { width: 20, height: 20, tintColor: '#FFF', resizeMode: 'contain' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  listContent: { padding: 16 },
  equipmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  equipmentImage: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  equipmentName: { flex: 1, fontSize: 16, fontWeight: '500', color: '#000' },
  addButton: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  emptyContainer: { alignItems: 'center', paddingTop: 50 },
  emptyText: { color: '#999', fontSize: 14 },
});

export default AvailableEquipmentScreen;