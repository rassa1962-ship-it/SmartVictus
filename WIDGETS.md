# Виджеты для SmartVictus

## Обзор

Виджеты = всегда нативные (Java/Kotlin для Android, Swift для iOS)

## Android

### Подход
1. React Native хранит данные в SharedPreferences
2. Нативный виджет (AppWidgetProvider) читает и показывает

### Файлы
- `ExpiringWidgetProvider.java` - виджет
- `expiring_widget.xml` - layout
- `expiring_widget_info.xml` - конфиг
- AndroidManifest.xml - регистрация

### Код виджета (Java)
```java
public class ExpiringWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            SharedPreferences prefs = context.getSharedPreferences("SmartVictus", Context.MODE_PRIVATE);
            int count = prefs.getInt("expiringCount", 0);

            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.expiring_widget);
            views.setTextViewText(R.id.appwidget_text, "Истекает: " + count);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
}
```

## iOS

### Подход
- WidgetKit + SwiftUI
- App Groups для обмена данными
- react-native-shared-group-preferences

### Библиотеки
- react-native-shared-group-preferences
- expo-apple-targets (для Expo)

## Вывод

**Сложность: Высокая**
- Нужен нативный код
- Для Expo - нужно делать eject/prebuild

**Рекомендация:** Оставить на потом, пока достаточно уведомлений.

---

*Источник: Perplexity AI*
