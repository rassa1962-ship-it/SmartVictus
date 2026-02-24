// SettingsScreen.tsx — Экран настроек
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, ThemeMode } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }: any) {
  const { theme, setThemeMode, toggleTheme } = useTheme();

  const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Светлая', icon: '☀️' },
    { value: 'dark', label: 'Тёмная', icon: '🌙' },
    { value: 'system', label: 'Системная', icon: '📱' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Настройки</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Секция темы */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Оформление
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.cardRow}>
              <Text style={[styles.cardLabel, { color: theme.colors.text }]}>
                🌙 Тёмная тема
              </Text>
              <Switch
                value={theme.isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.cardLabel, { color: theme.colors.text, marginBottom: 12 }]}>
              Режим темы
            </Text>
            {themeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeOption,
                  theme.mode === option.value && { 
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary,
                  }
                ]}
                onPress={() => setThemeMode(option.value)}
              >
                <Text style={styles.themeIcon}>{option.icon}</Text>
                <Text style={[
                  styles.themeLabel, 
                  { color: theme.mode === option.value ? theme.colors.primary : theme.colors.textSecondary }
                ]}>
                  {option.label}
                </Text>
                {theme.mode === option.value && (
                  <Text style={[styles.checkmark, { color: theme.colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Секция уведомлений */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Уведомления
          </Text>
          
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate('NotificationsSettings')}
          >
            <View style={styles.cardRow}>
              <Text style={[styles.cardLabel, { color: theme.colors.text }]}>
                🔔 Настройки уведомлений
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Секция резервного копирования */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Данные
          </Text>
          
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate('Backup')}
          >
            <View style={styles.cardRow}>
              <Text style={[styles.cardLabel, { color: theme.colors.text }]}>
                💾 Резервное копирование
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Секция о приложении */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            О приложении
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: theme.colors.textSecondary }]}>
                Версия
              </Text>
              <Text style={[styles.aboutValue, { color: theme.colors.text }]}>
                1.0.0
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: theme.colors.textSecondary }]}>
                Название
              </Text>
              <Text style={[styles.aboutValue, { color: theme.colors.text }]}>
                SmartVictus
              </Text>
            </View>
          </View>
        </View>

        {/* Описание */}
        <View style={styles.description}>
          <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
            SmartVictus — умное приложение для управления продуктами и отслеживания сроков годности.
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
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  themeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  themeLabel: {
    fontSize: 15,
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  aboutLabel: {
    fontSize: 15,
  },
  aboutValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
  },
  description: {
    padding: 20,
    paddingTop: 10,
  },
  descriptionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
