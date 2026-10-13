# Luphonix — iPhone 16 Pro Complete Setup Guide

This guide provides step-by-step instructions to install, connect, and use **Luphonix** on your **iPhone 16 Pro** with **Apple's built-in Siri** and your live **Turso Cloud Database**, **without enabling Developer Mode**, and with your backend deployed on **Vercel** for 5G access.

---

## 📋 Overview of What You Need

1. **Your iPhone 16 Pro** (Running iOS 18+ / iOS 26+)
2. **Your Live Turso Database** (Already connected & migrated at `libsql://ios-assistent-dkios.aws-ap-south-1.turso.io`)
3. **Vercel** (Free cloud serverless hosting for anywhere 5G / Wi-Fi access)
4. **Apple TestFlight** (The official Apple distribution method that runs **WITHOUT enabling Developer Mode**)

---

## 🔒 Why You Do NOT Need Developer Mode (Apple TestFlight)

On iOS 16 and later, Apple introduced "Developer Mode" **strictly for direct USB sideloading** from untrusted computers. If you install an app via third-party sideloaders (AltStore, Sideloadly) or uncertified USB runs, iOS forces you to turn on Developer Mode, which displays security warnings and requires a full phone reboot.

### The Solution: Apple TestFlight (Zero Developer Mode Required)
- **Official Apple Distribution**: When Luphonix is uploaded to **Apple TestFlight** (via App Store Connect), Apple cryptographically signs the build with its official distribution certificate.
- **Zero Developer Mode**: You download the official **TestFlight** app directly from the Apple App Store on your iPhone 16 Pro, tap **Install**, and the app opens immediately **with NO Developer Mode prompt, NO phone reboot, and NO security warnings**.
- **Full System Access**: Apple's built-in Siri, App Intents, Action Button, and local notifications work natively at 100% capability.

---

## 🚀 Part 1: Installing Luphonix on iPhone 16 Pro (No Developer Mode)

### Method 1: Apple TestFlight (Recommended — 0% Developer Mode)

#### If you have access to a Mac:
1. Open **`SiriLife.xcodeproj`** in Xcode.
2. Under target **SiriLife** → **Signing & Capabilities**:
   - Ensure **"Automatically manage signing"** is checked.
   - Select your **Apple Developer Team** (Bundle ID: `com.luphonix.app`).
