// AppNavigator.tsx — Навигация
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import NotificationsSettingsScreen from '../screens/NotificationsSettingsScreen';
import BackupScreen from '../screens/BackupScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Простой компонент иконки
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Inventory: '📦',
    Scanner: '📷',
    Shopping: '🛒',
    Settings: '⚙️',
  };
  
  return (
    <View style={styles.iconContainer}>
      <Text style={focused ? styles.iconFocused : styles.icon}>
        {icons[name]}
      </Text>
    </View>
  );
};

// Основные табы
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen}
      />
      <Tab.Screen 
        name="Scanner" 
        component={BarcodeScannerScreen}
      />
      <Tab.Screen 
        name="Shopping" 
        component={ShoppingListScreen}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
      />
    </Tab.Navigator>
  );
}

// Главный навигатор со стеком
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
      <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
      <Stack.Screen name="Backup" component={BackupScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
  },
});
