# SmartVictus 🏠

Smart food tracking app for managing groceries and expiry dates. Built with React Native (Expo).

[![React Native](https://img.shields.io/badge/React%20Native-Expo-blue?style=flat&logo=react)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## 📱 About

SmartVictus helps you track product expiry dates in your fridge, pantry, and freezer. Never forget about perishable food again!

**Available on:** iOS, Android

## ✨ Features

### Current Capabilities
- 📦 **Inventory Management** - Track products across multiple storage locations
- ⏰ **Expiry Tracking** - Monitor expiration dates with visual indicators
- 🛒 **Shopping List** - Plan your purchases
- 📊 **Dashboard** - Overview of expiring products
- 🔍 **Search** - Find products by name
- 📂 **Categories** - Organize products by category (dairy, meat, vegetables, etc.)
- ✏️ **Edit Products** - Modify product details
- 📜 **History** - Action logging
- 📷 **Barcode Scanner** - Scan and auto-fill product data
- 🌙 **Dark Theme** - Light and dark mode support
- 🔔 **Push Notifications** - Reminders before products expire
- ⚙️ **Settings** - Configure notifications and theme

### Smart Features
- 🧠 **AI Auto-Sorting** - Automatic categorization using AI
- 📷 **OCR Receipt Scanning** - Scan receipts with ocr.space (free)
- 🔎 **Open Food Facts API** - Automatic product data lookup
- 📤 **Export/Import** - Backup and restore data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go (for mobile testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/rassa1962-ship-it/SmartVictus.git
cd SmartVictus

# Install dependencies
npm install

# Start the development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

## 📂 Project Structure

```
SmartVictus/
├── src/
│   ├── models/           # Data models and types
│   ├── navigation/       # React Navigation setup
│   ├── screens/          # App screens
│   │   ├── DashboardScreen.tsx
│   │   ├── InventoryScreen.tsx
│   │   ├── ShoppingListScreen.tsx
│   │   ├── AddProductScreen.tsx
│   │   ├── EditProductScreen.tsx
│   │   ├── BarcodeScannerScreen.tsx
│   │   ├── SmartCameraScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── BackupScreen.tsx
│   ├── services/         # Business logic
│   │   ├── storage.ts    # AsyncStorage wrapper
│   │   ├── notifications.ts
│   │   ├── backup.ts
│   │   ├── barcodeDb.ts
│   │   └── ocr.ts
│   └── context/          # React Context (theme)
├── App.tsx              # Main app component
└── package.json
```

## 🛠 Tech Stack

- **Framework:** React Native (Expo SDK 54)
- **Language:** TypeScript
- **Navigation:** React Navigation 7
- **Storage:** AsyncStorage
- **APIs:** Open Food Facts, ocr.space

## 🔜 Roadmap

### Phase 1 - Firebase Sync (In Progress)
- [ ] Firebase Authentication (email/password)
- [ ] Cloud sync between devices
- [ ] Family sharing (multiple users per fridge)

### Phase 2 - Smart Predictions
- [ ] Dynamic expiry date adjustment
- [ ] Consumption predictions
- [ ] Smart recommendations

### Phase 3 - Community
- [ ] Recipe suggestions (TheMealDB API)
- [ ] "What to cook from expiring items"
- [ ] Telegram bot for barcode lookup

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

---

*SmartVictus - Your smart kitchen assistant!*

## 🇷🇺 Russian README

Русская версия описания доступна в [README-RU.md](README-RU.md)
