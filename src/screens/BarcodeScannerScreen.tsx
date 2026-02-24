// BarcodeScannerScreen.tsx — Экран сканирования штрих-кодов
import React, { useState, useEffect, useRef } from 'react';
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
import { useIsFocused } from '@react-navigation/native';
import { addInventoryItem } from '../services/storage';
import { getUserBarcodes, findUserBarcode } from '../services/barcodeDb';
import { Room, Unit, Category, ROOMS, CATEGORIES } from '../models';

// База данных штрих-кодов
const BARCODE_DATABASE: Record<string, { name: string; defaultCategory: Category; defaultExpiryDays: number }> = {
  // Молочные
  '4601234567890': { name: 'Молоко пастеризованное 3.2%', defaultCategory: 'dairy', defaultExpiryDays: 5 },
  '4601234567891': { name: 'Молоко ультрапастеризованное', defaultCategory: 'dairy', defaultExpiryDays: 14 },
  '4609876543210': { name: 'Кефир 1%', defaultCategory: 'dairy', defaultExpiryDays: 7 },
  '4609876543211': { name: 'Кефир 3.2%', defaultCategory: 'dairy', defaultExpiryDays: 7 },
  '4606666666666': { name: 'Сметана 20%', defaultCategory: 'dairy', defaultExpiryDays: 7 },
  '4606666666667': { name: 'Сметана 15%', defaultCategory: 'dairy', defaultExpiryDays: 7 },
  '4607777777777': { name: 'Творог 5%', defaultCategory: 'dairy', defaultExpiryDays: 5 },
  '4607777777778': { name: 'Творог 9%', defaultCategory: 'dairy', defaultExpiryDays: 5 },
  '4608888888888': { name: 'Масло сливочное 82%', defaultCategory: 'dairy', defaultExpiryDays: 20 },
  '4608888888889': { name: 'Масло сливочное 72.5%', defaultCategory: 'dairy', defaultExpiryDays: 20 },
  '4609999999990': { name: 'Сыр Российский', defaultCategory: 'dairy', defaultExpiryDays: 30 },
  '4609999999991': { name: 'Сыр Голландский', defaultCategory: 'dairy', defaultExpiryDays: 30 },
  '4602222222222': { name: 'Яйца куриные С1', defaultCategory: 'dairy', defaultExpiryDays: 14 },
  '4602222222223': { name: 'Яйца куриные С2', defaultCategory: 'dairy', defaultExpiryDays: 14 },
  
  // Мясо
  '4603333333333': { name: 'Куриное филе', defaultCategory: 'meat', defaultExpiryDays: 2 },
  '4603333333334': { name: 'Куриные окорочка', defaultCategory: 'meat', defaultExpiryDays: 3 },
  '4604444444444': { name: 'Свинина', defaultCategory: 'meat', defaultExpiryDays: 3 },
  '4604444444445': { name: 'Говядина', defaultCategory: 'meat', defaultExpiryDays: 3 },
  '4604444444446': { name: 'Фарш говяжий', defaultCategory: 'meat', defaultExpiryDays: 1 },
  '4604444444447': { name: 'Фарш свиной', defaultCategory: 'meat', defaultExpiryDays: 1 },
  '4604444444448': { name: 'Колбаса вареная', defaultCategory: 'meat', defaultExpiryDays: 5 },
  '4604444444449': { name: 'Сосиски', defaultCategory: 'meat', defaultExpiryDays: 5 },
  
  // Рыба
  '4605555555555': { name: 'Рыба охлаждённая', defaultCategory: 'fish', defaultExpiryDays: 2 },
  '4605555555556': { name: 'Сёмга', defaultCategory: 'fish', defaultExpiryDays: 3 },
  '4605555555557': { name: 'Форель', defaultCategory: 'fish', defaultExpiryDays: 3 },
  '4605555555558': { name: 'Сельдь', defaultCategory: 'fish', defaultExpiryDays: 5 },
  '4605555555559': { name: 'Скумбрия', defaultCategory: 'fish', defaultExpiryDays: 2 },
  
  // Овощи
  '4601000000001': { name: 'Картофель', defaultCategory: 'vegetables', defaultExpiryDays: 14 },
  '4601000000002': { name: 'Лук репчатый', defaultCategory: 'vegetables', defaultExpiryDays: 30 },
  '4601000000003': { name: 'Морковь', defaultCategory: 'vegetables', defaultExpiryDays: 14 },
  '4601000000004': { name: 'Капуста', defaultCategory: 'vegetables', defaultExpiryDays: 10 },
  '4601000000005': { name: 'Помидоры', defaultCategory: 'vegetables', defaultExpiryDays: 7 },
  '4601000000006': { name: 'Огурцы', defaultCategory: 'vegetables', defaultExpiryDays: 7 },
  '4601000000007': { name: 'Перец болгарский', defaultCategory: 'vegetables', defaultExpiryDays: 7 },
  '4601000000008': { name: 'Зелень (укроп/петрушка)', defaultCategory: 'vegetables', defaultExpiryDays: 5 },
  
  // Фрукты
  '4602000000001': { name: 'Яблоки', defaultCategory: 'fruits', defaultExpiryDays: 14 },
  '4602000000002': { name: 'Бананы', defaultCategory: 'fruits', defaultExpiryDays: 5 },
  '4602000000003': { name: 'Апельсины', defaultCategory: 'fruits', defaultExpiryDays: 10 },
  '4602000000004': { name: 'Мандарины', defaultCategory: 'fruits', defaultExpiryDays: 7 },
  '4602000000005': { name: 'Виноград', defaultCategory: 'fruits', defaultExpiryDays: 5 },
  '4602000000006': { name: 'Клубника', defaultCategory: 'fruits', defaultExpiryDays: 3 },
  
  // Выпечка
  '4601111111111': { name: 'Хлеб белый', defaultCategory: 'bakery', defaultExpiryDays: 3 },
  '4601111111112': { name: 'Хлеб чёрный', defaultCategory: 'bakery', defaultExpiryDays: 3 },
  '4601111111113': { name: 'Батон', defaultCategory: 'bakery', defaultExpiryDays: 3 },
  '4601111111114': { name: 'Лаваш', defaultCategory: 'bakery', defaultExpiryDays: 5 },
  
  // Напитки
  '4603000000001': { name: 'Вода питьевая 0.5л', defaultCategory: 'drinks', defaultExpiryDays: 180 },
  '4603000000002': { name: 'Вода питьевая 1.5л', defaultCategory: 'drinks', defaultExpiryDays: 180 },
  '4603000000003': { name: 'Сок апельсиновый', defaultCategory: 'drinks', defaultExpiryDays: 30 },
  '4603000000004': { name: 'Сок яблочный', defaultCategory: 'drinks', defaultExpiryDays: 30 },
  '4603000000005': { name: 'Сок мультифрукт', defaultCategory: 'drinks', defaultExpiryDays: 30 },
  '4603000000006': { name: 'Газировка', defaultCategory: 'drinks', defaultExpiryDays: 90 },
  
  // Заморозка
  '4604000000001': { name: 'Пельмени', defaultCategory: 'frozen', defaultExpiryDays: 180 },
  '4604000000002': { name: 'Вареники', defaultCategory: 'frozen', defaultExpiryDays: 180 },
  '4604000000003': { name: 'Котлеты полуфабрикат', defaultCategory: 'frozen', defaultExpiryDays: 90 },
  '4604000000004': { name: 'Мороженое', defaultCategory: 'frozen', defaultExpiryDays: 180 },
  
  // Консервы
  '4605000000001': { name: 'Тунец консервированный', defaultCategory: 'canned', defaultExpiryDays: 365 },
  '4605000000002': { name: 'Сардина консервированная', defaultCategory: 'canned', defaultExpiryDays: 365 },
  '4605000000003': { name: 'Кукуруза консервированная', defaultCategory: 'canned', defaultExpiryDays: 365 },
  '4605000000004': { name: 'Горошек консервированный', defaultCategory: 'canned', defaultExpiryDays: 365 },
  '4605000000005': { name: 'Фасоль консервированная', defaultCategory: 'canned', defaultExpiryDays: 365 },
  
  // Крупы/макароны
  '4606000000001': { name: 'Рис', defaultCategory: 'grains', defaultExpiryDays: 365 },
  '4606000000002': { name: 'Гречка', defaultCategory: 'grains', defaultExpiryDays: 365 },
  '4606000000003': { name: 'Овсянка', defaultCategory: 'grains', defaultExpiryDays: 180 },
  '4606000000004': { name: 'Макароны', defaultCategory: 'grains', defaultExpiryDays: 365 },
  '4606000000005': { name: 'Мука', defaultCategory: 'grains', defaultExpiryDays: 180 },
};

