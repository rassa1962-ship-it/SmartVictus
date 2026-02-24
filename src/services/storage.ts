// Сервис для работы с AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InventoryItem, ShoppingItem, generateId, Category, HistoryItem, HistoryAction } from '../models';

const KEYS = {
  INVENTORY: 'smartvictus_inventory',
  SHOPPING: 'smartvictus_shopping',
  HISTORY: 'smartvictus_history',
};

// ==================== IN-MEMORY STORAGE FALLBACK ====================
let inMemoryStorage: { [key: string]: string } = {};

let storageReady: boolean | null = null;
let useInMemory = false;

const isAsyncStorageAvailable = async (): Promise<boolean> => {
  try {
    if (!AsyncStorage) return false;
    await AsyncStorage.getItem('__test__');
    return true;
  } catch (error) {
    console.warn('AsyncStorage недоступен, используем in-memory storage');
    return false;
  }
};

const getItem = async (key: string): Promise<string | null> => {
  if (storageReady === null) {
    storageReady = await isAsyncStorageAvailable();
    useInMemory = !storageReady;
  }
  
  if (useInMemory) {
    return inMemoryStorage[key] || null;
  }
  
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn('Ошибка AsyncStorage, переключаемся на in-memory:', error);
    useInMemory = true;
    return inMemoryStorage[key] || null;
  }
};

const storageSetItem = async (key: string, value: string): Promise<void> => {
  if (useInMemory) {
    inMemoryStorage[key] = value;
    return;
  }
  
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn('Ошибка AsyncStorage, переключаемся на in-memory:', error);
    useInMemory = true;
    inMemoryStorage[key] = value;
  }
};

// ==================== ИСТОРИЯ ====================

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const data = await getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
};

export const addHistoryItem = async (
  action: HistoryAction, 
  productName: string, 
  details?: string
): Promise<void> => {
  try {
    const history = await getHistory();
    const newItem: HistoryItem = {
      id: generateId(),
      action,
      productName,
      timestamp: new Date().toISOString(),
      details,
    };
    // Ограничиваем историю 50 записями
    history.unshift(newItem);
    if (history.length > 50) {
      history.pop();
    }
    await storageSetItem(KEYS.HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error adding history item:', error);
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    await storageSetItem(KEYS.HISTORY, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing history:', error);
  }
};

// ==================== ИНВЕНТАРЬ ====================

export const getInventory = async (): Promise<InventoryItem[]> => {
  try {
    const data = await getItem(KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting inventory:', error);
    return [];
  }
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'addedDate'>): Promise<InventoryItem> => {
  try {
    const inventory = await getInventory();
    const newItem: InventoryItem = {
      ...item,
      id: generateId(),
      addedDate: new Date().toISOString(),
    };
    inventory.push(newItem);
    await storageSetItem(KEYS.INVENTORY, JSON.stringify(inventory));
    
    // Логируем в историю
    await addHistoryItem('add', newItem.name);
    
    return newItem;
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
};

export const removeInventoryItem = async (id: string): Promise<void> => {
  try {
    const inventory = await getInventory();
    const item = inventory.find(i => i.id === id);
    const filtered = inventory.filter(item => item.id !== id);
    await storageSetItem(KEYS.INVENTORY, JSON.stringify(filtered));
    
    // Логируем в историю
    if (item) {
      await addHistoryItem('delete', item.name);
    }
  } catch (error) {
    console.error('Error removing inventory item:', error);
    throw error;
  }
};

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>): Promise<void> => {
  try {
    const inventory = await getInventory();
    const index = inventory.findIndex(item => item.id === id);
    if (index !== -1) {
      const oldName = inventory[index].name;
      inventory[index] = { ...inventory[index], ...updates };
      await storageSetItem(KEYS.INVENTORY, JSON.stringify(inventory));
      
      // Логируем в историю
      const details = updates.name !== oldName ? `Переименован в "${updates.name}"` : undefined;
      await addHistoryItem('edit', oldName, details);
    }
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
};

export const getExpiringItems = async (days: number = 3): Promise<InventoryItem[]> => {
  const inventory = await getInventory();
  const now = Date.now();
  const threshold = days * 24 * 60 * 60 * 1000;
  
  return inventory.filter(item => {
    const expiry = new Date(item.expiryDate).getTime();
    return (expiry - now) <= threshold && expiry > now;
  });
};

// ==================== СПИСОК ПОКУПОК ====================

export const getShoppingList = async (): Promise<ShoppingItem[]> => {
  try {
    const data = await getItem(KEYS.SHOPPING);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting shopping list:', error);
    return [];
  }
};

export const addShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'isBought'>): Promise<ShoppingItem> => {
  try {
    const list = await getShoppingList();
    const newItem: ShoppingItem = {
      ...item,
      id: generateId(),
      isBought: false,
    };
    list.push(newItem);
    await storageSetItem(KEYS.SHOPPING, JSON.stringify(list));
    return newItem;
  } catch (error) {
    console.error('Error adding shopping item:', error);
    throw error;
  }
};

export const removeShoppingItem = async (id: string): Promise<void> => {
  try {
    const list = await getShoppingList();
    const filtered = list.filter(item => item.id !== id);
    await storageSetItem(KEYS.SHOPPING, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing shopping item:', error);
    throw error;
  }
};

export const toggleShoppingItem = async (id: string): Promise<void> => {
  try {
    const list = await getShoppingList();
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index].isBought = !list[index].isBought;
      await storageSetItem(KEYS.SHOPPING, JSON.stringify(list));
    }
  } catch (error) {
    console.error('Error toggling shopping item:', error);
    throw error;
  }
};

export const clearBoughtItems = async (): Promise<void> => {
  try {
    const list = await getShoppingList();
    const filtered = list.filter(item => !item.isBought);
    await storageSetItem(KEYS.SHOPPING, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing bought items:', error);
    throw error;
  }
};

// ==================== ДЕМО ДАННЫЕ ====================

export const addDemoData = async (): Promise<void> => {
  const inventory = await getInventory();
  if (inventory.length > 0) return;

  const now = new Date();
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await addInventoryItem({
    name: 'Молоко 2.5%',
    quantity: 1000,
    unit: 'ml',
    room: 'fridge',
    category: 'dairy' as Category,
    expiryDate: in3days.toISOString(),
  });

  await addInventoryItem({
    name: 'Яйца',
    quantity: 10,
    unit: 'pcs',
    room: 'fridge',
    category: 'dairy' as Category,
    expiryDate: in7days.toISOString(),
  });

  await addInventoryItem({
    name: 'Хлеб',
    quantity: 1,
    unit: 'pcs',
    room: 'pantry',
    category: 'bakery' as Category,
    expiryDate: in3days.toISOString(),
  });

  await addInventoryItem({
    name: 'Фарш куриный',
    quantity: 500,
    unit: 'g',
    room: 'freezer',
    category: 'meat' as Category,
    expiryDate: in7days.toISOString(),
  });
};
