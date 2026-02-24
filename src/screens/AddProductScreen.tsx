// AddProductScreen.tsx — Экран добавления продукта
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Room, Unit, ROOMS, UNITS, Category, CATEGORIES } from '../models';
import { addInventoryItem } from '../services/storage';
import { addUserBarcode } from '../services/barcodeDb';

export default function AddProductScreen({ navigation, route }: any) {
  const barcode = route?.params?.barcode || null;
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<Unit>('pcs');
  const [room, setRoom] = useState<Room>('fridge');
  const [category, setCategory] = useState<Category>('other');
  const [expiryDays, setExpiryDays] = useState('7');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название продукта');
      return;
    }

    const qty = parseFloat(quantity) || 0;
    if (qty <= 0) {
      Alert.alert('Ошибка', 'Введите количество');
      return;
    }

    const days = parseInt(expiryDays) || 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    try {
      await addInventoryItem({
        name: name.trim(),
        quantity: qty,
        unit,
        room,
        category,
        expiryDate: expiryDate.toISOString(),
      });

      // Сохраняем штрих-код в пользовательскую базу
      if (barcode) {
        await addUserBarcode(barcode, name.trim(), category, days);
      }

      Alert.alert('Успешно', 'Продукт добавлен!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить продукт');
    }
  };

  const getUnitBtnStyle = (u: string): any => {
    return unit === u ? [styles.unitBtn, styles.unitBtnActive] : styles.unitBtn;
  };

  const getUnitTextStyle = (u: string): any => {
    return unit === u ? [styles.unitText, styles.unitTextActive] : styles.unitText;
  };

  const getRoomBtnStyle = (r: string): any => {
    return room === r ? [styles.roomBtn, styles.roomBtnActive] : styles.roomBtn;
  };

  const getRoomTextStyle = (r: string): any => {
    return room === r ? [styles.roomText, styles.roomTextActive] : styles.roomText;
  };

  const getCategoryBtnStyle = (c: string): any => {
    return category === c ? [styles.categoryBtn, styles.categoryBtnActive] : styles.categoryBtn;
  };

  const getCategoryTextStyle = (c: string): any => {
    return category === c ? [styles.categoryText, styles.categoryTextActive] : styles.categoryText;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Добавить продукт</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        {/* Штрих-код (если есть) */}
        {barcode && (
          <View style={[styles.field, { backgroundColor: '#ECFDF5', padding: 12, borderRadius: 8 }]}>
            <Text style={{ fontSize: 12, color: '#10B981' }}>_barcode Штрих-код:</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>{barcode}</Text>
          </View>
        )}

        {/* Название */}
        <View style={styles.field}>
          <Text style={styles.label}>Название</Text>
          <TextInput
            style={styles.input}
            placeholder="Например: Молоко 2.5%"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Количество */}
        <View style={styles.field}>
          <Text style={styles.label}>Количество</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="1"
              placeholderTextColor="#9CA3AF"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            <View style={styles.unitButtons}>
              {UNITS.map(u => (
                <TouchableOpacity
                  key={u.value}
                  style={getUnitBtnStyle(u.value)}
                  onPress={() => setUnit(u.value)}
                >
                  <Text style={getUnitTextStyle(u.value)}>
                    {u.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Категория */}
        <View style={styles.field}>
          <Text style={styles.label}>Категория</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={getCategoryBtnStyle(cat.value)}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={getCategoryTextStyle(cat.value)}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Место хранения */}
        <View style={styles.field}>
          <Text style={styles.label}>Место хранения</Text>
          <View style={styles.roomButtons}>
            {ROOMS.map(r => (
              <TouchableOpacity
                key={r.value}
                style={getRoomBtnStyle(r.value)}
                onPress={() => setRoom(r.value)}
              >
                <Text style={styles.roomIcon}>
                  {r.value === 'fridge' ? '🧊' : r.value === 'pantry' ? '🗄️' : '❄️'}
                </Text>
                <Text style={getRoomTextStyle(r.value)}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Срок годности */}
        <View style={styles.field}>
          <Text style={styles.label}>Срок годности (дней)</Text>
          <TextInput
            style={styles.input}
            placeholder="7"
            placeholderTextColor="#9CA3AF"
            value={expiryDays}
            onChangeText={setExpiryDays}
            keyboardType="numeric"
          />
          <Text style={styles.hint}>Через сколько дней продукт испортится</Text>
        </View>

        {/* Кнопка сохранения */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Добавить продукт</Text>
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    fontSize: 16,
    color: '#10B981',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  unitButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  unitBtnActive: {
    backgroundColor: '#10B981',
  },
  unitText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  unitTextActive: {
    color: '#fff',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBtn: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  categoryBtnActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#10B981',
  },
  roomButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roomBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  roomBtnActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  roomIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  roomText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  roomTextActive: {
    color: '#10B981',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  saveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
