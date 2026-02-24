// BackupScreen.tsx — Экран резервного копирования
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { exportData, getDataSize } from '../services/backup';
import { exportBarcodesToJSON, importBarcodesFromJSON, getUserBarcodes } from '../services/barcodeDb';

export default function BackupScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [dataSize, setDataSize] = useState({ inventory: 0, shopping: 0, barcodes: 0 });

  useEffect(() => {
    loadDataSize();
  }, []);

  const loadDataSize = async () => {
    const size = await getDataSize();
    const barcodes = await getUserBarcodes();
    setDataSize({ ...size, barcodes: Object.keys(barcodes).length });
  };

  const handleExportBarcodes = async () => {
    setLoading(true);
    const json = await exportBarcodesToJSON();
    setLoading(false);
    
    Alert.alert(
      'Экспорт штрих-кодов',
      `Найдено ${dataSize.barcodes} штрих-кодов.\n\nJSON сохранён в консоли.`,
      [{ text: 'OK' }]
    );
    console.log('Barcodes JSON:', json);
  };

  const handleImportBarcodes = () => {
    Alert.alert(
      'Импорт штрих-кодов',
      'Введите JSON строку с базой штрих-кодов (в реальном приложении - выберите файл)',
      [{ text: 'Отмена' }]
    );
    // В реальном приложении здесь был бы FilePicker
  };

  const handleExport = async () => {
    if (dataSize.inventory === 0 && dataSize.shopping === 0) {
      Alert.alert('Нет данных', 'Сначала добавьте продукты или создайте список покупок');
      return;
    }

    setLoading(true);
    const result = await exportData();
    setLoading(false);

    if (result.success) {
      // Показываем JSON (в реальном приложении можно было бы сохранить в файл)
      Alert.alert(
        'Успешно', 
        `Данные экспортированы!\n\nСкопируйте данные из консоли или используйте для резервного копирования.`,
        [{ text: 'OK' }]
      );
      console.log('Exported data:', result.data);
    } else {
      Alert.alert('Ошибка', 'Не удалось экспортировать данные');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: theme.colors.primary }]}>← Назад</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Резервное копирование</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Информация о данных */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>📊 Информация о данных</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Продуктов в инвентаре:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{dataSize.inventory}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Товаров в списке покупок:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{dataSize.shopping}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Штрих-кодов пользователя:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{dataSize.barcodes}</Text>
          </View>
        </View>

        {/* Экспорт */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>📤 Экспорт данных</Text>
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            Сохранить все данные в файл JSON.
          </Text>
          
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleExport}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>Экспортировать данные</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Экспорт штрих-кодов */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>🏷️ Экспорт штрих-кодов</Text>
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            Сохранить базу штрих-кодов в JSON для обмена с другими пользователями.
          </Text>
          
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
            onPress={handleExportBarcodes}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>Экспортировать штрих-коды</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Информация */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>💡 Информация</Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Экспортированный файл содержит все ваши продукты и списки покупок. Вы можете использовать этот файл для резервного копирования или переноса данных на другое устройство.
          </Text>
        </View>
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
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
