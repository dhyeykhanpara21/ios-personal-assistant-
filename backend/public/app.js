/**
 * Luphonix — Progressive Web Application
 * Complete Client State, Offline Storage, Cloud Sync, and Audio Engine
 */

(function () {
  'use strict';

  // --- Initial State & Storage Keys ---
  const STORAGE_KEY_TASKS = 'luphonix_tasks_v1';
  const STORAGE_KEY_WATER = 'luphonix_water_logs_v1';
  const STORAGE_KEY_REMINDERS = 'luphonix_reminders_v1';
  const STORAGE_KEY_PREFS = 'luphonix_preferences_v1';
  const STORAGE_KEY_API_KEY = 'luphonix_api_key_v1';

  // Default sample data for instant wow effect on first open
  const DEFAULT_TASKS = [
    { id: '1', title: 'Review Luphonix project architecture', category: 'work', priority: 'high', is_completed: true, created_at: new Date().toISOString() },
    { id: '2', title: 'Drink 500ml fresh water with electrolytes', category: 'health', priority: 'medium', is_completed: false, created_at: new Date().toISOString() },
    { id: '3', title: 'Sync tasks with iPhone Siri shortcuts', category: 'study', priority: 'high', is_completed: false, created_at: new Date().toISOString() },
    { id: '4', title: 'Evening meditation or 20-min brisk walk', category: 'personal', priority: 'low', is_completed: false, created_at: new Date().toISOString() }
  ];

  const DEFAULT_WATER = [
    { id: 'w1', amount_ml: 250, timestamp: new Date(Date.now() - 4 * 3600000).toISOString() },
    { id: 'w2', amount_ml: 500, timestamp: new Date(Date.now() - 2 * 3600000).toISOString() }
  ];

  const DEFAULT_REMINDERS = [
    { id: 'r1', title: 'Hydration Check-in', time: '14:00', recurrence: 'daily', is_enabled: true },
    { id: 'r2', title: 'Plan Tomorrow Priorities', time: '20:30', recurrence: 'daily', is_enabled: true }
  ];

  const DEFAULT_PREFS = {
    dailyWaterGoal: 2000,
    backendUrl: window.location.origin,
    audioEnabled: true,
    activeStreak: 3
  };

  // State object
  const state = {
    tasks: loadStorage(STORAGE_KEY_TASKS, DEFAULT_TASKS),
    waterLogs: loadStorage(STORAGE_KEY_WATER, DEFAULT_WATER),
    reminders: loadStorage(STORAGE_KEY_REMINDERS, DEFAULT_REMINDERS),
    prefs: loadStorage(STORAGE_KEY_PREFS, DEFAULT_PREFS),
    currentFilter: 'all',
    searchQuery: '',
    activeView: 'dashboard',
    isOnline: navigator.onLine
  };

  function loadStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  // --- Web Audio Micro-Synthesizer (Zero asset dependencies!) ---
  let audioCtx = null;
  function playSound(type) {
    if (!state.prefs.audioEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'water') {
        // High soft water chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'check') {
        // Satisfying task checkmark pop
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'click') {
        // Subtle tap
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (err) {
      // Audio not permitted or suspended, ignore gracefully
    }
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '✅' : type === 'water' ? '💧' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // --- Dynamic Greeting ---
  function updateGreeting() {
    const timeEl = document.getElementById('greeting-time');
    const titleEl = document.getElementById('greeting-title');
    if (!timeEl || !titleEl) return;

    const hour = new Date().getHours();
    let timeText = 'Good Morning';
    if (hour >= 12 && hour < 17) timeText = 'Good Afternoon';
    else if (hour >= 17 && hour < 22) timeText = 'Good Evening';
    else if (hour >= 22 || hour < 5) timeText = 'Good Night';

    timeEl.textContent = timeText;
    titleEl.textContent = hour < 12 ? 'Start Your Day Strong' : 'Today at a Glance';
  }

  // --- Hydration Calculation & Ring Animation ---
  function getTodayWaterTotal() {
    const today = new Date().toDateString();
    return state.waterLogs
      .filter((log) => new Date(log.timestamp).toDateString() === today)
      .reduce((sum, log) => sum + (log.amount_ml || 0), 0);
  }

  function updateHydrationRings() {
    const totalMl = getTodayWaterTotal();
    const goalMl = state.prefs.dailyWaterGoal || 2000;
    const percent = Math.min(Math.round((totalMl / goalMl) * 100), 100);
    const circumference = 326.726; // 2 * PI * 52
    const offset = circumference - (percent / 100) * circumference;

    // Dashboard Ring Elements
    const dashVal = document.getElementById('dash-water-val');
    const dashGoal = document.getElementById('dash-water-goal');
    const dashPercent = document.getElementById('dash-water-percent');
    const dashProgress = document.getElementById('dash-ring-progress');

    if (dashVal) dashVal.textContent = totalMl.toLocaleString();
    if (dashGoal) dashGoal.textContent = goalMl.toLocaleString();
    if (dashPercent) dashPercent.textContent = `${percent}%`;
    if (dashProgress) dashProgress.style.strokeDashoffset = offset;

    // Hydration Page Elements
    const hydVal = document.getElementById('hyd-water-val');
    const hydGoalDisplay = document.getElementById('hyd-goal-display');
    const hydGoalText = document.getElementById('hyd-water-goal-text');
    const hydPercent = document.getElementById('hyd-water-percent');
    const hydProgress = document.getElementById('hyd-ring-progress');

    if (hydVal) hydVal.textContent = totalMl.toLocaleString();
    if (hydGoalDisplay) hydGoalDisplay.textContent = goalMl.toLocaleString();
    if (hydGoalText) hydGoalText.textContent = goalMl.toLocaleString();
    if (hydPercent) hydPercent.textContent = `${percent}%`;
    if (hydProgress) hydProgress.style.strokeDashoffset = offset;

    renderWeeklyChart();
    renderDrinkHistory();
  }

  function logWater(amount) {
    playSound('water');
    const newLog = {
      id: 'w_' + Date.now(),
      amount_ml: parseInt(amount, 10),
      timestamp: new Date().toISOString()
    };
    state.waterLogs.unshift(newLog);
    saveStorage(STORAGE_KEY_WATER, state.waterLogs);
    updateHydrationRings();
    showToast(`Logged ${amount} ml of water!`, 'water');

    // Async background cloud sync if backend is active
    syncWaterToCloud(newLog);
  }

  function renderWeeklyChart() {
    const container = document.getElementById('weekly-chart-bars');
    const avgLabel = document.getElementById('hyd-weekly-average');
    if (!container) return;

    container.innerHTML = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const dayTotals = [];
    const goal = state.prefs.dailyWaterGoal || 2000;

    // Calculate past 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = d.toDateString();
      const total = state.waterLogs
        .filter((l) => new Date(l.timestamp).toDateString() === dStr)
        .reduce((acc, l) => acc + l.amount_ml, 0);

      dayTotals.push({
        dayName: days[d.getDay()],
        total,
        isToday: i === 0
      });
    }

    const weeklySum = dayTotals.reduce((a, b) => a + b.total, 0);
    const avg = Math.round(weeklySum / 7);
    if (avgLabel) avgLabel.textContent = `Avg: ${avg.toLocaleString()} ml`;

    dayTotals.forEach((item) => {
      const heightPercent = Math.min(Math.round((item.total / goal) * 100), 100);
      const isGoalMet = item.total >= goal;

      const group = document.createElement('div');
      group.className = `chart-bar-group ${item.isToday ? 'today' : ''}`;
      group.innerHTML = `
        <div class="chart-bar-track" title="${item.dayName}: ${item.total} ml">
          <div class="chart-bar-fill ${isGoalMet ? 'goal-met' : ''}" style="height: ${Math.max(heightPercent, 6)}%;"></div>
        </div>
        <span class="chart-day-label">${item.dayName}</span>
      `;
      container.appendChild(group);
    });
  }

  function renderDrinkHistory() {
    const list = document.getElementById('water-logs-list');
    if (!list) return;

    const todayStr = new Date().toDateString();
    const todayLogs = state.waterLogs.filter((l) => new Date(l.timestamp).toDateString() === todayStr);

    if (todayLogs.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💧</div>
          <p>No water logged yet today. Tap +250 ml to start!</p>
        </div>
      `;
      return;
    }

    list.innerHTML = todayLogs
      .map((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
        <div class="task-item">
          <span style="font-size: 20px;">💧</span>
          <div class="task-content">
            <div class="task-title" style="text-decoration: none; color: #FFFFFF;">${log.amount_ml} ml</div>
            <div class="task-meta"><span>${time}</span></div>
          </div>
          <button class="task-delete-btn" data-delete-water="${log.id}" title="Remove entry">✕</button>
        </div>
      `;
      })
      .join('');
  }

  // --- Tasks Engine ---
  function renderTasks() {
    const previewContainer = document.getElementById('dash-tasks-preview');
    const fullContainer = document.getElementById('tasks-full-list');

    const pendingCount = state.tasks.filter((t) => !t.is_completed).length;
    const doneCount = state.tasks.filter((t) => t.is_completed).length;

    const statPending = document.getElementById('stat-tasks-pending');
    const statDone = document.getElementById('stat-tasks-done');
    if (statPending) statPending.textContent = pendingCount;
    if (statDone) statDone.textContent = doneCount;

    // Filter tasks
    let filtered = [...state.tasks];
    if (state.currentFilter === 'completed') {
      filtered = filtered.filter((t) => t.is_completed);
    } else if (state.currentFilter === 'today') {
      filtered = filtered.filter((t) => !t.is_completed);
    } else if (state.currentFilter !== 'all') {
      filtered = filtered.filter((t) => t.category.toLowerCase() === state.currentFilter.toLowerCase());
    }

    if (state.searchQuery.trim().length > 0) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter((t) => t.title.toLowerCase().includes(q));
    }

    // Dashboard Preview (Top 3)
    if (previewContainer) {
      const previewTasks = state.tasks.slice(0, 3);
      if (previewTasks.length === 0) {
        previewContainer.innerHTML = `
          <div class="empty-state" style="padding: 20px;">
            <p>All caught up! Add a new task above.</p>
          </div>
        `;
      } else {
        previewContainer.innerHTML = previewTasks.map((t) => renderTaskHTML(t)).join('');
      }
    }

    // Full Tasks View
    if (fullContainer) {
      if (filtered.length === 0) {
        fullContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">✨</div>
            <p>No tasks found. Tap + to add one!</p>
          </div>
        `;
      } else {
        fullContainer.innerHTML = filtered.map((t) => renderTaskHTML(t)).join('');
      }
    }
  }

  function renderTaskHTML(task) {
    const priorityClass = task.priority ? task.priority.toLowerCase() : 'medium';
    const categoryName = task.category ? task.category.toUpperCase() : 'GENERAL';

    return `
      <div class="task-item ${task.is_completed ? 'completed' : ''}" data-task-id="${task.id}">
        <button class="task-checkbox-btn" data-toggle-task="${task.id}" aria-label="Toggle task">
          <span class="task-checkbox-check">✓</span>
        </button>
        <div class="task-content">
          <div class="task-title">${escapeHTML(task.title)}</div>
          <div class="task-meta">
            <span class="priority-tag ${priorityClass}">${priorityClass}</span>
            <span class="category-tag">${categoryName}</span>
          </div>
        </div>
        <button class="task-delete-btn" data-delete-task="${task.id}" title="Delete task">✕</button>
      </div>
    `;
  }

  function toggleTask(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    task.is_completed = !task.is_completed;
    playSound('check');
    saveStorage(STORAGE_KEY_TASKS, state.tasks);
    renderTasks();
    showToast(task.is_completed ? 'Task completed! 🎉' : 'Task marked pending', 'success');

    syncTaskToCloud(task);
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveStorage(STORAGE_KEY_TASKS, state.tasks);
    renderTasks();
    showToast('Task removed', 'info');
  }

  function addTask(title, category, priority) {
    const newTask = {
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 't_' + Date.now(),
      title: title.trim(),
      category: category || 'work',
      priority: priority || 'medium',
      is_completed: false,
      due_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    state.tasks.unshift(newTask);
    saveStorage(STORAGE_KEY_TASKS, state.tasks);
    renderTasks();
    showToast('New task added!', 'success');

    syncTaskToCloud(newTask);
  }

  // --- Reminders Engine ---
  function renderReminders() {
    const container = document.getElementById('reminders-full-list');
    if (!container) return;

    if (state.reminders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔔</div>
          <p>No reminders scheduled. Tap + to set one!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.reminders
      .map((r) => {
        return `
        <div class="task-item">
          <span style="font-size: 22px;">⏰</span>
          <div class="task-content">
            <div class="task-title" style="text-decoration: none; color: #FFFFFF;">${escapeHTML(r.title)}</div>
            <div class="task-meta">
              <span class="priority-tag low">${r.time}</span>
              <span class="category-tag">${(r.recurrence || 'ONCE').toUpperCase()}</span>
            </div>
          </div>
          <button class="task-delete-btn" data-delete-reminder="${r.id}" title="Delete reminder">✕</button>
        </div>
      `;
      })
      .join('');
  }

  function addReminder(title, time, recurrence) {
    const newReminder = {
      id: 'r_' + Date.now(),
      title: title.trim(),
      time,
      recurrence,
      is_enabled: true
    };
    state.reminders.push(newReminder);
    saveStorage(STORAGE_KEY_REMINDERS, state.reminders);
    renderReminders();
    showToast('Reminder scheduled!', 'success');
  }

  // --- Cloud Sync Helpers ---
  async function testBackendPing() {
    const urlInput = document.getElementById('setting-backend-url');
    const resultEl = document.getElementById('backend-ping-result');
    if (!resultEl) return;

    const base = urlInput ? urlInput.value.trim() : state.prefs.backendUrl;
    resultEl.textContent = 'Pinging backend...';
    resultEl.style.color = '#FBBF24';

    const start = performance.now();
    try {
      const res = await fetch(`${base}/health`, { method: 'GET', cache: 'no-store' });
      const latency = Math.round(performance.now() - start);

      if (res.ok) {
        const json = await res.json();
        resultEl.textContent = `✅ Connected to ${json.service || 'Luphonix API'} (${latency} ms)`;
        resultEl.style.color = '#34D399';
        updateConnectionStatus(true);
      } else {
        resultEl.textContent = `⚠️ Server returned HTTP ${res.status}`;
        resultEl.style.color = '#F87171';
      }
    } catch (err) {
      resultEl.textContent = `❌ Could not reach server (${err.message})`;
      resultEl.style.color = '#F87171';
      updateConnectionStatus(false);
    }
  }

  function updateConnectionStatus(connected) {
    const pill = document.getElementById('connection-pill');
    const text = document.getElementById('connection-text');
    if (!pill || !text) return;

    if (connected) {
      pill.classList.remove('offline');
      text.textContent = 'Cloud Active';
    } else {
      pill.classList.add('offline');
      text.textContent = 'Local Mode';
    }
  }

  let currentApiKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';

  function updateApiKeyUI(key) {
    const input = document.getElementById('setting-webhook-api-key');
    if (input) {
      input.value = key;
    }
  }

  async function ensureApiKey(forceRefresh = false) {
    if (!forceRefresh && currentApiKey) {
      updateApiKeyUI(currentApiKey);
      return currentApiKey;
    }

    const base = state.prefs.backendUrl || window.location.origin;
    try {
      const res = await fetch(`${base}/api/auth/webhook-key`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.apiKey) {
          currentApiKey = data.apiKey;
          localStorage.setItem(STORAGE_KEY_API_KEY, currentApiKey);
          updateApiKeyUI(currentApiKey);
          return currentApiKey;
        }
      }
    } catch (e) {
      console.warn('Could not fetch webhook key from cloud:', e);
    }

    if (!currentApiKey) {
      currentApiKey = 'luphonix-siri-master-key';
      localStorage.setItem(STORAGE_KEY_API_KEY, currentApiKey);
    }
    updateApiKeyUI(currentApiKey);
    return currentApiKey;
  }

  async function syncWaterToCloud(log) {
    if (!state.prefs.backendUrl) return;
    try {
      const key = await ensureApiKey();
      await fetch(`${state.prefs.backendUrl}/api/hydration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({ amount_ml: log.amount_ml, logged_at: log.timestamp })
      });
    } catch (e) {
      // Offline fallback silent catch
    }
  }

  async function syncTaskToCloud(task) {
    const base = state.prefs.backendUrl || window.location.origin;
    try {
      const key = await ensureApiKey();
      const payload = {
        id: task.id,
        title: task.title,
        category: task.category || 'work',
        priority: task.priority || 'medium',
        is_completed: Boolean(task.is_completed),
        due_at: task.due_at || new Date().toISOString()
      };
      const res = await fetch(`${base}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.warn('Task sync non-200:', res.status, await res.text());
      }
    } catch (e) {
      console.warn('Offline task fallback:', e);
    }
  }

  async function syncAllWithCloud() {
    const base = state.prefs.backendUrl || window.location.origin;
    try {
      const key = await ensureApiKey();
      // Push local tasks up
      if (Array.isArray(state.tasks) && state.tasks.length > 0) {
        for (const t of state.tasks) {
          await syncTaskToCloud(t);
        }
      }

      // Pull cloud tasks down
      const res = await fetch(`${base}/api/tasks?filter=all`, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (res.ok) {
        const body = await res.json();
        if (body && Array.isArray(body.data) && body.data.length > 0) {
          state.tasks = body.data;
          saveStorage(STORAGE_KEY_TASKS, state.tasks);
          renderTasks();
        }
      }
    } catch (e) {
      console.warn('Cloud sync error:', e);
    }
  }

  // --- Siri Shortcuts Copy Helpers ---
  function setupSiriCopyButtons() {
    const waterBtn = document.getElementById('btn-copy-siri-water');
    const tasksBtn = document.getElementById('btn-copy-siri-tasks');
    const copyTokenBtn = document.getElementById('btn-copy-token');
    const refreshBtn = document.getElementById('btn-regenerate-token');

    const base = state.prefs.backendUrl || window.location.origin;

    if (waterBtn) {
      waterBtn.addEventListener('click', async () => {
        const key = await ensureApiKey();
        const url = `${base}/api/hydration?amount=250&format=text&apiKey=${encodeURIComponent(key)}`;
        navigator.clipboard.writeText(url).then(() => {
          showToast('Copied Water Webhook URL (with API key)!', 'success');
        });
      });
    }

    if (tasksBtn) {
      tasksBtn.addEventListener('click', async () => {
        const key = await ensureApiKey();
        const url = `${base}/api/tasks?filter=today&format=text&apiKey=${encodeURIComponent(key)}`;
        navigator.clipboard.writeText(url).then(() => {
          showToast('Copied Tasks Webhook URL (with API key)!', 'success');
        });
      });
    }

    if (copyTokenBtn) {
      copyTokenBtn.addEventListener('click', async () => {
        const key = await ensureApiKey();
        navigator.clipboard.writeText(key).then(() => {
          showToast('Copied API Key to clipboard!', 'success');
        });
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        showToast('Refreshing API key...', 'info');
        await ensureApiKey(true);
        showToast('API Key refreshed successfully!', 'success');
      });
    }
  }


  // --- Modal Controllers ---
  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
      const input = modal.querySelector('input');
      if (input) setTimeout(() => input.focus(), 150);
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('active'));
  }

  // --- Tab Navigation Controller ---
  function switchView(viewName) {
    playSound('click');
    state.activeView = viewName;

    // Toggle View Sections
    document.querySelectorAll('.view-section').forEach((sec) => {
      sec.classList.remove('active');
    });
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) targetSection.classList.add('active');

    // Toggle Nav Icons
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.remove('active');
      if (item.dataset.view === viewName) {
        item.classList.add('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Event Bindings & Init ---
  function initEvents() {
    // Bottom Nav Tabs
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view) switchView(view);
      });
    });

    // Header Quick Add
    const quickAddBtn = document.getElementById('btn-quick-add');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', () => openModal('modal-task'));
    }

    // Modal Close Buttons
    document.querySelectorAll('.modal-close-btn').forEach((btn) => {
      btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllModals();
      });
    });

    // Quick Water Buttons (Dashboard + Hydration Page)
    document.querySelectorAll('[data-water]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const amount = btn.dataset.water;
        if (amount) logWater(amount);
      });
    });

    // Custom Water Buttons
    const customWaterBtns = [document.getElementById('btn-quick-custom'), document.getElementById('btn-hyd-custom')];
    customWaterBtns.forEach((btn) => {
      if (btn) btn.addEventListener('click', () => openModal('modal-water'));
    });

    // Custom Water Form
    const customWaterForm = document.getElementById('form-custom-water');
    if (customWaterForm) {
      customWaterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('custom-water-amount');
        if (input && input.value) {
          logWater(input.value);
          closeAllModals();
        }
      });
    }

    // Reset Today's Water
    const resetWaterBtn = document.getElementById('btn-clear-water-logs');
    if (resetWaterBtn) {
      resetWaterBtn.addEventListener('click', () => {
        const todayStr = new Date().toDateString();
        state.waterLogs = state.waterLogs.filter((l) => new Date(l.timestamp).toDateString() !== todayStr);
        saveStorage(STORAGE_KEY_WATER, state.waterLogs);
        updateHydrationRings();
        showToast("Today's water logs reset", 'info');
      });
    }

    // Delete individual water log
    document.addEventListener('click', (e) => {
      const delWaterId = e.target.closest('[data-delete-water]')?.dataset.deleteWater;
      if (delWaterId) {
        state.waterLogs = state.waterLogs.filter((l) => l.id !== delWaterId);
        saveStorage(STORAGE_KEY_WATER, state.waterLogs);
        updateHydrationRings();
        showToast('Water log removed', 'info');
      }
    });

    // Tasks Filter Pills
    document.querySelectorAll('.filter-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        state.currentFilter = pill.dataset.filter || 'all';
        renderTasks();
      });
    });

    // Tasks Search Input
    const searchInput = document.getElementById('tasks-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderTasks();
      });
    }

    // Task Item Checkmark & Delete delegation
    document.addEventListener('click', (e) => {
      const toggleId = e.target.closest('[data-toggle-task]')?.dataset.toggleTask;
      if (toggleId) {
        toggleTask(toggleId);
        return;
      }

      const deleteId = e.target.closest('[data-delete-task]')?.dataset.deleteTask;
      if (deleteId) {
        deleteTask(deleteId);
        return;
      }

      const deleteRemId = e.target.closest('[data-delete-reminder]')?.dataset.deleteReminder;
      if (deleteRemId) {
        state.reminders = state.reminders.filter((r) => r.id !== deleteRemId);
        saveStorage(STORAGE_KEY_REMINDERS, state.reminders);
        renderReminders();
        showToast('Reminder deleted', 'info');
      }
    });

    // Add Task Button
    const addTaskBtn = document.getElementById('btn-add-task-modal');
    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', () => openModal('modal-task'));
    }

    // Add Task Form Submit
    const formAddTask = document.getElementById('form-add-task');
    if (formAddTask) {
      formAddTask.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('task-title-input');
        const catSelect = document.getElementById('task-category-select');
        const prioSelect = document.getElementById('task-priority-select');

        if (titleInput && titleInput.value.trim().length > 0) {
          addTask(titleInput.value, catSelect ? catSelect.value : 'work', prioSelect ? prioSelect.value : 'medium');
          titleInput.value = '';
          closeAllModals();
        }
      });
    }

    // Add Reminder Button & Form
    const addReminderBtn = document.getElementById('btn-add-reminder-modal');
    if (addReminderBtn) {
      addReminderBtn.addEventListener('click', () => openModal('modal-reminder'));
    }

    const formAddReminder = document.getElementById('form-add-reminder');
    if (formAddReminder) {
      formAddReminder.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('reminder-title-input');
        const timeInput = document.getElementById('reminder-time-input');
        const recSelect = document.getElementById('reminder-recurring-select');

        if (titleInput && titleInput.value.trim().length > 0) {
          addReminder(titleInput.value, timeInput ? timeInput.value : '09:00', recSelect ? recSelect.value : 'daily');
          titleInput.value = '';
          closeAllModals();
        }
      });
    }

    // Settings View Triggers
    const linkViewAllTasks = document.getElementById('link-view-all-tasks');
    if (linkViewAllTasks) {
      linkViewAllTasks.addEventListener('click', () => switchView('tasks'));
    }

    const linkEditGoal = document.getElementById('link-edit-water-goal');
    if (linkEditGoal) {
      linkEditGoal.addEventListener('click', () => switchView('settings'));
    }

    const btnShowInstall = document.getElementById('btn-show-install-guide');
    if (btnShowInstall) {
      btnShowInstall.addEventListener('click', () => openModal('modal-install'));
    }

    // Test Backend Ping
    const btnPing = document.getElementById('btn-test-backend-ping');
    if (btnPing) {
      btnPing.addEventListener('click', testBackendPing);
    }

    // Save Settings
    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        const goalInput = document.getElementById('setting-daily-water-goal');
        const urlInput = document.getElementById('setting-backend-url');
        const audioSelect = document.getElementById('setting-audio-toggle');

        if (goalInput) state.prefs.dailyWaterGoal = parseInt(goalInput.value, 10) || 2000;
        if (urlInput) state.prefs.backendUrl = urlInput.value.trim();
        if (audioSelect) state.prefs.audioEnabled = audioSelect.value === 'enabled';

        saveStorage(STORAGE_KEY_PREFS, state.prefs);
        updateHydrationRings();
        showToast('Settings saved successfully!', 'success');
      });
    }

    // Reset Data
    const btnReset = document.getElementById('btn-reset-data');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all tasks and hydration history to defaults?')) {
          state.tasks = [...DEFAULT_TASKS];
          state.waterLogs = [...DEFAULT_WATER];
          state.reminders = [...DEFAULT_REMINDERS];
          saveStorage(STORAGE_KEY_TASKS, state.tasks);
          saveStorage(STORAGE_KEY_WATER, state.waterLogs);
          saveStorage(STORAGE_KEY_REMINDERS, state.reminders);
          renderTasks();
          updateHydrationRings();
          renderReminders();
          showToast('Data reset to default', 'info');
        }
      });
    }

    // Load initial settings fields
    const backendInput = document.getElementById('setting-backend-url');
    if (backendInput && state.prefs.backendUrl) {
      backendInput.value = state.prefs.backendUrl;
    }

    const goalInput = document.getElementById('setting-daily-water-goal');
    if (goalInput && state.prefs.dailyWaterGoal) {
      goalInput.value = state.prefs.dailyWaterGoal;
    }

    setupSiriCopyButtons();
  }

  // --- Service Worker Registration ---
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => console.log('✅ Luphonix PWA Service Worker Registered'))
          .catch((err) => console.log('Service Worker registration skipped:', err));
      });
    }
  }

  // --- App Initialization ---
  function init() {
    updateGreeting();
    updateHydrationRings();
    renderTasks();
    renderReminders();
    initEvents();
    ensureApiKey();
    registerServiceWorker();

    // Auto-sync existing local tasks with cloud for Siri
    setTimeout(syncAllWithCloud, 500);

    // Health ping test on load
    setTimeout(testBackendPing, 800);
  }


  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
