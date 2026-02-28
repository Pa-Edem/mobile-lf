# 📱 Lingua Flow

Mobile application for learning foreign languages through AI-powered contextual dialogs.

## 🌍 Supported Languages

Finnish (FI) • English (EN) • Spanish (ES) • German (DE) • French (FR) • Italian (IT) • Portuguese (PT) • Swedish (SE) • Norwegian (NO)

## 🚀 Technology Stack

- **Framework:** React Native + Expo
- **Navigation:** Expo Router v6
- **Styling:** NativeWind (Tailwind CSS)
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **State Management:** React Query
- **AI:** Groq API (Llama 3) + ElevenLabs TTS

## 📋 Features

### MVP (Phase 1-5)

- ✅ User authentication (Email + Google OAuth)
- ✅ AI-powered dialog generation
- ✅ 4 training levels (Learn, Pronunciation, Translation, Listening)
- ✅ Subscription system (FREE, PRO, PREMIUM)
- ✅ 7-day PRO trial
- ✅ ElevenLabs voice synthesis for premium users

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/lingua-flow.git
cd lingua-flow

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Add your Supabase keys to .env

# Start development server
npm start
```

### Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📚 Project Structure

```
app/               # Expo Router screens
├── (auth)/        # Authentication screens
├── (tabs)/        # Main app tabs
├── dialogs/       # Dialog screens
└── modals/        # Modal screens

components/        # Reusable React components
hooks/            # Custom React hooks
contexts/         # React contexts
lib/              # Utilities and configs
```

## 🗓️ Development Roadmap

- [x] Phase 1: Foundation (Auth, Navigation) - 2 weeks
- [x] Phase 2: Core Features (Dialog Generation) - 3-4 weeks
- [ ] Phase 3: Training System (4 levels) - 3-4 weeks
- [ ] Phase 4: Monetization (Stripe, Trial) - 2-3 weeks
- [ ] Phase 5: Polish (Stats, Settings) - 1-2 weeks

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Pa-Edem - [@Pa-Edem](https://github.com/Pa-Edem)

---

**Status:** 🚧 In Development (Phase 3)

---

## Current project structure

```
lflow
├─ app
│  ├─ (auth)
│  │  ├─ forgot-password.js
│  │  ├─ login.js
│  │  └─ _layout.js
│  ├─ (tabs)
│  │  ├─ index.js
│  │  ├─ messages.js
│  │  ├─ profile.js
│  │  ├─ settings.js
│  │  ├─ stats.js
│  │  └─ _layout.js
│  ├─ dialogs
│  │  ├─ new.js
│  │  ├─ [id]
│  │  │  ├─ flashcards.js
│  │  │  ├─ level-0.js
│  │  │  ├─ level-1.js
│  │  │  ├─ level-2.js
│  │  │  ├─ level-3.js
│  │  │  └─ level-4.js
│  │  └─ [id].js
│  ├─ global.css
│  ├─ index.js
│  ├─ language-selection.js
│  └─ _layout.js
├─ app.json
├─ assets
│  └─ images
│     ├─ favicon.png
│     ├─ google.png
│     ├─ google.svg
│     ├─ logo.png
│     ├─ logo.svg
│     └─ splash-icon.png
├─ babel.config.js
├─ components
│  ├─ AccuracyResult.js
│  ├─ AnswerButton.js
│  ├─ CompletionModal.js
│  ├─ CustomAlert.js
│  ├─ DialogCard.js
│  ├─ EmptyState.js
│  ├─ ExportModal.js
│  ├─ LanguagePickerModal.js
│  ├─ LevelSlider.js
│  ├─ RecordButton.js
│  ├─ ReplicaCard.js
│  ├─ ReplicasSlider.js
│  ├─ SplashScreen.js
│  ├─ ToneSlider.js
│  ├─ TrainingButton.js
│  ├─ UpgradeModal.js
│  ├─ UsageLimitsCard.js
│  └─ WordsInput.js
├─ contexts
│  └─ SupabaseContext.js
├─ eas.json
├─ eslint.config.js
├─ hooks
│  ├─ useAudioPlayer.js
│  ├─ useAudioRecorder.js
│  ├─ useAuth.js
│  ├─ useProfile.js
│  ├─ useSpeechRecognition.js
│  └─ useTrainingLogger.js
├─ lib
│  ├─ evaluateSpeech.js
│  ├─ exportUtils.js
│  ├─ i18n.js
│  ├─ planUtils.js
│  └─ supabase.js
├─ locales
│  ├─ en.json
│  └─ ru.json
├─ metro.config.cjs
├─ nativewind-env.d.ts
├─ package-lock.json
├─ package.json
├─ README.md
├─ supabase
│  ├─ config.toml
│  └─ functions
│     ├─ deno.json
│     └─ generate-dialog
│        ├─ .npmrc
│        ├─ deno.json
│        └─ index.ts
├─ tailwind.config.js
└─ tsconfig.json

```
