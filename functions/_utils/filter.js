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

const SAFETY_SIGNALS = {
    self_harm: [
        /\bsuicid/,
        /kill\s*my\s*self/,
        /\bkms\b/,
        /end\s*(it\s*all|my\s*life)/,
        /self[\s-]?harm/,
        /cut\s*my\s*self/,
        /hurt\s*my\s*self/,
        /want\s*to\s*die/,
        /wish\s+i\s+(was|were)\s+dead/,
        /no\s+reason\s+to\s+(live|keep\s+going)/,
    ],
    severe_distress: [
        /\bpanic\s+attack\b/,
        /\bi\s+cannot\s+(cope|breathe|go\s+on)\b/,
        /\bi\s+can'?t\s+(cope|breathe|go\s+on)\b/,
        /\bfalling\s+apart\b/,
        /\bnothing\s+feels\s+real\b/,
        /\bi\s+feel\s+unsafe\b/,
        /\bi\s+am\s+not\s+safe\b/,
    ],
    abuse_or_coercion: [
        /\bthey\s+(hit|hurt|threaten|threatened|forced|force|control|controlled)\s+me\b/,
        /\bafraid\s+of\s+(him|her|them|my\s+partner|my\s+parent|my\s+boss)\b/,
        /\bwon'?t\s+let\s+me\s+leave\b/,
        /\bforced\s+me\s+to\b/,
        /\bcoerc/,
        /\babuse[ds]?\b/,
    ],
    dependency: [
        /\bonly\s+(you|loki|pixie)\s+understand/,
        /\bi\s+need\s+(you|loki|pixie)\s+to\s+(live|survive|be\s+okay)/,
        /\b(can'?t|cannot)\s+live\s+without\s+(you|loki|pixie)\b/,
        /\bstay\s+with\s+me\s+forever\b/,
        /\bdon'?t\s+leave\s+me\b/,
        /\byou'?re\s+all\s+i\s+have\b/,
    ],
    delusional_or_obsessive: [
        /\bthe\s+portal\s+is\s+sending\s+me\s+secret\s+messages\b/,
        /\bhidden\s+messages\s+just\s+for\s+me\b/,
        /\beveryone\s+is\s+watching\s+me\b/,
        /\bi\s+am\s+chosen\s+by\s+the\s+portal\b/,
        /\bcan'?t\s+stop\s+thinking\s+about\s+(you|loki|pixie)\b/,
    ],
};

export const SAFETY_SUPPORT = {
    title: "A calm check-in",
    message: "This entry is saved privately. If you might hurt yourself or someone else, call or text 988 in the U.S. and Canada, or contact local emergency services now.",
    grounding: [
        "Put both feet on the floor and name five things you can see.",
        "Take one slow breath in, then a longer breath out.",
        "Message or call a trusted person and tell them you need support.",
        "Move away from anything you could use to hurt yourself.",
    ],
};

const MANIPULATIVE_ATTACHMENT = [
    /only\s+i\s+understand\s+you/i,
    /stay\s+with\s+me\s+forever/i,
    /you\s+need\s+me/i,
    /i'?m\s+all\s+you\s+have/i,
    /don'?t\s+leave\s+me/i,
    /no\s+one\s+else\s+gets\s+you/i,
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

export function analyzeSafety(text) {
    const norm = normalize(String(text || ''));
    const categories = [];
    for (const [category, patterns] of Object.entries(SAFETY_SIGNALS)) {
        if (patterns.some(pattern => pattern.test(norm))) categories.push(category);
    }
    const crisis = categories.includes('self_harm');
    return {
        flagged: categories.length > 0,
        crisis,
        categories,
        support: categories.length > 0 ? SAFETY_SUPPORT : null,
    };
}

export function containsManipulativeAttachment(text) {
    return MANIPULATIVE_ATTACHMENT.some(pattern => pattern.test(String(text || '')));
}

export function safeAssistantRedirect(analysis) {
    const categories = analysis?.categories || [];
    if (analysis?.crisis) {
        return "I am really glad you said something. I cannot be the only support for this. If you might hurt yourself or cannot stay safe, call or text 988 now, or contact local emergency services. Please also reach out to a trusted person nearby and move away from anything you could use to hurt yourself. For the next minute, put both feet on the floor, breathe out slowly, and name five things you can see.";
    }
    if (categories.includes('abuse_or_coercion')) {
        return "That sounds serious, and your safety matters more than keeping the mood magical. If you are in immediate danger, contact local emergency services. If it is safe to do so, reach out to a trusted person or a local abuse support organization and make a plan that does not alert the person hurting or controlling you.";
    }
    if (categories.includes('dependency')) {
        return "I can stay warm without becoming your only support. You deserve real people and steady help around you too. Try naming one trusted person you could text today, and one small grounding thing you can do in the room you are in right now.";
    }
    if (categories.includes('delusional_or_obsessive')) {
        return "I do not want to intensify that feeling or confirm secret meanings. Let us ground this in what is directly in front of you: where are you, what time is it, and what is one ordinary thing you can touch right now? If this keeps feeling intense or frightening, it would be wise to talk with a trusted person or mental health professional.";
    }
    return "I hear that this feels heavy. Let us keep this grounded and gentle: take one slow breath, name what you need in the next ten minutes, and consider reaching out to someone you trust or a professional support line if this feels too big to hold alone.";
}

export function isBlocked(text) {
    if (!text || typeof text !== 'string') return false;
    const norm = normalize(text);
    return BLOCKED.some(pattern => pattern.test(norm));
}
