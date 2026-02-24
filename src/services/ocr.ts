// ocr.ts — Сервис OCR сканирования чеков
import { InventoryItem, Category, Room } from '../models';

// OCR.space API (бесплатный, 500 запросов/день)
const OCR_SPACE_API = 'https://api.ocr.space/parse/image';

// Тип результата OCR
export type OCRResult = {
  success: boolean;
  text?: string;
  items?: string[];
  error?: string;
};

// Категории по умолчанию для AI сортировки (английские ключи)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'dairy': ['молоко', 'кефир', 'йогурт', 'сыр', 'творог', 'сметана', 'масло', 'сливки'],
  'meat': ['мясо', 'курица', 'свинина', 'говядина', 'колбаса', 'сосиски', 'бекон', 'фарш'],
  'vegetables': ['помидор', 'огурец', 'лук', 'картофель', 'морковь', 'перец', 'капуста', 'зелень', 'салат'],
  'fruits': ['яблок', 'банан', 'апельсин', 'манго', 'киви', 'виноград', 'клубника'],
  'bakery': ['хлеб', 'батон', 'булка', 'лаваш', 'пита', 'тортилья'],
  'drinks': ['вода', 'сок', 'газировка', 'чай', 'кофе', 'молочный коктейль'],
  'frozen': ['мороженое', 'замороженный', 'пельмени', 'вареники'],
  'canned': ['консерв', 'тунец', 'сардина', 'кукуруза', 'горошек', 'фасоль'],
  'grains': ['макароны', 'круп', 'рис', 'мука', 'сахар', 'соль', 'масло растительное'],
};

// Места хранения по умолчанию (английские ключи)
const ROOM_KEYWORDS: Record<string, string[]> = {
  'fridge': ['молоко', 'мясо', 'сыр', 'творог', 'кефир', 'йогурт', 'сметана', 'овощи', 'фрукты', 'колбаса'],
  'freezer': ['замороженный', 'мороженое', 'пельмени'],
  'pantry': ['консерв', 'круп', 'макароны', 'мука', 'чай', 'кофе'],
};

// Отправить изображение на OCR
export const processReceiptImage = async (base64Image: string): Promise<{
  success: boolean;
  text?: string;
  items?: string[];
  error?: string;
}> => {
  try {
    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
    formData.append('language', 'rus');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    const response = await fetch(OCR_SPACE_API, {
      method: 'POST',
      headers: {
        'apikey': 'helloworld', // Бесплатный ключ для тестов
      },
      body: formData,
    });

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      return { success: false, error: 'Ошибка обработки изображения' };
    }

    if (!data.ParsedResults || data.ParsedResults.length === 0) {
      return { success: false, error: 'Текст не найден' };
    }

    const fullText = data.ParsedResults.map((r: any) => r.ParsedText).join('\n');
    const items = extractItemsFromText(fullText);

    return {
      success: true,
      text: fullText,
      items,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return { success: false, error: 'Ошибка соединения с OCR сервисом' };
  }
};

// Извлечь товары из текста чека
const extractItemsFromText = (text: string): string[] => {
  const lines = text.split('\n');
  const items: string[] = [];

  for (const line of lines) {
    // Ищем строки с названием товара и ценой
    // Обычно формат: "НАЗВАНИЕ ТОВАРА 99.99"
    const match = line.match(/^([А-Яа-яёA-Za-z\s]+)[\s\d]*(\d+[.,]\d{2})/);
    
    if (match && match[1] && match[1].length > 2) {
      const name = match[1].trim();
      // Фильтруем короткие строки и служебные слова
      if (name.length > 3 && !isServiceWord(name)) {
        items.push(name);
      }
    }
  }

  return items.slice(0, 20); // Максимум 20 товаров
};

// Проверка служебных слов
const isServiceWord = (word: string): boolean => {
  const serviceWords = ['итог', 'сумма', 'скидка', 'бонус', 'налог', 'ндс', 'оплата', 'карта', 'спасибо', 'через'];
  const lowerWord = word.toLowerCase();
  return serviceWords.some(sw => lowerWord.includes(sw));
};

// AI сортировка товара по категории
export const categorizeProduct = (productName: string): Category => {
  const lowerName = productName.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category as Category;
    }
  }

  return 'other';
};

// AI определение места хранения
export const determineStorageRoom = (productName: string): Room => {
  const lowerName = productName.toLowerCase();

  for (const [room, keywords] of Object.entries(ROOM_KEYWORDS)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return room as Room;
    }
  }

  return 'fridge'; // По умолчанию
};

// Предсказание срока годности (дней)
export const predictExpiryDays = (productName: string): number => {
  const lowerName = productName.toLowerCase();

  // Молочные - 7 дней
  if (CATEGORY_KEYWORDS['dairy'].some(k => lowerName.includes(k))) return 7;
  
  // Мясо - 3 дня
  if (CATEGORY_KEYWORDS['meat'].some(k => lowerName.includes(k))) return 3;
  
  // Овощи/фрукты - 14 дней
  if (CATEGORY_KEYWORDS['vegetables'].some(k => lowerName.includes(k)) ||
      CATEGORY_KEYWORDS['fruits'].some(k => lowerName.includes(k))) return 14;
  
  // Хлеб - 5 дней
  if (CATEGORY_KEYWORDS['bakery'].some(k => lowerName.includes(k))) return 5;
  
  // Заморозка - 180 дней
  if (CATEGORY_KEYWORDS['frozen'].some(k => lowerName.includes(k))) return 180;
  
  // Консервы - 365 дней
  if (CATEGORY_KEYWORDS['canned'].some(k => lowerName.includes(k))) return 365;

  return 30; // По умолчанию 30 дней
};

// Создать InventoryItem из названия товара
export const createInventoryItemFromOCR = (productName: string): Partial<InventoryItem> => {
  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + predictExpiryDays(productName));

  return {
    name: productName,
    category: categorizeProduct(productName),
    room: determineStorageRoom(productName),
    expiryDate: expiryDate.toISOString().split('T')[0],
    quantity: 1,
    unit: 'pcs',
  };
};
