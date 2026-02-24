// notifications.ts — Сервис push-уведомлений
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getInventory } from './storage';
import { InventoryItem } from '../models';

// Флаг для отслеживания поддержки уведомлений
let notificationsSupported = true;

// Настройка обработчика уведомлений
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  
  // Настройка канала для Android
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('expiry-alerts', {
      name: 'Срок годности',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });
    Notifications.setNotificationChannelAsync('restock-alerts', {
      name: 'Пополнение запасов',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }
} catch (e) {
  notificationsSupported = false;
  console.log('Notifications not supported in this environment');
}

// Запрос разрешения на уведомления
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!notificationsSupported) return false;
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission for notifications not granted');
      return false;
    }

    // Настройка каналов для Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('expiry-alerts', {
        name: 'Уведомления о сроке годности',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      });
    }

    return true;
  } catch (e) {
    console.log('Error requesting notification permission:', e);
    return false;
  }
};

// Запланировать уведомление о сроке годности (с настраиваемым количеством дней)
export const scheduleExpiryNotification = async (item: InventoryItem, daysBefore: number = 1): Promise<string | null> => {
  if (!notificationsSupported) return null;
  try {
    const expiryDate = new Date(item.expiryDate);
    const now = new Date();
    
    // Уведомление за N дней до истечения
    const notifyDate = new Date(expiryDate);
    notifyDate.setDate(notifyDate.getDate() - daysBefore);
    notifyDate.setHours(9, 0, 0, 0); // 9:00 утра

    // Не планировать если дата уже прошла
    if (notifyDate <= now) {
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Срок годности истекает',
        body: `${item.name} истекает через ${daysBefore} ${daysBefore === 1 ? 'день' : 'дней'}!`,
        data: { productId: item.id, type: 'expiry' },
      },
      trigger: {
        date: notifyDate,
        channelId: 'expiry-alerts',
      },
    });

    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

// Запланировать уведомление о пополнении запасов
export const scheduleRestockNotification = async (itemName: string): Promise<string | null> => {
  if (!notificationsSupported) return null;
  try {
    const notifyDate = new Date();
    notifyDate.setDate(notifyDate.getDate() + 1);
    notifyDate.setHours(10, 0, 0, 0); // 10:00 утра

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛒 Пора пополнить запасы',
        body: `${itemName} заканчивается, не забудьте купить!`,
        data: { type: 'restock', productName: itemName },
      },
      trigger: {
        date: notifyDate,
        channelId: 'restock-alerts',
      },
    });

    return id;
  } catch (error) {
    console.error('Error scheduling restock notification:', error);
    return null;
  }
};

// Запланировать уведомление для всех товаров (с настраиваемым количеством дней)
export const scheduleAllExpiryNotifications = async (daysBefore: number = 1): Promise<void> => {
  if (!notificationsSupported) return;
  try {
    // Отменить все существующие уведомления
    await cancelAllNotifications();

    const inventory = await getInventory();
    const expiringItems = inventory.filter(item => {
      const days = Math.ceil(
        (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return days > 0 && days <= daysBefore + 2;
    });

    // Планировать уведомления для товаров
    for (const item of expiringItems) {
      await scheduleExpiryNotification(item, daysBefore);
    }

    console.log(`Scheduled ${expiringItems.length} expiry notifications for ${daysBefore} days before`);
  } catch (error) {
    console.error('Error scheduling all notifications:', error);
  }
};

// Проверить и отправить уведомления о низком количестве товара
export const checkLowStockAndNotify = async (): Promise<void> => {
  if (!notificationsSupported) return;
  try {
    const inventory = await getInventory();
    const lowStockItems = inventory.filter(item => item.quantity <= 1);
    
    if (lowStockItems.length > 0) {
      const itemNames = lowStockItems.slice(0, 3).map(i => i.name).join(', ');
      const suffix = lowStockItems.length > 3 ? ' и другие' : '';
      
      await showLocalNotification(
        '📦 Заканчивается',
        `${itemNames}${suffix} заканчиваются!`,
        { type: 'low_stock' }
      );
    }
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
};

// Отменить все уведомления
export const cancelAllNotifications = async (): Promise<void> => {
  if (!notificationsSupported) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

// Отменить конкретное уведомление
export const cancelNotification = async (id: string): Promise<void> => {
  if (!notificationsSupported) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

// Получить все запланированные уведомления
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  if (!notificationsSupported) return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Локальное уведомление (для немедленного показа)
export const showLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> => {
  if (!notificationsSupported) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Показать немедленно
    });
  } catch (error) {
    console.error('Error showing local notification:', error);
  }
};

// Добавить обработчик нажатия на уведомление
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

// Добавить обработчик получения уведомления
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription => {
  return Notifications.addNotificationReceivedListener(callback);
};
