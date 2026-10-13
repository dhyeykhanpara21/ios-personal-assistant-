# Luphonix: Built-in Siri Voice Assistant & Apple Shortcuts Setup Guide

This comprehensive guide explains how your iPhone 16 Pro's **built-in Siri** and Apple Shortcuts work in **Luphonix**, how voice commands are executed natively on-device, and how to test them.

---

## 1. Overview of Siri Integration Architecture

Luphonix uses Apple's native **App Intents framework** (native to iOS 16, 17, 18, and future iOS versions).

### Key Architectural Strengths:
1. **100% Native Built-in Siri**: No custom speech chatbot or separate in-app assistant. When you speak to Siri, Apple's built-in Siri interface (the glowing Apple Intelligence border on iPhone 16 Pro) appears on screen, uses on-device speech processing, and speaks back in Apple's Siri voice.
2. **Offline-First Resilience**: Intents share data directly with the app via an **App Group container** (`group.com.luphonix.app`). Even with no internet connection, voice commands immediately update your local tasks, reminders, and hydration records, syncing with the Turso cloud when connectivity is restored.
3. **App Store Security Compliant**: Siri interacts exclusively through authorized, typed `AppIntent` parameters.

---

## 2. Supported Built-in Siri Voice Commands

| Feature | What to Say to Your iPhone | Intent Class | Built-in Siri Voice Confirmation |
| :--- | :--- | :--- | :--- |
| **Add Reminder** | *"Siri, add a reminder in Luphonix to study at 8 PM."* | `AddReminderIntent` | *"Scheduled a reminder in Luphonix to 'study' at 8:00 PM."* |
| **Recurring Health** | *"Siri, remind me in Luphonix to take my medicine."* | `AddReminderIntent` | Siri schedules your medication reminder and confirms aloud. |
| **Social Reminder** | *"Siri, remind me in Luphonix to call my friend."* | `AddReminderIntent` | *"Scheduled a reminder in Luphonix to 'call my friend'..."* |
| **Water Schedule** | *"Siri, remind me to drink water every hour in Luphonix."* | `SetWaterReminderIntervalIntent` | *"Updated your Luphonix water reminders to every 60 minutes during your active hours."* |
| **Add Task** | *"Siri, add a task to complete my project tomorrow in Luphonix."* | `AddTaskIntent` | *"Added task 'complete my project' due at ... in Luphonix."* |
| **Query Tasks** | *"Siri, what are my tasks for today in Luphonix?"* | `GetTodayTasksIntent` | *"You have 3 tasks today in Luphonix: Review Specs, Drink water, Call Alex."* |
| **Complete Task** | *"Siri, mark my study task as completed in Luphonix."* | `CompleteTaskIntent` | *"Marked 'study' as completed in Luphonix. Good job!"* |
| **Log Hydration** | *"Siri, log 250 ml of water in Luphonix."* | `LogWaterIntent` | *"Logged 250 ml in Luphonix. You have drunk 750 ml out of your 2000 ml goal today."* |
| **Check Hydration** | *"Siri, how much water have I drunk today in Luphonix?"* | `GetHydrationIntent` | *"You've drunk 750 ml of water today. You have 1250 ml remaining to reach your 2000 ml goal in Luphonix."* |

---

## 3. How to Test on Your iPhone 16 Pro

### Step 1: Install and Launch Luphonix
1. Run the app on your iPhone 16 Pro (via Xcode, TestFlight, or Sideloadly).
2. Tap **"Allow"** when prompted for Notification permissions.
3. Launch the app once to let iOS discover the `LuphonixShortcuts` provider.

### Step 2: Verify in iOS Settings
1. On your iPhone 16 Pro, open **Settings** → **Apple Intelligence & Siri** (or **Siri & Search**).
2. Confirm **"Listen for 'Siri' or 'Hey Siri'"** is **ON**.
3. Scroll to **Luphonix** and confirm **"Use with Ask Siri"** is **ON**.

### Step 3: Speak Directly to Siri
1. Activate Siri:
   - Say: *"Siri"* or *"Hey Siri"*
   - Or hold the **Side Button (Power Button)**
   - Or double-tap the **Home Indicator** bar at the bottom to Type to Siri
2. Say:
   > **"Siri, what are my tasks for today in Luphonix?"**
3. Siri will read your tasks out loud and display a native card on screen!
