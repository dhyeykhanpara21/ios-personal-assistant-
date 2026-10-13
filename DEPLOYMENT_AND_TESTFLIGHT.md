# Luphonix: Production Deployment & TestFlight Preparation Guide

This guide walks through configuring **Turso (libSQL)** in production, deploying the **TypeScript/Hono** backend, and configuring Xcode for **Apple TestFlight** distribution for **Luphonix**.

---

## 1. Turso Database Setup (libSQL)

Turso provides edge-replicated, low-latency SQLite databases powered by libSQL.

### Step 1: Install Turso CLI & Log In
```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
irm https://get.tur.so/install.ps1 | iex

turso auth signup # or turso auth login
```

### Step 2: Create a Production Database
```bash
turso db create luphonix-prod --location iad
```

### Step 3: Get Database URL and Auth Token
```bash
# Show database connection URL
turso db show luphonix-prod --url
# Outputs: libsql://luphonix-prod-[your-org].turso.io

# Create a long-lived production access token
turso db tokens create luphonix-prod
# Outputs: [JWT-like auth token]
```

### Step 4: Apply Schema Migrations to Turso Cloud
In `backend/.env`:
```env
TURSO_DATABASE_URL=libsql://luphonix-prod-[your-org].turso.io
TURSO_AUTH_TOKEN=your_token_from_step_3
```

Run migrations:
```bash
cd backend
npm run migrate
```
You will see:
```text
🔄 Running Turso database migrations...
✅ Successfully executed 14 migration statements on Turso/libSQL.
```

---

## 2. Deploying the Hono Backend

The Luphonix backend is lightweight, stateless, and optimized for serverless edge platforms or container runtimes.

Set environment variables in your deployment dashboard:
- `PORT=3000`
- `NODE_ENV=production`
- `TURSO_DATABASE_URL=libsql://luphonix-prod-...`
- `TURSO_AUTH_TOKEN=your_turso_token`
- `JWT_SECRET=your_32_character_random_hex_key`
- `ALLOWED_ORIGIN=*`

---

## 3. iOS App Configuration for Production

### Step 1: Update iOS API Client Base URL
In `SiriLife/Services/APIClient.swift`, point `baseURLString` to your deployed backend URL:
```swift
#if DEBUG
public var baseURLString: String = "http://localhost:3000"
#else
public var baseURLString: String = "https://api.luphonix.app"
#endif
```

> **Security Guarantee**: The iOS application **never** receives or stores the `TURSO_AUTH_TOKEN`. All interactions flow through the secure Hono backend with JWT token authorization.

---

## 4. Xcode TestFlight & App Store Submission

### Step 1: Apple Developer Portal Setup
1. Log in to [developer.apple.com](https://developer.apple.com).
2. Under **Certificates, Identifiers & Profiles**:
   - Register App ID: `com.luphonix.app`
   - Enable Capabilities:
     - **App Groups**: Create group `group.com.luphonix.app` and assign it to the App ID.
     - **Push Notifications** (optional for remote pushes).
     - **SiriKit / App Intents**.

### Step 2: Code Signing in Xcode
1. Open `SiriLife.xcodeproj`.
2. Select target **SiriLife** → **Signing & Capabilities**.
3. Check **"Automatically manage signing"**.
4. Select your **Apple Developer Team**.
5. Ensure the bundle identifier matches `com.luphonix.app`.

### Step 3: Archive and Upload
1. In Xcode scheme selector, choose **"Any iOS Device (arm64)"**.
2. Select menu **Product → Archive**.
3. Once archiving completes, the **Xcode Organizer** opens.
4. Click **"Distribute App"** → choose **"TestFlight & App Store"**.
5. Xcode will validate assets, compile bitcode/symbols, and upload the build to App Store Connect.
