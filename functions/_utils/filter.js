// Content filter — blocks slurs, severe profanity, and crisis content.
// Each entry is a regex tested against the normalized input.
// Normalization: lowercase, common leet-speak substitutions, collapse repeated chars.

// Crisis terms — checked separately so callers can show a 988 prompt instead of a generic block.
const CRISIS = [
    /\bsuicid/,                         // suicide, suicidal, suicides
    /kill\s*my\s*self/,                 // kill myself / kill my self
    /\bkms\b/,                          // kms
    /end\s*(it\s*all|my\s*life)/,       // end it all / end my life
    /self[\s-]?harm/,                   // self harm / self-harm
    /cut\s*my\s*self/,                  // cut myself
    /want\s*to\s*die/,                  // want to die
];

const BLOCKED = [
    // ── Racial / ethnic slurs ──
    /\bn[i1!]+gg[ae3]+r?s?\b/,
    /\bn[i1!]+gg[a4@]+s?\b/,
    /\bch[i1!]+nk(s)?\b/,
    /\bsp[i1!]+c(s)?\b/,
    /\bk[i1!]+ke(s)?\b/,
    /\bw[e3]+tb[a4@]ck(s)?\b/,
    /\bg[o0]+[o0]+k(s)?\b/,
    /\bc[o0]+[o0]+n(s)?\b/,
    /\bj[i1!]+gb[a4@]b[o0]+\b/,
    /\bp[o0]+rch\s*m[o0]+nk[e3]+y\b/,
    /\br[a4@]+gh[e3]+[a4@]+d(s)?\b/,
    /\bt[o0]+w[e3]+lh[e3]+[a4@]+d(s)?\b/,
    /\bs[a4@]+nd\s*n[i1!]+gg[ae3]+r\b/,
    /\bb[e3]+[a4@]+n[e3]+r(s)?\b/,
    /\bz[i1!]+pp[e3]+rh[e3]+[a4@]+d\b/,
    /\bsl[o0]+p[e3]+(s)?\b/,
    /\bh[e3]+[e3]+b(s)?\b/,
    /\bh[y]+m[i1!]+[e3]+(s)?\b/,
    /\bw[o0]+p(s)?\b/,
    /\bd[a4@]+g[o0]+(s)?\b/,
    /\bcr[a4@]+ck[e3]+r(s)?\b/,

    // ── Homophobic / transphobic slurs ──
    /\bf[a4@]+gg?[o0]+t(s)?\b/,
    /\bd[y]+k[e3]+(s)?\b/,
    /\btr[a4@]+nn[yi]+(s)?\b/,
    /\bsh[e3]+m[a4@]+l[e3]+(s)?\b/,

    // ── Severe profanity ──
    /f+[u\*]+c+k+/,
    /\bs+h+[i1!]+t+\b/,
    /\bc+u+n+t+\b/,
    /m+[o0]+t+h+[e3]+r+f+[u\*]+c+k/,
    /\ba+s+s+h+[o0]+l+[e3]+\b/,
    /\bb+[i1!]+t+c+h+\b/,
    /\bd+[i1!]+c+k+h+[e3]+[a4@]+d\b/,
    /\bc+[o0]+c+k+s+u+c+k/,

    // ── Sexual content ──
    /\bp+[o0]+r+n+\b/,
    /\bp+[o0]+r+n+[o0]+\b/,
    /\bn+[u]+d+[e3]+\b/,
    /\bn+[u]+d+[e3]+s\b/,
    /\bs+[e3]+x+[yu]+[a4@]+l\b/,
    /\bs+[e3]+x+t+[i1!]+ng\b/,
    /\bn+[u]+d+[e3]+s\b/,
    /\bc+[o0]+c+k+\b/,
    /\bd+[i1!]+c+k+\b/,
    /\bp+[u]+s+s+y\b/,
    /\bt+[i1!]+t+s?\b/,
    /\bb+[o0]+[o0]+b+s?\b/,
    /\ba+n+[a4@]+l\b/,
    /\bb+l+[o0]+w+j+[o0]+b\b/,
    /\bh+[a4@]+n+d+j+[o0]+b\b/,
    /\bj+[e3]+r+k+[i1!]+ng+[o0]+f+f\b/,
    /\bm+[a4@]+s+t+[u]+r+b+[a4@]+t/,
    /\bc+[u]+m+sh+[o0]+t\b/,
    /\bj+[i1!]+z+z\b/,
    /\bc+[u]+m\b/,
    /\bw+h+[o0]+r+[e3]\b/,
    /\bs+l+[u]+t+\b/,
    /\bs+k+[a4@]+nk\b/,
    /\bh+[o0]+[o0]+k+[e3]+r\b/,
    /\bp+[e3]+d+[o0]\b/,
    /\bp+[e3]+d+[o0]+ph+[i1!]+l/,
    /\bc+h+[i1!]+l+d+p+[o0]+r+n/,
    /\br+[a4@]+p+[e3]+\b/,
    /\br+[a4@]+p+[i1!]+s+t\b/,
];

function normalize(text) {
    return text
        .toLowerCase()
        // leet speak
        .replace(/[4@]/g, 'a')
        .replace(/[3]/g, 'e')
        .replace(/[1!|]/g, 'i')
        .replace(/[0]/g, 'o')
        .replace(/[$]/g, 's')
        // collapse runs of identical letters (heeelllo → hello)
        .replace(/(.)\1{2,}/g, '$1$1');
}

export function isCrisis(text) {
    if (!text || typeof text !== 'string') return false;
    const norm = normalize(text);
    return CRISIS.some(pattern => pattern.test(norm));
}

export function isBlocked(text) {
    if (!text || typeof text !== 'string') return false;
    const norm = normalize(text);
    return BLOCKED.some(pattern => pattern.test(norm));
}
