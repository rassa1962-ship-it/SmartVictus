// Firebase Firestore service for SmartVictus
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query,
  where,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { InventoryItem, ShoppingItem } from '../models';

// ==================== HOUSEHOLDS ====================

// Тип для household
export interface Household {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: Date;
}

// Создать household (для нового пользователя)
export const createHousehold = async (ownerUid: string, name: string = 'Мой холодильник'): Promise<string> => {
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
export const getHousehold = async (householdId: string): Promise<Household | null> => {
  const docRef = doc(db, 'households', householdId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { 
    id: docSnap.id, 
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate()
  } as Household : null;
};

// Получить все households пользователя (где он участник)
export const getUserHouseholds = async (uid: string): Promise<Household[]> => {
  // Для упрощения - возвращаем один household по uid
  const household = await getHousehold(uid);
  return household ? [household] : [];
};

// ==================== MEMBERS ====================

// Тип для участника
export interface Member {
  uid: string;
  role: 'owner' | 'member';
  joinedAt: Date;
}

// Добавить участника в household
export const addMember = async (householdId: string, uid: string, role: 'owner' | 'member'): Promise<void> => {
  await setDoc(doc(db, 'households', householdId, 'members', uid), {
    role,
    joinedAt: Timestamp.now(),
  });
};

// Получить роль пользователя
export const getMemberRole = async (householdId: string, uid: string): Promise<string | null> => {
  const docRef = doc(db, 'households', householdId, 'members', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data().role : null;
};

// Получить всех участников household
export const getHouseholdMembers = async (householdId: string): Promise<Member[]> => {
  const membersRef = collection(db, 'households', householdId, 'members');
  const snapshot = await getDocs(membersRef);
  return snapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data(),
    joinedAt: doc.data().joinedAt?.toDate()
  })) as Member[];
};

// ==================== PRODUCTS ====================

// Добавить продукт
export const addProduct = async (householdId: string, product: Omit<InventoryItem, 'id'>): Promise<string> => {
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
export const updateProduct = async (householdId: string, productId: string, updates: Partial<InventoryItem>): Promise<void> => {
  const docRef = doc(db, 'households', householdId, 'products', productId);
  await setDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  }, { merge: true });
};

// Удалить продукт
export const deleteProduct = async (householdId: string, productId: string): Promise<void> => {
  await deleteDoc(doc(db, 'households', householdId, 'products', productId));
};

// Слушать изменения продуктов (real-time)
export const subscribeProducts = (householdId: string, callback: (products: InventoryItem[]) => void) => {
  const productsRef = collection(db, 'households', householdId, 'products');
  return onSnapshot(productsRef, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      expiryDate: doc.data().expiryDate?.toDate?.()?.toISOString() || '',
      addedDate: doc.data().addedDate?.toDate?.()?.toISOString() || '',
    })) as InventoryItem[];
    callback(products);
  });
};

// ==================== SHOPPING LIST ====================

// Добавить в список покупок
export const addShoppingItem = async (householdId: string, item: Omit<ShoppingItem, 'id'>): Promise<string> => {
  const itemsRef = collection(db, 'households', householdId, 'shopping');
  const docRef = doc(itemsRef);
  await setDoc(docRef, {
    ...item,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

// Получить список покупок
export const getShoppingList = async (householdId: string): Promise<ShoppingItem[]> => {
  const itemsRef = collection(db, 'households', householdId, 'shopping');
  const snapshot = await getDocs(itemsRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ShoppingItem[];
};

// Удалить из списка покупок
export const deleteShoppingItem = async (householdId: string, itemId: string): Promise<void> => {
  await deleteDoc(doc(db, 'households', householdId, 'shopping', itemId));
};

// ==================== HOUSEHOLD CREATION ====================

// Проверить и создать household если нужно
export const ensureHousehold = async (uid: string): Promise<string> => {
  const existing = await getHousehold(uid);
  if (existing) {
    return uid;
  }
  return await createHousehold(uid, 'Мой холодильник');
};
