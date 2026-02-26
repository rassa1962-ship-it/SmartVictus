// Migration service - перенос данных с AsyncStorage в Firebase
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addProduct } from './firestore';
import { auth } from './firebase';
import { getInventory, getShoppingList } from './storage';
import { InventoryItem } from '../models';

const MIGRATED_FLAG = 'smartvictus_migrated_v1';

// Проверить флаг миграции
const isMigrated = async (): Promise<boolean> => {
  const migrated = await AsyncStorage.getItem(MIGRATED_FLAG);
  return migrated === '1';
};

// Установить флаг миграции
const setMigrated = async (): Promise<void> => {
  await AsyncStorage.setItem(MIGRATED_FLAG, '1');
};

// Основная функция миграции
export const migrateIfNeeded = async (): Promise<boolean> => {
  try {
    // Проверить флаг миграции
    if (await isMigrated()) {
      console.log('Миграция уже выполнена');
      return false;
    }
    
    // Проверить авторизацию
    const user = auth.currentUser;
    if (!user) {
      console.log('Пользователь не авторизован, миграция отложена');
      return false;
    }
    
    // Получить локальные данные
    const localInventory = await getInventory();
    
    if (localInventory.length === 0) {
      console.log('Нет локальных данных для миграции');
      await setMigrated();
      return false;
    }
    
    console.log(`Начинаем миграцию ${localInventory.length} продуктов...`);
    
    const householdId = user.uid;
    
    // Перенести продукты
    for (const product of localInventory) {
      try {
        await addProduct(householdId, {
          name: product.name,
          quantity: product.quantity,
          unit: product.unit,
          room: product.room,
          category: product.category,
          userCategoryId: product.userCategoryId,
          expiryDate: product.expiryDate,
          addedDate: product.addedDate,
        } as Omit<InventoryItem, 'id'>);
      } catch (error) {
        console.error('Ошибка миграции продукта:', product.name, error);
      }
    }
    
    // Установить флаг миграции
    await setMigrated();
    
    console.log('Миграция завершена!');
    return true;
  } catch (error) {
    console.error('Ошибка миграции:', error);
    return false;
  }
};

// Сбросить флаг миграции (для тестирования)
export const resetMigration = async (): Promise<void> => {
  await AsyncStorage.removeItem(MIGRATED_FLAG);
};
