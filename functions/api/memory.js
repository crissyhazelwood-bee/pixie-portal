import { getSessionUserId } from "../_utils/auth.js";
import { ensureStateTables, logPixieEvent, nowSeconds, resp, safeJsonParse } from "../_utils/state.js";

function boundedObject(value, max = 2000) {
  try {
    const text = JSON.stringify(value || {});
    if (text.length > max) return {};
    return JSON.parse(text);
  } catch (_) {
    return {};
  }
}

function sanitizeMemory(input = {}) {
  const preferences = input.preferences && typeof input.preferences === "object"
    ? boundedObject(input.preferences)
    : {};
  const altarSummary = input.altarSummary && typeof input.altarSummary === "object"
    ? boundedObject(input.altarSummary)
    : {};
  const herbology = input.herbology && typeof input.herbology === "object"
    ? boundedObject(input.herbology)
    : {};
  return {
    favoriteColors: Array.isArray(input.favoriteColors) ? input.favoriteColors.slice(0, 12).map(v => String(v).slice(0, 40)) : [],
    favoriteThemes: Array.isArray(input.favoriteThemes) ? input.favoriteThemes.slice(0, 12).map(v => String(v).slice(0, 80)) : [],
    notes: String(input.notes || "").slice(0, 1200),
    preferences,
    altarSummary,
    herbology,
    lastSavedFrom: String(input.lastSavedFrom || "site").slice(0, 80)
  };
}

export async function onRequestGet({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  await ensureStateTables(env);
  const { results } = await env.DB.prepare("SELECT * FROM pixie_memory_state WHERE user_id = ?").bind(userId).all();
  const row = results[0] || { disabled: 0, memory_json: "{}" };
  await logPixieEvent(env, userId, "memory_viewed", {}, "memory");
  return resp({ disabled: !!row.disabled, memory: safeJsonParse(row.memory_json, {}), updated_at: row.updated_at || null });
}

export async function onRequestPut({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  await ensureStateTables(env);
  const body = await request.json().catch(() => ({}));
  const memory = sanitizeMemory(body.memory || body);
  await env.DB.prepare(
    "INSERT INTO pixie_memory_state (user_id, disabled, memory_json, updated_at) VALUES (?, 0, ?, ?) ON CONFLICT(user_id) DO UPDATE SET memory_json = excluded.memory_json, disabled = 0, updated_at = excluded.updated_at"
  ).bind(userId, JSON.stringify(memory), nowSeconds()).run();
  return resp({ success: true, memory });
}

export async function onRequestDelete({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  await ensureStateTables(env);
  await env.DB.prepare(
    "INSERT INTO pixie_memory_state (user_id, disabled, memory_json, updated_at) VALUES (?, 1, '{}', ?) ON CONFLICT(user_id) DO UPDATE SET disabled = 1, memory_json = '{}', updated_at = excluded.updated_at"
  ).bind(userId, nowSeconds()).run();
  await logPixieEvent(env, userId, "memory_disabled", {}, "memory");
  return resp({ success: true, disabled: true });
}
