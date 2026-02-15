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
