# 🚗 Application Flotte de Véhicules

Système complet de gestion de flotte avec tracking GPS temps réel, notifications et interface web/mobile.

## 📱 Architecture

### 🌐 Frontend Web (React + Vite)
- **Technologies**: React 19, TypeScript, TailwindCSS, Leaflet
- **Cartographie**: OpenStreetMap avec react-leaflet
- **Firebase**: Authentification, Firestore, Real-time updates
- **Localisation**: `/Frontend/src`

### 📱 Application Mobile (Flutter)
- **Technologies**: Flutter 3.x, Dart
- **Cartographie**: flutter_map avec OpenStreetMap
- **Services**: GPS tracking, FCM notifications, Firebase
- **Localisation**: `/driver_mobile/lib`

### 🔧 Backend (Node.js + Firebase)
- **Technologies**: Node.js, Express, Socket.io, Firebase Admin
- **Base de données**: Firestore
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Localisation**: `/backend`

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Flutter 3.x
- Compte Firebase avec projet configuré

### Installation Backend
```bash
cd backend
npm install
cp .env.example .env  # Configurer variables Firebase
npm start
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
