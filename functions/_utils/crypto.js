// WebCrypto-based password utilities — works natively in Cloudflare Workers
// Replaces bcryptjs which requires Node.js APIs not available in Workers

export async function hashPassword(password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
    );
    const hash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2:${saltHex}:${hash}`;
}

export async function verifyPassword(password, stored) {
    if (!stored || !stored.startsWith('pbkdf2:')) return false;
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const [, saltHex, storedHash] = parts;
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
    // BUG-13 fix: decode stored hash to bytes so we can do constant-time comparison
    const storedBytes = new Uint8Array(storedHash.match(/.{2}/g).map(b => parseInt(b, 16)));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
    );
    const computedBytes = new Uint8Array(bits);
    // Constant-time byte comparison — no short-circuit on mismatch
    let diff = 0;
    for (let i = 0; i < computedBytes.length; i++) diff |= computedBytes[i] ^ storedBytes[i];
    return diff === 0;
}

export function generateRecoveryCode() {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    return hex.match(/.{4}/g).join('-'); // e.g. A3F2-B1C4-D5E6-A7B8-C9D0-E1F2
}

export async function hashRecoveryCode(code) {
    const clean = code.replace(/-/g, '').toUpperCase();
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(clean));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
