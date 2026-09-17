# Dinlipi (দিনলিপি) 🍃

> **A cozy, tactile, and completely private offline financial ledger for Android.**  
> Built with Expo SDK 57, React Native, Drizzle ORM, and SQLite.

[![License: MIT](https://img.shields.io/badge/License-MIT-CEF04A.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android%20Exclusive-262928.svg?style=flat-square)](https://expo.dev)
[![Storage](https://img.shields.io/badge/Database-Local%20SQLite%20(Drizzle)-81B29A.svg?style=flat-square)](https://orm.drizzle.team)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-E07A5F.svg?style=flat-square)](CONTRIBUTING.md)

---

Dinlipi is an open-source, local-first mobile personal finance companion designed with a warm, minimalist aesthetic. Unlike modern banking applications that require always-on internet connections, account sign-ups, and telemetry tracking, Dinlipi keeps **100% of your financial records isolated on your device's internal storage**.

---

## ✨ Core Highlights & Features

### 🗄️ 100% Offline & Private SQLite Ledger
- Powered by **Drizzle ORM** and **Expo SQLite**.
- Zero cloud syncing, zero third-party tracking, zero accounts required.
- Full offline CRUD operations for income, expense, and transfer records.
- Live reactive queries automatically sync balances across dashboard, analytics, and cards.

### 🎨 Procedural Generative Envelope Cards
- Custom budget cards inspired by physical envelopes with Apple Card-style mesh gradients.
- **Procedural SVG Shape Engine**: Generates unique backgrounds utilizing mathematical curves, angled polygons, glowing orbs, intersecting arcs, and fluid ribbon waves.
- Dynamic contrast detection automatically calculates text luminance for optimal readability.
- Enter custom card networks (e.g., Vault, Personal Property, Emergency Reserve).

### 📖 Khata & People Ledger (Lend & Borrow)
- Track personal debts, shared expenses, and credit balances with friends and merchants.
- Multi-installment payment logging with timestamps and remaining balance computations.
- Support for nicknames, aliases, and direct phone contact shortcuts.

### 📄 One-Tap PDF Monthly Statement Export
- Automatically compiles itemized transaction history, income vs. expense cashflow, and net savings.
- Formatted with clean typography and generated directly on-device using `expo-print`.
- Shares via Android's native save/share sheet using `expo-sharing`.

### 🛡️ Hardware Sensors, Biometrics & Tactile Haptics
- **Tactile Heartbeat Engine**: Subtle, Apple-like micro-haptics when entering PINs and recording transactions.
- **Biometric Sensor Lock**: Secure your financial vault using device fingerprint or Face unlock.
- **Integrated Hardware Hub**: Interactive diagnostics to test haptic pulses and verify sensor permissions from the dashboard.

### 🧼 Zero Prefilled Bloat & Complete Vault Reset
- Strict raw installation: no fake transactions, dummy cards, or placeholder categories.
- Guided empty states educate users on envelopes, subscriptions, and categories.
- One-tap **Danger Zone** vault wipe to permanently purge all data and start completely from scratch.

---

## 📲 Downloading the Android APK

Dinlipi is tailored specifically for Android. You can install and run it on any Android device running Android 8.0+:

### Option A: Download from GitHub Releases
1. Navigate to the [Releases](https://github.com/IshakShekh97/dinlipi/releases) page of this repository.
2. Download the latest `dinlipi-v1.0.0.apk` asset.
3. Open the downloaded file on your Android phone and tap **Install** (allow installation from unknown sources if prompted).

### Option B: Cloud Build with EAS (Expo Application Services)
To build the standalone `.apk` directly using EAS:

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Log in to your Expo account
eas login

# 3. Build standalone APK for Android
eas build -p android --profile preview
```
Once the cloud build completes, EAS provides a direct download link and QR code for the `.apk`.

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js (v20+)
- [Bun](https://bun.sh) (recommended) or npm
- Android device or Android Studio emulator
- Expo Go or Expo Development Client

### Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/IshakShekh97/dinlipi.git
cd dinlipi

# 2. Install dependencies (Bun)
bun install

# 3. Start development server
bunx expo start
```

### Useful Commands

```bash
# Run TypeScript typechecks
bunx tsc --noEmit

# Run ESLint diagnostics
bun run lint

# Validate Expo modules and configuration
bunx expo-doctor
```

---

## 🧱 Architecture & Project Structure

```
dinlipi/
├── src/
│   ├── app/                      # Expo Router file-based screens
│   │   ├── (tabs)/               # Bottom tab navigation (Home, Spending, Khata, Analytics, Settings)
│   │   ├── onboarding.tsx        # Guided welcome onboarding
│   │   ├── profile-setup.tsx     # Mandatory profile name & preferences setup
│   │   └── _layout.tsx           # Root navigator and theme providers
│   ├── components/
│   │   ├── cards/                # Budget envelope stack & procedural card creator
│   │   ├── categories/           # Category carousels & envelope manager
│   │   ├── khata/                # Khata people modals, person details & installments
│   │   ├── recurring/            # Subscription & bill tracker modals
│   │   ├── security/             # Device permissions, hardware hub & PIN keypad
│   │   ├── settings/             # Vault wipe, currency picker, backup controls
│   │   └── ui/                   # CozyModal, ConfirmModal, CardMeshBackground
│   ├── constants/                # Theme tokens, pastel palettes, haptics
│   ├── context/                  # Security context & theme context
│   ├── db/                       # Drizzle ORM schema, SQLite client & live queries
│   ├── store/                    # Zustand UI & application state store
│   └── utils/                    # Currency formatting & mathematical helpers
├── assets/                       # Custom logos, splash artwork, and adaptive icons
├── eas.json                      # EAS configuration for standalone APK builds
└── app.json                      # Expo app manifest & permissions configuration
```

---

## 🤝 Contributing

Contributions from the open-source community are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for details on code style, commit conventions, and pull request workflows.

---

## 📄 License

Dinlipi is open-source software licensed under the [MIT License](LICENSE).
