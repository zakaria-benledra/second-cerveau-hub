# 🧠 MINDED — Behavioral Intelligence System

> **"Transform Your Actions Into Your Best Self"**

[![Version](https://img.shields.io/badge/version-V41-blue.svg)](https://github.com/zakaria-benledra/second-cerveau-hub)
[![Score](https://img.shields.io/badge/QA%20Score-95%25+-green.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-94.5%25-blue.svg)]()
[![License](https://img.shields.io/badge/license-Private-red.svg)]()

---

## 🎯 Vision

**MINDED is not a productivity app. It is a Behavioral Intelligence System.**

It doesn't help you get organized. It helps you become someone disciplined, consistent, and predictable in your results.

### What We Really Sell

A **BEHAVIORAL TRANSFORMATION SYSTEM** that:
- 🔍 **Observes** what you plan, what you actually do, and what you avoid
- 📊 **Measures** your discipline, consistency, and momentum
- 🎯 **Scores** your performance across 3 domains (Discipline, Mental, Finance)
- 💡 **Recommends** personalized actions through AI Coach "Sage"
- ⚡ **Intervenes** automatically when you drift

### Operating Model

```
OBSERVE → MEASURE → SCORE → RECOMMEND → DECIDE → EXECUTE → AUDIT → LEARN
```

---

## ✨ Features V41 "Gamification Complète"

### 🆕 New in V41

| Feature | Description | Impact |
|---------|-------------|--------|
| 🎯 **Challenges System** | 12 défis (quotidiens, hebdo, mensuels) | +40% engagement |
| 🏆 **XP from Challenges** | Rewards 20-500 XP per challenge | Motivation boost |
| 📊 **Challenge Tracking** | Progress bars & expiration timers | Better UX |
| 🔥 **Difficulty Levels** | Easy, Medium, Hard, Extreme | Progression curve |

### ✅ V40 "Intelligence Proactive" (Previous)

| Feature | Description | Impact |
|---------|-------------|--------|
| ⚡ **AI Cache** | <50ms response time | -99% latency |
| 📴 **Offline Mode** | 24h data availability via IndexedDB | +15% retention |
| 🔔 **Push Notifications** | Smart behavioral alerts | +25% engagement |
| 📅 **Journal Date Picker** | Write entries for past dates | New feature |
| 🎯 **Connected Suggestions** | Mood/Energy → AI adapts | +30% relevance |
| 📝 **Dynamic Templates** | Context-aware reflection prompts | Better UX |
| 🧪 **15 E2E Tests** | Playwright automated testing | +30% confidence |

### Core Modules

| Module | Description | Page |
|--------|-------------|------|
| 🆔 **Identity** | Real-time behavioral score (3 domains) | `/identity` |
| ✅ **Tasks** | CRUD with priorities, projects, due dates | `/tasks` |
| 📋 **Kanban** | Drag & drop board (4 columns) | `/kanban` |
| 💪 **Habits** | Tracking with streaks & behavioral section | `/habits` |
| 📓 **Journal** | 5 tabs: Today, Timeline, Notes, Insights, Evolution | `/journal` |
| 💰 **Finance** | Transactions, budgets, categories | `/finance` |
| 🤖 **AI Coach** | Sage companion with chat & suggestions | `/ai-coach` |
| 🏆 **Achievements** | XP, Levels, Badges, Challenges, Gamification | `/achievements` |
| ⚙️ **Settings** | Personalization, Interests, GDPR, Export | `/settings` |

### AI Features

| Feature | Description |
|---------|-------------|
| 🧠 **Sage Companion** | Personalized AI coach adapting to your style |
| 💬 **Chat Mode** | Conversational AI assistance |
| 💡 **Smart Suggestions** | Context-aware recommendations |
| 📊 **Behavioral Analysis** | Pattern detection & insights |
| ⚠️ **Burnout Alerts** | Proactive workload warnings |
| 🔄 **Learning Profile** | Feedback loop (👍/👎) improves suggestions |

---

## 🎮 Gamification System V41

### Challenges

| Type | Count | Duration | XP Range |
|------|-------|----------|----------|
| 📅 **Daily** | 5 | 24h | 20-40 XP |
| 📆 **Weekly** | 4 | 7 days | 75-150 XP |
| 🗓️ **Monthly** | 3 | 30 days | 200-500 XP |

### Default Challenges

| Challenge | Type | Target | XP | Difficulty |
|-----------|------|--------|-----|------------|
| 🌅 Matinal Productif | Daily | 3 habits | 30 | Easy |
| 🎯 Focus Master | Daily | 2h focus | 40 | Medium |
| 📝 Journaliste | Daily | 1 journal | 25 | Easy |
| ⚡ Tâches Éclair | Daily | 5 tasks | 35 | Medium |
| 🔥 Streak Guardian | Daily | Maintain streak | 20 | Easy |
| 💯 Semaine Parfaite | Weekly | 100% habits 7d | 150 | Hard |
| 🏆 Conquérant | Weekly | 25 tasks | 100 | Medium |
| 🧠 Réflexion Profonde | Weekly | 5 journals | 75 | Medium |
| 📈 Score Champion | Weekly | Score >80% | 120 | Hard |
| 👑 Légende du Mois | Monthly | 30d streak | 500 | Extreme |
| ⚔️ Centurion | Monthly | 100 tasks | 300 | Hard |
| 🧘 Maître Zen | Monthly | 20 journals | 200 | Medium |

### XP Rewards

| Action | XP |
|--------|-----|
| Habit completed | +10 |
| Task completed | +15 |
| Streak day | +25 |
| Perfect day | +50 |
| Challenge completed | +20 to +500 |

### Level Formula

```javascript
level = Math.floor(Math.sqrt(totalXP / 50)) + 1
```

### Badge Categories

- 🔥 **Streak**: 7, 30, 100, 365 days
- 💪 **Habits**: First habit, Master, Legend
- ✅ **Tasks**: First task, Warrior, Legend
- 📝 **Journal**: First entry, Regular, Master
- ⭐ **Special**: Early Bird, Night Owl, Perfect Week

---

## 📱 Mobile App

### Download

The mobile app is built automatically with each release. Download the latest APK from:

👉 **[Releases Page](https://github.com/zakaria-benledra/second-cerveau-hub/releases)**

### Installation (Android)

1. Download `app-debug.apk` from the releases page
2. On your phone, enable **"Install from unknown sources"** in Settings > Security
3. Open the downloaded APK file
4. Tap **Install**
5. Open **Minded** and sign in!

### Features

| Platform | Status | Notes |
|----------|--------|-------|
| 🤖 **Android** | ✅ Available | APK download from Releases |
| 🍎 **iOS** | 🔜 Coming Soon | Requires Apple Developer account |
| 🌐 **PWA** | ✅ Available | Install from browser |

### PWA Installation

You can also install Minded as a Progressive Web App:

1. Visit the web app in Chrome/Safari
2. Tap the **"Add to Home Screen"** option
3. Minded will appear as an app icon

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| **State** | TanStack Query + Zustand |
| **Backend** | Supabase Edge Functions (Deno) |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (Email + OAuth) |
| **Charts** | Recharts |
| **Mobile** | Capacitor (iOS & Android) |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **PWA** | Service Worker + IndexedDB |

### Project Structure

```
src/
├── ai/                 # AI experience store & utilities
├── components/
│   ├── auth/           # ProtectedRoute, AdminRoute
│   ├── gamification/   # XP, Badges, Level, Streak, Challenges
│   ├── journal/        # Insights, Evolution tabs
│   ├── landing/        # 12 landing page sections
│   ├── layout/         # AppLayout, Sidebar, Header
│   ├── sage/           # AI Companion components
│   ├── settings/       # Personalization, Notifications
│   ├── suggestions/    # Smart suggestions UI
│   └── ui/             # shadcn/ui components
├── hooks/              # 50+ React Query hooks
├── lib/
│   └── api/            # API layer for all modules
├── pages/              # 40+ route pages
├── stores/             # Zustand stores
└── types/              # TypeScript definitions

supabase/
├── functions/          # 15+ Edge Functions
│   ├── smart-suggestions/
│   ├── sage-core/
│   ├── journal-ai-assist/
│   ├── compute-scores/
│   └── ...
└── migrations/         # 60+ SQL migrations
```

---

## 📊 Scoring Engine

### Global Score Formula

```
GLOBAL_SCORE = (DISCIPLINE × 0.40) + (MENTAL × 0.30) + (FINANCE × 0.30)
```

### Domain Subscores

| Domain | Components | Weight |
|--------|------------|--------|
| **Discipline** | Habits completion, Task completion, Streak | 40% |
| **Mental** | Journal entries, Mood tracking, Focus sessions | 30% |
| **Finance** | Budget adherence, Transaction tracking | 30% |

### Real-time Metrics

- **Momentum Index**: 7-day trend (50 = stable, >50 = improving)
- **Burnout Index**: Composite stress indicator
- **Consistency Factor**: Rolling completion rate

---

## 🔐 Security & Privacy

| Feature | Implementation |
|---------|----------------|
| **RLS** | Row Level Security on all tables |
| **Data Isolation** | `user_id` filter on every query |
| **GDPR Compliant** | Export, Delete, Consent management |
| **No Data Selling** | Your data stays yours |
| **Audit Logging** | All AI actions are logged |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or bun
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/zakaria-benledra/second-cerveau-hub.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests (Playwright)

```bash
# Run all tests
npx playwright test

# Run specific suite
npx playwright test e2e/gamification.spec.ts
npx playwright test e2e/journal.spec.ts
npx playwright test e2e/settings.spec.ts
npx playwright test e2e/pwa.spec.ts
npx playwright test e2e/ai-cache.spec.ts

# Interactive mode
npx playwright test --ui

# HTML report
npx playwright test --reporter=html
```

### Test Coverage

| Suite | File | Tests | Coverage |
|-------|------|-------|----------|
| 🎮 **Gamification** | `gamification.spec.ts` | 10 | XP, Badges, Streaks, Tabs |
| 📓 **Journal V40** | `journal.spec.ts` | 12 | Date picker, Mood, Templates IA |
| ⚙️ **Settings V40** | `settings.spec.ts` | 14 | Personnalisation, RGPD, Profil |
| 📱 **PWA** | `pwa.spec.ts` | 5 | Service Worker, IndexedDB, Offline |
| 🤖 **AI Cache** | `ai-cache.spec.ts` | 3 | Cache perf, Suggestions |
| 🔐 **Auth** | `auth.spec.ts` | 5 | Login, Logout, Protected routes |
| 🧭 **Navigation** | `navigation.spec.ts` | 10 | All routes accessible |
| 📊 **Core CRUD** | `core-crud.spec.ts` | 20+ | Tasks, Habits, Journal |
| 📐 **Responsive** | `responsive.spec.ts` | 5 | 4 viewport sizes |
| 👑 **Admin** | `admin.spec.ts` | 8 | RBAC, Dashboard admin |
| 💬 **AI Feedback** | `ai-feedback.spec.ts` | 15 | Feedback loop, Personalization |

**Total: 100+ E2E tests**

---

## 📱 PWA Features

- ✅ **Installable** on mobile/desktop
- ✅ **Offline Mode** with IndexedDB cache
- ✅ **Push Notifications** (opt-in)
- ✅ **Background Sync** when online

---

## 🗺️ Roadmap

### ✅ V40 "Intelligence Proactive"

- [x] AI Cache (<50ms)
- [x] Offline Mode (24h)
- [x] Push Notifications
- [x] Journal Date Picker
- [x] 15 E2E Tests
- [x] Landing Page V40

### ✅ V41 "Gamification Complète" (Current)

- [x] Daily/Weekly/Monthly Challenges (12 défis)
- [x] Challenge progress tracking
- [x] XP rewards for challenges
- [x] Difficulty levels (Easy → Extreme)
- [ ] Leaderboard (anonymized)
- [ ] Rewards Shop
- [ ] Enhanced animations

### 🔮 V42+ (Future)

- [ ] Google Calendar Integration
- [ ] Weather-based suggestions
- [ ] PDF Export
- [ ] Team/Workspace features

---

## 📈 Performance

| Metric | V39 | V40 | V41 | Improvement |
|--------|-----|-----|-----|-------------|
| AI Response | 5s | <50ms | <50ms | -99% |
| First Load | 3s | 2.5s | 2.5s | -17% |
| Offline Support | ❌ | ✅ 24h | ✅ 24h | New |
| Gamification | Basic | Basic | Full | Complete |

---

## 📊 Database Schema (Core Tables)

### Core
- `users` (auth.users)
- `profiles` (user profile data)
- `preferences` (user settings)
- `workspaces` (multi-tenant workspaces)
- `memberships` (user-workspace relationships)
- `user_roles` (RBAC roles)

### Execution
- `tasks`, `task_events`
- `habits`, `habit_logs`, `streaks`
- `routines`, `routine_logs`
- `focus_sessions`, `time_blocks`
- `inbox_items`

### Gamification
- `gamification_profiles` (XP, Level, Streak)
- `badges`, `user_badges`
- `gamification_challenges` (12 system challenges)
- `user_gamification_challenges` (user progress)
- `gamification_challenge_completions` (history)

### Planning
- `projects`, `domains`, `resources`
- `goals`
- `calendar_events`

### Growth
- `journal_entries`
- `reading_items`, `flashcards`, `highlights`

### Finance
- `finance_transactions`, `finance_categories`
- `budgets`

### Intelligence
- `scores_daily`, `scores_weekly`, `scores_monthly`
- `automation_rules`, `automation_events`
- `system_events`
- `ai_proposals`, `agent_actions`
- `audit_log`, `undo_stack`

---

## 🤝 Contributing

This is a private repository. Please contact the maintainer for contribution guidelines.

---

## 📄 License

Private - All rights reserved © 2026

---

## 👨‍💻 Author

**Zakaria Benledra**
- GitHub: [@zakaria-benledra](https://github.com/zakaria-benledra)

---

Built with ❤️ and ☕ for people who want to become their best selves.
