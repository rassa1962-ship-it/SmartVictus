// NotificationsSettingsScreen.tsx — Настройки уведомлений
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getInventory } from '../services/storage';
import { 
  scheduleAllExpiryNotifications, 
  cancelAllNotifications,
  showLocalNotification,
  checkLowStockAndNotify 
} from '../services/notifications';

export default function NotificationsSettingsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [expiryNotifications, setExpiryNotifications] = useState(false);
  const [restockNotifications, setRestockNotifications] = useState(false);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(1);
  const [inventoryCount, setInventoryCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const inventory = await getInventory();
    setInventoryCount(inventory.length);
  };

  const handleTestNotification = async () => {
    await showLocalNotification(
      '🔔 Тестовое уведомление',
      'Это тестовое уведомление от SmartVictus!'
    );
    Alert.alert('Успешно', 'Тестовое уведомление отправлено!');
  };

  const handleSaveSettings = async () => {
    // Перепланируем уведомления с новыми настройками
    if (expiryNotifications) {
      await scheduleAllExpiryNotifications(notifyDaysBefore);
    } else {
      await cancelAllNotifications();
    }
    
    // Если включены уведомления о пополнении - проверим низкий запас
    if (restockNotifications) {
      await checkLowStockAndNotify();
    }
    
    Alert.alert('Сохранено', 'Настройки уведомлений обновлены!');
  };

  const daysOptions = [1, 2, 3];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: theme.colors.primary }]}>← Назад</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Уведомления</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Статистика */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>📊 Статистика</Text>
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            Всего продуктов в инвентаре: {inventoryCount}
          </Text>
        </View>

        {/* Уведомления о сроке годности */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={[styles.cardLabel, { color: theme.colors.text }]}>⏰ Уведомления о сроке годности</Text>
              <Text style={[styles.cardHint, { color: theme.colors.textSecondary }]}>
                Уведомлять за {notifyDaysBefore} {notifyDaysBefore === 1 ? 'день' : 'дней'} до истечения
              </Text>
            </View>
            <Switch
              value={expiryNotifications}
              onValueChange={setExpiryNotifications}
              trackColor={{ false: '#E5E7EB', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          {expiryNotifications && (
            <View style={styles.optionsRow}>
              {daysOptions.map(days => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.optionBtn,
                    notifyDaysBefore === days && { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={() => setNotifyDaysBefore(days)}
                >
                  <Text style={[
                    styles.optionText,
                    { color: notifyDaysBefore === days ? '#fff' : theme.colors.text }
                  ]}>
                    {days} дн.
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Уведомления о пополнении */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={[styles.cardLabel, { color: theme.colors.text }]}>🛒 Уведомления о пополнении</Text>
              <Text style={[styles.cardHint, { color: theme.colors.textSecondary }]}>
                Напоминать когда товары заканчиваются
              </Text>
            </View>
            <Switch
              value={restockNotifications}
              onValueChange={setRestockNotifications}
              trackColor={{ false: '#E5E7EB', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Тестовое уведомление */}
        <TouchableOpacity 
          style={[styles.testBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handleTestNotification}
        >
          <Text style={styles.testBtnText}>🔔 Отправить тестовое уведомление</Text>
        </TouchableOpacity>

        {/* Сохранить */}
        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
          onPress={handleSaveSettings}
        >
          <Text style={styles.saveBtnText}>Сохранить настройки</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  cardHint: {
    fontSize: 13,
    marginTop: 4,
  },
  statText: {
    fontSize: 14,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
    marginRight: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  optionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  testBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  testBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
