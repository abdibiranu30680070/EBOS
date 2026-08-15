# EBOS System

EBOS is a business operations system for sales, inventory, purchasing, customer management, and reporting. The project is split into:

- Backend: NestJS + Prisma + PostgreSQL
- Frontend: React + Vite
- Mobile app: Capacitor Android wrapper around the frontend

## Project Structure

```text
backend/          # NestJS API server
frontend/         # Web + mobile frontend app
.github/workflows # GitHub Actions CI/CD for Android build
```

## Architecture

- The backend exposes REST APIs for authentication, products, customers, branches, purchases, reports, and sync.
- The frontend is a React app that stores local offline data using IndexedDB with Dexie.
- The mobile app uses Capacitor to package the web frontend as an Android app.
- The app stores a lightweight session cache in localStorage for auth persistence, while real business data is synced to the backend.

## Features

- User authentication and authorization
- Business and branch management
- Product and inventory tracking
- POS checkout and sales
- Purchases and stock adjustments
- Customer management and payments
- Reports and dashboard views
- Offline-first local data sync with backend

## Requirements

- Node.js 24+
- npm
- Java 21 for Android builds
- PostgreSQL database
- Android Studio / Android SDK for mobile app builds

## Backend Setup

1. Open the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create your environment file:

```bash
cp .env.example .env
```

4. Configure database and app settings in `.env`.

Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ebos"
JWT_SECRET="your-secret-key"
PORT=3000
```

5. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

6. Start the backend:

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000
```

## Frontend Setup

1. Open the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment configuration:

```bash
cp .env.example .env
```

4. Configure the API base URL in `.env`:

```env
VITE_API_BASE_URL=https://ebos-glzg.onrender.com
```

For local development:

```env
VITE_API_BASE_URL=http://localhost:3000
```

5. Start the app:

```bash
npm run dev
```

## Mobile App Setup

This frontend is wrapped in Capacitor for Android.

### Sync Capacitor and build Android

```bash
cd frontend
npm run build
npx cap sync android
```

### Open Android project

```bash
npx cap open android
```

### Build APK

```bash
cd frontend/android
chmod +x gradlew
./gradlew assembleDebug
```

The generated APK will be in:

```text
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## Android CI

The GitHub workflow in `.github/workflows/android-build.yml` installs:

- Node 24
- Java 21
- Android dependencies
- then runs the web build and Android APK build

This is required because the Capacitor/Android dependencies compile with Java 21 and Android SDK 36.

## Notes on Auth and Data Storage

- `localStorage` is used for short-term session persistence such as the logged-in user and access token.
- The app also stores offline business data locally using IndexedDB (Dexie) for sync support.
- The backend remains the source of truth for authenticated user and business data.
- When online, the app syncs local records to the backend.

## Production / Deployment

- Backend can be deployed to a Node-compatible host or serverless environment with PostgreSQL.
- Frontend can be deployed as a static site or packaged with Capacitor for mobile.
- The mobile app should point to the deployed backend using `VITE_API_BASE_URL`.

## Common Commands

### Backend

```bash
cd backend
npm install
npm run start:dev
npm run build
npm run test
```

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npx cap sync android
```

## Troubleshooting

### Gradle / Java error

If you see `invalid source release: 21`, make sure Java 21 is installed and configured:

```bash
java -version
```

### API connection issues

Check your `.env` file and ensure `VITE_API_BASE_URL` points to the correct backend host.

---

This project is designed for business operations workflows and supports an offline-first mobile experience with synchronization to the API backend.
