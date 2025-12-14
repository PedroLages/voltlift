# 🏋️ IronPath (VoltLift)

<div align="center">

**The no-BS fitness tracking app built for lifters who want results.**

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.0-119eff?logo=capacitor)](https://capacitorjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-ffca28?logo=firebase)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Development](#-development) • [Architecture](#-architecture)

</div>

---

## 🎯 What is IronPath?

IronPath is a **mobile-first progressive web app** and **native iOS/Android app** designed for serious lifters. Track workouts, smash PRs, follow proven programs (GZCLP, nSuns, 5/3/1), and let AI guide your progressive overload—all with blazing-fast performance and aggressive, motivating design.

Built with **React 19**, **TypeScript**, and **Capacitor**, IronPath delivers native-quality performance on iOS/Android while maintaining the flexibility of web deployment. No fluff. No ads. Just pure lifting intelligence.

---

## 🔥 Features

### 💪 **Core Training**
- **Lightning-Fast Workout Logging** - < 100ms set logging, pre-filled from last workout
- **Smart Progressive Overload** - Research-backed AI suggestions using RPE, recovery, and history
- **Built-in Programs** - GZCLP, nSuns (4/5/6-day), 5/3/1 BBB, Greg Nuckols, Reddit PPL
- **Adaptive Frequency** - Programs auto-adjust to 3/4/5/6-day schedules
- **PR Tracking & Celebrations** - Auto-detect 1RM, volume, strength PRs with notifications
- **Rest Timer** - Customizable with iOS notifications when time's up

### 📊 **Intelligence & Insights**
- **Adaptive Recovery System** - Sleep, soreness, stress tracking affects AI recommendations
- **Auto-Deload Detection** - Warns when fatigue is too high (RPE analysis)
- **Detailed Analytics** - Volume, intensity, body weight, lift correlations
- **Year in Review** - Annual stats, streaks, total volume, top lifts
- **AI Coaching** - Powered by Google Gemini for workout tips & motivation

### 📱 **Native Mobile Experience**
- **iOS Local Notifications** - Daily reminders, PR celebrations, rest timer alerts
- **Offline-First** - Full functionality without internet
- **Live Updates** - Over-the-air updates via Firebase Hosting
- **Haptic Feedback** - Satisfying tactile responses for iOS
- **Dark Mode** - Aggressive black theme with neon yellow accents (#ccff00)

### 🎨 **Design Philosophy**
- **Mobile-First, Always** - Optimized for iPhone SE (375px) and up
- **Thumb-Zone UI** - Primary actions within bottom 60% of screen
- **WCAG AA Compliant** - 4.5:1 contrast ratios, keyboard navigation
- **< 200ms Interactions** - Buttery smooth, no jank
- **Aggressive Energy** - Bold typography, intense language, high contrast

---

## 🛠 Tech Stack

### **Frontend**
- **React 19** - Latest with concurrent features
- **TypeScript 5.6** - Type-safe development
- **Vite 6** - Lightning-fast HMR and builds
- **Tailwind CSS 3** - Utility-first styling
- **Zustand** - Lightweight state management with persistence
- **React Router 6** - Client-side routing

### **Backend & Cloud**
- **Firebase** - Authentication, Firestore, Hosting, Storage
- **Google Gemini API** - AI-powered workout suggestions
- **GitHub Actions** - Automated CI/CD to Firebase

### **Mobile**
- **Capacitor 8** - Native iOS/Android wrapper
- **Local Notifications** - Native push notifications
- **Haptics** - iOS tactile feedback
- **Camera** - Progress photos

### **Code Quality**
- **ESLint** - Linting
- **PostCSS** - CSS processing
- **Git Hooks** - Pre-commit checks

---

## 🚀 Installation

### **Prerequisites**
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **pnpm**
- **Xcode** (for iOS development)
- **Android Studio** (for Android development)

### **1. Clone the Repository**
```bash
git clone https://github.com/PedroLages/voltlift.git
cd voltlift
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Configure Environment**

Create `.env.local`:

```bash
# Backend (Firebase or PocketBase)
VITE_BACKEND_TYPE=firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# AI Features (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

See [`.env.example`](.env.example) for full template.

### **4. Run Development Server**
```bash
npm run dev
```

App runs at `http://localhost:3000`

---

## 📱 Development

### **Web Development**
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
```

### **iOS Development**

**First-time setup:**
```bash
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

**Development workflow:**
```bash
# For local testing (use Mac's IP address)
# Edit capacitor.config.ts: url: 'http://YOUR_IP:3000'
npm run dev
npx cap sync ios
# Open Xcode and run on device/simulator

# For production (live updates from Firebase)
# Edit capacitor.config.ts: url: 'https://voltlift-app.web.app'
npm run build
npx cap sync ios
# Build once in Xcode
# Future updates auto-deploy via Firebase!
```

### **Android Development**
```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

---

## 🏗 Architecture

### **State Management**
- **Zustand Store** (`store/useStore.ts`) - Single global store with localStorage persistence
- **Auth Store** (`store/useAuthStore.ts`) - Firebase auth state + cloud sync
- **Cloud Sync** - Automatic sync to Firebase on auth changes

### **Data Flow**
```
User Action → Component → Zustand Store → localStorage + Firebase → Cloud
                ↓
         useStore Hook
                ↓
          Re-render UI
```

### **Key Patterns**
- **Templates** - `WorkoutSession` with `status: 'template'`
- **Active Workouts** - `status: 'active'`
- **History** - `status: 'completed'`
- **Programs** - Multi-week templates with frequency variants
- **PR Tracking** - Auto-calculated from workout history

### **File Structure**
```
IronPath/
├── components/        # React components
├── pages/            # Route pages
├── services/         # Business logic (AI, notifications, backend)
├── store/            # Zustand state management
├── constants.ts      # Exercise library, programs
├── types.ts          # TypeScript definitions
└── docs/             # Architecture & design docs
```

---

## 🌐 Deployment

### **Firebase Hosting** (Automatic)
Pushes to `main` branch automatically deploy via GitHub Actions:

```yaml
# .github/workflows/firebase-deploy.yml
on:
  push:
    branches: [main]

# Deploys to: https://voltlift-app.web.app
```

### **iOS App Store**
1. Build production bundle: `npm run build`
2. Sync to iOS: `npx cap sync ios`
3. Open Xcode: `npx cap open ios`
4. Archive & upload to App Store Connect

### **Android Play Store**
1. Build production bundle: `npm run build`
2. Sync to Android: `npx cap sync android`
3. Open Android Studio: `npx cap open android`
4. Generate signed APK/AAB

---

## 📚 Documentation

- [**CLAUDE.md**](CLAUDE.md) - Claude Code instructions & project overview
- [**Design Principles**](docs/design-principles.md) - S-tier mobile design standards
- [**Feature Requirements**](docs/feature-requirements.md) - Detailed feature specs
- [**Competitive Analysis**](docs/competitive-analysis.md) - Research on Strong, Hevy, Boostcamp
- [**User Flows**](docs/user-flows.md) - User journeys & personas
- [**Backend Migration Guide**](docs/backend-migration-guide.md) - Firebase ↔ PocketBase
- [**Capacitor Guide**](docs/capacitor-guide.md) - iOS/Android native integration

---

## 🎨 Design System

### **Colors**
- **Primary**: `#ccff00` (Neon Yellow-Green)
- **Background**: `#000000` (Pure Black)
- **Surface**: `#111111` (Dark Surface)
- **Muted Text**: `#9ca3af` (Gray-400)

### **Typography**
- **Font**: Inter (system fallback)
- **Headers**: 900 weight, uppercase, italic
- **Body**: 400-600 weight

### **Accessibility**
- ✅ WCAG AA contrast ratios (4.5:1 for text)
- ✅ Keyboard navigable with visible focus states
- ✅ Touch targets ≥ 44x44px
- ✅ Screen reader compatible

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### **Commit Convention**
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google AI Studio** - Initial project scaffolding
- **Google Gemini** - AI-powered workout suggestions
- **Firebase** - Backend infrastructure
- **Capacitor** - Native mobile wrapper
- **Strong, Hevy, Boostcamp** - Inspiration for best-in-class fitness UX

---

## 📧 Contact

**Pedro Lages** - [@PedroLages](https://github.com/PedroLages)

**Project Link**: [https://github.com/PedroLages/voltlift](https://github.com/PedroLages/voltlift)

**Live App**: [https://voltlift-app.web.app](https://voltlift-app.web.app)

---

<div align="center">

**Built with 💪 by lifters, for lifters.**

[⬆ Back to Top](#-ironpath-voltlift)

</div>
