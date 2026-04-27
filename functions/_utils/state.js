export const jsonHeaders = { "Content-Type": "application/json" };

export function resp(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

export function nowSeconds() {
  return Date.now() / 1000;
}

export function safeJsonParse(value, fallback = null) {
  try { return value ? JSON.parse(value) : fallback; } catch (_) { return fallback; }
}

export function clampText(value, max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function ensureStateTables(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS portal_players (
    user_id INTEGER PRIMARY KEY,
    points INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_daily_at REAL NOT NULL DEFAULT 0,
    garden TEXT NOT NULL DEFAULT '{}',
    plot TEXT NOT NULL DEFAULT '[]',
    placed_json TEXT NOT NULL DEFAULT '[]',
    created_at REAL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS pixie_memory_state (
    user_id INTEGER PRIMARY KEY,
    disabled INTEGER NOT NULL DEFAULT 0,
    memory_json TEXT NOT NULL DEFAULT '{}',
    updated_at REAL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS pixie_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_type TEXT NOT NULL,
    source TEXT DEFAULT '',
    payload TEXT DEFAULT '{}',
    created_at REAL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS pixie_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_json TEXT DEFAULT '{}',
    equipped INTEGER NOT NULL DEFAULT 0,
    created_at REAL,
    updated_at REAL,
    UNIQUE(user_id, item_id)
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS generation_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_type TEXT NOT NULL,
    provider TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'queued',
    cost INTEGER NOT NULL DEFAULT 0,
    prompt TEXT DEFAULT '',
    result_url TEXT DEFAULT '',
    external_id TEXT DEFAULT '',
    metadata TEXT DEFAULT '{}',
    created_at REAL,
    updated_at REAL
  )`).run();
}

export async function logPixieEvent(env, userId, eventType, payload = {}, source = "site") {
  await ensureStateTables(env);
  const safeType = clampText(eventType, 80) || "unknown";
  const safeSource = clampText(source, 80);
  const safePayload = JSON.stringify(payload || {}).slice(0, 4000);
  await env.DB.prepare(
    "INSERT INTO pixie_events (user_id, event_type, source, payload, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(userId || null, safeType, safeSource, safePayload, nowSeconds()).run();
}

export async function getOrCreatePortalPlayer(env, userId) {
  await ensureStateTables(env);
  let { results } = await env.DB.prepare("SELECT * FROM portal_players WHERE user_id = ?").bind(userId).all();
  if (!results[0]) {
    await env.DB.prepare(
      "INSERT INTO portal_players (user_id, points, streak, last_daily_at, garden, plot, placed_json, created_at) VALUES (?, 0, 0, 0, '{}', '[]', '[]', ?)"
    ).bind(userId, nowSeconds()).run();
    ({ results } = await env.DB.prepare("SELECT * FROM portal_players WHERE user_id = ?").bind(userId).all());
  }
  return results[0];
}
