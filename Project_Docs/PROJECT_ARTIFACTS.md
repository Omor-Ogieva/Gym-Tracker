# Summit — Project Artifacts

**Course:** CSE 217
**Date:** March 2026
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

### Epic 2 — Routine Management

| ID | User Story | Priority |
|----|-----------|----------|
| US-07 | As a user, I want to create a named workout routine so that I can reuse the same workout plan multiple times. | High |
| US-08 | As a user, I want to add exercises from a library of 500+ movements to my routine so that I don't have to type exercise names manually. | High |
| US-09 | As a user, I want to define target sets, reps, and weight for each exercise in a routine so that I have a plan to follow during training. | High |
| US-10 | As a user, I want to mark specific sets as warmup sets so that they are tracked separately from working sets. | Medium |
| US-11 | As a user, I want to delete a routine I no longer use so that my routine list stays clean. | Medium |
| US-12 | As a user, I want to create my own custom exercises so that I can track movements not in the built-in library. | Medium |

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

### Epic 5 — Settings & Personalization

| ID | User Story | Priority |
|----|-----------|----------|
| US-28 | As a user, I want to switch between light and dark themes so that the app is comfortable to use in any lighting condition. | Medium |
| US-29 | As a user, I want to choose between pounds (lbs) and kilograms (kg) so that weights are displayed in my preferred unit. | Medium |

---

### Feature Descriptions

#### Feature: Offline-First Architecture
The app detects Supabase connectivity on startup. If unavailable, all data operations route to an in-memory local store. An "offline" badge is displayed in the UI. When the user is online, all reads and writes go to Supabase PostgreSQL.

#### Feature: Routine Template → Live Session Cloning
When a user starts a workout from a routine, the app deep-copies all exercises and sets from the routine template into a new `WorkoutSession` record. Changes made during the live workout do not affect the template.

#### Feature: Personal Record (PR) Detection
After a workout is saved, the app compares the max weight and max volume (weight × reps) per exercise against stored personal records. If a new record is achieved, the user is shown a congratulatory alert modal listing the beaten records.

#### Feature: Exercise Progression Chart
Each exercise has a detail screen showing a line chart (via `react-native-gifted-charts`) of max weight per session plotted over time, with session dates as x-axis labels. Unit conversion (lbs/kg) is applied to chart values.

#### Feature: Rest Timer
A configurable auto-starting countdown banner appears after each set is marked complete. Duration is user-configurable (60 s – 5 min with custom option). The banner is dismissible and plays haptic feedback on completion.

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

### Sprint 2 — Routine Builder (DONE)
| ID | Item | Status |
|----|------|--------|
| BL-06 | Create routine list screen with create/delete | DONE |
| BL-07 | Build exercise picker with search across 500+ exercises | DONE |
| BL-08 | Add/remove exercises and sets to a routine | DONE |
| BL-09 | Target weight, reps, warmup flag per set | DONE |
| BL-10 | Custom exercise creation (name, muscle, equipment) | DONE |

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

### Sprint 4 — Progress Tracking (DONE)
| ID | Item | Status |
|----|------|--------|
| BL-18 | Workout history list with session details | DONE |
| BL-19 | Profile stats (workouts, sets, volume) | DONE |
| BL-20 | Streak calculation (current & best) | DONE |
| BL-21 | PR detection and alert modal | DONE |
| BL-22 | Exercise progression chart | DONE |
| BL-23 | Weekly activity calendar | DONE |

### Sprint 5 — Polish & Settings (DONE)
| ID | Item | Status |
|----|------|--------|
| BL-24 | Theme system (light / dark / system) | DONE |
| BL-25 | Unit preference (lbs / kg) with conversion | DONE |
| BL-26 | Profile editing (username, password) | DONE |
| BL-27 | Settings screen (timer, theme, units, about, FAQ) | DONE |
| BL-28 | Double-tap guard on submit actions | DONE |

### Backlog — Future Work
| ID | Item | Status | Notes |
|----|------|--------|-------|
| BL-29 | Push notifications for rest timer completion | TODO | Requires `expo-notifications` |
| BL-30 | Social sharing of workouts | TODO | |
| BL-31 | Barcode/plate calculator | TODO | |
| BL-32 | Body weight / measurement tracking | TODO | |
| BL-33 | Unit test suite (Jest + React Native Testing Library) | TODO | No tests currently exist |
| BL-34 | Sync local offline data to Supabase on reconnect | TODO | Current offline data is not persisted to cloud |
| BL-35 | Routine reordering / editing after creation | TODO | Currently must delete and recreate |

