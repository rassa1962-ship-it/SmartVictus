// BarcodeScannerScreen.tsx — Экран сканирования штрих-кодов
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { addInventoryItem } from '../services/storage';
import { Room, Unit, Category, ROOMS, CATEGORIES } from '../models';

// База данных штрих-кодов (упрощённая)
const BARCODE_DATABASE: Record<string, { name: string; defaultCategory: Category; defaultExpiryDays: number }> = {
  '4601234567890': { name: 'Молоко пастеризованное', defaultCategory: 'dairy', defaultExpiryDays: 5 },
  '4609876543210': { name: 'Кефир 1%', defaultCategory: 'dairy', defaultExpiryDays: 7 },
  '4601111111111': { name: 'Хлеб белый', defaultCategory: 'bakery', defaultExpiryDays: 3 },
  '4602222222222': { name: 'Яйца куриные С1', defaultCategory: 'dairy', defaultExpiryDays: 14 },
  '4603333333333': { name: 'Куриное филе', defaultCategory: 'meat', defaultExpiryDays: 2 },
  '4604444444444': { name: 'Свинина', defaultCategory: 'meat', defaultExpiryDays: 3 },
  '4605555555555': { name: 'Рыба охлаждённая', defaultCategory: 'fish', defaultExpiryDays: 2 },
  '4606666666666': { name: 'Сметана 20%', defaultCategory: 'dairy', defaultExpiryDays: 7 },
  '4607777777777': { name: 'Творог 5%', defaultCategory: 'dairy', defaultExpiryDays: 5 },
  '4608888888888': { name: 'Масло сливочное', defaultCategory: 'dairy', defaultExpiryDays: 20 },
};

export default function BarcodeScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<{
    name: string;
    category: Category;
    expiryDays: number;
  } | null>(null);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    
    setScanned(true);
    const code = result.data;
    setScannedCode(code);
    
    // Вибрация при успешном сканировании
    Vibration.vibrate(100);
    
    // Проверяем базу данных
    const product = BARCODE_DATABASE[code];
    if (product) {
      setProductInfo({
        name: product.name,
        category: product.defaultCategory,
        expiryDays: product.defaultExpiryDays,
      });
    } else {
      // Если товар не найден, предлагаем ввести вручную
      setProductInfo(null);
      Alert.alert(
        'Товар не найден',
        `Штрих-код: ${code}\n\nХотите добавить новый товар вручную?`,
        [
          { text: 'Отмена', style: 'cancel', onPress: () => resetScanner() },
          { text: 'Добавить', onPress: () => navigation.navigate('AddProduct', { barcode: code }) },
        ]
      );
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScannedCode(null);
    setProductInfo(null);
  };

  const addProductToInventory = async () => {
    if (!productInfo) return;

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + productInfo.expiryDays);

      await addInventoryItem({
        name: productInfo.name,
        quantity: 1,
        unit: 'pcs',
        room: 'fridge',
        category: productInfo.category,
        expiryDate: expiryDate.toISOString(),
      });

      Alert.alert('Успешно', 'Товар добавлен в инвентарь!', [
        { text: 'OK', onPress: () => {
          resetScanner();
          navigation.goBack();
        }}
      ]);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить товар');
      resetScanner();
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Загрузка...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Доступ к камере</Text>
          <Text style={styles.permissionText}>
            Для сканирования штрих-кодов требуется доступ к камере
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Разрешить</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnTop}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Сканер</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr',
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code39',
              'code93',
              'code128',
              'codabar',
              'itf14',
            ],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
      </View>

      {scanned && productInfo && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>✅ Товар найден</Text>
          <Text style={styles.productName}>{productInfo.name}</Text>
          <Text style={styles.productDetails}>
            Категория: {CATEGORIES.find(c => c.value === productInfo.category)?.icon} {' '}
            {CATEGORIES.find(c => c.value === productInfo.category)?.label}
          </Text>
          <Text style={styles.productDetails}>
            Срок годности: ~{productInfo.expiryDays} дней
          </Text>
          
          <View style={styles.resultActions}>
            <TouchableOpacity 
              style={styles.addBtn}
              onPress={addProductToInventory}
            >
              <Text style={styles.addBtnText}>Добавить в инвентарь</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.scanAgainBtn}
              onPress={resetScanner}
            >
              <Text style={styles.scanAgainBtnText}>Сканировать ещё</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!scanned && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Наведите камеру на штрих-код товара
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1F2937',
  },
  backBtnTop: {
    fontSize: 16,
    color: '#10B981',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 40,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  backBtn: {
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  scannerContainer: {
    flex: 1,
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: 280,
    height: 180,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10B981',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  resultContainer: {
    backgroundColor: '#1F2937',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  resultTitle: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  productDetails: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  resultActions: {
    marginTop: 20,
    gap: 10,
  },
  addBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scanAgainBtn: {
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanAgainBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
