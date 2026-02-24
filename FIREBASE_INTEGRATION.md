# Firebase интеграция для SmartVictus

## 1. Установка зависимостей

```bash
npm install firebase @react-native-firebase/auth @react-native-firebase/firestore
```

**Важно:** После установки нужно перезапустить Expo:
```bash
npx expo start --clear
```

---

## 2. Настройка Firebase Console

### Создание проекта
1. Перейди на [console.firebase.google.com](https://console.firebase.google.com)
2. Создай новый проект "SmartVictus"
3. Включи Analytics (опционально)

### Настройка Authentication
1. **Authentication** → **Sign-in method**
2. Включи **Email/Password**
   - Email/Password: **Включить**
   - Email link (passwordless): Выключить
3. **Отключи** Phone и все SMS-варианты (они не работают в РФ)

### Настройка Firestore Database
1. **Firestore Database** → **Create database**
2. Выбери расположение: `europe-west1` (ближе к РФ)
3. Режим: **Start in test mode** (потом настроим правила)

### Получение конфигурации
1. **Project Settings** (шестерёнка)
2. Скопируй `firebaseConfig` объект

---

## 3. Конфигурация проекта

### Создай файл `src/services/firebase.ts`

```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ТВОЯ КОНФИГУРАЦИЯ из Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "smartvictus.firebaseapp.com",
  projectId: "smartvictus",
  storageBucket: "smartvictus.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:..."
};

// Инициализация App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Инициализация Auth с сохранением сессии
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
export const db = getFirestore(app);

export default app;
```

---

## 4. Auth функции

### Создай файл `src/services/auth.ts`

```typescript
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from './firebase';

export type { User };

// Регистрация по email/password
export const register = async (email: string, password: string): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// Вход
export const login = async (email: string, password: string): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// Выход
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// Слушатель изменения состояния авторизации
export const subscribeAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
```

---

## 5. Структура Firestore

### Коллекции

```
households/{householdId}
  ├── name: string
  ├── createdAt: timestamp
  └── ownerUid: string

households/{householdId}/members/{uid}
  ├── role: "owner" | "member"
  └── joinedAt: timestamp

households/{householdId}/products/{productId}
  ├── name: string
  ├── quantity: number
  ├── unit: "g" | "kg" | "pcs" | "l" | "ml"
  ├── room: "fridge" | "pantry" | "freezer"
  ├── category: string
  ├── expiryDate: timestamp
  ├── addedDate: timestamp
  └── updatedAt: timestamp
```

### Firestore функции

Создай `src/services/firestore.ts`:

```typescript
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { InventoryItem, ShoppingItem } from '../models';

// ==================== HOUSEHOLDS ====================

// Создать household (для нового пользователя)
export const createHousehold = async (ownerUid: string, name: string = 'Мой холодильник') => {
  const householdRef = doc(collection(db, 'households'));
  await setDoc(householdRef, {
    name,
    ownerUid,
    createdAt: Timestamp.now(),
  });
  
  // Добавить владельца как участника
  await setDoc(doc(db, 'households', householdRef.id, 'members', ownerUid), {
    role: 'owner',
    joinedAt: Timestamp.now(),
  });
  
  return householdRef.id;
};

// Получить household по ID
export const getHousehold = async (householdId: string) => {
  const docRef = doc(db, 'households', householdId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

// Получить все households пользователя
export const getUserHouseholds = async (uid: string) => {
  // Сложный запрос - ищем где пользователь в members
  const households: any[] = [];
  // Для упрощения - возвращаем один household по uid
  const householdId = uid; // Для одиночного пользователя
  const household = await getHousehold(householdId);
  if (household) households.push(household);
  return households;
};

// ==================== MEMBERS ====================

// Добавить участника в household
export const addMember = async (householdId: string, uid: string, role: 'owner' | 'member') => {
  await setDoc(doc(db, 'households', householdId, 'members', uid), {
    role,
    joinedAt: Timestamp.now(),
  });
};

// Получить роль пользователя
export const getMemberRole = async (householdId: string, uid: string) => {
  const docRef = doc(db, 'households', householdId, 'members', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().role : null;
};

// ==================== PRODUCTS ====================

// Добавить продукт
export const addProduct = async (householdId: string, product: Omit<InventoryItem, 'id'>) => {
  const productsRef = collection(db, 'households', householdId, 'products');
  const docRef = doc(productsRef);
  await setDoc(docRef, {
    ...product,
    expiryDate: Timestamp.fromDate(new Date(product.expiryDate)),
    addedDate: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

// Получить все продукты household
export const getProducts = async (householdId: string): Promise<InventoryItem[]> => {
  const productsRef = collection(db, 'households', householdId, 'products');
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    expiryDate: doc.data().expiryDate?.toDate?.()?.toISOString() || '',
    addedDate: doc.data().addedDate?.toDate?.()?.toISOString() || '',
  })) as InventoryItem[];
};

// Обновить продукт
export const updateProduct = async (householdId: string, productId: string, updates: Partial<InventoryItem>) => {
  const docRef = doc(db, 'households', householdId, 'products', productId);
  await setDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  }, { merge: true });
};

// Удалить продукт
export const deleteProduct = async (householdId: string, productId: string) => {
  await deleteDoc(doc(db, 'households', householdId, 'products', productId));
};

// Слушать изменения продуктов (real-time)
export const subscribeProducts = (householdId: string, callback: (products: InventoryItem[]) => void) => {
  const productsRef = collection(db, 'households', householdId, 'products');
  return onSnapshot(productsRef, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as InventoryItem[];
    callback(products);
  });
};
```

---

## 6. Миграция с AsyncStorage

Создай `src/services/migration.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProducts, createHousehold, addProduct } from './firestore';
import { auth } from './firebase';
import { getInventory, getShoppingList } from './storage';

const MIGRATED_FLAG = 'smartvictus_migrated_v1';

// Проверить и запустить миграцию
export const migrateIfNeeded = async (): Promise<boolean> => {
  // Проверить флаг миграции
  const migrated = await AsyncStorage.getItem(MIGRATED_FLAG);
  if (migrated === '1') return false;
  
  // Проверить авторизацию
  const user = auth.currentUser;
  if (!user) return false;
  
  // Получить локальные данные
  const localInventory = await getInventory();
  const localShopping = await getShoppingList();
  
  if (localInventory.length === 0 && localShopping.length === 0) {
    await AsyncStorage.setItem(MIGRATED_FLAG, '1');
    return false;
  }
  
  // Создать household если нет
  const householdId = user.uid;
  await createHousehold(householdId, 'Мой холодильник');
  
  // Перенести продукты
  for (const product of localInventory) {
    await addProduct(householdId, product);
  }
  
  // Позже: перенести shopping list
  
  // Установить флаг миграции
  await AsyncStorage.setItem(MIGRATED_FLAG, '1');
  
  return true;
};
```

---

## 7. Правила безопасности Firestore

В Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Household - доступ только для участников
    match /households/{householdId} {
      allow read: request.auth != null && 
        exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
      allow write: request.auth != null && 
        get(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid)).data.role == 'owner';
      
      // Members subcollection
      match /members/{uid} {
        allow read: request.auth != null;
        allow create: request.auth != null && 
          get(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid)).data.role == 'owner';
        allow delete: request.auth != null && 
          get(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid)).data.role == 'owner' && uid != request.auth.uid;
      }
      
      // Products subcollection
      match /products/{productId} {
        allow read: request.auth != null && 
          exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
        allow write: request.auth != null && 
          exists(/databases/$(database)/documents/households/$(householdId)/members/$(request.auth.uid));
      }
    }
  }
}
```

---

## 8. Family Sharing (приглашение)

### Генерация приглашения
```typescript
// В SettingsScreen
const shareHousehold = async () => {
  const householdId = user.uid; // или текущий household
  const shareCode = `smartvictus://join/${householdId}`;
  // Показать QR код или ссылку
};
```

### Присоединение к семье
```typescript
// При входе проверить URL или ввод кода
const joinHousehold = async (householdId: string, uid: string) => {
  await addMember(householdId, uid, 'member');
};
```

---

## 9. Интеграция с App.tsx

```typescript
import { useEffect, useState } from 'react';
import { subscribeAuth, logout } from './src/services/auth';
import { migrateIfNeeded } from './src/services/migration';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuth(async (user) => {
      setUser(user);
      if (user) {
        // Запустить миграцию при первом входе
        await migrateIfNeeded();
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <AuthScreen />; // Экран входа/регистрации
  }

  return <MainApp />;
}
```

---

## 10. Следующие шаги

1. ✅ Создай Firebase проект
2. ✅ Настрой Authentication (email/password)
3. ✅ Создай Firestore базу
4. 📝 Скопируй конфигурацию
5. 📝 Создай файлы по инструкции
6. 🔄 Обнови App.tsx для работы с Auth

---

*Обновлено: Февраль 2026*
