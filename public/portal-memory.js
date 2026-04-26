// portal-memory.js — Pixie Portal Memory System
// The portal remembers. Tracks visits, games, wishes, rare events.
// No UI. No announcements. The world just changes around you.

(function () {
    const KEY = 'ppMem';

    const defaults = {
        firstVisit: null,
        visitCount: 0,      // session count (new session = 30+ min gap)
        lastVisit: null,
        pageHits: {},       // { page: loadCount }
        gameCount: {},      // { game: timesStarted }
        wishCount: 0,
        tarotDrawCount: 0,
        journalCount: 0,
        sigilClicks: 0,
        rareEventsSeen: [],
    };

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw) return Object.assign({}, defaults);
            return Object.assign({}, defaults, JSON.parse(raw));
        } catch (e) { return Object.assign({}, defaults); }
    }

    function save(m) {
        try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {}
    }

    const mem = load();
    const now = new Date();
    const hour = now.getHours();

    // Detect current page from URL
    const path = window.location.pathname;
    const page = (path === '/' || path.match(/index/)) ? 'home'
        : path.replace(/^\//, '').replace(/\.html$/, '');

    // Is this a new session? (more than 30 min since last visit)
    const isNewSession = !mem.lastVisit ||
        (Date.now() - new Date(mem.lastVisit).getTime()) > 30 * 60 * 1000;

    // Record this visit
    if (!mem.firstVisit) mem.firstVisit = now.toISOString();
    mem.lastVisit = now.toISOString();
    if (isNewSession) mem.visitCount = (mem.visitCount || 0) + 1;
    mem.pageHits[page] = (mem.pageHits[page] || 0) + 1;
    save(mem);

    // ---- State helpers ----
    const portalHits  = () => mem.pageHits['the_portal'] || 0;
    const wellHits    = () => mem.pageHits['wishing_well'] || 0;
    const siteVisits  = () => mem.visitCount;
    const isReturning = () => siteVisits() >= 2;
    const isFrequent  = () => siteVisits() >= 5;
    const isDevout    = () => siteVisits() >= 15;
    const isLateNight = () => hour >= 22 || hour <= 4;
    const isVeryLate  = () => hour >= 1 && hour <= 4;
    const totalGames  = () => Object.values(mem.gameCount || {}).reduce((a, b) => a + b, 0);

    // ---- Phrase system ----
    function phrase(key) {
        const p = {
            // Homepage hero subtitle
            'home.subtitle':
                isVeryLate()  ? 'the portal never sleeps \u2726 neither do you' :
                isLateNight() ? "you're up late \u2726 the portal is awake" :
                isDevout()    ? 'you keep returning \u2726 the magic knows' :
                isFrequent()  ? 'you keep coming back \u2726 something is growing' :
                isReturning() ? 'welcome back \u2726 the portal remembers' :
                                'games \u2726 journal \u2726 magic',

            // Subtle whisper line below hero subtitle (blank if nothing to say)
            'home.whisper':
                isVeryLate()  ? 'it is late. the sigil is more visible in the dark.' :
                isDevout()    ? 'the portal has marked you.' :
                isFrequent()  ? 'there are things here that only appear to those who return.' :
                isReturning() ? 'something is different when you look closely.' :
                                '',

            // The Portal start screen — based on portal-specific visits
            'portal.step':
                portalHits() >= 10 ? 'the roots remember you.' :
                portalHits() >= 5  ? 'the garden knows your footsteps now.' :
                portalHits() >= 2  ? 'you came back.' :
                                     'Step Through',

            // Wishing Well start screen — based on wish count + well visits
            'well.tap':
                mem.wishCount >= 10 ? 'something stirs in the water.' :
                mem.wishCount >= 3  ? 'the well remembers your wishes.' :
                wellHits() >= 2     ? 'you came back to wish.' :
                                      'Tap to Play',

            // Generic game start screens — based on total games played
            'game.tap':
                totalGames() >= 30 ? 'you know every corner of this world.' :
                totalGames() >= 10 ? 'back again.' :
                isReturning()      ? 'Tap to Play' :
                                     'Tap to Play',
        };
        return p[key] !== undefined ? p[key] : '';
    }

    // ---- DOM application ----
    // Runs automatically on load. Finds known elements and shifts their text.
    function applyMemory() {
        // Homepage hero subtitle
        const heroSub = document.querySelector('.hero-subtitle');
        if (heroSub) {
            const t = phrase('home.subtitle');
            if (t) heroSub.textContent = t;
        }

        // Homepage whisper (injected below subtitle, fades in slowly)
        if (page === 'home') {
            const whisper = phrase('home.whisper');
            if (whisper && !document.getElementById('memory-whisper')) {
                const hero = document.querySelector('.hero');
                const cta  = document.querySelector('.hero-cta');
                if (hero && cta) {
                    const el = document.createElement('p');
                    el.id = 'memory-whisper';
                    el.style.cssText = [
                        'color:#403050',
                        'font-size:11px',
                        'letter-spacing:3px',
                        'text-transform:lowercase',
                        'text-align:center',
                        'margin:0 0 18px',
                        'opacity:0',
                        'transition:opacity 2.5s ease',
                        'font-family:Quicksand,sans-serif',
                    ].join(';');
                    el.textContent = whisper;
                    hero.insertBefore(el, cta);
                    setTimeout(() => { el.style.opacity = '1'; }, 2000);
                }
            }
        }

        // The Portal start screen
        const stepText = document.querySelector('.step-text');
        if (stepText) {
            const t = phrase('portal.step');
            if (t) stepText.textContent = t;
        }

        // Wishing Well start screen
        if (page === 'wishing_well') {
            const tapText = document.querySelector('.tap-text');
            if (tapText) {
                const t = phrase('well.tap');
                if (t) tapText.textContent = t;
            }
        } else {
            // Other game pages — only change on return visits
            if (isReturning()) {
                const tapText = document.querySelector('.tap-text');
                if (tapText) {
                    const t = phrase('game.tap');
                    if (t && t !== 'Tap to Play') tapText.textContent = t;
                }
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyMemory);
    } else {
        applyMemory();
    }

    // ---- Public API ----
    window.PortalMemory = {
        get: () => Object.assign({}, mem),
        phrase,

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
            mem.sigilClicks = (mem.sigilClicks || 0) + 1;
            save(mem);
            return mem.sigilClicks;
        },
        recordRareEvent(name) {
            if (!mem.rareEventsSeen.includes(name)) {
                mem.rareEventsSeen.push(name);
                save(mem);
            }
        },

        isReturning,
        isFrequent,
        isDevout,
        isLateNight,
        siteVisits,
        portalHits,
        wishCount: () => mem.wishCount,
        sigilClicks: () => mem.sigilClicks,
    };
})();