3. In the Xcode top menu destination selector, choose **"Any iOS Device (arm64)"**.
4. Click **Product → Archive**.
5. When the Xcode Organizer window appears, select the archive and click **"Distribute App"**.
6. Select **"TestFlight & App Store"** → click **Upload**.
7. In ~5 minutes, the build appears in [App Store Connect](https://appstoreconnect.apple.com) under **TestFlight**.
8. Under **Internal Testing**, add your Apple ID email.

#### On Your iPhone 16 Pro:
1. Open the **App Store** on your iPhone 16 Pro and download **TestFlight** (by Apple).
2. Open TestFlight or tap the invitation link received in your email.
3. Tap **Accept** → Tap **Install**.
4. Luphonix appears on your Home Screen and opens immediately — **no Developer Mode prompt ever appears!**

---

### Alternative Method (If testing temporarily via Xcode USB run):
If you connect your iPhone 16 Pro directly to a Mac with a paid Apple Developer Account registered in Xcode, Xcode installs the app into your device container. *(Note: Free personal Apple IDs via USB prompt for Developer Mode on iOS 16+, which is why TestFlight above is the recommended approach).*

---

## 🌐 Part 2: Deploying Backend to Vercel (Cloud & 5G Access)

The Luphonix backend is built with **Hono** and is serverless-ready for **Vercel** with native **Turso (libSQL)** HTTP edge support. Deploying to Vercel gives you a permanent, free `https://your-app.vercel.app` endpoint accessible 24/7 over 5G and Wi-Fi.

### Option A: 60-Second Deploy with Vercel CLI (Fastest)

1. Open PowerShell or Terminal in the `backend` folder:
   ```powershell
   cd "c:\Users\dhyey\OneDrive\Desktop\ios app\backend"
   ```
2. Run the Vercel deployment command:
   ```bash
   npx -y vercel
   ```
3. Follow the quick terminal prompts:
   - `Set up and deploy?` → Press **Y**
   - `Which scope?` → Press **Enter** (your personal Vercel account)
   - `Link to existing project?` → Press **N**
   - `What’s your project’s name?` → `luphonix-api` (or press **Enter**)
   - `In which directory is your code located?` → `./` (press **Enter**)
   - `Want to modify settings?` → Press **N**
4. Add your Turso Database credentials to Vercel:
   ```bash
   npx vercel env add TURSO_DATABASE_URL production
   # When prompted, paste: libsql://ios-assistent-dkios.aws-ap-south-1.turso.io

   npx vercel env add TURSO_AUTH_TOKEN production
   # When prompted, paste your Turso auth token

   npx vercel env add JWT_SECRET production
   # When prompted, paste: super-secret-luphonix-jwt-key-dev-only-32-chars-long
   ```
5. Deploy to production:
   ```bash
   npx -y vercel --prod
   ```
6. Vercel will output your live URL:
   `https://luphonix-api.vercel.app` (or similar).

---

### Option B: Deploy via Vercel Web Dashboard (Zero CLI)

1. Push this project to your GitHub account:
   ```bash
   git add .
   git commit -m "Configure Vercel serverless for Luphonix"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **Add New...** → **Project**.
4. Import your GitHub repository (`ios app` or `luphonix`).
5. In the project configuration screen:
   - **Framework Preset**: Other
   - **Root Directory**: Click **Edit** and choose `backend`.
   - **Build and Output Settings**: Defaults are automatically handled by `backend/vercel.json`.
6. Expand **Environment Variables** and add the 3 variables:
   | Key | Value |
   | :--- | :--- |
   | `TURSO_DATABASE_URL` | `libsql://ios-assistent-dkios.aws-ap-south-1.turso.io` |
   | `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...` *(your full Turso token)* |
   | `JWT_SECRET` | `super-secret-luphonix-jwt-key-dev-only-32-chars-long` |
   | `ALLOWED_ORIGIN` | `*` |
7. Click **Deploy**. Vercel will build and assign you an SSL domain in under 30 seconds!

---

### 🧪 Step 3: Verify Your Vercel Backend

Open your browser or run in terminal:
```bash
curl https://your-luphonix-api.vercel.app/health
```
You will receive:
```json
{
  "status": "healthy",
  "service": "Luphonix Backend API",
  "database": "Turso (libSQL)",
  "timestamp": "2026-10-13T15:45:00.000Z",
  "version": "1.0.0"
}
```
✅ Your backend is live in the cloud and directly connected to your Turso database!

---

## 📱 Part 3: Connecting Your iPhone 16 Pro to the Vercel Backend

You have two easy ways to point the iPhone app to your Vercel URL:

### Method 1: Right from the iPhone App UI (No Recompiling Needed!)
1. Open **Luphonix** on your iPhone 16 Pro.
2. Tap the **Settings** gear icon in the bottom navigation bar.
3. Under the **Cloud Backend (Vercel)** section:
   - Tap the link field.
   - Paste your Vercel deployment URL (e.g. `https://luphonix-api.vercel.app`).
4. That's it! Luphonix immediately routes all tasks, water logs, and Siri sync requests to your Vercel backend.

### Method 2: Configure in Code before TestFlight Upload
In [`SiriLife/Services/APIClient.swift`](file:///c:/Users/dhyey/OneDrive/Desktop/ios%20app/SiriLife/Services/APIClient.swift), set `_defaultBaseURL`:
```swift
private var _defaultBaseURL: String = "https://your-luphonix-api.vercel.app"
```

---

## 🎙️ Part 4: Enabling iPhone 16 Pro Built-in Siri

Once Luphonix is installed via TestFlight on your iPhone 16 Pro:

### Step 1: First App Launch
1. Tap the **Luphonix** app icon on your home screen.
2. When prompted: **"Luphonix Would Like to Send You Notifications"** → Tap **Allow**.
   *(This allows local alarms for water and daily reminders to pop up on time).*
3. Keep the app open for 5 seconds so iOS registers your App Shortcuts with Apple's Siri system.

### Step 2: Verify Siri Settings
1. Open **Settings** on your iPhone 16 Pro.
2. Tap **Apple Intelligence & Siri** (or **Siri & Search**).
3. Ensure **Listen for "Siri" or "Hey Siri"** is toggled **ON**.
4. Scroll down to **Luphonix** in the app list:
   - Ensure **"Use with Ask Siri"** is toggled **ON**.

---

## 🗣️ Part 5: How to Talk to Built-in Siri on iPhone 16 Pro

No need to open the app. Hold your iPhone or wear AirPods and say:

### 1. Check Today's Tasks
> *"Siri, what are my tasks for today in Luphonix?"*
- **Siri response:** Reads out today's pending tasks and shows Apple's native task card.

### 2. Add a Study / Work Reminder
> *"Siri, add a reminder in Luphonix to study at 8 PM."*
- **Siri response:** *"Scheduled a reminder in Luphonix to 'study' at 8:00 PM."*

### 3. Log Water Intake
> *"Siri, log 250 ml of water in Luphonix."*
- **Siri response:** *"Logged 250 ml in Luphonix. You have drunk 250 ml out of your 2000 ml goal today."*

### 4. Check Water Progress
> *"Siri, how much water have I drunk today in Luphonix?"*
- **Siri response:** Reports your intake and how much is remaining for today's goal.

### 5. Hourly Water Reminder
> *"Siri, remind me to drink water every hour in Luphonix."*
- **Siri response:** Updates your hydration reminder schedule to trigger every 60 minutes during active hours.

### 6. Create a New Task
> *"Siri, add a task to complete project tomorrow in Luphonix."*
- **Siri response:** Creates the task with tomorrow's due date.

### 7. Complete a Task
> *"Siri, mark my study task as completed in Luphonix."*
- **Siri response:** *"Marked 'study' as completed in Luphonix. Good job!"*

---

## ⚡ Part 6: iPhone 16 Pro Exclusive Shortcuts

### 1. Action Button Trigger
1. Go to **Settings → Action Button**.
2. Swipe to **Shortcut**.
3. Tap the picker and select **Luphonix → Log Water** or **Add Task**.
4. Now, pressing the physical Action Button on the side of your iPhone 16 Pro logs water or opens a new task immediately!

### 2. Type to Siri
On iPhone 16 Pro with iOS 18+:
- Double-tap the **Home Bar** at the bottom of the screen.
- Type: `log 250 ml of water in Luphonix`
- Press return — Apple's Siri logs it silently without needing to speak out loud.

---

## 🛠️ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **I don't want Developer Mode enabled** | Sideloading triggers Developer Mode on iOS 16+. | Install via **Apple TestFlight** (Part 1). TestFlight apps are officially signed by Apple and **NEVER ask for Developer Mode**. |
| **"I couldn't find an app named Luphonix"** | iOS hasn't indexed shortcuts yet. | Open the app once on your phone and leave it open for 5 seconds. In **Settings → Siri → Luphonix**, make sure "Use with Ask Siri" is turned ON. |
| **Notifications not arriving** | Permissions denied or Focus mode active. | Go to **Settings → Notifications → Luphonix** and enable **Allow Notifications**, **Sounds**, and **Badges**. Check that Do Not Disturb is off. |
| **Cloud sync fails** | Incorrect backend URL. | In Luphonix **Settings**, check your Vercel URL under **Cloud Backend (Vercel)**. Ensure it begins with `https://` and has no trailing slash. |
