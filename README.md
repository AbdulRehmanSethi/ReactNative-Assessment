# BookRide (RNAssessment)

A ride-hailing mobile app built with React Native (Expo bare workflow) and Firebase. Two roles
share one codebase — **Partner** (rider) requests a trip and negotiates a fare; **Driver** goes
online, quotes, and drives the trip to completion — with live map tracking, real-time Firestore
sync, and a full ride lifecycle from request to completion.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native 0.81.5 + Expo ~54.0 (bare workflow) |
| Language | TypeScript (strict mode) |
| State Management | Redux Toolkit + Redux Persist |
| Backend | Firebase Auth (phone/OTP) + Cloud Firestore |
| Maps | MapLibre React Native |
| Routing | OSRM public routing API (with straight-line/haversine fallback) |
| Geocoding | Photon (address search + reverse geocoding) |
| Map Tiles | OpenFreeMap |
| Navigation | React Navigation (Stack + Bottom Tabs) |
| Bottom Sheets | `@gorhom/bottom-sheet` |
| Animation | React Native Reanimated (smoothed live marker movement) |
| Storage | AsyncStorage (via Redux Persist) |
| Dev Client | Expo Dev Client |
| Builds | EAS Build |
| Linting | ESLint + Prettier |

All map/routing/geocoding services are free and keyless — no API keys to provision for local
development.

---

## Features

### Authentication

- Branded gradient **Splash** screen (shown on launch and while Redux Persist rehydrates).
- **Welcome** screen: phone + OTP login (real Firebase phone auth), plus Register/Login actions
  for both roles, presented as two clear cards.
- **Simple Register**: a single, role-aware form. Only **Full Name** is required — CNIC, phone,
  email, profile photo, and (for drivers) license/vehicle details are all optional and can be
  filled in now or skipped for a fast demo signup.
- **Simple Login**: log in by full name + role (looked up in Firestore) — no password, intended
  for demoing without repeating OTP verification every time.
- OTP verification for a brand-new phone number routes into the same simple registration form
  (no separate/duplicate registration UI).

### Partner (Rider)

- Live map with current location, pickup/dropoff pins (search or drag-to-pin).
- Request a ride, receive fare quotes from nearby online drivers, accept one.
- Live tracking of the assigned driver during `En Route → Arrived → Started → Completed`, with
  route polyline, ETA, and remaining distance.
- Cancel while the driver hasn't started the trip yet.

### Driver

- Go online/offline; publishes live location to Firestore while online.
- See nearby ride requests in real time, with a **tab badge** showing the incoming request count
  even while on another tab.
- Submit a fare quote per request; advance an accepted ride through its full status lifecycle.
- Own-GPS-driven map (zero round-trip latency) while the partner sees a smoothed, animated
  version of the same position.

### Ride Lifecycle

A single state machine (`RideStatus` + `RIDE_TRANSITIONS`) is enforced on every Firestore write:

```text
Requested → Driver Quoted Fare → Fare Accepted → Driver En Route
          → Driver Arrived → Ride Started → Ride Completed
                    (cancellable up to Driver Arrived)
```

---

## Project Structure

```text
.
├── android/, ios/            # Native projects (bare workflow — committed, see note below)
├── assets/                   # App icons, splash, adaptive icon
├── src/
│   ├── components/           # Reusable UI (Button, FormField, Card, ImagePicker, …)
│   │   ├── map/               # ThemedMapView, markers, RoutePolyline, TripBottomSheet, …
│   │   └── ride/               # QuoteCard, RequestCard, StatusChip, SearchingIndicator
│   ├── config/                # Map style config
│   ├── features/ride/         # Ride domain types + status state machine
│   ├── hooks/                 # useLocationTracking, useActiveRideListener,
│   │                           # useDriverRouteTracking, useSmoothedPosition, …
│   ├── navigation/             # AuthStack, PartnerNavigator/Tabs, DriverNavigator/Tabs
│   ├── redux/
│   │   ├── store.ts            # Store + Redux Persist config (partial `ride` persistence)
│   │   ├── auth/                # authSlice — session, OTP, simple register/login
│   │   ├── driver/              # driverSlice — online/offline, live location
│   │   └── ride/                # rideSlice — requests, quotes, active ride
│   ├── screens/
│   │   ├── Splash.tsx, Welcome.tsx, Otp.tsx, Register.tsx, RoleLogin.tsx
│   │   ├── PartnerHome.tsx, DriverHome.tsx, Profile.tsx
│   │   └── ride/                # Offers, RequestDetail, DriverRequests, ActiveRide
│   ├── services/                # Thin wrappers around Firebase/Firestore + OSRM/Photon calls
│   ├── theme/                   # Design tokens, light/dark ColorTokens, ThemeProvider
│   └── utils/                   # date + geo (haversine) helpers
├── App.tsx                    # Entry point (Redux Provider, PersistGate, ThemeProvider)
├── app.json                   # Expo config (plugins, permissions, bundle ids)
├── eas.json                   # EAS build profiles
└── package.json
```

Path alias `~/` maps to `src/` (configured in `tsconfig.json`).

---

## Architecture Notes

