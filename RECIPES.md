# API Рецептов для SmartVictus

## Бесплатные варианты

### 1. TheMealDB (Рекомендую)
- ✅ Бесплатно
- ✅ JSON, без сложной авторизации
- ✅ Категории, поиск по названию, ингредиентам
- ✅ Тестовый ключ: `1`

**Эндпоинты:**
- `https://www.themealdb.com/api/json/v1/1/search.php?s=chicken` - поиск
- `https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken,broccoli` - по ингредиентам

### 2. API Ninjas - Recipe API
- ✅ Бесплатный тариф
- ✅ Поиск по ингредиентам
- ⚠️ Ограничение запросов

### 3. DummyJSON Recipes
- ✅ Для тестов
- ⚠️ Фейковые данные

## Spoonacular (мощный, но лимиты)
- ⚠️ Есть free тариф, но сильно ограничен
- Можно использовать для экспериментов

## Как интегрировать в SmartVictus

### Сценарий "Что приготовить":
1. Берём продукты с истекающим сроком
2. Делаем запрос к API с ингредиентами
3. Показываем рецепты с картинками

### Пример запроса (TheMealDB):
```
GET https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken,broccoli
```

### Ответ:
```json
{
  "meals": [
    {
      "strMeal": "Chicken Broccoli",
      "strMealThumb": "https://...",
      "idMeal": "12345"
    }
  ]
}
```

## Roadmap

- [ ] Добавить экран рецептов
- [ ] Интегрировать TheMealDB API
- [ ] Кнопка "Рецепты из того, что скоро испортится"

---

*Источник: Perplexity AI*
