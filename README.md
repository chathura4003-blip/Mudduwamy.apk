# ශ්‍රී සුමන මහා පිරිවෙන් ERP (Sri Sumana Pirivena ERP)

[![Version](https://img.shields.io/badge/version-3.8.5-amber.svg)](package.json)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Web-blue.svg)](capacitor.config.ts)
[![Framework](https://img.shields.io/badge/framework-React%2019%20%7C%20Vite%206%20%7C%20Capacitor%207-green.svg)](package.json)

ශ්‍රී සුමන මහා පිරිවෙන (මුද්දුව, රත්නපුර) ආයතනික කළමනාකරණ පද්ධතිය හා නිල Android Mobile APK යෙදුම (Comprehensive Pirivena Institution ERP System & Official Mobile Application).

---

## 📱 Features (ප්‍රධාන විශේෂාංග)

- **Student Portal (ශිෂ්‍ය අංශය)**: QR ශිෂ්‍ය හැඳුනුම්පත, මාර්ගගත විභාග (Online Exams), කාලසටහන, විභාග ප්‍රතිඵල සහ ඩිජිටල් පුස්තකාලය.
- **Teacher Portal (ගුරුභවත් අංශය)**: ගුරු කාලසටහන්, ශිෂ්‍ය පැමිණීම, සජීවී විභාග අධීක්ෂණය, ලකුණු සටහන් සහ අධ්‍යයන නිබන්ධන බෙදාහැරීම.
- **Admin Dashboard (පරිපාලක පුවරුව)**: නව ඇතුළත් කිරීම්, ශිෂ්‍ය/ගුරු නාමාවලි, පන්ති/විෂය කළමනාකරණය, පින්කම් අරමුදල (Donations), සජීවී විකාශන නිවේදන (Live Broadcasts), සහ ආරක්ෂක Audit Logs.
- **Dharma AI Copilot**: Google Gemini & OpenRouter බහු-මාදිලි කෘතිම බුද්ධි සහයක.
- **Offline & Push Notifications**: OneSignal Push Notifications සහ පූර්ණ Offline Network Status Detection.
- **Modern Monastic UI**: පිරිවෙන් සම්ප්‍රදායික ආලෝකය සහ අඳුරු මාදිලිය (Light/Dark Monastic Theme), Safe-area Inset & Multi-device Touch Target අනුකූලතාවය.

---

## 🚀 Getting Started (ආරම්භ කිරීම)

### Prerequisites (පූර්ව අවශ්‍යතා)
- **Node.js**: v20.0.0 හෝ ඊට ඉහළ
- **NPM**: v10.0.0 හෝ ඊට ඉහළ
- **Android Studio / Android SDK**: API 34+ (Android APK එක build කිරීම සඳහා)
- **Java JDK**: Version 17

### 1. Installation (ස්ථාපනය)
```bash
# Clone the repository
git clone <YOUR_GITHUB_REPO_URL>
cd apk

# Install dependencies
npm install
```

### 2. Environment Setup (පරිසර විචල්‍යයන්)
`.env.example` ගොනුව `.env` ලෙස පිටපත් කර ඔබගේ API යතුරු ඇතුළත් කරන්න:
```bash
cp .env.example .env
```

### 3. Development Server (දේශීයව ක්‍රියාත්මක කිරීම)
```bash
# Start Vite development server
npm run dev
```

---

## 📦 Building the Android APK (Android APK එක සෑදීම)

### Automated Single-Command Build (ස්වයංක්‍රීයව සෑදීම)
```bash
npm run build:apk
```
මෙමඟින් ස්වයංක්‍රීයව:
1. Vite Production Bundle එක `dist/` වෙත build කරයි.
2. Android App Icons සහ Splash Screens උත්පාදනය කරයි.
3. Capacitor Android Platform එක sync කරයි.
4. Gradle මඟින් නිල වශයෙන් අත්සන් කරන ලද `SriSumanaPirivenaERP-Release.apk` ගොනුව සකස් කරයි.

### Manual Capacitor Steps (පියවරෙන් පියවර සෑදීම)
```bash
# 1. Build web bundle
npm run build

# 2. Sync web assets with Capacitor Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

---

## 📂 Project Structure (ව්‍යාපෘති ව්‍යුහය)

```
├── android/               # Native Android Capacitor Project (Gradle, Manifest, Assets)
├── php/                   # Backend REST API Endpoints & Database Schema (MySQL)
├── public/                # Public Static Assets (Logos, Icons, Web Workers)
├── scripts/               # Build Automation Scripts (APK Build, Icon Generator)
├── src/
│   ├── api/               # API Clients & Server Endpoints Integration
│   ├── components/        # Reusable UI Components & Modals
│   ├── context/           # React Context Providers (Auth, Theme, Language, etc.)
│   ├── hooks/             # Custom Hooks (Android Back Button, Portal Data)
│   ├── services/          # Services (Notifications, OneSignal, AI Provider, Lifecycle)
│   ├── utils/             # Utility Functions (Date, Haptics, Sound, Permissions)
│   └── views/             # Core Views (AdminDashboard, TeacherPortal, StudentPortal)
├── capacitor.config.ts    # Capacitor Mobile Configuration
├── package.json           # Dependencies & Scripts
├── tsconfig.json          # TypeScript Configuration
└── vite.config.ts         # Vite Bundler Configuration
```

---

## 🛡️ License & Rights
© 2026 ශ්‍රී සුමන මහා පිරිවෙන (මුද්දුව, රත්නපුර). All Rights Reserved.
