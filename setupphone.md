# Luphonix — iPhone 16 Pro Complete Setup Guide

This guide provides step-by-step instructions to install, connect, and use **Luphonix** on your **iPhone 16 Pro** with **Apple's built-in Siri** and your live **Turso Cloud Database**, with **ZERO Developer Mode**, no cables, no MacBook, and 100% free hosting on **Vercel**.

---

## 📋 Overview of What You Need

1. **Your iPhone 16 Pro** (Running iOS 18+)
2. **Safari on iPhone** (To add the Progressive Web App to your Home Screen)
3. **Your Live Turso Database** (Already connected & migrated at `libsql://ios-assistent-dkios.aws-ap-south-1.turso.io`)
4. **Vercel** (Free cloud serverless hosting for anywhere 5G / Wi-Fi access)

---

## 🔒 Why the PWA Requires ZERO Developer Mode

- **Official Apple Web Standard**: Progressive Web Apps (PWAs) run directly via Apple Safari’s WebKit engine.
- **Zero Developer Mode**: You open the app link in Safari, tap **Share** → **Add to Home Screen**, and Luphonix installs immediately to your iPhone 16 Pro Home Screen.
- **No Developer Mode prompt, no phone reboot, no 7-day expiration, and no security warnings.**
- **Full Apple OLED Native Look**: Luphonix is styled with dark glassmorphism, responsive safe-area insets for Dynamic Island, full-screen standalone mode, and tactile audio feedback.
- **Built-in Siri Integration**: Works with Apple's built-in **Shortcuts** app on your iPhone to execute voice commands (*"Hey Siri, log water in Luphonix"*).


---

## 🚀 Part 1: Installing Luphonix on iPhone 16 Pro

### Method 1: Progressive Web App (Recommended — 0% Developer Mode, 0 Cables, 0 Reboots)

This is the fastest, cleanest way to get Luphonix on your iPhone 16 Pro:

1. **Deploy to Vercel** (or launch local server):
   Once your Vercel URL is live (e.g. `https://luphonix-api.vercel.app`):
2. **On your iPhone 16 Pro**:
   - Open **Safari** and visit your deployment URL: `https://your-luphonix.vercel.app`
   - Tap the **Share** button in Safari's bottom toolbar (the square icon with the upward arrow 📤).
   - Scroll down and tap **"Add to Home Screen"** (➕).
   - Tap **Add** in the top right corner.
3. **Open Luphonix**:
   - Tap the **Luphonix** icon on your Home Screen.
   - It launches in **standalone mode** (full screen with no browser bars), with native haptics, water ring animations, task management, and live Turso database cloud sync.
   - **No Developer Mode prompt, no Mac needed, and no 7-day expiration!**

---

### Method 2: Native IPA Sideloading (Requires Developer Mode + Sideloadly)

### Step 1: Trigger the Cloud Build on GitHub
1. Commit and push your latest code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure GitHub Actions cloud IPA build"
   git push origin main
   ```
2. Go to your GitHub repository in your web browser:
   `https://github.com/luphonixtestimonials/ios-personal-assistant-`
3. Click the **Actions** tab at the top.
4. You will see the **"SiriLife iOS Build & IPA Release"** workflow running on a cloud Mac (`macos-14`).
   *(Or click "Run workflow" to start it manually anytime).*
5. In ~3–4 minutes, the workflow turns **green (success)** ✅.

### Step 2: Download `SiriLife.ipa` to your Windows PC
1. Click on the completed workflow run.
2. Scroll down to the **Artifacts** section at the bottom.
3. Click **`SiriLife-iOS-Package`** to download the zip file.
4. Unzip the file on your Windows PC — inside is your compiled **`SiriLife.ipa`**!

---

### Step 3: Install onto iPhone 16 Pro using Sideloadly (Free for Windows)

**Sideloadly** is the standard, trusted tool that signs iOS apps using your personal free Apple ID and installs them directly to your iPhone from Windows.

1. **Prerequisite**: Ensure you have **Apple Devices** (or **iTunes**) installed on your Windows PC so Apple USB drivers are active:
   - Download from the [Microsoft Store: Apple Devices](https://apps.microsoft.com/detail/9np83lwlpz9k) or iTunes.
2. **Download Sideloadly**:
   - Download the free Windows installer from [sideloadly.io](https://sideloadly.io) and install it.
3. **Connect iPhone 16 Pro**:
   - Connect your iPhone 16 Pro to your Windows PC using your USB-C cable.
   - If prompted on your iPhone: tap **"Trust This Computer"** and enter your passcode.
4. **Install Luphonix**:
   - Open **Sideloadly**. Your iPhone 16 Pro will appear in the **Device** field.
   - Drag and drop **`SiriLife.ipa`** into the large IPA box on Sideloadly.
   - Enter your **Apple ID email** in the Apple ID box.
   - Click **Start**.
   - *(If prompted, enter your Apple ID password / 2-factor code. Sideloadly sends this directly to Apple's developer provisioning server to generate your free personal certificate).*
   - Sideloadly will output: `Done! Installing... 100%`.

---

### Step 4: First-Time iPhone Permissions (Takes 30 Seconds)

Because the app is signed with your personal free Apple ID, iOS requires two quick one-time authorizations:

1. **Trust Your Developer Profile**:
   - On your iPhone 16 Pro, open **Settings** → **General** → **VPN & Device Management**.
   - Under *Developer App*, tap your **Apple ID email**.
   - Tap **Trust "[Your Apple ID]"** → tap **Trust**.

2. **Enable Developer Mode (iOS 16+ Requirement)**:
   - Open **Settings** → **Privacy & Security**.
   - Scroll down to the bottom and tap **Developer Mode**.
   - Toggle **Developer Mode** to **ON**.
   - Tap **Restart**.
   - After the iPhone restarts and you unlock it, tap **Turn On** and enter your passcode.

🎉 **Luphonix is now fully installed and running natively on your iPhone 16 Pro!** You can now open it, use Siri, and connect it to your live Vercel cloud backend.


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
