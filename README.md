# 🧠 SECOND CERVEAU

> Decision Intelligence System for Human Behavior - Système personnel d'exécution, d'apprentissage et de pilotage.

## 🎯 Vision

**"SECOND CERVEAU is not a productivity app. It is a Decision Intelligence System for Human Behavior. It measures who the user is becoming — and actively shapes who they become next."**

Design dual-mode system:
- **(A) Executive Dashboard** — productivité, projets, métriques, risques, décisions
- **(B) Motivational Coach** — habitudes, énergie, clarté, croissance personnelle

**OPERATING MODEL**: OBSERVE → MEASURE → SCORE → RECOMMEND → DECIDE → EXECUTE → AUDIT → LEARN

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
| **Scores** | scores_daily, scores_weekly, scores_monthly | compute-scores | `/scores` | global_score |
| **Automation** | automation_rules, automation_events, system_events | - | `/automation` | trigger_count |
| Dashboard | daily_stats, weekly_stats | - | `/dashboard` | ✅ |
| Agent IA | agent_actions, ai_proposals, audit_log | - | `/agent` | approval_rate |
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
| `compute-scores` | Calculate daily/weekly/monthly scores | ✅ Deployed |

## 📊 Scoring Engine

### Global Score Formula (v1)

```
GLOBAL_SCORE = (HABITS_SCORE × 0.35) + (TASKS_SCORE × 0.25) + (FINANCE_SCORE × 0.20) + (HEALTH_SCORE × 0.20)
```

### Subscores

| Score | Formula | Weight |
|-------|---------|--------|
| Habits | completed / expected × consistency_factor | 35% |
| Tasks | completed / planned × priority_weight | 25% |
| Finance | 1 - (spent / budget) | 20% |
| Health | focus_sessions / target_sessions | 20% |

### Additional Metrics

- **Momentum Index**: Trend direction based on 7-day history (50 = stable, >50 = improving)
- **Burnout Index**: Composite of task stress, habit stress, and trend stress
- **Consistency Factor**: 7-day rolling completion rate

## ⚡ Automation Engine

### Event Model

Every state change emits a system event:
```json
{
  "event_type": "habit.completed",
  "user_id": "uuid",
  "entity": "habits",
  "entity_id": "uuid",
  "source": "ui",
  "payload": {},
  "created_at": "timestamp"
}
```

### Automation Rules

Rules follow IF/THEN pattern:
- **Trigger Event**: `habit.missed`, `budget.threshold_reached`, `day.overloaded`, etc.
- **Action Type**: `create_task`, `send_notification`, `ai_proposal`, `reward_prompt`
- **Priority**: Higher priority rules execute first
- **Channel**: `ui`, `email`, `push`, `ai`

### Pre-built Templates

1. **Missed Habit → Task**: Creates a catch-up task when a habit is missed
2. **Budget Threshold → Notification**: Alerts when spending exceeds threshold
3. **Overloaded Day → AI Proposal**: Suggests rescheduling when too many tasks
4. **7-Day Inactivity → Re-engagement**: Sends motivational message
5. **Goal Achieved → Reward**: Celebrates and prompts reflection

## 🏢 Multi-Tenant Architecture

### Workspace Model

```
Workspace
 ├── Members
 │    ├── Owner (full access)
 │    ├── Admin (manage members)
 │    └── Member (read/write)
 └── Data (isolated by workspace_id)
```

### Plan Tiers

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| History Depth | 7d | 90d | Unlimited |
| AI Coach | Limited | Full | Custom |
| Automations | 3 | 25 | Unlimited |
| BI Dashboards | 1 | 5 | Unlimited |

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
3. **Dashboards read from Stats tables only**: daily_stats, weekly_stats, monthly_stats, scores_daily, scores_weekly, scores_monthly
4. **AI follows**: PROPOSE → APPROVE → EXECUTE → AUDIT → UNDO
5. **Data isolation**: Every table has `user_id` (and optionally `workspace_id`), all queries filter by user
6. **No destructive migrations**: add nullable → backfill → deprecate → delete
7. **Every mutation emits event**: system_events table captures all state changes

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- User data isolated by `user_id` and `workspace_id`
- Role-based access control via `user_roles` table (separate from profiles)
- Security definer functions for role checks (`has_role`, `is_workspace_member`)
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
├── hooks/              # React Query hooks (useTasks, useHabits, useScores, useAutomation, etc.)
├── lib/
│   └── api/            # API layer (tasks, habits, inbox, scores, automation, etc.)
├── pages/              # Route pages (17+ modules)
├── stores/             # Zustand stores
└── types/              # TypeScript types

supabase/
├── functions/          # Edge Functions
│   ├── api-tasks/
│   ├── api-habits/
│   ├── api-inbox/
│   ├── compute-scores/
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
- Nightly stats job should run at midnight
- Score recalculation happens on-demand or via nightly job
- Health score uses focus sessions as proxy (120 min target)

## 🔄 Scheduled Jobs

Configure these Edge Functions to run on schedule:

| Job | Schedule | Endpoint |
|-----|----------|----------|
| nightly-stats | Daily at 00:00 | `POST /nightly-stats` |
| weekly-review | Monday at 06:00 | `POST /weekly-review` |
| compute-scores | Daily at 00:05 | `POST /compute-scores` |

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

### Analytics
- `daily_stats`, `weekly_stats`, `monthly_stats`
- `ai_metrics`, `usage_ledger`
- `metric_registry`

## 📝 License

Private - All rights reserved
