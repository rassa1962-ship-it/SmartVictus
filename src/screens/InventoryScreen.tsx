// InventoryScreen.tsx — Экран Инвентаря
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { 
  InventoryItem, 
  Room, 
  Category,
  ROOMS, 
  ROOM_ICONS, 
  CATEGORIES,
  CATEGORY_ICONS,
  getDaysUntilExpiry, 
  formatDate 
} from '../models';
import { getInventory, removeInventoryItem } from '../services/storage';
import { useTheme } from '../context/ThemeContext';

type FilterType = 'all' | Room | Category;
type FilterMode = 'room' | 'category';

export default function InventoryScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [filterMode, setFilterMode] = useState<FilterMode>('room');
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const data = await getInventory();
    setInventory(data);
  };

  const handleDelete = (item: InventoryItem) => {
    Alert.alert(
      'Удалить продукт',
      `Вы уверены, что хотите удалить "${item.name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: async () => {
            await removeInventoryItem(item.id);
            loadData();
          }
        },
      ]
    );
  };

  // Фильтрация по месту/категории
  const filteredByType = filter === 'all' 
    ? inventory 
    : filterMode === 'room'
      ? inventory.filter(item => item.room === filter)
      : inventory.filter(item => item.category === filter);

  // Поиск по названию
  const filteredItems = searchQuery.trim()
    ? filteredByType.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredByType;

  const getCardStyle = (isExpired: boolean, isExpiring: boolean): any => {
    if (isExpired) return [styles.card, styles.cardExpired];
    if (isExpiring) return [styles.card, styles.cardWarning];
    return styles.card;
  };

  const getExpiryStyle = (isExpired: boolean, isExpiring: boolean): any => {
    if (isExpired) return [styles.cardExpiry, styles.cardExpiryExpired];
    if (isExpiring) return [styles.cardExpiry, styles.cardExpiryWarning];
    return styles.cardExpiry;
  };

  const getFilterBtnStyle = (isActive: boolean): any => {
    if (isActive) return [styles.filterBtn, styles.filterBtnActive];
    return styles.filterBtn;
  };

  const getFilterTextStyle = (isActive: boolean): any => {
    if (isActive) return [styles.filterText, styles.filterTextActive];
    return styles.filterText;
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    const isExpired = days < 0;
    const isExpiring = days >= 0 && days <= 3;

    return (
      <TouchableOpacity 
        style={getCardStyle(isExpired, isExpiring)}
        onPress={() => navigation.navigate('EditProduct', { productId: item.id })}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardCategoryIcon}>
              {CATEGORY_ICONS[item.category] || '📦'}
            </Text>
          </View>
          <Text style={styles.cardIcon}>{ROOM_ICONS[item.room]}</Text>
        </View>
        
        <View style={styles.cardDetails}>
          <Text style={styles.cardQuantity}>
            {item.quantity} {item.unit}
          </Text>
          <Text style={styles.cardRoom}>
            {ROOMS.find(r => r.value === item.room)?.label}
          </Text>
        </View>
        
        <Text style={getExpiryStyle(isExpired, isExpiring)}>
          {isExpired 
            ? `❌ Просрочено (${formatDate(item.expiryDate)})`
            : isExpiring 
              ? `⚠️ ${days} дн. (${formatDate(item.expiryDate)})`
              : `✓ до ${formatDate(item.expiryDate)}`
          }
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Инвентарь</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{inventory.length} продуктов</Text>
      </View>

      {/* Поиск */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по названию..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearSearch}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Переключатель режима фильтрации */}
      <View style={styles.filterModeToggle}>
        <TouchableOpacity 
          style={[styles.filterModeBtn, filterMode === 'room' && styles.filterModeBtnActive]}
          onPress={() => {
            setFilterMode('room');
            setFilter('all');
          }}
        >
          <Text style={[styles.filterModeText, filterMode === 'room' && styles.filterModeTextActive]}>
            По месту
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterModeBtn, filterMode === 'category' && styles.filterModeBtnActive]}
          onPress={() => {
            setFilterMode('category');
            setFilter('all');
          }}
        >
          <Text style={[styles.filterModeText, filterMode === 'category' && styles.filterModeTextActive]}>
            По категории
          </Text>
        </TouchableOpacity>
      </View>

      {/* Фильтры */}
      <View style={styles.filters}>
        <TouchableOpacity 
          style={getFilterBtnStyle(filter === 'all')}
          onPress={() => setFilter('all')}
        >
          <Text style={getFilterTextStyle(filter === 'all')}>
            Все
          </Text>
        </TouchableOpacity>
        
        {filterMode === 'room' ? (
          ROOMS.map(room => (
            <TouchableOpacity 
              key={room.value}
              style={getFilterBtnStyle(filter === room.value)}
              onPress={() => setFilter(room.value)}
            >
              <Text style={getFilterTextStyle(filter === room.value)}>
                {room.label}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          CATEGORIES.slice(0, 5).map(cat => (
            <TouchableOpacity 
              key={cat.value}
              style={getFilterBtnStyle(filter === cat.value)}
              onPress={() => setFilter(cat.value)}
            >
              <Text style={getFilterTextStyle(filter === cat.value)}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Результаты поиска */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResults}>
          <Text style={styles.searchResultsText}>
            Найдено: {filteredItems.length}
          </Text>
        </View>
      )}

      {/* Список */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery.length > 0 
              ? 'Ничего не найдено' 
              : 'Нет продуктов'}
          </Text>
        }
      />

      {/* Кнопка добавления */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearSearch: {
    position: 'absolute',
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 12,
    color: '#6B7280',
  },
  searchResults: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchResultsText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  filterModeToggle: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  filterModeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  filterModeBtnActive: {
    backgroundColor: '#10B981',
  },
  filterModeText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterModeTextActive: {
    color: '#fff',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterBtnActive: {
    backgroundColor: '#10B981',
  },
  filterText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 20,
    paddingTop: 10,
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
  cardExpired: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardCategoryIcon: {
    fontSize: 16,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  cardQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardRoom: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardExpiry: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 6,
    fontWeight: '500',
  },
  cardExpiryExpired: {
    color: '#EF4444',
  },
  cardExpiryWarning: {
    color: '#F59E0B',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 40,
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  scannerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scannerButtonText: {
    fontSize: 24,
  },
});
