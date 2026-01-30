# 🧠 SECOND CERVEAU

> Système personnel d'exécution, d'apprentissage et de pilotage combinant un Dashboard Exécutif et un Coach Motivationnel.

## 🎯 Vision

Design dual-mode system:
- **(A) Executive Dashboard** — productivité, projets, métriques, risques, décisions
- **(B) Motivational Coach** — habitudes, énergie, clarté, croissance personnelle

**PRIMARY LOOP**: Today → Action → Feedback → Insight → Improvement

## 🚀 Features

### ✅ Implemented Modules

| Module | DB Table | API/Edge Function | UI Page | BI Indicator |
|--------|----------|-------------------|---------|--------------|
| Today/Home | daily_stats | /stats/today | `/` | ✅ |
| Tasks | tasks, task_events | api-tasks | `/tasks` | completion_rate |
| Habits | habits, habit_logs, streaks | api-habits | `/habits` | habit_adherence |
| Routines | routines, routine_logs | - | `/routines` | ✅ |
| Inbox | inbox_items | api-inbox | `/inbox` | ✅ |
| Projects | projects, domains, resources | - | `/projects` | ✅ |
| Goals | goals | - | `/goals` | ✅ |
| Focus | focus_sessions, time_blocks | - | `/focus` | focus_minutes |
| Calendar | calendar_events | - | `/calendar` | ✅ |
| Learning | reading_items, flashcards, highlights | - | `/learning` | ✅ |
| Journal | journal_entries | - | `/journal` | mood_tracking |
| Finance | finance_transactions, budgets | - | `/finance` | budget_variance |
| Dashboard | daily_stats, weekly_stats | - | `/dashboard` | ✅ |
| Agent IA | agent_actions, audit_log, undo_stack | - | `/agent` | approval_rate |
| Notifications | notifications | - | `/notifications` | ✅ |
| Settings | preferences, profiles | - | `/settings` | ✅ |

### 🔄 Edge Functions (Backend API)

| Function | Purpose | Status |
|----------|---------|--------|
| `api-tasks` | CRUD tasks with audit logging | ✅ Deployed |
| `api-habits` | CRUD habits + log completion + streak management | ✅ Deployed |
| `api-inbox` | Capture + convert to task + archive | ✅ Deployed |
| `nightly-stats` | Calculate daily stats for all users | ✅ Deployed |
| `weekly-review` | Generate weekly aggregates + notifications | ✅ Deployed |

## 📊 BI Formulas (Canonical)

```
completion_rate = tasksCompleted / tasksPlanned
tasksPlanned = tasks WHERE dueDate=today OR startDate=today
overload_index = SUM(estimateMin due today) / dailyCapacityMin
habit_adherence = completedHabitLogs / expectedHabitLogs
streak = consecutive days habit_adherence >= threshold
budget_variance = actualSpend - budgetLimit
clarity_score = tasks_with(estimateMin + dueDate) / totalTasks
```

## 🛡️ System Rules (Contract)

1. **Every feature has**: DB table + API endpoint + UI screen + BI indicator
2. **UI reads only**: All writes go through Edge Functions (backend services)
3. **Dashboards read from Stats tables only**: daily_stats, weekly_stats, monthly_stats
4. **AI follows**: PROPOSE → APPROVE → EXECUTE → AUDIT → UNDO
5. **Data isolation**: Every table has `user_id`, all queries filter by user
6. **No destructive migrations**: add nullable → backfill → deprecate → delete

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- User data isolated by `user_id`
- Admin role check via `profiles.role`
- Audit logging for all agent actions
- OAuth + Email authentication

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **State**: React Query + Zustand

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # ProtectedRoute
│   ├── layout/         # AppLayout, Sidebar, Header
│   └── ui/             # shadcn/ui components
├── hooks/              # React Query hooks (useTasks, useHabits, etc.)
├── lib/
│   └── api/            # API layer (tasks, habits, inbox, etc.)
├── pages/              # Route pages
├── stores/             # Zustand stores
└── types/              # TypeScript types

supabase/
├── functions/          # Edge Functions
│   ├── api-tasks/
│   ├── api-habits/
│   ├── api-inbox/
│   ├── nightly-stats/
│   └── weekly-review/
└── migrations/         # Database migrations
```

## 🚦 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development: `npm run dev`

## 📈 Assumptions

- Default daily capacity: 480 minutes (8 hours)
- Default timezone: Europe/Paris
- Habit streak resets if missed for 1+ day
- Weekly review runs Monday for previous week
- Nightly stats job should run at midnight (configure via external scheduler)

## 🔄 Scheduled Jobs

Configure these Edge Functions to run on schedule (use external cron service like cron-job.org):

| Job | Schedule | Endpoint |
|-----|----------|----------|
| nightly-stats | Daily at 00:00 | `POST /nightly-stats` |
| weekly-review | Monday at 06:00 | `POST /weekly-review` |

## 📝 License

Private - All rights reserved