// Поиск товара по API
const searchProductByAPI = async (barcode: string): Promise<{
  name: string;
  category: Category;
  expiryDays: number;
} | null> => {
  try {
    // Используем Open Food Facts API (бесплатный)
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await response.json();

    if (data.status === 1 && data.product) {
      const product = data.product;
      const name = product.product_name || product.product_name_en || 'Неизвестный товар';
      
      // Определяем категорию по данным из API
      let category: Category = 'other';
      const categories = product.categories_tags || [];
      
      if (categories.some((c: string) => c.includes('dairy'))) category = 'dairy';
      else if (categories.some((c: string) => c.includes('meat'))) category = 'meat';
      else if (categories.some((c: string) => c.includes('fish'))) category = 'fish';
      else if (categories.some((c: string) => c.includes('vegetable'))) category = 'vegetables';
      else if (categories.some((c: string) => c.includes('fruit'))) category = 'fruits';
      else if (categories.some((c: string) => c.includes('bakery'))) category = 'bakery';
      else if (categories.some((c: string) => c.includes('beverage') || c.includes('drink'))) category = 'drinks';
      else if (categories.some((c: string) => c.includes('frozen'))) category = 'frozen';
      else if (categories.some((c: string) => c.includes('canned') || c.includes('preserved'))) category = 'canned';
      else if (categories.some((c: string) => c.includes('grain') || c.includes('pasta'))) category = 'grains';

      // Срок годности по умолчанию для разных категорий
      let expiryDays = 30;
      switch (category) {
        case 'dairy': expiryDays = 7; break;
        case 'meat': expiryDays = 3; break;
        case 'fish': expiryDays = 2; break;
        case 'vegetables': expiryDays = 14; break;
        case 'fruits': expiryDays = 7; break;
        case 'bakery': expiryDays = 5; break;
        case 'drinks': expiryDays = 90; break;
        case 'frozen': expiryDays = 180; break;
        case 'canned': expiryDays = 365; break;
        case 'grains': expiryDays = 180; break;
      }

      return { name, category, expiryDays };
    }
  } catch (error) {
    console.error('API Error:', error);
  }
  return null;
};

