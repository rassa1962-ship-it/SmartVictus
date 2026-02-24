// HistoryScreen.tsx — Экран истории действий
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { HistoryItem, HISTORY_ICONS, HISTORY_LABELS, formatDateTime } from '../models';
import { getHistory, clearHistory } from '../services/storage';

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const data = await getHistory();
    setHistory(data);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Очистить историю',
      'Вы уверены, что хотите удалить всю историю? Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            loadData();
          }
        },
      ]
    );
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'add': return '#10B981';
      case 'edit': return '#3B82F6';
      case 'delete': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.item}>
      <View style={[styles.iconContainer, { backgroundColor: getActionColor(item.action) + '20' }]}>
        <Text style={styles.icon}>{HISTORY_ICONS[item.action]}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.action, { color: getActionColor(item.action) }]}>
            {HISTORY_LABELS[item.action]}
          </Text>
          <Text style={styles.time}>
            {formatDateTime(item.timestamp)}
          </Text>
        </View>
        <Text style={styles.productName}>{item.productName}</Text>
        {item.details && (
          <Text style={styles.details}>{item.details}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>История</Text>
        <Text style={styles.subtitle}>
          {history.length} {history.length === 1 ? 'запись' : history.length >= 2 && history.length <= 4 ? 'записи' : 'записей'}
        </Text>
      </View>

      {history.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearHistory}
          >
            <Text style={styles.clearBtnText}>🗑️ Очистить историю</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>История пуста</Text>
            <Text style={styles.emptySubtext}>
              Здесь будут отображаться все действия с продуктами
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
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
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  clearBtnText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  item: {
    flexDirection: 'row',
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  productName: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  details: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
