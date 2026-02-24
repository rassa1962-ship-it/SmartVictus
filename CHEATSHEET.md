# Шпаргалка по SmartVictus

## 🚨 Важные правила

### 1. Установка пакетов

**ПРАВИЛЬНО (через Expo):**
```bash
npx expo install <package-name>
```

**НЕПРАВИЛЬНО (через npm):**
```bash
npm install <package-name>
```

Почему? Команда `expo install` автоматически устанавливает версии пакетов, совместимые с твоей версией Expo.

### 2. Ошибки на Android в Expo Go

Если появляется ошибка типа:
```
java.lang.String cannot be cast to java.lang.Boolean
```

Это значит, что версии пакетов несовместимы с Expo. Решение:
```bash
npx expo install
```
или
```bash
npx expo install @react-native-async-storage/async-storage react-native-screens
```

---

## 📦 Текущие версии пакетов

```json
{
  "expo": "~54.0.33",
  "react-native": "0.81.5",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "react-native-screens": "~4.16.0",
  "react-native-safe-area-context": "^5.6.2"
}
```

---

## 🔧 Полезные команды

| Команда | Описание |
|---------|----------|
| `npx expo start` | Запустить проект |
| `npx expo start --android` | Запустить для Android |
| `npx expo start --ios` | Запустить для iOS |
| `npx expo install <pkg>` | Установить пакет (безопасно) |
| `npx tsc --noEmit` | Проверить TypeScript |
| `npx expo --version` | Версия Expo |

---

## 🐛 Типичные проблемы

### AsyncStorageError: Native module is null
- Причина: AsyncStorage недоступен
- Решение: Добавлен fallback в `src/services/storage.ts` (использует in-memory storage)

### String cannot be cast to Boolean
- Причина: Несовместимость версий пакетов
- Решение: `npx expo install`

### Port 8081 is being used
- Закройте другие процессы или используйте другой порт

---

## 📱 Тестирование

1. Запусти: `npx expo start`
2. Открой Expo Go на телефоне
3. Отсканируй QR-код

---

*Обновлено: 2025-02-24*
