// SmartCameraScreen.tsx — Умная камера для сканирования чеков
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { processReceiptImage, createInventoryItemFromOCR, OCRResult } from '../services/ocr';
import { addInventoryItem } from '../services/storage';
import { ROOM_ICONS, CATEGORY_ICONS, Room, Category } from '../models';
import { InventoryItem } from '../models';

interface DetectedItem {
  name: string;
  category: Category;
  room: Room;
  expiryDays: number;
}

export default function SmartCameraScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [countdownActive, setCountdownActive] = useState(false);
  const cameraRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Таймер для обратного отсчёта
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdownActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCountdownActive(false);
            takePhoto();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdownActive, countdown]);

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
      if (photo?.base64) {
        setSelectedImage(photo.uri);
        processImage(photo.base64, photo.uri);
      }
    }
  };

  const startAutoCapture = () => {
    setCountdown(3);
    setCountdownActive(true);
  };

  const cancelAutoCapture = () => {
    setCountdown(0);
    setCountdownActive(false);
  };

  const savePhotoToLibrary = async () => {
    if (!selectedImage) return;
    Alert.alert(
      'Сохранить фото?',
      'Хотите сохранить фото чека в галерею?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Сохранить', 
          onPress: async () => {
            try {
              const MediaLibrary = require('expo-media-library');
              const { status } = await MediaLibrary.requestPermissionsAsync();
              if (status === 'granted') {
                await MediaLibrary.saveToLibraryAsync(selectedImage);
                Alert.alert('Сохранено', 'Фото сохранено в галерею');
              }
            } catch (error) {
              console.error('Error saving photo:', error);
            }
          }
        },
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(result.assets[0].uri);
      processImage(result.assets[0].base64, result.assets[0].uri);
    }
  };

  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setProcessing(false);
    setCountdown(0);
    setCountdownActive(false);
  };

  const processImage = async (base64: string, uri: string) => {
    setProcessing(true);
    setDetectedItems([]);
    
    // Создаём AbortController для возможности отмены
    abortControllerRef.current = new AbortController();
    
    // Таймаут 30 секунд
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Время ожидания истекло (30 сек)')), 30000)
    );

    try {
      const result: OCRResult = await Promise.race([
        processReceiptImage(base64),
        timeoutPromise
      ]) as OCRResult;

      if (result.success && result.items && result.items.length > 0) {
        const items: DetectedItem[] = result.items.map((name: string) => {
          const partialItem = createInventoryItemFromOCR(name);
          return {
            name: name,
            category: partialItem.category || 'other',
            room: partialItem.room || 'fridge',
            expiryDays: 30,
          };
        });
        setDetectedItems(items);
      } else {
        Alert.alert(
          'Товары не найдены',
          result.error || 'Попробуйте сфотографировать чек ещё раз',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Отменено пользователем
      } else {
        Alert.alert(
          'Ошибка',
          error.message || 'Произошла ошибка при обработке',
          [{ text: 'OK' }]
        );
      }
    }

    setProcessing(false);
    abortControllerRef.current = null;
  };

  const addAllToInventory = async () => {
    for (const item of detectedItems) {
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(expiryDate.getDate() + item.expiryDays);

      const newItem: InventoryItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: item.name,
        quantity: 1,
        unit: 'pcs',
        room: item.room,
        category: item.category,
        expiryDate: expiryDate.toISOString().split('T')[0],
        addedDate: new Date().toISOString(),
      };

      await addInventoryItem(newItem);
    }

    Alert.alert(
      'Успешно!',
      `Добавлено ${detectedItems.length} товаров в инвентарь`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const removeItem = (index: number) => {
    setDetectedItems(prev => prev.filter((_, i) => i !== index));
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionText, { color: theme.colors.text }]}>
            Для сканирования чеков нужен доступ к камере
          </Text>
          <TouchableOpacity 
            style={[styles.permissionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>Разрешить</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: theme.colors.primary }]}>← Назад</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Умная камера</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Камера или результаты */}
      {!selectedImage ? (
        <View style={styles.cameraContainer}>
          {isFocused ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.scanArea}>
                  {countdownActive && countdown > 0 ? (
                    <Text style={styles.countdownText}>{countdown}</Text>
                  ) : (
                    <Text style={styles.scanHint}>
                      Наведите на чек
                    </Text>
                  )}
                </View>
              </View>
            </CameraView>
          ) : (
            <View style={[styles.camera, styles.cameraPaused]}>
              <Text style={styles.cameraPausedText}>Камера выключена</Text>
            </View>
          )}

          <View style={styles.controls}>
            <TouchableOpacity 
              style={[styles.secondaryBtn, { backgroundColor: theme.colors.card }]}
              onPress={pickImage}
            >
              <Text style={styles.secondaryBtnText}>🖼️</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.captureBtn, { backgroundColor: theme.colors.primary }]}
              onPress={countdownActive ? cancelAutoCapture : takePhoto}
            >
              {countdownActive ? (
                <Text style={styles.captureBtnText}>✕</Text>
              ) : (
                <Text style={styles.captureBtnText}>📷</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryBtn, { backgroundColor: countdownActive ? '#EF4444' : theme.colors.card }]}
              onPress={countdownActive ? cancelAutoCapture : startAutoCapture}
            >
              <Text style={styles.secondaryBtnText}>{countdownActive ? '✕' : '⏱️'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.resultsContainer}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />

          {processing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.processingText, { color: theme.colors.text }]}>
                Анализирую чек...
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
                Найдено товаров: {detectedItems.length}
              </Text>

              {detectedItems.map((item, index) => (
                <View 
                  key={index} 
                  style={[styles.itemCard, { backgroundColor: theme.colors.card }]}
                >
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.colors.text }]}>
                      {item.name}
                    </Text>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemCategory}>
                        {CATEGORY_ICONS[item.category] || '📦'} {item.category}
                      </Text>
                      <Text style={styles.itemRoom}>
                        {ROOM_ICONS[item.room]} {item.room}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeBtn}
                    onPress={() => removeItem(index)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {detectedItems.length > 0 && (
                <TouchableOpacity 
                  style={[styles.addAllBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={addAllToInventory}
                >
                  <Text style={styles.addAllBtnText}>
                    Добавить все в инвентарь
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.scanAgainBtn, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setSelectedImage(null);
                  setDetectedItems([]);
                }}
              >
                <Text style={[styles.scanAgainBtnText, { color: theme.colors.textSecondary }]}>
                  Сканировать ещё раз
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraPaused: {
    flex: 1,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPausedText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: '85%',
    height: '60%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  scanHint: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  countdownText: {
    color: '#fff',
    fontSize: 72,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnText: {
    fontSize: 30,
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  secondaryBtnText: {
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  itemCategory: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemRoom: {
    fontSize: 13,
    color: '#6B7280',
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addAllBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addAllBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanAgainBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
  },
  scanAgainBtnText: {
    fontSize: 14,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionBtn: {
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
