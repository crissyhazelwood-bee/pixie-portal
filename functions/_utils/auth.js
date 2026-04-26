// BUG-06 fix: session versioning + cookie expiry
// Sessions now embed a version number. Incrementing session_version in the DB
// invalidates all previously issued cookies (e.g. after password reset/recovery).
// Backwards-compatible: old cookies without a version are treated as version 0.

const COOKIE_NAME = "pixie_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function sign(env, value) {
  const enc = new TextEncoder();
  const keyData = enc.encode(env.SESSION_SECRET);
  const key = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${value}.${b64}`;
}

async function verify(env, signed) {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const enc = new TextEncoder();
  const keyData = enc.encode(env.SESSION_SECRET);
  const key = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]
  );
  const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0));
  const ok = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(value));
  return ok ? value : null;
}

export async function getSessionUserId(env, request) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  const raw = decodeURIComponent(match[1]);
  const value = await verify(env, raw);
  if (!value) return null;

  // Parse userId and session version.
  // New format: "userId:version" — old format: "userId" (backwards compat, treated as version 0)
  const colonIdx = value.indexOf(":");
  let userId, cookieVersion;
  if (colonIdx === -1) {
    userId = parseInt(value, 10);
    cookieVersion = 0;
  } else {
    userId = parseInt(value.slice(0, colonIdx), 10);
    cookieVersion = parseInt(value.slice(colonIdx + 1), 10);
  }
  if (!userId || isNaN(userId)) return null;

  // Validate against the session_version stored in the DB
  const { results } = await env.DB.prepare(
    "SELECT session_version FROM users WHERE id = ?"
  ).bind(userId).all();
  if (!results[0]) return null;
  if (cookieVersion < (results[0].session_version || 0)) return null;

  return userId;
}

// sessionVersion should be the current session_version value from the users table.
// After a password reset/recovery, pass the newly incremented version so the
// fresh cookie is valid while all old cookies are rejected.
export async function createSessionCookie(env, userId, sessionVersion = 0, request = null) {
  const signed = await sign(env, `${userId}:${sessionVersion}`);
  let secure = true;
  try {
    const url = request ? new URL(request.url) : null;
    secure = !url || url.protocol === "https:";
  } catch(e) {}
  return `${COOKIE_NAME}=${encodeURIComponent(signed)}; Path=/; HttpOnly; SameSite=Lax; ${secure ? "Secure; " : ""}Max-Age=${COOKIE_MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
}
