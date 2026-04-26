// pixie-sigil.js — The Fae Mark
// A recurring symbol that lives across Pixie Portal.
// No explanation. No tutorial. It just appears.
// The more you find it, the more it responds.

(function () {
    // The mark: a ringed asterisk — circle, 4 spokes, 4 cardinal dots
    const SVG = [
        '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">',
        '<circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="0.9" opacity="0.7"/>',
        '<circle cx="20" cy="20" r="3.5" fill="currentColor" opacity="0.85"/>',
        '<line x1="20" y1="3" x2="20" y2="37" stroke="currentColor" stroke-width="0.7"/>',
        '<line x1="3" y1="20" x2="37" y2="20" stroke="currentColor" stroke-width="0.7"/>',
        '<line x1="6.8" y1="6.8" x2="33.2" y2="33.2" stroke="currentColor" stroke-width="0.4" opacity="0.5"/>',
        '<line x1="33.2" y1="6.8" x2="6.8" y2="33.2" stroke="currentColor" stroke-width="0.4" opacity="0.5"/>',
        '<circle cx="20" cy="3" r="1.4" fill="currentColor"/>',
        '<circle cx="20" cy="37" r="1.4" fill="currentColor"/>',
        '<circle cx="3" cy="20" r="1.4" fill="currentColor"/>',
        '<circle cx="37" cy="20" r="1.4" fill="currentColor"/>',
        '</svg>',
    ].join('');

    const MESSAGES = [
        'the mark is older than the portal.',
        'you found it.',
        'it watches too.',
        'draw it and see what answers.',
        'the garden has one too.',
        'not everything here is made of light.',
        'you were meant to find this.',
        'keep looking.',
    ];

    function getMem() {
        try { return JSON.parse(localStorage.getItem('ppMem') || '{}'); }
        catch (e) { return {}; }
    }

    function saveMem(m) {
        try { localStorage.setItem('ppMem', JSON.stringify(m)); } catch (e) {}
    }

    function showMessage(text) {
        const old = document.getElementById('sigil-msg');
        if (old) old.remove();

        const el = document.createElement('div');
        el.id = 'sigil-msg';
        el.textContent = text;
        el.style.cssText = [
            'position:fixed',
            'bottom:72px',
            'left:22px',
            'color:#b496ff',
            'font-family:Quicksand,sans-serif',
            'font-size:10px',
            'letter-spacing:2.5px',
            'line-height:1.6',
            'max-width:180px',
            'opacity:0',
            'transition:opacity 0.7s ease',
            'z-index:9998',
            'pointer-events:none',
        ].join(';');
        document.body.appendChild(el);

        requestAnimationFrame(() => {
            el.style.opacity = '0.55';
            setTimeout(() => {
                el.style.opacity = '0';
                setTimeout(() => el.remove(), 800);
            }, 3200);
        });
    }

    function init() {
        const mem    = getMem();
        const clicks = mem.sigilClicks || 0;

        // Base opacity climbs slowly with discovery
        const baseOpacity = Math.min(0.035 + clicks * 0.007, 0.2);

        const wrap = document.createElement('div');
        wrap.id = 'pixie-sigil';
        wrap.innerHTML = SVG;
        wrap.setAttribute('aria-hidden', 'true');
        wrap.style.cssText = [
            'position:fixed',
            'bottom:24px',
            'left:24px',
            'width:32px',
            'height:32px',
            'color:#b496ff',
            `opacity:${baseOpacity}`,
            'cursor:pointer',
            'z-index:9997',
            'transition:opacity 1.6s ease, transform 1.6s ease',
            'pointer-events:auto',
            '-webkit-tap-highlight-color:transparent',
            'user-select:none',
        ].join(';');

        document.body.appendChild(wrap);

        // Random activation on load — 1-in-15 chance the sigil "wakes"
        if (Math.random() < 0.067) {
            const delay = 1200 + Math.random() * 4000;
            setTimeout(() => {
                wrap.style.opacity = Math.min(0.4 + clicks * 0.025, 0.7).toString();
                wrap.style.transform = 'rotate(45deg) scale(1.2)';
                setTimeout(() => {
                    wrap.style.opacity = baseOpacity.toString();
                    wrap.style.transform = '';
                }, 2400);
            }, delay);
        }

        // Autonomous pulse after 3+ clicks
        if (clicks >= 3) {
            setInterval(() => {
                if (Math.random() < 0.25) {
                    const current = parseFloat(wrap.style.opacity);
                    wrap.style.opacity = Math.min(current + 0.14, 0.5).toString();
                    setTimeout(() => { wrap.style.opacity = baseOpacity.toString(); }, 1600);
                }
            }, 9000);
        }

        // Click handler
        wrap.addEventListener('click', function (e) {
            e.stopPropagation();

            const m = getMem();
            const n = (m.sigilClicks || 0) + 1;
            m.sigilClicks = n;
            saveMem(m);

            // Also update PortalMemory if it's loaded
            if (window.PortalMemory && window.PortalMemory.recordSigil) {
                window.PortalMemory.recordSigil();
            }

            // Visual response — spin and flare
            wrap.style.opacity = '0.75';
            wrap.style.transform = 'rotate(180deg) scale(1.35)';
            setTimeout(() => {
                wrap.style.opacity = baseOpacity.toString();
                wrap.style.transform = '';
            }, 900);

            // Messages unlock after 7 clicks, cycle through them
            if (n >= 7) {
                showMessage(MESSAGES[(n - 7) % MESSAGES.length]);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
