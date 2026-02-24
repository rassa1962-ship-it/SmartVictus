// DashboardScreen.tsx — Главный экран
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { InventoryItem, getDaysUntilExpiry, formatDate, ROOM_ICONS } from '../models';
import { getInventory, addDemoData } from '../services/storage';
import { useTheme } from '../context/ThemeContext';

export default function DashboardScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [daysLeft, setDaysLeft] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    // Добавим демо данные если пусто
    await addDemoData();
    
    const data = await getInventory();
    setInventory(data);

    // Подсчитать минимальные дни
    if (data.length > 0) {
      const minDays = Math.min(
        ...data
          .map(item => getDaysUntilExpiry(item.expiryDate))
          .filter(d => d >= 0)
      );
      setDaysLeft(minDays);
    }
  };

  // Товары которые скоро истекают (до 3 дней)
  const expiringItems = inventory
    .filter(item => {
      const days = getDaysUntilExpiry(item.expiryDate);
      return days >= 0 && days <= 3;
    })
    .sort((a, b) => 
      new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    const isExpiring = days <= 3;

    return (
      <View style={isExpiring ? [styles.card, styles.cardWarning] : styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardIcon}>{ROOM_ICONS[item.room]}</Text>
        </View>
        <Text style={styles.cardQuantity}>
          {item.quantity} {item.unit}
        </Text>
        <Text style={isExpiring ? [styles.cardExpiry, styles.cardExpiryWarning] : styles.cardExpiry}>
          {isExpiring 
            ? `⚠️ Истекает через ${days} дн. (${formatDate(item.expiryDate)})`
            : `До ${formatDate(item.expiryDate)}`
          }
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>SmartVictus</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Умное управление продуктами</Text>
        </View>
        <TouchableOpacity 
          style={[styles.themeBtn, { backgroundColor: theme.colors.card }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.themeBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Карточка "Хватит на X дней" */}
      <View style={[styles.statsCard, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.statsLabel}>Запасов хватит ещё на</Text>
        <Text style={styles.statsNumber}>
          {daysLeft} {daysLeft === 1 ? 'день' : daysLeft >= 2 && daysLeft <= 4 ? 'дня' : 'дней'}
        </Text>
        <Text style={styles.statsSublabel}>
          Пока всё не испортится
        </Text>
      </View>

      {/* Секция "Скоро закончится" */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>⚠️ Скоро закончится</Text>
        {expiringItems.length === 0 ? (
          <Text style={styles.emptyText}>Всё в порядке! Нет продуктов с истекающим сроком.</Text>
        ) : (
          <FlatList
            data={expiringItems}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnText: {
    fontSize: 20,
  },
  statsCard: {
    backgroundColor: '#10B981',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsNumber: {
    fontSize: 42,
    fontWeight: '700',
    color: '#fff',
    marginVertical: 4,
  },
  statsSublabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  section: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardIcon: {
    fontSize: 20,
  },
  cardQuantity: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  cardExpiry: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 6,
  },
  cardExpiryWarning: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
  },
});
