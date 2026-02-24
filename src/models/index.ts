// Модели данных для SmartVictus

// Место хранения
export type Room = 'fridge' | 'pantry' | 'freezer';

export const ROOMS: { value: Room; label: string }[] = [
  { value: 'fridge', label: 'Холодильник' },
  { value: 'pantry', label: 'Кладовка' },
  { value: 'freezer', label: 'Морозилка' },
];

export const ROOM_ICONS: Record<Room, string> = {
  fridge: '🧊',
  pantry: '🗄️',
  freezer: '❄️',
};

// Единицы измерения
export type Unit = 'g' | 'kg' | 'pcs' | 'l' | 'ml';

export const UNITS: { value: Unit; label: string }[] = [
  { value: 'g', label: 'г' },
  { value: 'kg', label: 'кг' },
  { value: 'pcs', label: 'шт' },
  { value: 'l', label: 'л' },
  { value: 'ml', label: 'мл' },
];

// ==================== КАТЕГОРИИ ====================

// Предустановленные категории
export type Category = 
  | 'dairy'      // Молочные
  | 'meat'       // Мясо
  | 'fish'       // Рыба
  | 'vegetables' // Овощи
  | 'fruits'     // Фрукты
  | 'bakery'     // Выпечка
  | 'drinks'     // Напитки
  | 'frozen'     // Заморозка
  | 'canned'     // Консервы
  | 'grains'     // Крупы/макароны
  | 'other';     // Другое

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: 'dairy', label: 'Молочные', icon: '🥛' },
  { value: 'meat', label: 'Мясо', icon: '🥩' },
  { value: 'fish', label: 'Рыба', icon: '🐟' },
  { value: 'vegetables', label: 'Овощи', icon: '🥬' },
  { value: 'fruits', label: 'Фрукты', icon: '🍎' },
  { value: 'bakery', label: 'Выпечка', icon: '🥖' },
  { value: 'drinks', label: 'Напитки', icon: '🧃' },
  { value: 'frozen', label: 'Заморозка', icon: '🧊' },
  { value: 'canned', label: 'Консервы', icon: '🥫' },
  { value: 'grains', label: 'Крупы', icon: '🌾' },
  { value: 'other', label: 'Другое', icon: '📦' },
];

export const CATEGORY_ICONS: Record<Category, string> = CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.value]: cat.icon }),
  {} as Record<Category, string>
);

// ==================== ПОЛЬЗОВАТЕЛЬСКИЕ КАТЕГОРИИ ====================

export interface UserCategory {
  id: string;
  name: string;
  icon: string;
}

// ==================== ИСТОРИЯ ====================

export type HistoryAction = 'add' | 'edit' | 'delete';

export interface HistoryItem {
  id: string;
  action: HistoryAction;
  productName: string;
  timestamp: string;
  details?: string;
}

export const HISTORY_ICONS: Record<HistoryAction, string> = {
  add: '➕',
  edit: '✏️',
  delete: '🗑️',
};

export const HISTORY_LABELS: Record<HistoryAction, string> = {
  add: 'Добавлен',
  edit: 'Изменён',
  delete: 'Удалён',
};

// ==================== ПРОДУКТЫ ====================

// Продукт в инвентаре
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  room: Room;
  category: Category;
  userCategoryId?: string; // Для пользовательских категорий
  expiryDate: string;
  addedDate: string;
}

// Элемент списка покупок
export interface ShoppingItem {
  id: string;
  name: string;
  isBought: boolean;
  quantity?: number;
  unit?: Unit;
  category?: Category;
}

// Генерация ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Форматирование даты
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
};

// Форматирование даты и времени
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Дней до истечения
export const getDaysUntilExpiry = (expiryDate: string): number => {
  const now = Date.now();
  const expiry = new Date(expiryDate).getTime();
  return Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
};

// Форматирование количества
export const formatQuantity = (quantity: number, unit: Unit): string => {
  const unitLabel = UNITS.find(u => u.value === unit)?.label || unit;
  return `${quantity} ${unitLabel}`;
};

// Получить иконку категории (встроенной или пользовательской)
export const getCategoryIcon = (
  category: Category, 
  userCategories: UserCategory[], 
  userCategoryId?: string
): string => {
  if (userCategoryId) {
    const userCat = userCategories.find(c => c.id === userCategoryId);
    if (userCat) return userCat.icon;
  }
  return CATEGORY_ICONS[category] || '📦';
};

// Получить название категории (встроенной или пользовательской)
export const getCategoryLabel = (
  category: Category, 
  userCategories: UserCategory[], 
  userCategoryId?: string
): string => {
  if (userCategoryId) {
    const userCat = userCategories.find(c => c.id === userCategoryId);
    if (userCat) return userCat.name;
  }
  return CATEGORIES.find(c => c.value === category)?.label || 'Другое';
};