export default function BarcodeScannerScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<{
    name: string;
    category: Category;
    expiryDays: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    
    setScanned(true);
    const code = result.data;
    setScannedCode(code);
    
    // Вибрация при успешном сканировании
    Vibration.vibrate(100);
    
    // Сначала проверяем пользовательскую базу (из памяти)
    const userProduct = await findUserBarcode(code);
    if (userProduct) {
      setProductInfo({
        name: userProduct.name,
        category: userProduct.defaultCategory as Category,
        expiryDays: userProduct.defaultExpiryDays,
      });
      return;
    }

    // Проверяем локальную базу
    const localProduct = BARCODE_DATABASE[code];
    if (localProduct) {
      setProductInfo({
        name: localProduct.name,
        category: localProduct.defaultCategory,
        expiryDays: localProduct.defaultExpiryDays,
      });
      return;
    }

    // Если не найден локально, ищем по API
    setLoading(true);
    const apiProduct = await searchProductByAPI(code);
    setLoading(false);

    if (apiProduct) {
      setProductInfo(apiProduct);
    } else {
      // Если товар не найден нигде, предлагаем ввести вручную
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
        {isFocused ? (
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
        ) : (
          <View style={[styles.scanner, styles.scannerPaused]}>
            <Text style={styles.scannerPausedText}>Камера выключена</Text>
          </View>
        )}
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

      {loading && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🔍 Поиск товара...</Text>
        </View>
      )}

      {!scanned && !loading && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Наведите камеру на штрих-код товара
          </Text>
          <TouchableOpacity 
            style={styles.smartCameraBtn}
            onPress={() => navigation.navigate('SmartCamera')}
          >
            <Text style={styles.smartCameraBtnText}>📷 Умная камера (OCR)</Text>
          </TouchableOpacity>
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
  scannerPaused: {
    flex: 1,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerPausedText: {
    color: '#9CA3AF',
    fontSize: 16,
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
    marginBottom: 16,
  },
  smartCameraBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  smartCameraBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