---

## 3. System Architecture & Design

### High-Level Overview

```
┌──────────────────────────────────────────────────────┐
│                  Expo (React Native)                 │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │  Screens   │  │  Components  │  │  Utilities  │   │
│  │ (Expo      │  │ExercisePicke │  │ useRestTimer│   │
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
| **Context / Hooks** | React Context + Custom Hooks | Theme, units, rest timer, auth state |
| **DB Facade** | `app/backend/db.tsx` | Routes all DB calls to Supabase or local store |
| **Supabase Client** | `@supabase/supabase-js` | Cloud PostgreSQL, Auth |
| **Local Store** | `app/backend/localDb.tsx` | In-memory JS objects (offline fallback) |
| **Persistent Storage** | AsyncStorage | User preferences, auth token caching |
| **Exercise Library** | `assets/data/exercises.json` | 500+ static exercise records |

### Key Design Decisions

1. **Offline-first via abstraction layer:** All screens call functions from `db.tsx` — they never import Supabase directly. This means switching between online/offline requires changing only one flag in `db.tsx`.

2. **Routine template vs. live session separation:** Routines are immutable templates. Starting a workout copies the template into `WorkoutSessions`/`SessionExercises`/`SessionExerciseSets`. This means editing a routine does not alter past workouts.

3. **File-based routing with Expo Router:** Each file in `/app` becomes a route automatically. Nested folders like `(tabs)/` create tab layouts. Modal screens like `settings.tsx` are pushed onto the stack.

4. **Theme via React Context:** A `ThemeContext` wraps the entire app. All components call `useTheme()` to get color tokens. This enables instant theme switching without re-mounting.

5. **Debounced weight/reps inputs:** Updating Supabase on every keystroke would be wasteful. Inputs debounce 500 ms and also commit on blur, reducing unnecessary writes.

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
        │ n                     │    created_at          │
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
| `/settings` | `app/settings.tsx` | Settings | Modal | — |
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
| `deleteRoutine(routineId)` | DELETE | Remove routine and cascade |
| `getRoutineExercises(routineId)` | GET | Ordered exercises in a routine |
| `insertRoutineExercise(exercise)` | POST | Add exercise to routine |
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
| `updateWorkoutSession(sessionId, updates)` | PATCH | Update session fields |
| `deleteWorkoutSession(sessionId)` | DELETE | Discard a session |

#### Session Exercises & Sets
| Function | Operation | Description |
|----------|-----------|-------------|
| `getSessionExercises(sessionId)` | GET | Exercises in a live session |
| `insertSessionExercise(exercise)` | POST | Add exercise mid-workout |
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

#### Custom Exercises
| Function | Operation | Description |
|----------|-----------|-------------|
| `getCustomExercises(userId)` | GET | User's custom exercises |
| `insertCustomExercise(exercise)` | POST | Create a custom exercise |
| `deleteCustomExercise(exerciseId)` | DELETE | Remove a custom exercise |

---

## 6. Test Plan & Evidence

> **Note:** As of the current sprint, the app does not have an automated test suite (no Jest or React Native Testing Library setup). All testing below is manual.

### Test Strategy

| Test Type | Approach | Status |
|-----------|----------|--------|
| Unit Tests | Not yet implemented | Planned (BL-33) |
| Integration Tests | Manual, via app | Ongoing |
| End-to-End Tests | Manual, via device/emulator | Ongoing |
| Static Analysis | TypeScript (`tsc`) + ESLint | Active |

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

---

### Static Analysis Evidence

TypeScript strict mode is enabled (`"strict": true` in `tsconfig.json`). All files compile without type errors as verified by:

```bash
npx tsc --noEmit
```

ESLint is configured via `eslint.config.js` using `eslint-config-expo`. Linting runs without errors on all source files:

```bash
npx expo lint
```

---

### Known Limitations / Open Defects

| ID | Description | Severity | Status |
|----|-------------|----------|--------|
| DEF-01 | Offline data is lost when the app is fully closed (in-memory only) | Medium | Open |
| DEF-02 | Routine exercises cannot be reordered after creation | Low | Open |
| DEF-03 | No automated test coverage | High | Planned (BL-33) |
| DEF-04 | Password change and account deletion require internet connection | Low | By design |

---