- **Services layer**: every Firebase/Firestore/HTTP call lives in `src/services/*`, wrapped in
  `try/catch` → `mapFirestoreError`. Redux thunks never talk to Firestore directly.
- **Auth is swappable**: `src/services/authService.ts` picks between `firebaseAuthService` (real
  phone OTP) and `mockAuthService` based on `EXPO_PUBLIC_USE_MOCK_AUTH` — every thunk/screen above
  it is unaffected either way.
- **State machine guard**: every ride status mutation (`rideService.ts`) re-reads the document
  inside a Firestore transaction and checks `canTransition()` before writing — illegal jumps
  (e.g. skipping straight to `Ride Completed`) are rejected server-side-equivalent, not just in UI.
- **Redux Persist**: only `auth` (full) and `ride.activeRideId` (a single field, via a
  `createTransform`) survive an app kill — negotiation state (drafts, quotes, incoming requests)
  is intentionally session-only. Uses `autoMergeLevel2` so a partially-persisted `ride` slice
  merges over fresh `initialState` instead of replacing it.
- **Driver-computed tracking**: the driver's device computes the route/ETA via OSRM and writes it
  onto the ride doc; the partner only ever reads it. This halves OSRM calls and keeps both sides
  in sync on the same route, rather than each side computing its own.
- **Name-based login** (`findUserByNameAndRole`) queries Firestore with two equality filters only
  (`role`, and a denormalized lowercased `fullNameLower`) — deliberately no `orderBy`, so it never
  needs a composite Firestore index. If several profiles share a name, the most recently created
  one is picked client-side — a known limitation of a password-less demo login.

---

## Prerequisites

- Node.js 18+ and Yarn
- Expo CLI (`npm install -g expo-cli`) and EAS CLI (`npm install -g eas-cli`) for cloud builds
- iOS: Xcode 15+, CocoaPods
- Android: Android Studio, JDK 17, an `ANDROID_HOME` SDK install
- A Firebase project with **Phone Authentication** and **Cloud Firestore** enabled

---

## Getting Started

### 1. Install dependencies

```bash
yarn install
```

### 2. Add your Firebase config

This repo intentionally does **not** commit Firebase credentials. Download them from your
Firebase project console and place them at:

- `./GoogleService-Info.plist` (iOS)
- `./google-services.json` (Android)

Both paths are already referenced in `app.json` under `expo.ios.googleServicesFile` /
`expo.android.googleServicesFile`.

### 3. (Optional) Skip real OTP during development

By default the app uses real Firebase phone auth. To use a mock auth service instead (no real SMS,
any code `123456` works), create a `.env` file:

```env
EXPO_PUBLIC_USE_MOCK_AUTH=true
```

### 4. Native projects

`android/` and `ios/` are committed to this repo (bare workflow), so you generally don't need to
run `expo prebuild`. If you add/change a config plugin in `app.json`, regenerate with:

```bash
npx expo prebuild
```

Then reinstall iOS pods:

```bash
cd ios && pod install && cd ..
```

### 5. Run

```bash
yarn start           # start the Metro dev server (dev client)
yarn ios              # build & run on iOS simulator
yarn android           # build & run on Android emulator
```

> These require a dev-client build on the device/simulator (this project uses native modules —
> Firebase, MapLibre — so Expo Go will not work). `yarn ios` / `yarn android` build one locally;
> see [EAS Builds](#eas-builds) to build one for a physical device instead.

---

## Available Scripts

```bash
yarn start          # Start dev server (dev client)
yarn ios             # Run on iOS simulator
yarn android          # Run on Android emulator
yarn prebuild        # Regenerate native folders (expo prebuild)
yarn lint            # Lint + check formatting
yarn format          # Lint fix + format write
yarn build:dev       # EAS development build
yarn build:preview   # EAS preview build (internal distribution)
yarn build:prod      # EAS production build (auto-increment version)
```

---

## EAS Builds

| Profile | Distribution | Use case |
|---|---|---|
| `development` | Internal | Dev client build for local development |
| `preview` | Internal | Stakeholder/QA testing (APK / internal TestFlight) |
| `production` | Store | App Store / Google Play release |

```bash
eas build --profile preview --platform android   # e.g. produce a shareable APK
eas build --profile development --platform ios
```

---

## Known Limitations (Demo Scope)

- **Name-only login** has no password — anyone who knows a registered full name and role can log
  in as that account. Acceptable for an assessment/demo, not for production.
- **OSRM's public demo routing server** has no uptime guarantee; the app falls back to a
  straight-line + haversine estimate automatically if it's unreachable, so tracking never breaks,
  just becomes approximate.
- **Firestore security rules** are currently in test/open mode for development convenience —
  lock these down before any real deployment.
- No push notifications yet for ride/status changes (in-app real-time listeners only).
- No ride-history screen yet — completed/cancelled rides are fully persisted in Firestore
  (status + all stage timestamps + fare), just not surfaced in a dedicated UI.

---

## Code Style

ESLint (flat config, `eslint-config-expo`) and Prettier are configured project-wide.

```bash
yarn lint     # check
yarn format   # auto-fix
```
