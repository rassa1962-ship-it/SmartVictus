// App.tsx — Главный файл приложения
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { subscribeAuth, getCurrentUser } from './src/services/auth';
import { ensureHousehold } from './src/services/firestore';
import { migrateIfNeeded } from './src/services/migration';
import { requestNotificationPermission, scheduleAllExpiryNotifications } from './src/services/notifications';

function AppContent() {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Подписка на изменения авторизации
    const unsubscribe = subscribeAuth(async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Создать household если нет
          await ensureHousehold(user.uid);
          // Запустить миграцию данных
          await migrateIfNeeded();
        } catch (error) {
          console.error('Ошибка инициализации:', error);
        }
      }
      
      setLoading(false);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Инициализация уведомлений при запуске
    const initNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        await scheduleAllExpiryNotifications();
      }
    };
    initNotifications();
  }, []);

  // Пока идёт проверка авторизации - показываем загрузку
  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Если не авторизован - показываем экран входа
  if (!user) {
    return (
      <AuthScreen onAuthSuccess={() => {
        // После успешной авторизации перезагрузим
        setLoading(true);
      }} />
    );
  }

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <NavigationContainer
        theme={{
          dark: theme.isDark,
          colors: {
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.card,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.primary,
          },
          fonts: {
            regular: {
              fontFamily: 'System',
              fontWeight: '400' as const,
            },
            medium: {
              fontFamily: 'System',
              fontWeight: '500' as const,
            },
            bold: {
              fontFamily: 'System',
              fontWeight: '700' as const,
            },
            heavy: {
              fontFamily: 'System',
              fontWeight: '900' as const,
            },
          },
        }}
      >
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
