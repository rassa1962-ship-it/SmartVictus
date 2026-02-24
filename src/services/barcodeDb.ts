// barcodeDb.ts — База штрих-кодов пользователя
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'user_barcodes';

export type BarcodeItem = {
  name: string;
  defaultCategory: string;
  defaultExpiryDays: number;
};

// Получить все штрих-коды пользователя
export const getUserBarcodes = async (): Promise<Record<string, BarcodeItem>> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading user barcodes:', error);
    return {};
  }
};

// Добавить штрих-код
export const addUserBarcode = async (
  barcode: string,
  name: string,
  defaultCategory: string,
  defaultExpiryDays: number
): Promise<void> => {
  try {
    const barcodes = await getUserBarcodes();
    barcodes[barcode] = { name, defaultCategory, defaultExpiryDays };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(barcodes));
  } catch (error) {
    console.error('Error saving user barcode:', error);
  }
};

// Найти штрих-код
export const findUserBarcode = async (barcode: string): Promise<BarcodeItem | null> => {
  const barcodes = await getUserBarcodes();
  return barcodes[barcode] || null;
};

// Удалить штрих-код
export const removeUserBarcode = async (barcode: string): Promise<void> => {
  try {
    const barcodes = await getUserBarcodes();
    delete barcodes[barcode];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(barcodes));
  } catch (error) {
    console.error('Error removing user barcode:', error);
  }
};

// Экспорт базы в JSON строку
export const exportBarcodesToJSON = async (): Promise<string> => {
  const barcodes = await getUserBarcodes();
  return JSON.stringify(barcodes, null, 2);
};

// Импорт базы из JSON строки
export const importBarcodesFromJSON = async (jsonString: string): Promise<number> => {
  try {
    const imported = JSON.parse(jsonString);
    const current = await getUserBarcodes();
    
    // Объединяем (импортированные перезаписывают существующие)
    const merged = { ...current, ...imported };
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return Object.keys(imported).length;
  } catch (error) {
    console.error('Error importing barcodes:', error);
    throw error;
  }
};
