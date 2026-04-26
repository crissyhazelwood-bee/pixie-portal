// portal-memory.js — Pixie Portal Memory System v2
// The portal remembers. The world changes around you.
// No announcements. No quest log. It just happens.

(function () {
    const KEY         = 'ppMem';
    const SESSION_KEY = 'ppSess';
    const SCHEMA_VER  = 2;

    // ---- Schema defaults ----
    const defaults = {
        schemaVersion : SCHEMA_VER,
        firstVisit    : null,
        visitCount    : 0,
        lastVisit     : null,
        pageHits      : {},       // { page: loadCount }
        gameCount     : {},       // { game: timesStarted }
        wishCount     : 0,
        tarotDrawCount: 0,
        journalCount  : 0,
        sigilClicks   : 0,
        rareEventsSeen: [],
        appLaunches   : 0,
    };

    // ---- Storage helpers ----
    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw) return Object.assign({}, defaults);
            const parsed = JSON.parse(raw);
            // Migrate v1 → v2: ensure new fields exist
            return Object.assign({}, defaults, parsed, { schemaVersion: SCHEMA_VER });
        } catch (e) { return Object.assign({}, defaults); }
    }

    function save(m) {
        try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {}
    }

    function getSession() {
        try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}'); } catch { return {}; }
    }

    function saveSession(s) {
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
    }

    // ---- Query param overrides (dev/QA only) ----
    const params = new URLSearchParams(window.location.search);

    if (params.get('memoryReset') === '1') {
        localStorage.removeItem(KEY);
        sessionStorage.removeItem(SESSION_KEY);
        const clean = new URL(window.location.href);
        clean.searchParams.delete('memoryReset');
        window.location.replace(clean.toString());
        return;
    }

    const mem = load();

    // Override state for testing without writing to storage
    const memOverride = params.get('memory');
    let _visitOverride = null, _hourOverride = null;
    if (memOverride === 'returning') _visitOverride = 3;
    if (memOverride === 'frequent')  _visitOverride = 7;
    if (memOverride === 'devout')    _visitOverride = 20;
    if (memOverride === 'late')      _hourOverride  = 23;

    const debugMode = params.get('debugMemory') === '1';

    // ---- Context ----
    const now  = new Date();
    const hour = _hourOverride !== null ? _hourOverride : now.getHours();
    const path = window.location.pathname;
    const page = (path === '/' || path.match(/index/)) ? 'home'
        : path.replace(/^\//, '').replace(/\.html$/, '');

    // Native app detection (Capacitor)
    const _isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform &&
        window.Capacitor.isNativePlatform());

    // New session? (30+ min gap, or first ever)
    const isNewSession = !mem.lastVisit ||
        (Date.now() - new Date(mem.lastVisit).getTime()) > 30 * 60 * 1000;

    // ---- Record this visit ----
    if (!mem.firstVisit) mem.firstVisit = now.toISOString();
    mem.lastVisit = now.toISOString();
    if (isNewSession) {
        mem.visitCount = (mem.visitCount || 0) + 1;
        if (_isNative) mem.appLaunches = (mem.appLaunches || 0) + 1;
    }
    mem.pageHits[page] = (mem.pageHits[page] || 0) + 1;
    save(mem);

    // ---- State helpers ----
    const _visits    = () => _visitOverride !== null ? _visitOverride : (mem.visitCount || 0);
    const portalHits = () => mem.pageHits['the_portal'] || 0;
    const wellHits   = () => mem.pageHits['wishing_well'] || 0;
    const siteVisits = _visits;

    const isReturning  = () => _visits() >= 2;
    const isFrequent   = () => _visits() >= 5;
    const isDevout     = () => _visits() >= 15;
    const isLateNight  = () => hour >= 22 || hour <= 4;
    const isVeryLate   = () => hour >= 1 && hour <= 4;
    const isNativeApp  = () => _isNative;

    const totalPageHits = () => Object.values(mem.pageHits).reduce((a, b) => a + b, 0);
    const totalGames    = () => Object.values(mem.gameCount || {}).reduce((a, b) => a + b, 0);

    const hasSeenRareEvent = (name) => (mem.rareEventsSeen || []).includes(name);

    const daysSince = (isoDate) => {
        if (!isoDate) return null;
        return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
    };
    const daysSinceFirstVisit = () => daysSince(mem.firstVisit);
    const daysSinceLastVisit  = () => {
        if (!mem.lastVisit) return null;
        // lastVisit was just set to now, use previous session gap
        return 0; // caller should track this themselves if needed
    };

    const apiBase = () => _isNative ? 'https://pixie-portal.com' : '';

    // ---- Rare event engine ----
    // Max 1 per session. Weighted by eligibility. Records once seen.
    function tryRareEvent() {
        const sess = getSession();
        if (sess.rareEventFired) return null;

        const candidates = [];

        if (isLateNight() && isReturning() && !hasSeenRareEvent('late_night_whisper'))
            candidates.push({ name: 'late_night_whisper', weight: 3 });

        if ((mem.sigilClicks || 0) >= 1 && !hasSeenRareEvent('sigil_wake'))
            candidates.push({ name: 'sigil_wake', weight: 2 });

        if ((mem.wishCount || 0) >= 3 && page === 'wishing_well' && !hasSeenRareEvent('well_echo'))
            candidates.push({ name: 'well_echo', weight: 2 });

        if (portalHits() >= 5 && page === 'the_portal' && !hasSeenRareEvent('garden_breath'))
            candidates.push({ name: 'garden_breath', weight: 2 });

        if ((mem.tarotDrawCount || 0) >= 2 && !hasSeenRareEvent('tarot_repeat'))
            candidates.push({ name: 'tarot_repeat', weight: 1 });

        if ((mem.journalCount || 0) >= 1 && isReturning() && !hasSeenRareEvent('journal_stirred'))
            candidates.push({ name: 'journal_stirred', weight: 1 });

        if (!candidates.length) return null;

        // Chance rises with visits, caps at 50%
        const chance = Math.min(0.12 + Math.floor(_visits() / 5) * 0.06, 0.5);
        if (Math.random() > chance) return null;

        // Weighted pick
        const total = candidates.reduce((s, c) => s + c.weight, 0);
        let r = Math.random() * total;
        for (const c of candidates) {
            r -= c.weight;
            if (r <= 0) {
                sess.rareEventFired = c.name;
                saveSession(sess);
                _recordRareEvent(c.name);
                return c.name;
            }
        }
        return null;
    }

    function _recordRareEvent(name) {
        if (!(mem.rareEventsSeen || []).includes(name)) {
            mem.rareEventsSeen.push(name);
            save(mem);
        }
    }

    // ---- The Three Threads ----
    // Fae Mark  → driven by sigilClicks
    // Well Below → driven by wishCount
    // Sleeping Garden → driven by portalHits

    function faeMarkStage() {
        const c = mem.sigilClicks || 0;
        if (c >= 15) return 'awakened';
        if (c >= 7)  return 'chosen';
        if (c >= 3)  return 'returning';
        if (c >= 1)  return 'noticed';
        return 'unseen';
    }

    function wellBelowStage() {
        const w = mem.wishCount || 0;
        if (w >= 15) return 'awakened';
        if (w >= 7)  return 'chosen';
        if (w >= 3)  return 'returning';
        if (w >= 1)  return 'noticed';
        return 'unseen';
    }

    function gardenStage() {
        const h = portalHits();
        if (h >= 20) return 'awakened';
        if (h >= 10) return 'chosen';
        if (h >= 5)  return 'returning';
        if (h >= 2)  return 'noticed';
        return 'unseen';
    }

    // ---- Phrase system ----
    function phrase(key) {
        const fae    = faeMarkStage();
        const well   = wellBelowStage();
        const garden = gardenStage();

        const p = {
            // Homepage hero subtitle
            'home.subtitle':
                isVeryLate()  ? 'the portal never sleeps \u2726 neither do you' :
                isLateNight() ? "you're up late \u2726 the portal is awake" :
                isDevout()    ? 'you keep returning \u2726 the magic knows' :
                isFrequent()  ? 'you keep coming back \u2726 something is growing' :
                isReturning() ? 'welcome back \u2726 the portal remembers' :
                isNativeApp() ? 'the portal is closer now \u2726' :
                                'games \u2726 journal \u2726 magic',

            // Homepage whisper — evolves with the Fae Mark thread
            'home.whisper':
                fae === 'awakened' ? 'the mark is part of you now. everything here knows.' :
                fae === 'chosen'   ? 'you found the mark. it found you back.' :
                fae === 'returning'? 'something in the corner is watching with more interest now.' :
                fae === 'noticed'  ? 'something is different when you look closely.' :
                isVeryLate()       ? 'it is late. the sigil is more visible in the dark.' :
                isDevout()         ? 'the portal has marked you.' :
                isFrequent()       ? 'there are things here that only appear to those who return.' :
                isReturning()      ? 'something is different when you look closely.' :
                                     '',

            // The Portal start screen — Garden thread
            'portal.step':
                garden === 'awakened' ? 'it has been waiting for you.' :
                garden === 'chosen'   ? 'the garden knows your footsteps now.' :
                garden === 'returning'? 'you came back.' :
                garden === 'noticed'  ? 'Step Through' :
                isNativeApp()         ? 'the portal opens.' :
                                        'Step Through',

            // Wishing Well — Well Below thread
            'well.tap':
                well === 'awakened' ? 'it knows what you want now.' :
                well === 'chosen'   ? 'the well has been collecting your wishes.' :
                well === 'returning'? 'something stirs in the water.' :
                well === 'noticed'  ? 'the well remembers your wishes.' :
                wellHits() >= 2     ? 'you came back to wish.' :
                                      'Tap to Play',

            // Well hint below tap text — Well Below thread
            'well.hint':
                well === 'awakened' ? 'it answers differently now.' :
                well === 'returning'? 'there is something under the water.' :
                                      '',

            // Generic game start
            'game.tap':
                totalGames() >= 30 ? 'you know every corner of this world.' :
                totalGames() >= 10 ? 'back again.' :
                                     'Tap to Play',

            // Portal: rare garden glow message (shown once, garden_breath event)
            'portal.rare.garden_breath':
                'one of the flowers opened just now. it had not done that before.',

            // Late night rare whisper
            'home.rare.late_night_whisper':
                'the portal is different after midnight. you already knew that.',

            // Journal stirred
            'journal.rare.journal_stirred':
                'one of your entries shifted while you were away.',
        };
        return p[key] !== undefined ? p[key] : '';
    }

    // ---- DOM application ----
    function applyMemory() {
        // Homepage hero subtitle
        const heroSub = document.querySelector('.hero-subtitle');
        if (heroSub) {
            const t = phrase('home.subtitle');
            if (t) heroSub.textContent = t;
        }

        // Homepage whisper
        if (page === 'home') {
            const whisper = phrase('home.whisper');
            if (whisper && !document.getElementById('memory-whisper')) {
                const hero = document.querySelector('.hero');
                const cta  = document.querySelector('.hero-cta');
                if (hero && cta) {
                    const el = document.createElement('p');
                    el.id = 'memory-whisper';
                    el.style.cssText = [
                        'color:#403050', 'font-size:11px', 'letter-spacing:3px',
                        'text-transform:lowercase', 'text-align:center',
                        'margin:0 0 18px', 'opacity:0', 'transition:opacity 2.5s ease',
                        'font-family:Quicksand,sans-serif',
                    ].join(';');
                    el.textContent = whisper;
                    hero.insertBefore(el, cta);
                    setTimeout(() => { el.style.opacity = '1'; }, 2000);
                }
            }

            // Rare event: late night whisper
            const rareEvent = tryRareEvent();
            if (rareEvent === 'late_night_whisper') {
                setTimeout(() => showFloatingWhisper(phrase('home.rare.late_night_whisper')), 5000);
            }
        }

        // The Portal start screen — Garden thread
        const stepText = document.querySelector('.step-text');
        if (stepText) {
            const t = phrase('portal.step');
            if (t) stepText.textContent = t;

            // Rare: garden_breath — glow the portal orb
            if (!getSession().rareEventFired) {
                const rareEvent = tryRareEvent();
                if (rareEvent === 'garden_breath') {
                    const orb = document.querySelector('.portal-orb');
                    if (orb) {
                        orb.style.filter += ' drop-shadow(0 0 40px rgba(150,255,220,0.9))';
                        setTimeout(() => showFloatingWhisper(phrase('portal.rare.garden_breath')), 3000);
                    }
                }
            }
        }

        // Wishing Well — Well Below thread
        if (page === 'wishing_well') {
            const tapText = document.querySelector('.tap-text');
            if (tapText) {
                const t = phrase('well.tap');
                if (t) tapText.textContent = t;
            }
            // Add hint below if well thread is active
            const wellHint = phrase('well.hint');
            if (wellHint) {
                const hintEl = document.querySelector('.hint');
                if (hintEl && !hintEl.querySelector('.well-thread-hint')) {
                    const hint = document.createElement('div');
                    hint.className = 'well-thread-hint';
                    hint.style.cssText = 'color:#504060;font-size:11px;margin-top:12px;letter-spacing:2px;opacity:0;transition:opacity 2s ease;';
                    hint.textContent = wellHint;
                    hintEl.appendChild(hint);
                    setTimeout(() => { hint.style.opacity = '1'; }, 2500);
                }
                // Rare: well_echo
                const rareEvent = tryRareEvent();
                if (rareEvent === 'well_echo') {
                    setTimeout(() => showFloatingWhisper('the water heard you.'), 4000);
                }
            }
        } else if (page !== 'the_portal') {
            // Other game pages — subtle on return
            if (isReturning()) {
                const tapText = document.querySelector('.tap-text');
                if (tapText) {
                    const t = phrase('game.tap');
                    if (t && t !== 'Tap to Play') tapText.textContent = t;
                }
            }
        }
    }

    // ---- Floating whisper (non-blocking rare event display) ----
    function showFloatingWhisper(text, durationMs = 5000) {
        if (!text) return;
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const el = document.createElement('div');
        el.style.cssText = [
            'position:fixed', 'bottom:80px', 'left:50%',
            'transform:translateX(-50%)',
            'color:#7060a0', 'font-family:Quicksand,sans-serif',
            'font-size:11px', 'letter-spacing:3px',
            'text-align:center', 'pointer-events:none',
            'z-index:9990', 'max-width:280px', 'line-height:1.7',
            prefersReduced ? 'opacity:0.5' : 'opacity:0',
            prefersReduced ? '' : 'transition:opacity 1s ease',
        ].join(';');
        el.textContent = text;
        document.body.appendChild(el);

        if (!prefersReduced) {
            requestAnimationFrame(() => {
                el.style.opacity = '0.55';
                setTimeout(() => {
                    el.style.opacity = '0';
                    setTimeout(() => el.remove(), 1100);
                }, durationMs);
            });
        } else {
            setTimeout(() => el.remove(), durationMs + 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyMemory);
    } else {
        applyMemory();
    }

    // ---- Public API ----
    window.PortalMemory = {
        get         : () => Object.assign({}, mem),
        phrase,
        showFloatingWhisper,

        // State
        isReturning, isFrequent, isDevout, isLateNight, isNativeApp,
        siteVisits, portalHits, wellHits, totalPageHits, totalGames,
        daysSinceFirstVisit,
        hasSeenRareEvent,
        apiBase,

        // Threads
        faeMarkStage, wellBelowStage, gardenStage,

        // Events
        tryRareEvent,

        // Record methods (idempotent increment, single source of truth)
        recordGame(name) {
            if (!mem.gameCount) mem.gameCount = {};
            mem.gameCount[name] = (mem.gameCount[name] || 0) + 1;
            save(mem);
        },
        recordWish() {
            mem.wishCount = (mem.wishCount || 0) + 1;
            save(mem);
        },
        recordTarot() {
            mem.tarotDrawCount = (mem.tarotDrawCount || 0) + 1;
            save(mem);
        },
        recordJournal() {
            mem.journalCount = (mem.journalCount || 0) + 1;
            save(mem);
        },
        recordSigil() {
            // Single source of truth — pixie-sigil.js calls this exclusively
            mem.sigilClicks = (mem.sigilClicks || 0) + 1;
            save(mem);
            return mem.sigilClicks;
        },
        recordRareEvent: _recordRareEvent,

        // Debug / QA
        reset() {
            if (!debugMode && !params.get('memoryReset')) return;
            localStorage.removeItem(KEY);
            sessionStorage.removeItem(SESSION_KEY);
            console.log('[PortalMemory] reset complete');
        },
        debug() {
            console.group('[PortalMemory] state');
            console.log('visits:', _visits(), '| page:', page, '| hour:', hour);
            console.log('fae:', faeMarkStage(), '| well:', wellBelowStage(), '| garden:', gardenStage());
            console.log('sigil:', mem.sigilClicks, '| wishes:', mem.wishCount, '| tarot:', mem.tarotDrawCount);
            console.log('rareEventsSeen:', mem.rareEventsSeen);
            console.log('isNative:', _isNative, '| apiBase:', apiBase());
            console.log('raw:', Object.assign({}, mem));
            console.groupEnd();
        },
    };

    if (debugMode) window.PortalMemory.debug();
})();
