const COOKIE_NAME = "pixie_session";

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
  return value ? parseInt(value, 10) : null;
}

export async function createSessionCookie(env, userId) {
  const signed = await sign(env, String(userId));
  return `${COOKIE_NAME}=${encodeURIComponent(signed)}; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
}
