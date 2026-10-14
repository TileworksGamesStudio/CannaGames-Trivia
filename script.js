/**
 * DAILY QUIZ — MASTER UNIVERSAL ENGINE
 * Adheres to the Unified Game Design, Mobile Optimization & Shared Daily Release Architecture
 * Updated with Botanical Cannabis Visual Identity & Exact Section 8 Leaf Silhouette Integration
 */
(function () {
  'use strict';

  const CONFIG = {
    csvPath: './puzzles.csv',
    storageKey: 'universal_daily_quiz_state',
    storageVersion: 2,
    homeUrl: 'https://example.com/',
    plusUrl: 'https://example.com/games',
    releaseTimeZone: 'Europe/London',
    maxFloatIcons: 12
  };

  // --- EXACT CANNABIS SVG MARKUP PRESERVED VERBATIM (SECTION 8) ---
  const EXACT_CANNABIS_SVG = `<svg xmlns="http://w3.org" viewBox="0 0 512 546" width="512" height="546">
  <g fill="#2e7d32">
    <!-- Center / Main Leaf Blade -->
    <path d="M256,20 C240,100 245,180 256,260 C267,180 272,100 256,20 Z" />
    <!-- Upper Side Lobes -->
    <path d="M256,260 C210,140 140,100 80,110 C140,160 200,230 256,260 Z" />
    <path d="M256,260 C302,140 372,100 432,110 C372,160 312,230 256,260 Z" />
    <!-- Middle Side Lobes -->
    <path d="M256,260 C180,200 100,210 50,250 C110,280 180,290 256,260 Z" />
    <path d="M256,260 C332,200 412,210 462,250 C402,280 332,290 256,260 Z" />
    <!-- Lower Side Lobes -->
    <path d="M256,260 C190,270 130,310 90,360 C140,360 200,340 256,260 Z" />
    <path d="M256,260 C322,270 382,310 422,360 C372,360 312,340 256,260 Z" />
    <!-- Stem / Petiole -->
    <path d="M246,260 L246,510 L266,510 L266,260 Z" />
  </g>
</svg>`;

  // --- AUDIO SYNTHESIZER (TACTILE, RESTRAINED, CONTROLLED) ---
  class SoundManager {
    constructor(enabled = true) {
      this.enabled = enabled;
      this.ctx = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    tone(freq, type = 'sine', duration = 0.1, gainVal = 0.08) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Fails silently if sound is unsupported
      }
    }

    tap() { this.tone(340, 'triangle', 0.04, 0.07); }
    correct() {
      this.tone(523.25, 'sine', 0.12, 0.10);
      setTimeout(() => this.tone(659.25, 'sine', 0.16, 0.10), 75);
    }
    incorrect() {
      this.tone(210, 'sawtooth', 0.18, 0.08);
    }
    complete() {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        setTimeout(() => this.tone(freq, 'sine', 0.18, 0.10), idx * 75);
      });
    }
  }

  // --- LOCAL STORAGE MANAGER (DEFENSIVE & SCHEMA PRESERVING) ---
  const Storage = {
    load() {
      const fallback = {
        version: CONFIG.storageVersion,
        sound: true,
        backgroundAnimation: true,
        streak: 0,
        bestStreak: 0,
        lastCompletedDate: null,
        history: {},
        inProgress: null
      };

      try {
        const raw = localStorage.getItem(CONFIG.storageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return fallback;

        return {
          version: CONFIG.storageVersion,
          sound: typeof parsed.sound === 'boolean' ? parsed.sound : true,
          backgroundAnimation: typeof parsed.backgroundAnimation === 'boolean' ? parsed.backgroundAnimation : true,
          streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
          bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : (parsed.streak || 0),
          lastCompletedDate: parsed.lastCompletedDate || null,
          history: parsed.history && typeof parsed.history === 'object' ? parsed.history : {},
          inProgress: parsed.inProgress && typeof parsed.inProgress === 'object' ? parsed.inProgress : null
        };
      } catch (e) {
        return fallback;
      }
    },
    save(state) {
      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
      } catch (e) {
        // Handled defensively
      }
    }
  };

  // --- RFC 4180 COMPLIANT CSV PARSER ---
  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(field.trim());
        field = '';
      } else if ((char === '\n' || (char === '\r' && next === '\n')) && !inQuotes) {
        if (char === '\r') i++;
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
    if (field || row.length > 0) {
      row.push(field.trim());
      rows.push(row);
    }

    if (rows.length < 2) throw new Error('Data file missing or invalid.');
    const headers = rows[0].map(h => h.toLowerCase());
    const records = [];

    for (let r = 1; r < rows.length; r++) {
      if (rows[r].length === 1 && rows[r][0] === '') continue;
      const item = {};
      headers.forEach((h, idx) => {
        item[h] = rows[r][idx] !== undefined ? rows[r][idx] : '';
      });
      records.push(item);
    }
    return records;
  }

  // --- AUTHORITATIVE TIME & UK RELEASE DATE RESOLUTION ---
  class ReleaseClock {
    constructor() {
      this.serverOffsetMs = 0;
      this.isSynchronized = false;
    }

    async sync() {
      try {
        const url = window.location.href.split('#')[0].split('?')[0] + '?_t=' + Date.now();
        const start = performance.now();
        const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        const latency = (performance.now() - start) / 2;
        const dateHeader = res.headers.get('Date');

        if (dateHeader) {
          const serverTime = new Date(dateHeader).getTime() + latency;
          if (!isNaN(serverTime)) {
            this.serverOffsetMs = serverTime - Date.now();
            this.isSynchronized = true;
          }
        }
      } catch (e) {
        this.isSynchronized = false;
      }
    }

    getNow() {
      return new Date(Date.now() + this.serverOffsetMs);
    }

    getTodayUkDateString() {
      const now = this.getNow();
      try {
        const dtf = new Intl.DateTimeFormat('en-CA', {
          timeZone: CONFIG.releaseTimeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        return dtf.format(now);
      } catch (e) {
        return now.toISOString().split('T')[0];
      }
    }
  }

  function resolveAnswerIndex(letter) {
    const clean = String(letter).trim().toUpperCase();
    if (clean === 'A' || clean === '0') return 0;
    if (clean === 'B' || clean === '1') return 1;
    if (clean === 'C' || clean === '2') return 2;
    if (clean === 'D' || clean === '3') return 3;
    return 0;
  }

  // --- FLOATING BACKGROUND CANNABIS LEAF CONTROLLER ---
  class BackgroundAtmosphere {
    constructor(container, enabled = true) {
      this.container = container;
      this.enabled = enabled;
      this.items = [];
      this.animFrame = null;
      this.lastTime = 0;
    }

    init() {
      if (!this.container) return;
      this.container.innerHTML = '';
      this.items = [];

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        this.enabled = false;
      }

      for (let i = 0; i < CONFIG.maxFloatIcons; i++) {
        const el = document.createElement('div');
        el.className = 'float-icon';
        const depthVal = i % 3;
        el.classList.add(depthVal === 0 ? 'depth-back' : depthVal === 1 ? 'depth-mid' : 'depth-fore');

        // Insert the exact, unaltered SVG
        el.innerHTML = EXACT_CANNABIS_SVG;

        // Controlled, gentle vertical floating speeds
        const speed = depthVal === 0 ? 10 + Math.random() * 6 : depthVal === 1 ? 16 + Math.random() * 8 : 22 + Math.random() * 10;
        const item = {
          el,
          x: Math.random() * 90 + 2,
          y: Math.random() * 105,
          speed,
          rotation: (Math.random() - 0.5) * 36
        };

        this.container.appendChild(el);
        this.items.push(item);
        this.renderItem(item);
      }

      if (this.enabled) {
        this.start();
      }
    }

    renderItem(item) {
      item.el.style.left = `${item.x}%`;
      item.el.style.transform = `translate3d(0, ${item.y}vh, 0) rotate(${item.rotation}deg)`;
    }

    start() {
      if (this.animFrame) cancelAnimationFrame(this.animFrame);
      this.lastTime = performance.now();
      const loop = (now) => {
        if (!this.enabled) return;
        const delta = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        this.items.forEach(item => {
          item.y -= (item.speed * delta) * 0.32;
          if (item.y < -18) {
            item.y = 105;
            item.x = Math.random() * 90 + 2;
            item.rotation = (Math.random() - 0.5) * 36;
          }
          item.el.style.transform = `translate3d(0, ${item.y}vh, 0) rotate(${item.rotation}deg)`;
        });

        this.animFrame = requestAnimationFrame(loop);
      };
      this.animFrame = requestAnimationFrame(loop);
    }

    stop() {
      if (this.animFrame) {
        cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
      }
    }

    setEnabled(val) {
      this.enabled = val;
      if (this.enabled) {
        this.start();
      } else {
        this.stop();
      }
    }
  }

  // --- CORE APPLICATION ORCHESTRATOR ---
  class DailyQuizApp {
    constructor() {
      this.state = Storage.load();
      this.sound = new SoundManager(this.state.sound);
      this.clock = new ReleaseClock();
      this.roundsByDate = {};
      this.todayUkDate = null;
      this.currentActiveDate = null;
      this.vaultDates = [];

      this.activeRound = null;
      this.currentIndex = 0;
      this.sessionAnswers = [];
      this.isReview = false;
      this.selectedAnswer = null;

      this.activeDrawer = null;

      this.cacheDom();
      this.atmosphere = new BackgroundAtmosphere(this.dom.floatingIconsContainer, this.state.backgroundAnimation);
      this.atmosphere.init();

      this.bindEvents();
      this.updateTogglesUI();
      this.init();
    }

    cacheDom() {
      this.dom = {
        appHeaderTitle: document.getElementById('appHeaderTitle'),
        headerHomeBtn: document.getElementById('headerHomeBtn'),
        headerBackBtn: document.getElementById('headerBackBtn'),
        quickSoundBtn: document.getElementById('quickSoundBtn'),
        quickSoundIcon: document.getElementById('quickSoundIcon'),
        floatingIconsContainer: document.getElementById('floatingIconsContainer'),

        // Views
        statusView: document.getElementById('statusView'),
        statusTitle: document.getElementById('statusTitle'),
        statusMessage: document.getElementById('statusMessage'),
        statusRetryBtn: document.getElementById('statusRetryBtn'),

        menuView: document.getElementById('menuView'),
        playTodayBtn: document.getElementById('playTodayBtn'),
        playTodayTitle: document.getElementById('playTodayTitle'),
        menuTodayBadge: document.getElementById('menuTodayBadge'),
        menuReleaseDate: document.getElementById('menuReleaseDate'),
        openVaultBtn: document.getElementById('openVaultBtn'),
        vaultCountBadge: document.getElementById('vaultCountBadge'),
        openSettingsBtn: document.getElementById('openSettingsBtn'),
        openHowToPlayBtn: document.getElementById('openHowToPlayBtn'),

        // Utility Row
        statsUtilityBtn: document.getElementById('statsUtilityBtn'),
        shareUtilityBtn: document.getElementById('shareUtilityBtn'),
        plusUtilityBtn: document.getElementById('plusUtilityBtn'),

        // Game View
        gameView: document.getElementById('gameView'),
        gameModeBadge: document.getElementById('gameModeBadge'),
        stepperTrack: document.getElementById('stepperTrack'),
        questionCounterLabel: document.getElementById('questionCounterLabel'),
        questionText: document.getElementById('questionText'),
        optionsContainer: document.getElementById('optionsContainer'),
        explanationPanel: document.getElementById('explanationPanel'),
        answerIndicator: document.getElementById('answerIndicator'),
        explanationText: document.getElementById('explanationText'),
        nextQuestionBtn: document.getElementById('nextQuestionBtn'),

        // Results View
        resultsView: document.getElementById('resultsView'),
        resultsHeadline: document.getElementById('resultsHeadline'),
        scoreValue: document.getElementById('scoreValue'),
        scoreTotal: document.getElementById('scoreTotal'),
        resultsBreakdown: document.getElementById('resultsBreakdown'),
        resultsStreakValue: document.getElementById('resultsStreakValue'),
        resultsAccuracyValue: document.getElementById('resultsAccuracyValue'),
        shareScoreBtn: document.getElementById('shareScoreBtn'),
        reviewQuizBtn: document.getElementById('reviewQuizBtn'),
        resultsVaultBtn: document.getElementById('resultsVaultBtn'),
        resultsMenuBtn: document.getElementById('resultsMenuBtn'),

        // Vault View
        vaultView: document.getElementById('vaultView'),
        vaultList: document.getElementById('vaultList'),
        vaultEmptyMsg: document.getElementById('vaultEmptyMsg'),
        vaultTotalBadge: document.getElementById('vaultTotalBadge'),

        // Drawers & Backdrop
        panelBackdrop: document.getElementById('panelBackdrop'),
        howToPlayDrawer: document.getElementById('howToPlayDrawer'),
        closeHowToBtn: document.getElementById('closeHowToBtn'),

        settingsDrawer: document.getElementById('settingsDrawer'),
        closeSettingsBtn: document.getElementById('closeSettingsBtn'),
        toggleAnimationBtn: document.getElementById('toggleAnimationBtn'),
        toggleSoundBtn: document.getElementById('toggleSoundBtn'),
        resetDataBtn: document.getElementById('resetDataBtn'),

        statsDrawer: document.getElementById('statsDrawer'),
        closeStatsBtn: document.getElementById('closeStatsBtn'),
        statPlayed: document.getElementById('statPlayed'),
        statAccuracy: document.getElementById('statAccuracy'),
        statCurrentStreak: document.getElementById('statCurrentStreak'),
        statBestStreak: document.getElementById('statBestStreak'),
        scoreDistributionChart: document.getElementById('scoreDistributionChart'),

        toastMessage: document.getElementById('toastMessage')
      };
    }

    bindEvents() {
      // Header Back
      this.dom.headerBackBtn.addEventListener('click', () => {
        this.sound.tap();
        this.showView('menuView');
      });

      // Sound Quick Toggle
      this.dom.quickSoundBtn.addEventListener('click', () => {
        this.toggleSound();
      });

      // Status Retry
      this.dom.statusRetryBtn.addEventListener('click', () => {
        this.sound.tap();
        this.init();
      });

      // Primary Menu Actions (Single tap response)
      this.dom.playTodayBtn.addEventListener('click', () => {
        this.sound.tap();
        this.startRound(this.currentActiveDate);
      });

      this.dom.openVaultBtn.addEventListener('click', () => {
        this.sound.tap();
        this.renderVault();
      });

      this.dom.openSettingsBtn.addEventListener('click', () => {
        this.sound.tap();
        this.openDrawer(this.dom.settingsDrawer);
      });

      this.dom.openHowToPlayBtn.addEventListener('click', () => {
        this.sound.tap();
        this.openDrawer(this.dom.howToPlayDrawer);
      });

      // Utility Row Actions
      this.dom.statsUtilityBtn.addEventListener('click', () => {
        this.sound.tap();
        this.renderStats();
        this.openDrawer(this.dom.statsDrawer);
      });

      this.dom.shareUtilityBtn.addEventListener('click', () => {
        this.sound.tap();
        this.shareGameLink();
      });

      this.dom.plusUtilityBtn.addEventListener('click', () => {
        this.sound.tap();
        window.location.href = CONFIG.plusUrl;
      });

      // Drawer Close Events
      this.dom.closeHowToBtn.addEventListener('click', () => this.closeActiveDrawer());
      this.dom.closeSettingsBtn.addEventListener('click', () => this.closeActiveDrawer());
      this.dom.closeStatsBtn.addEventListener('click', () => this.closeActiveDrawer());
      this.dom.panelBackdrop.addEventListener('click', () => this.closeActiveDrawer());

      // Settings Toggles
      this.dom.toggleAnimationBtn.addEventListener('click', () => {
        this.state.backgroundAnimation = !this.state.backgroundAnimation;
        Storage.save(this.state);
        this.atmosphere.setEnabled(this.state.backgroundAnimation);
        this.updateTogglesUI();
        this.sound.tap();
      });

      this.dom.toggleSoundBtn.addEventListener('click', () => {
        this.toggleSound();
      });

      this.dom.resetDataBtn.addEventListener('click', () => {
        if (window.confirm('Reset all Daily Quiz streaks and history on this device?')) {
          localStorage.removeItem(CONFIG.storageKey);
          this.state = Storage.load();
          this.sound.enabled = this.state.sound;
          this.atmosphere.setEnabled(this.state.backgroundAnimation);
          this.updateTogglesUI();
          this.renderMenu();
          this.closeActiveDrawer();
          this.showToast('Progress reset.');
        }
      });

      // Next Question / Complete
      this.dom.nextQuestionBtn.addEventListener('click', () => {
        this.sound.tap();
        this.handleNextQuestion();
      });

      // Results Actions
      this.dom.shareScoreBtn.addEventListener('click', () => this.shareScoreResult());
      this.dom.reviewQuizBtn.addEventListener('click', () => {
        this.sound.tap();
        this.startReview();
      });
      this.dom.resultsVaultBtn.addEventListener('click', () => {
        this.sound.tap();
        this.renderVault();
      });
      this.dom.resultsMenuBtn.addEventListener('click', () => {
        this.sound.tap();
        this.showView('menuView');
      });

      // Keyboard escape closes active drawer
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeDrawer) {
          this.closeActiveDrawer();
        }
      });
    }

    toggleSound() {
      this.sound.enabled = !this.sound.enabled;
      this.state.sound = this.sound.enabled;
      Storage.save(this.state);
      this.updateTogglesUI();
      if (this.sound.enabled) this.sound.tap();
    }

    updateTogglesUI() {
      this.dom.quickSoundIcon.textContent = this.sound.enabled ? '🔊' : '🔇';
      this.dom.toggleSoundBtn.setAttribute('aria-checked', String(this.sound.enabled));
      this.dom.toggleSoundBtn.querySelector('.toggle-state').textContent = this.sound.enabled ? 'ON' : 'OFF';

      this.dom.toggleAnimationBtn.setAttribute('aria-checked', String(this.state.backgroundAnimation));
      this.dom.toggleAnimationBtn.querySelector('.toggle-state').textContent = this.state.backgroundAnimation ? 'ON' : 'OFF';
    }

    // --- DRAWER INTERACTION (STRICT RIGHT -> LEFT HORIZONTAL TRANSITION) ---
    openDrawer(drawerEl) {
      if (this.activeDrawer && this.activeDrawer !== drawerEl) {
        this.activeDrawer.classList.remove('open');
        this.activeDrawer.hidden = true;
      }
      this.activeDrawer = drawerEl;
      this.dom.panelBackdrop.classList.remove('hidden');

      drawerEl.hidden = false;
      void drawerEl.offsetWidth;

      this.dom.panelBackdrop.classList.add('visible');
      drawerEl.classList.add('open');

      const closeBtn = drawerEl.querySelector('.drawer-close-btn');
      if (closeBtn) closeBtn.focus();
    }

    closeActiveDrawer() {
      if (!this.activeDrawer) return;
      this.sound.tap();
      const target = this.activeDrawer;
      this.activeDrawer = null;

      target.classList.remove('open');
      this.dom.panelBackdrop.classList.remove('visible');

      setTimeout(() => {
        target.hidden = true;
        this.dom.panelBackdrop.classList.add('hidden');
      }, 410);
    }

    showView(viewName) {
      const views = ['statusView', 'menuView', 'gameView', 'resultsView', 'vaultView'];
      views.forEach(v => this.dom[v].classList.add('hidden'));
      this.dom[viewName].classList.remove('hidden');

      if (viewName === 'menuView') {
        this.dom.appHeaderTitle.textContent = 'Daily Quiz';
        this.dom.headerHomeBtn.classList.remove('hidden');
        this.dom.headerBackBtn.classList.add('hidden');
        this.renderMenu();
      } else if (viewName === 'gameView') {
        this.dom.appHeaderTitle.textContent = this.activeRound
          ? (this.activeRound.date === this.currentActiveDate ? 'Daily Quiz' : `Vault: ${this.activeRound.date}`)
          : 'Daily Quiz';
        this.dom.headerHomeBtn.classList.add('hidden');
        this.dom.headerBackBtn.classList.remove('hidden');
      } else if (viewName === 'vaultView') {
        this.dom.appHeaderTitle.textContent = 'The Vault';
        this.dom.headerHomeBtn.classList.add('hidden');
        this.dom.headerBackBtn.classList.remove('hidden');
      } else if (viewName === 'resultsView') {
        this.dom.appHeaderTitle.textContent = 'Summary';
        this.dom.headerHomeBtn.classList.add('hidden');
        this.dom.headerBackBtn.classList.remove('hidden');
      } else {
        this.dom.appHeaderTitle.textContent = 'Daily Quiz';
        this.dom.headerHomeBtn.classList.remove('hidden');
        this.dom.headerBackBtn.classList.add('hidden');
      }
      window.scrollTo(0, 0);
    }

    // --- DATA INITIALIZATION & TIME SYNCHRONIZATION ---
    async init() {
      this.dom.statusTitle.textContent = 'Synchronizing';
      this.dom.statusMessage.textContent = 'Loading authoritative release schedule and puzzles...';
      this.dom.statusRetryBtn.classList.add('hidden');
      this.showView('statusView');

      try {
        const [csvRes] = await Promise.all([
          fetch(CONFIG.csvPath, { cache: 'no-store' }),
          this.clock.sync()
        ]);

        if (!csvRes.ok) throw new Error('Could not retrieve puzzles.csv.');
        const csvRaw = await csvRes.text();
        const records = parseCsv(csvRaw);

        this.roundsByDate = {};
        records.forEach(row => {
          if (!row.date) return;
          if (!this.roundsByDate[row.date]) this.roundsByDate[row.date] = [];
          this.roundsByDate[row.date].push({
            question: row.question || 'Question content not found.',
            options: [
              row.option_a || 'Option A',
              row.option_b || 'Option B',
              row.option_c || 'Option C',
              row.option_d || 'Option D'
            ],
            answerIndex: resolveAnswerIndex(row.answer),
            explanation: row.explanation || ''
          });
        });

        const allDates = Object.keys(this.roundsByDate).sort();
        if (allDates.length === 0) throw new Error('No valid quiz entries found in database.');

        // Establish Authoritative UK Date
        this.todayUkDate = this.clock.getTodayUkDateString();

        // Release Boundaries: Future content strictly locked
        const releasedDates = allDates.filter(d => d <= this.todayUkDate);

        if (this.roundsByDate[this.todayUkDate]) {
          this.currentActiveDate = this.todayUkDate;
          this.vaultDates = releasedDates.filter(d => d < this.todayUkDate);
        } else {
          // If today's puzzle is not authored yet, fallback to latest released puzzle
          if (releasedDates.length > 0) {
            this.currentActiveDate = releasedDates[releasedDates.length - 1];
            this.vaultDates = releasedDates.slice(0, -1);
          } else {
            this.currentActiveDate = allDates[0];
            this.vaultDates = [];
          }
        }

        // Vault ordered newest first
        this.vaultDates.sort((a, b) => b.localeCompare(a));
        this.showView('menuView');

      } catch (err) {
        this.dom.statusTitle.textContent = 'Connection Notice';
        this.dom.statusMessage.textContent = err.message || 'Unable to initialize puzzle data at this time.';
        this.dom.statusRetryBtn.classList.remove('hidden');
        this.showView('statusView');
      }
    }

    renderMenu() {
      this.dom.vaultCountBadge.textContent = `${this.vaultDates.length} Past`;

      if (!this.currentActiveDate) {
        this.dom.playTodayTitle.textContent = 'No Quiz Available';
        this.dom.menuReleaseDate.textContent = 'Check back later';
        this.dom.playTodayBtn.disabled = true;
        return;
      }

      this.dom.playTodayBtn.disabled = false;
      this.dom.menuReleaseDate.textContent = `Release: ${this.currentActiveDate} • 5 Questions`;

      const hist = this.state.history[this.currentActiveDate];
      const inProg = this.state.inProgress && this.state.inProgress.date === this.currentActiveDate;

      if (hist && hist.completed) {
        this.dom.playTodayTitle.textContent = 'View Today\'s Results';
        this.dom.menuTodayBadge.textContent = `Completed (${hist.score}/${hist.answers.length})`;
        this.dom.menuTodayBadge.className = 'badge completed';
      } else if (inProg) {
        const count = inProg.answers ? inProg.answers.length : 0;
        const total = this.roundsByDate[this.currentActiveDate].length;
        this.dom.playTodayTitle.textContent = 'Resume Daily Quiz';
        this.dom.menuTodayBadge.textContent = `In Progress (${count}/${total})`;
        this.dom.menuTodayBadge.className = 'badge';
      } else {
        this.dom.playTodayTitle.textContent = 'Play Daily Quiz';
        this.dom.menuTodayBadge.textContent = 'Ready';
        this.dom.menuTodayBadge.className = 'badge';
      }
    }

    startRound(dateStr) {
      const questions = this.roundsByDate[dateStr];
      if (!questions || questions.length === 0) return;

      this.activeRound = { date: dateStr, questions: questions };
      this.isReview = false;
      this.selectedAnswer = null;

      const hist = this.state.history[dateStr];
      if (hist && hist.completed) {
        this.sessionAnswers = hist.answers;
        this.showResults(hist.score);
        return;
      }

      const isCurrent = (dateStr === this.currentActiveDate);
      if (isCurrent && this.state.inProgress && this.state.inProgress.date === dateStr) {
        this.currentIndex = this.state.inProgress.currentIndex || 0;
        this.sessionAnswers = this.state.inProgress.answers || [];
      } else {
        this.currentIndex = 0;
        this.sessionAnswers = [];
      }

      this.dom.gameModeBadge.textContent = isCurrent ? `Daily Release • ${dateStr}` : `Vault Archive • ${dateStr}`;
      this.showView('gameView');
      this.renderQuestion();
    }

    renderQuestion() {
      const q = this.activeRound.questions[this.currentIndex];
      const total = this.activeRound.questions.length;
      this.selectedAnswer = null;

      this.dom.questionCounterLabel.textContent = `Question ${this.currentIndex + 1} of ${total}`;
      this.dom.questionText.textContent = q.question;
      this.dom.explanationPanel.classList.add('hidden');
      this.dom.optionsContainer.innerHTML = '';
      this.updateStepper();

      const labels = ['A', 'B', 'C', 'D'];
      q.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.type = 'button';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.innerHTML = `<span class="option-key">${labels[idx]}</span><span>${optText}</span>`;

        btn.addEventListener('click', () => {
          this.selectOption(idx);
        });

        this.dom.optionsContainer.appendChild(btn);
      });

      const isLast = (this.currentIndex === total - 1);
      this.dom.nextQuestionBtn.textContent = isLast ? 'Complete Quiz' : 'Next Question';
    }

    updateStepper() {
      this.dom.stepperTrack.innerHTML = '';
      this.activeRound.questions.forEach((_, idx) => {
        const pip = document.createElement('div');
        pip.className = 'step-pip';
        pip.textContent = idx + 1;
        pip.setAttribute('aria-label', `Question ${idx + 1}`);

        if (idx === this.currentIndex) {
          pip.classList.add('current');
        } else if (idx < this.sessionAnswers.length) {
          pip.classList.add(this.sessionAnswers[idx].isCorrect ? 'correct' : 'incorrect');
        }
        this.dom.stepperTrack.appendChild(pip);
      });
    }

    selectOption(idx) {
      if (this.selectedAnswer !== null) return;
      this.selectedAnswer = idx;

      const q = this.activeRound.questions[this.currentIndex];
      const isCorrect = (idx === q.answerIndex);
      this.sessionAnswers.push({ chosen: idx, isCorrect });

      if (isCorrect) {
        this.sound.correct();
        this.dom.answerIndicator.textContent = '✓ Correct';
        this.dom.answerIndicator.className = 'badge completed';
      } else {
        this.sound.incorrect();
        this.dom.answerIndicator.textContent = '✕ Incorrect';
        this.dom.answerIndicator.className = 'badge';
        this.dom.answerIndicator.style.borderColor = 'var(--color-incorrect-border)';
        this.dom.answerIndicator.style.color = 'var(--color-incorrect-text)';
      }

      // Visual feedback on choices
      const buttons = this.dom.optionsContainer.querySelectorAll('.option-btn');
      buttons.forEach((btn, bIdx) => {
        btn.disabled = true;
        if (bIdx === q.answerIndex) {
          btn.classList.add('correct');
        } else if (bIdx === idx && !isCorrect) {
          btn.classList.add('incorrect');
        }
        if (bIdx === idx) {
          btn.setAttribute('aria-checked', 'true');
        }
      });

      this.dom.explanationText.textContent = q.explanation || 'Verified reference answer.';
      this.dom.explanationPanel.classList.remove('hidden');
      this.updateStepper();

      if (this.activeRound.date === this.currentActiveDate) {
        this.state.inProgress = {
          date: this.currentActiveDate,
          currentIndex: this.currentIndex,
          answers: this.sessionAnswers
        };
        Storage.save(this.state);
      }

      this.dom.nextQuestionBtn.focus();
    }

    handleNextQuestion() {
      if (this.isReview) {
        if (this.currentIndex < this.activeRound.questions.length - 1) {
          this.currentIndex++;
          this.renderReviewQuestion();
        } else {
          this.showView('resultsView');
        }
        return;
      }

      if (this.currentIndex < this.activeRound.questions.length - 1) {
        this.currentIndex++;
        if (this.activeRound.date === this.currentActiveDate && this.state.inProgress) {
          this.state.inProgress.currentIndex = this.currentIndex;
          Storage.save(this.state);
        }
        this.renderQuestion();
      } else {
        this.finishRound();
      }
    }

    finishRound() {
      const score = this.sessionAnswers.filter(a => a.isCorrect).length;
      const isCurrent = (this.activeRound.date === this.currentActiveDate);

      if (isCurrent) {
        if (this.state.lastCompletedDate) {
          const last = new Date(this.state.lastCompletedDate);
          const curr = new Date(this.currentActiveDate);
          const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            this.state.streak = (this.state.streak || 0) + 1;
          } else if (diffDays > 1) {
            this.state.streak = 1;
          }
        } else {
          this.state.streak = 1;
        }

        if (this.state.streak > (this.state.bestStreak || 0)) {
          this.state.bestStreak = this.state.streak;
        }
        this.state.lastCompletedDate = this.currentActiveDate;
        this.state.inProgress = null;
      }

      this.state.history[this.activeRound.date] = {
        completed: true,
        score: score,
        answers: this.sessionAnswers
      };
      Storage.save(this.state);

      this.sound.complete();
      this.showResults(score);
    }

    showResults(score) {
      this.showView('resultsView');
      const total = this.sessionAnswers.length;
      this.dom.scoreValue.textContent = score;
      this.dom.scoreTotal.textContent = `/ ${total}`;

      this.dom.resultsStreakValue.textContent = this.state.streak || 0;
      const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
      this.dom.resultsAccuracyValue.textContent = `${accuracy}%`;

      this.dom.resultsBreakdown.innerHTML = '';
      this.sessionAnswers.forEach((ans, idx) => {
        const pip = document.createElement('div');
        pip.className = `result-pip ${ans.isCorrect ? 'correct' : 'incorrect'}`;
        pip.textContent = ans.isCorrect ? '✓' : '✕';
        pip.setAttribute('aria-label', `Question ${idx + 1}: ${ans.isCorrect ? 'Correct' : 'Incorrect'}`);
        this.dom.resultsBreakdown.appendChild(pip);
      });
    }

    startReview() {
      this.isReview = true;
      this.currentIndex = 0;
      this.showView('gameView');
      this.renderReviewQuestion();
    }

    renderReviewQuestion() {
      const q = this.activeRound.questions[this.currentIndex];
      const total = this.activeRound.questions.length;
      const ans = this.sessionAnswers[this.currentIndex] || { chosen: -1, isCorrect: false };
      this.updateStepper();

      this.dom.questionCounterLabel.textContent = `Reviewing ${this.currentIndex + 1} of ${total}`;
      this.dom.questionText.textContent = q.question;
      this.dom.optionsContainer.innerHTML = '';
      const labels = ['A', 'B', 'C', 'D'];

      q.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.disabled = true;
        if (idx === q.answerIndex) {
          btn.classList.add('correct');
        } else if (idx === ans.chosen && !ans.isCorrect) {
          btn.classList.add('incorrect');
        }
        btn.innerHTML = `<span class="option-key">${labels[idx]}</span><span>${optText}</span>`;
        this.dom.optionsContainer.appendChild(btn);
      });

      if (ans.isCorrect) {
        this.dom.answerIndicator.textContent = '✓ Correct';
        this.dom.answerIndicator.className = 'badge completed';
      } else {
        this.dom.answerIndicator.textContent = '✕ Incorrect';
        this.dom.answerIndicator.className = 'badge';
        this.dom.answerIndicator.style.borderColor = 'var(--color-incorrect-border)';
        this.dom.answerIndicator.style.color = 'var(--color-incorrect-text)';
      }

      this.dom.explanationText.textContent = q.explanation || 'Verified reference answer.';
      this.dom.explanationPanel.classList.remove('hidden');

      const isLast = (this.currentIndex === total - 1);
      this.dom.nextQuestionBtn.textContent = isLast ? 'Return to Summary' : 'Next Question';
    }

    renderVault() {
      this.showView('vaultView');
      this.dom.vaultList.innerHTML = '';
      this.dom.vaultTotalBadge.textContent = `${this.vaultDates.length} Puzzles`;

      if (this.vaultDates.length === 0) {
        this.dom.vaultEmptyMsg.classList.remove('hidden');
        return;
      }
      this.dom.vaultEmptyMsg.classList.add('hidden');

      this.vaultDates.forEach(dateStr => {
        const row = document.createElement('button');
        row.className = 'vault-row';
        row.type = 'button';

        const hist = this.state.history[dateStr];
        const isDone = hist && hist.completed;

        row.innerHTML = `
          <span class="vault-row-date">${dateStr}</span>
          <span class="badge ${isDone ? 'completed' : ''}">
            ${isDone ? `Score: ${hist.score}/${hist.answers.length}` : 'Play'}
          </span>
        `;

        row.addEventListener('click', () => {
          this.sound.tap();
          this.startRound(dateStr);
        });

        this.dom.vaultList.appendChild(row);
      });
    }

    renderStats() {
      const completedEntries = Object.values(this.state.history).filter(h => h.completed);
      const playedCount = completedEntries.length;

      let totalQuestions = 0;
      let totalCorrect = 0;
      const scoreDist = [0, 0, 0, 0, 0, 0];

      completedEntries.forEach(item => {
        const score = item.score || 0;
        if (score >= 0 && score <= 5) scoreDist[score]++;
        totalCorrect += score;
        totalQuestions += (item.answers ? item.answers.length : 5);
      });

      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      this.dom.statPlayed.textContent = playedCount;
      this.dom.statAccuracy.textContent = `${accuracy}%`;
      this.dom.statCurrentStreak.textContent = this.state.streak || 0;
      this.dom.statBestStreak.textContent = this.state.bestStreak || (this.state.streak || 0);

      this.dom.scoreDistributionChart.innerHTML = '';
      const maxDist = Math.max(...scoreDist, 1);

      for (let s = 5; s >= 0; s--) {
        const count = scoreDist[s];
        const pct = Math.max(Math.round((count / maxDist) * 100), 10);
        const row = document.createElement('div');
        row.className = 'dist-bar-row';
        row.innerHTML = `
          <span class="dist-bar-num">${s}</span>
          <div class="dist-bar-track">
            <div class="dist-bar-fill" style="width: ${count > 0 ? pct : 0}%;">${count}</div>
          </div>
        `;
        this.dom.scoreDistributionChart.appendChild(row);
      }
    }

    shareGameLink() {
      const shareData = {
        title: 'Daily Quiz',
        text: 'Test your general knowledge with today\'s Daily Quiz challenge!',
        url: window.location.href
      };

      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href)
          .then(() => this.showToast('Link copied to clipboard!'))
          .catch(() => this.showToast('Unable to copy link.'));
      } else {
        this.showToast('Sharing not supported on this browser.');
      }
    }

    shareScoreResult() {
      const score = this.sessionAnswers.filter(a => a.isCorrect).length;
      const total = this.sessionAnswers.length;
      const pips = this.sessionAnswers.map(a => a.isCorrect ? '🟩' : '⬛').join('');
      const text = `Daily Quiz • ${this.activeRound.date}\nScore: ${score}/${total}\n${pips}\n${window.location.href}`;

      if (navigator.share) {
        navigator.share({ title: 'Daily Quiz Result', text }).catch(() => {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => this.showToast('Result copied to clipboard!'))
          .catch(() => this.showToast('Unable to copy result.'));
      } else {
        this.showToast('Sharing not supported on this browser.');
      }
    }

    showToast(message) {
      this.dom.toastMessage.textContent = message;
      this.dom.toastMessage.classList.add('visible');
      setTimeout(() => {
        this.dom.toastMessage.classList.remove('visible');
      }, 2300);
    }
  }

  // Self-bootstrapping
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DailyQuizApp());
  } else {
    new DailyQuizApp();
  }
})();