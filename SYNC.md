# Синхронизация для SmartVictus

## Варианты

### 1. Firebase (Рекомендую)
- ✅ Бесплатный тариф (Spark)
- ✅ Автосинхронизация
- ✅ Auth (email/Google)
- ✅ Firestore или Realtime DB

**Структура:**
```
users/{userId}/fridges/{fridgeId}/products/{productId}
```

### 2. Облачный бэкап (iCloud/Google Drive)
- ✅ Полный контроль
- ✅ Ручной экспорт/импорт
- ❌ Нет живой синхронизации

### 3. P2P (Peer-to-Peer)
- ❌ Сложно
- ❌ Нужен сигнальный сервер
- ⚠️ Только для "быстрого обмена"

## Реализация Firebase

```typescript
import firestore from '@react-native-firebase/firestore';

// Слушать изменения
export function subscribeProducts(onChange) {
  return firestore()
    .collection('users')
    .doc(userId)
    .collection('fridges')
    .doc(fridgeId)
    .collection('products')
    .onSnapshot(snapshot => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onChange(items);
    });
}

// Сохранить продукт
export async function saveProduct(product) {
  await firestore()
    .collection('users')
    .doc(userId)
    .collection('fridges')
    .doc(fridgeId)
    .collection('products')
    .doc(product.id)
    .set(product, { merge: true });
}
```

## План

### Сейчас
1. Firebase как основной механизм
2. Кнопки экспорт/импорт (файл)

### Позже
- Auto-backup в облако
- Семейный шэринг (fridgeId)

---

*Источник: Perplexity AI*
