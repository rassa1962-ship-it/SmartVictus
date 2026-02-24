// backup.ts — Сервис экспорта/импорта данных
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getInventory, getShoppingList } from './storage';

const KEYS = {
  INVENTORY: 'smartvictus_inventory',
  SHOPPING: 'smartvictus_shopping',
  HISTORY: 'smartvictus_history',
};

// Экспорт всех данных (возвращает JSON строку для использования вне приложения)
export const exportData = async (): Promise<{ success: boolean; data: string }> => {
  try {
    const inventory = await getInventory();
    const shoppingList = await getShoppingList();
    
    const exportDataObj = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      inventory,
      shoppingList,
    };
    
    const jsonString = JSON.stringify(exportDataObj, null, 2);
    
    return { success: true, data: jsonString };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { success: false, data: '' };
  }
};

// Импорт данных из JSON строки
export const importData = async (jsonString: string): Promise<{ success: boolean; message: string }> => {
  try {
    const data = JSON.parse(jsonString);
    
    // Проверка версии
    if (!data.version) {
      return { success: false, message: 'Неверный формат файла' };
    }
    
    // Импорт инвентаря
    if (data.inventory && Array.isArray(data.inventory)) {
      await AsyncStorage.setItem(KEYS.INVENTORY, JSON.stringify(data.inventory));
    }
    
    // Импорт списка покупок
    if (data.shoppingList && Array.isArray(data.shoppingList)) {
      await AsyncStorage.setItem(KEYS.SHOPPING, JSON.stringify(data.shoppingList));
    }
    
    return { success: true, message: `Импортировано: ${data.inventory?.length || 0} продуктов, ${data.shoppingList?.length || 0} покупок` };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, message: 'Ошибка при импорте данных' };
  }
};

// Получить размер данных
export const getDataSize = async (): Promise<{ inventory: number; shopping: number }> => {
  try {
    const inventory = await getInventory();
    const shoppingList = await getShoppingList();
    
    return {
      inventory: inventory.length,
      shopping: shoppingList.length,
    };
  } catch (error) {
    return { inventory: 0, shopping: 0 };
  }
};
