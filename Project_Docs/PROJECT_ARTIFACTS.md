# Summit — Project Artifacts

**Course:** CSE 217
**Date:** April 2026
**Platform:** React Native (Expo) + Supabase

---

## Table of Contents

1. [User Stories & Feature Descriptions](#1-user-stories--feature-descriptions)
2. [Backlog](#2-backlog)
3. [System Architecture & Design](#3-system-architecture--design)
4. [Entity Relationship Diagram (ERD)](#4-entity-relationship-diagram-erd)
5. [Route Table](#5-route-table)
6. [Test Plan & Evidence](#6-test-plan--evidence)

---

## 1. User Stories & Feature Descriptions

### Epic 1 — Authentication & Account Management

| ID | User Story | Priority |
|----|-----------|----------|
| US-01 | As a new user, I want to create an account with my email and a password so that my workout data is saved and private. | High |
| US-02 | As a returning user, I want to sign in with my email and password so that I can access my workout history across devices. | High |
| US-03 | As a user, I want to be able to change my username so that my profile reflects my preferred name. | Medium |
| US-04 | As a user, I want to change my password while online so that I can keep my account secure. | Medium |
| US-05 | As a user, I want to sign out of the app so that my account is not accessible to others using my device. | High |
| US-06 | As a user, I want to use the app offline so that I can track workouts even without internet access. | High |
| US-38 | As a user who has forgotten my password, I want to request a password reset email so that I can regain access to my account without contacting support. | High |

### Epic 2 — Routine Management

| ID | User Story | Priority |
|----|-----------|----------|
| US-07 | As a user, I want to create a named workout routine so that I can reuse the same workout plan multiple times. | High |
| US-08 | As a user, I want to add exercises from a library of 500+ movements to my routine so that I don't have to type exercise names manually. | High |
| US-09 | As a user, I want to define target sets, reps, and weight for each exercise in a routine so that I have a plan to follow during training. | High |
| US-10 | As a user, I want to mark specific sets as warmup sets so that they are tracked separately from working sets. | Medium |
| US-11 | As a user, I want to delete a routine I no longer use so that my routine list stays clean. | Medium |
| US-12 | As a user, I want to create my own custom exercises so that I can track movements not in the built-in library. | Medium |
| US-33 | As a user, I want to edit the name and description of an existing routine so that I can correct mistakes without deleting and recreating it. | Medium |
| US-34 | As a user, I want to reorder my routines so that the ones I use most often appear at the top of my list. | Low |
| US-35 | As a user, I want to replace an exercise in a routine or active workout with a different one so that I can swap movements without losing the rest of the plan. | Medium |

### Epic 3 — Workout Logging

| ID | User Story | Priority |
|----|-----------|----------|
| US-13 | As a user, I want to start a workout from a saved routine so that the exercises and sets are pre-loaded for me. | High |
| US-14 | As a user, I want to log the actual weight and reps for each set during a workout so that I have a record of what I lifted. | High |
| US-15 | As a user, I want to see the weight and reps from my previous session for each exercise as a reference so that I know what to try to beat. | High |
| US-16 | As a user, I want to mark sets as complete so that I can track my progress through the workout in real time. | High |
| US-17 | As a user, I want to add exercises mid-workout so that I can adjust my training on the fly. | Medium |
| US-18 | As a user, I want to see a running timer showing how long my workout has been active so that I can manage my gym time. | Medium |
| US-19 | As a user, I want to add notes to a workout session so that I can record how I felt or any relevant context. | Low |
| US-20 | As a user, I want to discard a workout without saving so that accidental starts do not pollute my history. | Medium |
| US-21 | As a user, I want a configurable rest timer that starts automatically after I complete a set so that I don't have to manually watch the clock between sets. | Medium |

### Epic 4 — Progress & History

| ID | User Story | Priority |
|----|-----------|----------|
| US-22 | As a user, I want to view my full workout history so that I can review past training sessions. | High |
| US-23 | As a user, I want to see my total workouts, total sets, and total volume lifted so that I understand my overall training load. | Medium |
| US-24 | As a user, I want to see my current and longest workout streaks so that I am motivated to train consistently. | Medium |
| US-25 | As a user, I want to be notified when I set a new personal record (weight or volume) so that I can celebrate my progress. | High |
| US-26 | As a user, I want to view a progression chart for a specific exercise so that I can see my strength improvement over time. | High |
| US-27 | As a user, I want to see a weekly activity calendar showing which days I trained so that I can spot gaps in my routine. | Low |
| US-28 | As a user, I want to edit the name and notes of a saved workout so that I can correct mistakes or add context after the fact. | Medium |
| US-29 | As a user, I want to delete a saved workout from my history so that accidental or invalid sessions do not affect my stats. | Medium |
| US-30 | As a user, I want to share a summary of a completed workout so that I can show my progress to others. | Low |

### Epic 5 — Settings & Personalization

| ID | User Story | Priority |
|----|-----------|----------|
| US-31 | As a user, I want to switch between light and dark themes so that the app is comfortable to use in any lighting condition. | Medium |
| US-32 | As a user, I want to choose between pounds (lbs) and kilograms (kg) so that weights are displayed in my preferred unit. | Medium |

### Epic 6 — Progress Photos

| ID | User Story | Priority |
|----|-----------|----------|
| US-36 | As a user, I want to optionally take or pick a progress photo when I finish a workout so that I can visually track my physique changes over time. | Medium |
| US-37 | As a user, I want to see my progress photo displayed on my workout history card so that I can associate visual progress with specific training sessions. | Medium |

---

### Feature Descriptions

#### Feature: Forgot Password (Password Reset)

The sign-in screen exposes a "Forgot password?" link below the password field. Tapping it switches `auth.tsx` to a `forgot-password` mode (implemented as a `type AuthMode` string union state machine — `signin | signup | forgot-password`). In this mode only the email field is shown. Submitting calls `db.resetPassword(email)`, which delegates to `supabase.auth.resetPasswordForEmail()`. Supabase sends a password reset link to the provided address using its built-in transactional email service — no custom SMTP setup is required. On success, the user sees an inline confirmation: "Password reset email sent! Check your inbox." A "Back to Sign In" link returns to the normal login flow. The feature requires an internet connection; an offline-friendly error message is shown if the device has no network.

#### Feature: Offline-First Architecture
The app detects Supabase connectivity on startup. If unavailable, all data operations route to an in-memory local store. An "offline" badge is displayed in the UI. When the user is online, all reads and writes go to Supabase PostgreSQL.

#### Feature: Routine Template → Live Session Cloning
When a user starts a workout from a routine, the app deep-copies all exercises and sets from the routine template into a new `WorkoutSession` record. Changes made during the live workout do not affect the template.

#### Feature: Personal Record (PR) Detection
After a workout is saved, the app compares the max weight and max volume (weight × reps) per exercise against stored personal records. If a new record is achieved, the user is shown a congratulatory alert modal listing the beaten records.

#### Feature: Exercise Progression Chart
Each exercise has a detail screen showing a line chart (via `react-native-gifted-charts`) of max weight per session plotted over time, with session dates as x-axis labels. Unit conversion (lbs/kg) is applied to chart values.

#### Feature: Rest Timer
A configurable auto-starting countdown banner appears after each set is marked complete. Duration is user-configurable (60 s – 5 min with custom option). The banner is dismissible and plays haptic feedback on completion. When the app is backgrounded, a local push notification (via `expo-notifications`) fires when the countdown reaches zero, so users are alerted even if they lock their screen mid-rest.

#### Feature: Workout History Management
Each completed workout card in the Profile tab exposes a contextual action sheet (3-dot menu) with three options: **Share** (exports a formatted text summary via the native Share API), **Edit** (navigates to a dedicated full-screen past-workout editor at `workout-edit/[sessionId]` where users can rename the session, update notes, and edit any exercise's sets — weight, reps, warmup flag — add or remove sets, add new exercises, or replace existing ones; all changes auto-save on blur; name/notes save on "Done"), and **Delete** (confirms via an alert, then calls `deleteWorkoutSession` and removes the card from local state without a re-fetch).

#### Feature: Exercise Options Menu (3-dot) in Active Workout & Routine Editor

Each exercise card in both the active workout screen and the routine editor exposes an ellipsis (`···`) icon. Tapping it opens a bottom sheet with two options: **Replace Exercise** (opens the exercise picker in replace mode — the record is updated in-place via `updateSessionExercise` / `updateRoutineExercise`, preserving all existing sets) and **Remove Exercise** (deletes the exercise and its sets with an optimistic state update).

#### Feature: Routine Options Menu (3-dot) on Routine List

Each routine card on the Workouts tab exposes an ellipsis (`···`) icon that opens a bottom sheet with four actions: **Edit Routine** (opens a centered modal pre-filled with name and description, saved via `updateRoutine`), **Move Up** / **Move Down** (swaps the routine's position in the list and batch-persists `routine_order` to the DB; boundaries are visually dimmed), and **Delete Routine** (delegates to the existing `ConfirmModal` + `deleteRoutine` flow).

#### Feature: Progress Photo on Workout Finish

When the user taps "Finish Workout," a bottom-sheet modal (`ProgressPhotoModal`) slides up before the screen navigates away. The modal offers three options: **Take Photo** (device camera, `aspect: [3, 4]`), **Choose from Library** (photo picker), and **Skip**. While the upload is in progress, the modal shows an `ActivityIndicator` and cannot be dismissed. The photo is uploaded to the Supabase Storage bucket `progress-photos` under the path `{userId}/{sessionId}.{ext}` (mirroring the existing avatar upload pattern). The resulting public URL is written back to the `photo_url` column on the `workout_sessions` row. If the user is offline, the local file URI is stored directly so the photo still renders in history without internet. The photo is displayed as a full-width (220 px tall, `borderRadius: 10`, `resizeMode="cover"`) image at the bottom of each `WorkoutHistoryCard` in the Profile tab.

**Supabase setup required:**

- SQL: `ALTER TABLE workout_sessions ADD COLUMN photo_url TEXT;`
- Storage: bucket `progress-photos`, public ON
- RLS: INSERT + UPDATE policies scoped to `(storage.foldername(name))[1] = auth.uid()::text`; public SELECT policy

#### Feature: Active Workout Finish Fix

When "Finish" is tapped, the local session state is immediately updated with `end_time` before `router.back()` is called. This prevents the `beforeRemove` navigation guard (which intercepts back-swipes on in-progress workouts) from firing incorrectly and re-populating the minimized workout bar after the session has ended.

#### Feature: Profile Performance Optimization

Profile load time is reduced by collapsing a previously O(N×M) query waterfall into two batch queries (`getBatchSessionExercises`, `getBatchSessionExerciseSets`) using Supabase `.in()` filtering. Results are stored in in-memory lookup maps for O(1) access during stat aggregation. A stale-while-revalidate cache suppresses re-fetches for data fresher than 30 seconds and eliminates the loading spinner on tab re-focus.

#### Feature: Offline Session Sync on Reconnect

When a workout is completed while offline, the full session tree (session row + exercises + sets) is serialised into an AsyncStorage queue (`offlineQueue.ts`). A `networkStatus` singleton (`networkStatus.ts`) tracks real-time connectivity via `@react-native-community/netinfo`. The `useSyncManager` hook (mounted in `_layout.tsx`) triggers a sync run on app startup (if pending items exist) and on every offline → online network transition. During sync, each queued session is inserted into Supabase with local-to-remote ID remapping for exercise IDs, then removed from the queue on success. A banner in the root layout displays sync progress and a success count on completion.

---

## 2. Backlog

Items are ordered by priority (High → Low). Items marked `[DONE]` are implemented; `[TODO]` are planned but not yet built.

### Sprint 1 — Core Auth & Data Layer (DONE)
| ID | Item | Status |
|----|------|--------|
| BL-01 | Set up Expo project with TypeScript and Expo Router | DONE |
| BL-02 | Configure Supabase client and PostgreSQL schema | DONE |
| BL-03 | Implement sign up / sign in / sign out flows | DONE |
| BL-04 | Build DB abstraction layer with offline fallback | DONE |
| BL-05 | Implement AsyncStorage persistence for auth session | DONE |
| BL-55 | Forgot password flow — email input + `resetPasswordForEmail` via Supabase | DONE |

### Sprint 2 — Routine Builder (DONE)
| ID | Item | Status |
|----|------|--------|
| BL-06 | Create routine list screen with create/delete | DONE |
| BL-07 | Build exercise picker with search across 500+ exercises | DONE |
| BL-08 | Add/remove exercises and sets to a routine | DONE |
| BL-09 | Target weight, reps, warmup flag per set | DONE |
| BL-10 | Custom exercise creation (name, muscle, equipment) | DONE |
| BL-41 | Routine 3-dot menu: edit name/description inline | DONE |
| BL-42 | Routine 3-dot menu: move up / move down reordering | DONE |
| BL-43 | Routine 3-dot menu: delete routine with confirmation | DONE |
| BL-44 | Exercise 3-dot menu in routine editor: replace exercise in-place | DONE |
| BL-45 | Exercise 3-dot menu in routine editor: remove exercise | DONE |

### Sprint 3 — Live Workout Logging (DONE)
| ID | Item | Status |
|----|------|--------|
| BL-11 | Start workout from routine (template clone) | DONE |
| BL-12 | Log weight/reps per set with debounced input | DONE |
| BL-13 | Mark sets complete; show previous session hints | DONE |
| BL-14 | Add exercises mid-workout | DONE |
| BL-15 | Workout timer (elapsed duration) | DONE |
| BL-16 | Finish workout / discard workout flows | DONE |
| BL-17 | Rest timer banner (configurable, auto-start) | DONE |
| BL-46 | Exercise 3-dot menu in active workout: replace exercise in-place | DONE |
| BL-47 | Exercise 3-dot menu in active workout: remove exercise | DONE |
| BL-48 | Fix: finishing workout incorrectly re-showed minimized workout bar | DONE |

### Sprint 4 — Progress Tracking (DONE)
| ID | Item | Status |
|----|------|--------|
| BL-18 | Workout history list with session details | DONE |
| BL-19 | Profile stats (workouts, sets, volume) | DONE |
| BL-20 | Streak calculation (current & best) | DONE |
| BL-21 | PR detection and alert modal | DONE |
| BL-22 | Exercise progression chart | DONE |
| BL-23 | Weekly activity calendar | DONE |

### Sprint 5 — Polish, Settings & Quality (DONE)

| ID | Item | Status |
|----|------|--------|
| BL-24 | Theme system (light / dark / system) | DONE |
| BL-25 | Unit preference (lbs / kg) with conversion | DONE |
| BL-26 | Profile editing (username, password) | DONE |
| BL-27 | Settings screen (timer, theme, units, about, FAQ) | DONE |
| BL-28 | Double-tap guard on submit actions | DONE |
| BL-29 | Unit test suite — 4 suites, 48 tests, 100% coverage on utility layer | DONE |
| BL-30 | Workout history edit / delete with confirmation and optimistic UI | DONE |
| BL-31 | Workout history share via native Share API | DONE |
| BL-32 | Profile batch queries and stale-while-revalidate caching | DONE |
| BL-33 | Tab transition and screen animation flicker fixes | DONE |
| BL-34 | Push notifications for rest timer (background alert when countdown ends) | DONE |
| BL-49 | Past workout editing — full-screen editor for reps, sets, exercises, name, notes | DONE |

### Sprint 6 — Progress Photos (DONE)

| ID | Item | Status |
|----|------|--------|
| BL-50 | `ProgressPhotoModal` component — camera / library / skip bottom sheet | DONE |
| BL-51 | `uploadProgressPhoto` in `db.tsx` — FormData upload to `progress-photos` Supabase Storage bucket | DONE |
| BL-52 | `updateSessionPhotoUrl` in `db.tsx` + `localDb.tsx` — persist URL to `workout_sessions.photo_url` | DONE |
| BL-53 | Wire photo modal into `finishWorkout()` flow in `workout.tsx` | DONE |
| BL-54 | Display progress photo in `WorkoutHistoryCard` on Profile tab | DONE |

### Sprint 7 — Code Review Hardening (DONE)

Improvements identified in the June 2026 code review, implemented 2026-06-19. Ordered by priority (High → Low). After this sprint the CI gate (`npm run ci`) is green: **0 lint errors, 0 type errors, 128 tests passing**.

| ID | Item | Status | Notes |
|----|------|--------|-------|
| BL-56 | Read-through cache for Supabase reads so routines, history, PRs and custom exercises are available on a cold start while offline | DONE | **High.** New `app/backend/readCache.ts`: successful online reads are mirrored to AsyncStorage and replayed offline; 13 read methods wrapped; cache cleared on sign-out. Closes the *read* half of DEF-06. Syncing offline-*created* routines/custom exercises split out to BL-65 |
| BL-57 | Shared `app/backend/types.ts`; typed the `db.tsx` / `localDb.tsx` / `offlineQueue.ts` data layer; removed offline-path `as any`; extended `PendingSession` with cardio fields | DONE | **Medium.** Closes DEF-07. Typecheck went 323→0 errors (also added `@types/jest`, excluded `app-example`) |
| BL-58 | `typecheck` + `ci` npm scripts and `.github/workflows/ci.yml` running lint + typecheck + test on push/PR | DONE | **Medium.** Surfaced that lint + typecheck were already failing; fixed the pre-existing blockers (renamed `useSupabase`→`shouldUseSupabase`, escaped JSX quotes) |
| BL-59 | Unit tests for `cardioUtils.ts` and the extracted `syncMapping.ts` (offline ID remap) | DONE | **Medium.** Closes DEF-10. Suite grew 76→128 tests / 6→9 suites |
| BL-60 | Rest-timer background notification reschedules on "+30 s" and cancels on skip | DONE | **Low.** Closes DEF-08 (`handleAddRestTime` in `workout.tsx`) |
| BL-61 | Untracked `coverage/` and `app-example/`; added `coverage/` to `.gitignore` (and to tsconfig / eslint ignores) | DONE | **Low.** Closes DEF-09 |
| BL-62 | Silent `catch (_) {}` replaced with `__DEV__`-gated `logError` (`app/utils/log.ts`) | DONE | **Low.** Applied in `workout.tsx` (sync, PR detection, photo) and `profile.tsx` (cache parse) |
| BL-63 | Batched child deletes in `deleteWorkoutSession` and exercise inserts in `syncPendingSessions` (`.in()` / bulk insert) | DONE | **Low.** |
| BL-64 | Remove redundant manual memoization now that the React Compiler is enabled | DEFERRED | **Low.** The compiler can bail out per-component; stripping `memo` / `useCallback` from hot paths (e.g. `SetRow`) risks perf regressions. Low value, high blast radius — intentionally not done |
| BL-65 | Extend the offline sync queue to cover routines / custom exercises created offline, and make offline start-from-routine work from cached data | TODO | **Medium.** Remaining half of DEF-06; the BL-56 read-through cache covers reads only |

### Backlog — Future Work

| ID | Item | Status | Notes |
|----|------|--------|-------|
| BL-34 | Push notifications for rest timer completion | DONE | `expo-notifications`; fires a local notification when countdown reaches 0 |
| BL-35 | Sync local offline data to Supabase on reconnect | DONE | `offlineQueue.ts`, `networkStatus.ts`, `useSyncManager` hook; closes DEF-01 |
| BL-36 | Routine reordering / editing after creation | DONE | 3-dot menu on each routine card — edit, move up/down, delete (BL-41–43); closes DEF-02 |
| BL-37 | Barcode / plate calculator | TODO | |
| BL-38 | Body weight / measurement tracking | TODO | |
| BL-39 | Input validation and error messages on all forms | TODO | Auth, profile edit, session edit — currently minimal (DEF-05) |
| BL-40 | Component-level and integration test coverage | TODO | Utility + hook layer now covered; component/screen tests remain |

---

## 3. System Architecture & Design

### High-Level Overview

```
┌──────────────────────────────────────────────────────┐
│                  Expo (React Native)                 │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │  Screens   │  │  Components  │  │  Utilities  │   │
│  │ (Expo      │  │ExercisePicker│  │ useRestTimer│   │
│  │  Router)   │  │ HistoryCard  │  │ prDetection │   │
│  └─────┬──────┘  └──────┬───────┘  └──────┬──────┘   │
│        │                │                 │          │
│        └────────────────┼─────────────────┘          │
│                         │                            │
│              ┌──────────▼──────────┐                 │
│              │   DB Abstraction    │  app/backend/db │
│              │  (db.tsx facade)    │                 │
│              └──────────┬──────────┘                 │
│                         │                            │
│            ┌────────────┴─────────────┐              │
│            │                          │              │
│   ┌────────▼────────┐      ┌──────────▼───────────┐  │
│   │   Supabase      │      │    localDb.tsx       │  │
│   │ (PostgreSQL)    │      │ (In-memory fallback) │  │
│   │  Online mode    │      │    Offline mode      │  │
│   └─────────────────┘      └──────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Layer Descriptions

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Screens** | Expo Router (`/app/*.tsx`) | Page-level components, navigation |
| **Components** | React Native | Reusable UI elements |
| **Context / Hooks** | React Context + Custom Hooks | Theme, units, rest timer, auth state, sync manager |
| **DB Facade** | `app/backend/db.tsx` | Routes all DB calls to Supabase or local store |
| **Supabase Client** | `@supabase/supabase-js` | Cloud PostgreSQL, Auth |
| **Local Store** | `app/backend/localDb.tsx` | In-memory JS objects (offline fallback) |
| **Offline Queue** | `app/backend/offlineQueue.ts` | AsyncStorage-persisted queue of completed offline sessions |
| **Network Status** | `app/backend/networkStatus.ts` | Runtime connectivity singleton via `@react-native-community/netinfo` |
| **Persistent Storage** | AsyncStorage | User preferences, auth token, offline session queue |
| **Exercise Library** | `assets/data/exercises.json` | 500+ static exercise records |

### Key Design Decisions

1. **Offline-first via abstraction layer:** All screens call functions from `db.tsx` — they never import Supabase directly. This means switching between online/offline requires changing only one flag in `db.tsx`.

2. **Routine template vs. live session separation:** Routines are immutable templates. Starting a workout copies the template into `WorkoutSessions`/`SessionExercises`/`SessionExerciseSets`. This means editing a routine does not alter past workouts.

3. **File-based routing with Expo Router:** Each file in `/app` becomes a route automatically. Nested folders like `(tabs)/` create tab layouts. Modal screens like `settings.tsx` are pushed onto the stack.

4. **Theme via React Context:** A `ThemeContext` wraps the entire app. All components call `useTheme()` to get color tokens. This enables instant theme switching without re-mounting.

5. **Debounced weight/reps inputs:** Updating Supabase on every keystroke would be wasteful. Inputs debounce 500 ms and also commit on blur, reducing unnecessary writes.

6. **Batch queries for profile load:** The profile screen previously issued one DB request per session and one per exercise (N+M requests). This was refactored to two batch queries using Supabase `.in()` filtering, with in-memory lookup maps for O(1) stat aggregation. A 30-second stale-while-revalidate cache prevents redundant fetches on tab re-focus.

---

## 4. Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│      Users      │
├─────────────────┤
│ PK user_id      │
│    username     │
│    email        │
│    created_at   │
└────────┬────────┘
         │ 1
         │ has many
    ┌────┴──────────────────────────────────┐
    │                                       │
    │ n                                     │ n
┌───▼────────────┐              ┌───────────▼────────────┐
│    Routines    │              │    WorkoutSessions     │
├────────────────┤              ├────────────────────────┤
│ PK routine_id  │              │ PK session_id          │
│ FK user_id     │◄─────────────│ FK user_id             │
│    routine_name│  optional FK │ FK routine_id (opt.)   │
│    description │              │    session_name        │
│    created_at  │              │    session_date        │
└───────┬────────┘              │    start_time          │
        │ 1                     │    end_time (opt.)     │
        │ has many              │    notes (opt.)        │
        │ n                     │    photo_url (opt.)    │
                                │    created_at          │
┌───────▼────────────────┐      └───────────┬────────────┘
│   RoutineExercises     │                  │ 1
├────────────────────────┤                  │ has many
│ PK routine_exercise_id │                  │ n
│ FK routine_id          │      ┌───────────▼────────────┐
│    exercise_id         │      │   SessionExercises     │
│    exercise_name       │      ├────────────────────────┤
│    exercise_order      │      │ PK session_exercise_id │
└───────┬────────────────┘      │ FK session_id          │
        │ 1                     │    exercise_id         │
        │ has many              │    exercise_name       │
        │ n                     │    exercise_order      │
┌───────▼────────────────┐      │    notes (opt.)        │
│  RoutineExerciseSets   │      └───────────┬────────────┘
├────────────────────────┤                  │ 1
│ PK routine_set_id      │                  │ has many
│ FK routine_exercise_id │                  │ n
│    set_number          │      ┌───────────▼────────────┐
│    target_weight (opt) │      │  SessionExerciseSets   │
│    target_reps (opt.)  │      ├────────────────────────┤
│    is_warmup           │      │ PK session_set_id      │
└────────────────────────┘      │ FK session_exercise_id │
                                │    set_number          │
                                │    weight (opt.)       │
                                │    reps (opt.)         │
                                │    is_warmup           │
                                │    completed           │
                                └────────────────────────┘

┌────────────────────────┐      ┌────────────────────────┐
│   PersonalRecords      │      │   CustomExercises      │
├────────────────────────┤      ├────────────────────────┤
│ PK pr_id               │      │ PK exercise_id         │
│ FK user_id             │      │ FK user_id             │
│    exercise_id         │      │    name                │
│    max_weight (opt.)   │      │    primary_muscle (opt)│
│    max_volume (opt.)   │      │    equipment (opt.)    │
│    achieved_at         │      │    created_at          │
└────────────────────────┘      └────────────────────────┘
```

### Relationships Summary

| Table A | Relationship | Table B | Notes |
|---------|-------------|---------|-------|
| Users | 1 : N | Routines | User owns their routines |
| Users | 1 : N | WorkoutSessions | User owns their sessions |
| Users | 1 : N | PersonalRecords | One PR per exercise per user (upsert) |
| Users | 1 : N | CustomExercises | User-created exercises |
| Routines | 1 : N | RoutineExercises | Ordered exercises in a template |
| Routines | 0..1 : N | WorkoutSessions | Session may reference source routine |
| RoutineExercises | 1 : N | RoutineExerciseSets | Target sets per exercise in template |
| WorkoutSessions | 1 : N | SessionExercises | Actual exercises done in a session |
| SessionExercises | 1 : N | SessionExerciseSets | Actual sets logged per exercise |

---

## 5. Route Table

### Screen Routes (Expo Router)

| Route | File | Screen Name | Navigation Type | Parameters |
|-------|------|-------------|-----------------|------------|
| `/` | `app/index.tsx` | Entry | Redirect | — |
| `/auth` | `app/auth.tsx` | Sign In / Sign Up | Stack | — |
| `/(tabs)` | `app/(tabs)/_layout.tsx` | Tab Navigator | Tab Layout | — |
| `/(tabs)/index` | `app/(tabs)/index.tsx` | Workouts (Routines) | Tab | — |
| `/(tabs)/profile` | `app/(tabs)/profile.tsx` | Profile & History | Tab | — |
| `/workout` | `app/workout.tsx` | Active Workout | Stack (full-screen) | `sessionId: string` |
| `/settings` | `app/settings.tsx` | Settings | Stack (slide from bottom) | — |
| `/exercise-detail/[exerciseId]` | `app/exercise-detail/[exerciseId].tsx` | Exercise Progression | Stack | `exerciseId: string` |

### Database API Routes (db.tsx facade)

#### Authentication
| Function | Operation | Description |
|----------|-----------|-------------|
| `signUp(email, password, username)` | POST | Register new user |
| `signIn(email, password)` | POST | Authenticate user, return session |
| `signOut()` | POST | Invalidate session |
| `getSession()` | GET | Return current auth session |
| `getUser()` | GET | Return current user record |
| `changePassword(newPassword)` | PATCH | Update password (online only) |
| `resetPassword(email)` | POST | Send Supabase password-reset email; online only |
| `onAuthStateChange(callback)` | SUB | Subscribe to auth state events |

#### User Profiles
| Function | Operation | Description |
|----------|-----------|-------------|
| `getUserProfile(userId)` | GET | Fetch user's profile row |
| `updateUserProfile(userId, updates)` | PATCH | Update username or profile fields |

#### Routines
| Function | Operation | Description |
|----------|-----------|-------------|
| `getRoutines()` | GET | List all routines for current user |
| `insertRoutine(routine)` | POST | Create a new routine |
| `updateRoutine(routineId, updates)` | PATCH | Edit routine name, description, or order |
| `deleteRoutine(routineId)` | DELETE | Remove routine and cascade |
| `getRoutineExercises(routineId)` | GET | Ordered exercises in a routine |
| `insertRoutineExercise(exercise)` | POST | Add exercise to routine |
| `updateRoutineExercise(routineExerciseId, updates)` | PATCH | Replace exercise identity (id + name) in-place |
| `deleteRoutineExercise(routineExerciseId)` | DELETE | Remove exercise from routine |
| `getRoutineExerciseSets(routineExerciseId)` | GET | Template sets for an exercise |
| `insertRoutineExerciseSet(set)` | POST | Add a set to a routine exercise |
| `updateRoutineExerciseSet(routineSetId, updates)` | PATCH | Edit target weight/reps |
| `deleteRoutineExerciseSet(routineSetId)` | DELETE | Remove a set |

#### Workout Sessions
| Function | Operation | Description |
|----------|-----------|-------------|
| `startWorkoutSession(params)` | POST | Create a new blank session |
| `startWorkoutFromRoutine(routineId, userId)` | POST | Clone routine → live session |
| `finishWorkoutSession(sessionId, notes)` | PATCH | Set `end_time`, save notes |
| `getWorkoutSessions(userId)` | GET | All completed sessions for user |
| `getWorkoutSession(sessionId)` | GET | Single session by ID |
| `getActiveSession(userId)` | GET | In-progress session (no `end_time`) |
| `updateWorkoutSession(sessionId, updates)` | PATCH | Update session name or notes |
| `updateSessionPhotoUrl(sessionId, photoUrl)` | PATCH | Persist progress photo URL to `photo_url` column; falls back to local store when offline |
| `deleteWorkoutSession(sessionId)` | DELETE | Discard a session and all child records |
| `getBatchSessionExercises(sessionIds)` | GET | All exercises for a list of sessions in one request |
| `getBatchSessionExerciseSets(exerciseIds)` | GET | All sets for a list of exercises in one request |

#### Storage

| Function                                      | Operation | Description                                                                                                                               |
|-----------------------------------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `uploadAvatar(userId, uri)`                   | PUT       | Upload profile photo to `avatars/{userId}` in Supabase Storage; returns public URL                                                        |
| `uploadProgressPhoto(userId, sessionId, uri)` | PUT       | Upload workout progress photo to `progress-photos/{userId}/{sessionId}.{ext}`; returns public URL with cache-buster; requires internet    |

#### Session Exercises & Sets
| Function | Operation | Description |
|----------|-----------|-------------|
| `getSessionExercises(sessionId)` | GET | Exercises in a live session |
| `insertSessionExercise(exercise)` | POST | Add exercise mid-workout |
| `updateSessionExercise(sessionExerciseId, updates)` | PATCH | Replace exercise identity or update notes in-place |
| `deleteSessionExercise(sessionExerciseId)` | DELETE | Remove exercise from session |
| `getSessionExerciseSets(sessionExerciseId)` | GET | Sets for one exercise |
| `insertSessionExerciseSet(set)` | POST | Add a new set |
| `updateSessionExerciseSet(sessionSetId, updates)` | PATCH | Update weight, reps, completed |
| `deleteSessionExerciseSet(sessionSetId)` | DELETE | Remove a set |

#### Personal Records & Progress
| Function | Operation | Description |
|----------|-----------|-------------|
| `getPersonalRecords(userId)` | GET | All PRs for user |
| `upsertPersonalRecord(record)` | POST/PATCH | Insert or update PR for exercise |
| `getExerciseHistory(exerciseId, userId)` | GET | All session data for one exercise |
| `getPreviousSessionSets(exerciseId, userId, excludeSessionId)` | GET | Last session's sets (hint display) |

#### Offline Sync

| Function                       | Operation | Description                                                                                      |
|--------------------------------|-----------|--------------------------------------------------------------------------------------------------|
| `syncPendingSessions(userId)`  | POST      | Insert all queued offline sessions into Supabase with ID remapping; returns `{ synced, errors }` |
| `getPendingSessionCount()`     | GET       | Returns the number of sessions currently in the offline queue                                    |

#### Custom Exercises
| Function | Operation | Description |
|----------|-----------|-------------|
| `getCustomExercises(userId)` | GET | User's custom exercises |
| `insertCustomExercise(exercise)` | POST | Create a custom exercise |
| `deleteCustomExercise(exerciseId)` | DELETE | Remove a custom exercise |

---

## 6. Test Plan & Evidence

### Test Strategy

| Test Type | Approach | Status |
|-----------|----------|--------|
| Unit Tests | Jest + `@testing-library/react-native` | **Active — 128 tests across 9 suites** |
| Integration Tests | Manual, via app | Ongoing |
| End-to-End Tests | Manual, via device/emulator | Ongoing |
| Static Analysis | TypeScript (`tsc`) + ESLint | Active |

---

### Automated Unit Tests

Tests live in `gym-tracker/__tests__/` and run with `npm test`.

#### Coverage Summary

| File | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| `prDetection.ts` | 100% | 100% | 100% | 100% |
| `pressGuard.ts` | 100% | 100% | 100% | 100% |
| `units.ts` | 100% | 100% | 100% | 100% |
| `useRestTimer.ts` | 100% | 100% | 100% | 100% |
| `offlineQueue.ts` | 100% | 100% | 100% | 100% |
| `useSyncManager.ts` | 100% | 100% | 100% | 100% |
| **All files** | **100%** | **100%** | **100%** | **100%** |

Total: 9 suites, 128 tests, 0 failures.

#### Test File Descriptions

| File | Unit Under Test | Tests | Key Scenarios Covered |
|------|----------------|-------|-----------------------|
| `prDetection.test.ts` | `detectPersonalRecords()` | 14 | First session sets PR, beats existing max weight, beats max volume, no PR when lighter, multiple exercises, empty input |
| `pressGuard.test.ts` | `useGuardedPress()` | 7 | First press fires, double-tap blocked, second press allowed after delay, partial delay still blocked, custom delay, async function support |
| `units.test.ts` | `toDisplay()`, `fromDisplay()`, `convertWeight()` | 13 | lbs identity, kg↔lbs conversion, null passthrough, rounding, zero values |
| `useRestTimer.test.ts` | `useRestTimer()` hook | 14 | Initial state, start/pause/reset, AsyncStorage persistence, countdown tick, completion callback, custom duration |
| `offlineQueue.test.ts` | `offlineQueue.ts` functions | 17 | Empty queue, enqueue/append, exercise+set persistence, count tracking, index removal, key deletion on empty, session origin round-trip, overwrite, clear |
| `useSyncManager.test.ts` | `useSyncManager()` hook | 11 | No-op when userId null, skip when 0 pending, skip when disconnected, skip when unreachable, sync on mount when pending+connected, reconnect trigger (false→true), no-op on true→true, no-op on true→false, zero synced count, event listener cleanup |
| `cardioUtils.test.ts` | `cardioUtils.ts` | 33 | Duration digit helpers, duration parse/format, distance conversions (km/mi), pace & speed, cardio session aggregation (completed-only, best pace/distance) |
| `syncMapping.test.ts` | `syncMapping.ts` | 9 | Local→remote exercise ID mapping by insertion order, partial-insert handling, set remap preserving all strength + cardio fields, dropping sets whose exercise failed to insert |
| `readCache.test.ts` | `readCache.ts` | 10 | write/read round-trip, key namespacing, corrupt-JSON safety, selective clear, `cachedRead` online-caches / offline-serves-cache / offline-fallback / no-cache-on-error |

To run tests with coverage:

```bash
cd gym-tracker
npm test -- --coverage
```

HTML report is generated at `coverage/lcov-report/index.html`.

---

### Manual Test Cases

#### TC-01: User Registration
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open app, tap "Create Account" | Sign-up form appears | Pass |
| 2 | Enter valid email and password (≥ 6 chars) | No validation errors | Pass |
| 3 | Tap "Sign Up" | Account created, redirected to Workouts tab | Pass |
| 4 | Attempt sign-up with already-used email | Error message shown | Pass |

#### TC-02: User Sign In / Sign Out
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Enter registered email/password, tap "Sign In" | Redirected to Workouts tab | Pass |
| 2 | Navigate to Settings → Sign Out | Redirected to Auth screen | Pass |
| 3 | Enter wrong password | Error message shown | Pass |

#### TC-03: Offline Mode
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Disable network, open app | "Offline" badge displayed | Pass |
| 2 | Create a routine while offline | Routine appears in list | Pass |
| 3 | Start and complete a workout while offline | Session saved to local store | Pass |
| 4 | Re-enable network, reopen app | App re-enters online mode | Pass |

#### TC-16: Offline Session Sync on Reconnect

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Disable network, complete a full workout | Session queued in AsyncStorage | Pass |
| 2 | Re-enable network while app is open | "Syncing offline workouts…" banner appears | Pass |
| 3 | Wait for sync to complete | "N workout(s) synced!" banner shown briefly | Pass |
| 4 | Navigate to Profile tab | Synced workout appears in history | Pass |
| 5 | Close and reopen app with pending sessions | Startup sync runs automatically | Pass |

#### TC-04: Create Routine
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Tap "+" on Workouts tab | "New Routine" modal appears | Pass |
| 2 | Enter routine name, tap Create | Routine appears in list | Pass |
| 3 | Tap routine → Add Exercise | Exercise picker opens | Pass |
| 4 | Search "bench press", select it | Exercise added to routine | Pass |
| 5 | Tap "+ Add Set", enter target weight/reps | Set row appears | Pass |
| 6 | Toggle warmup flag on first set | Set marked as warmup | Pass |

#### TC-05: Start Workout from Routine
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Tap "Start Workout" on a routine | Active workout screen loads | Pass |
| 2 | Verify exercises and set counts match template | Correct data shown | Pass |
| 3 | Enter weight/reps in a set | Values saved after 500 ms debounce | Pass |
| 4 | Tap checkbox on a set | Set marked complete, rest timer starts | Pass |
| 5 | Tap "Finish Workout" | Prompt for notes shown, session saved | Pass |
| 6 | Verify routine template unchanged | Original routine data unmodified | Pass |

#### TC-06: Previous Session Hints
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Complete a workout with logged weights | Session saved to DB | Pass |
| 2 | Start same routine again | Previous session's weight/reps shown as placeholder | Pass |

#### TC-07: Personal Record Detection
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Log a weight for an exercise with no prior PR | Finish workout — PR alert shown | Pass |
| 2 | Log a heavier weight in a later session | PR alert shows new record | Pass |
| 3 | Log a lighter weight than PR | No PR alert shown | Pass |

#### TC-08: Exercise Progression Chart
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Complete 2+ workouts with the same exercise | History exists in DB | Pass |
| 2 | Tap exercise name in workout history | Progression chart screen opens | Pass |
| 3 | Verify chart shows one data point per session | Correct number of points displayed | Pass |
| 4 | Change unit to kg in Settings | Chart values convert correctly | Pass |

#### TC-09: Rest Timer
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Enable rest timer in Settings | Timer toggled on | Pass |
| 2 | Mark a set complete | Rest timer banner appears with countdown | Pass |
| 3 | Wait for countdown to reach 0 | Haptic feedback fires, banner updates | Pass |
| 4 | Tap "Dismiss" on banner | Banner disappears | Pass |
| 5 | Background the app mid-countdown | Local push notification fires when countdown reaches 0 | Pass |

#### TC-10: Theme Switching
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open Settings → Appearance → Dark | All screens switch to dark theme | Pass |
| 2 | Switch to Light | All screens switch to light theme | Pass |
| 3 | Switch to System | Theme follows device system setting | Pass |
| 4 | Close and reopen app | Theme preference persists | Pass |

#### TC-11: Unit Preference (lbs / kg)
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Set unit to kg in Settings | Workout screen shows "kg" label | Pass |
| 2 | View progression chart | Weights shown in kg | Pass |
| 3 | Switch back to lbs | Values update immediately | Pass |

#### TC-12: Workout History
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to Profile tab | Completed sessions listed | Pass |
| 2 | Verify session shows correct date, duration, exercises | Metadata matches session data | Pass |
| 3 | Verify stats (total workouts, volume) match history | Counts are accurate | Pass |

#### TC-13: Workout History — Edit
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Tap the 3-dot menu on any workout card | Action sheet slides up with Share / Edit / Delete | Pass |
| 2 | Tap "Edit" | Modal appears pre-filled with current name and notes | Pass |
| 3 | Change the session name, tap "Save" | Card updates in place without a full reload | Pass |
| 4 | Reopen app and navigate to Profile | Edited name persists from DB | Pass |

#### TC-14: Workout History — Delete
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Tap the 3-dot menu → "Delete" | Confirmation alert shown | Pass |
| 2 | Tap "Delete" in alert | Card removed from list; profile stats update | Pass |
| 3 | Tap "Cancel" in alert | Card remains; no change | Pass |

#### TC-15: Workout History — Share
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Tap the 3-dot menu → "Share" | Native share sheet opens | Pass |
| 2 | Verify share text includes name, date, duration, exercises | Formatted summary is correct | Pass |

#### TC-17: Routine 3-dot Menu — Edit

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Tap the `···` icon on a routine card | Bottom sheet slides up with Edit / Move Up / Move Down / Delete | Pass |
| 2 | Tap "Edit Routine" | Centered modal appears pre-filled with current name and description | Pass |
| 3 | Change the name, tap "Save" | Card updates in place; modal closes | Pass |
| 4 | Reopen app | Edited name persists from DB | Pass |

#### TC-18: Routine 3-dot Menu — Reorder

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open 3-dot menu on the first routine in the list | "Move Up" option is visually dimmed | Pass |
| 2 | Tap "Move Down" | Routine swaps with the one below; sheet closes | Pass |
| 3 | Open 3-dot menu on the last routine | "Move Down" option is visually dimmed | Pass |
| 4 | Tap "Move Up" | Routine swaps with the one above | Pass |
| 5 | Reopen app | New order persists from DB | Pass |

#### TC-19: Routine 3-dot Menu — Delete

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Tap "Delete Routine" in the 3-dot sheet | ConfirmModal appears with routine name | Pass |
| 2 | Tap "Delete" | Card removed from list; sheet closes | Pass |
| 3 | Tap "Cancel" | Card remains; no change | Pass |

#### TC-20: Exercise 3-dot Menu — Replace Exercise

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open 3-dot menu on an exercise in the routine editor | Bottom sheet shows "Replace Exercise" and "Remove Exercise" | Pass |
| 2 | Tap "Replace Exercise" | Exercise picker opens | Pass |
| 3 | Select a different exercise | Exercise name updates on the card; existing sets are preserved | Pass |
| 4 | Repeat in the active workout screen | Same behaviour; sets retained | Pass |

#### TC-21: Exercise 3-dot Menu — Remove Exercise

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open 3-dot menu on an exercise in the routine editor | Bottom sheet appears | Pass |
| 2 | Tap "Remove Exercise" | Exercise and all its sets removed from the screen immediately | Pass |
| 3 | Repeat in the active workout screen | Same behaviour; session state updates correctly | Pass |

#### TC-22: Finish Workout — Minimized Bar Dismissed

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Start a workout from a routine | Active workout screen opens; minimized bar registers the session | Pass |
| 2 | Log at least one set, tap "Finish Workout" | Session saved; active workout screen closes | Pass |
| 3 | Verify minimized workout bar is no longer visible | Bar is dismissed; navigates to previous screen cleanly | Pass |

#### TC-24: Forgot Password

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On the Sign In screen, tap "Forgot password?" | Screen switches to "Reset Password" mode; only the email field and "Send Reset Email" button are shown | Pass |
| 2 | Enter a registered email address, tap "Send Reset Email" | Success message "Password reset email sent! Check your inbox." displayed | Pass |
| 3 | Enter an unregistered or malformed email | Supabase error message displayed inline | Pass |
| 4 | Attempt while offline (no network) | "Requires internet connection to reset password." error shown | Pass |
| 5 | Tap "Back to Sign In" | Screen returns to normal sign-in form; error/success messages cleared | Pass |

#### TC-23: Progress Photo — Capture and Display on History Card

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Finish a workout session | Progress photo bottom sheet appears with Camera / Library / Skip options | Pass |
| 2 | Tap "Take Photo", take a photo | Camera opens; after capture, uploading spinner shows briefly; modal dismisses; app navigates back | Pass |
| 3 | Open Profile tab and locate the finished workout history card | The progress photo is displayed below the exercise list on the card | Pass |
| 4 | Finish another workout and tap "Skip" | No photo prompt lingers; app navigates back immediately; history card shows no photo | Pass |

---

### Static Analysis Evidence

TypeScript strict mode is enabled (`"strict": true` in `tsconfig.json`). All files compile without type errors:

```bash
npx tsc --noEmit
```

ESLint is configured via `eslint.config.js` using `eslint-config-expo`:

```bash
npx expo lint
```

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint + typecheck + test on every push and pull request. Run all three locally with:

```bash
npm run ci
```

As of 2026-06-19 the gate is green: 0 lint errors, 0 type errors, 128 passing tests.

---

### Known Limitations / Open Defects

| ID | Description | Severity | Status |
|----|-------------|----------|--------|
| DEF-01 | Offline data is lost when the app is fully closed (in-memory only) | Medium | **Partially closed** — BL-35 persists *finished* sessions via the offline queue; in-progress sessions and all non-session data (routines, history, PRs, custom exercises) remain in-memory only (see DEF-06 / BL-56) |
| DEF-02 | Routine exercises cannot be reordered after creation | Low | **Closed** — BL-36 implemented routine 3-dot menu with move up/down and edit |
| DEF-03 | No automated test coverage | High | **Closed** — 48 unit tests added in Sprint 5 (commit `40f71f8`) |
| DEF-04 | Password change and account deletion require internet connection | Low | By design |
| DEF-05 | Forms have minimal client-side input validation | Medium | Open — tracked as BL-39 |
| DEF-06 | Local store (`localDb.tsx`) is in-memory only — Supabase reads are never cached, so a cold start while offline shows empty routines/history/PRs; routines and custom exercises created offline are silently lost on reconnect because only finished sessions are queued | High | **Partially closed** — read-through cache (BL-56) now serves cached server reads offline on cold start; syncing offline-*created* routines / custom exercises remains (BL-65) |
| DEF-07 | The `db.tsx` facade returns `any` throughout (112 `any` usages app-wide despite `strict` mode); `PendingSession` omits the cardio fields written via `as any`, so the offline queue is untyped for cardio sets | Medium | **Closed** — BL-57 (shared `types.ts`, typed data layer + offline queue) |
| DEF-08 | Rest-timer background notification is not rescheduled when the user adds time ("+15 s"), so it fires at the original countdown end; `setOnComplete` is wired in tests but never called in-app | Low | **Closed** — BL-60 |
| DEF-09 | Generated `coverage/` and the Expo starter `app-example/` are committed to git (the latter despite being listed in `.gitignore`) | Low | **Closed** — BL-61 |
| DEF-10 | `cardioUtils.ts` (212 LOC of pure logic) and the offline `syncPendingSessions` ID remap have no unit tests; the reported "100%" coverage reflects only the 6 instrumented files, not the whole utility surface | Medium | **Closed** — BL-59 (`cardioUtils` + `syncMapping` tests) |

---
