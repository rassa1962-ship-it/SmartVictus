// ShoppingListScreen.tsx — Экран Списка покупок
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ShoppingItem } from '../models';
import { 
  getShoppingList, 
  addShoppingItem, 
  removeShoppingItem, 
  toggleShoppingItem,
  clearBoughtItems 
} from '../services/storage';
import { useTheme } from '../context/ThemeContext';

export default function ShoppingListScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [newItemText, setNewItemText] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const data = await getShoppingList();
    setShoppingList(data);
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    
    await addShoppingItem({ name: newItemText.trim() });
    setNewItemText('');
    loadData();
  };

  const handleToggle = async (id: string) => {
    await toggleShoppingItem(id);
    loadData();
  };

  const handleDelete = (item: ShoppingItem) => {
    Alert.alert(
      'Удалить',
      `Удалить "${item.name}" из списка?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: async () => {
            await removeShoppingItem(item.id);
            loadData();
          }
        },
      ]
    );
  };

  const handleClearBought = () => {
    const boughtCount = shoppingList.filter(item => item.isBought).length;
    if (boughtCount === 0) {
      Alert.alert('Нет купленных', 'Сначала отметьте товары как купленные');
      return;
    }

    Alert.alert(
      'Очистить купленные',
      `Удалить ${boughtCount} купленных товаров?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Очистить', 
          onPress: async () => {
            await clearBoughtItems();
            loadData();
          }
        },
      ]
    );
  };

  const boughtCount = shoppingList.filter(item => item.isBought).length;
  const totalCount = shoppingList.length;
  const isAddDisabled = !newItemText.trim();

  const getItemStyle = (isBought: boolean): any => {
    return isBought 
      ? [styles.item, { backgroundColor: theme.colors.card, opacity: 0.7 }] 
      : [styles.item, { backgroundColor: theme.colors.card }];
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <TouchableOpacity 
      style={getItemStyle(item.isBought)}
      onPress={() => handleToggle(item.id)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.checkbox, item.isBought && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
        {item.isBought && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.itemText, { color: item.isBought ? theme.colors.textSecondary : theme.colors.text }, item.isBought && styles.itemTextBought]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Покупки</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {boughtCount > 0 
              ? `${boughtCount} из ${totalCount} куплено`
              : `${totalCount} товаров`
            }
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.scannerBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('BarcodeScanner')}
        >
          <Text style={styles.scannerBtnText}>📷</Text>
        </TouchableOpacity>
      </View>

      {/* Поле ввода */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="Добавить товар..."
          placeholderTextColor={theme.colors.textSecondary}
          value={newItemText}
          onChangeText={setNewItemText}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity 
          style={[styles.addBtn, isAddDisabled && styles.addBtnDisabled]}
          onPress={handleAddItem}
          disabled={isAddDisabled}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Список */}
      <FlatList
        data={shoppingList}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Список покупок пуст</Text>
        }
      />

      {/* Кнопки действий */}
      {shoppingList.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.clearBtn}
            onPress={handleClearBought}
          >
            <Text style={[styles.clearBtnText, { color: theme.colors.error }]}>Очистить купленные</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scannerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerBtnText: {
    fontSize: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  addBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  addBtnText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  itemText: {
    fontSize: 16,
    flex: 1,
  },
  itemTextBought: {
    textDecorationLine: 'line-through',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  actions: {
    padding: 20,
    paddingTop: 0,
  },
  clearBtn: {
    padding: 14,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
