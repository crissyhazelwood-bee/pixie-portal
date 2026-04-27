import { getSessionUserId } from "../_utils/auth.js";
import { ensureStateTables, logPixieEvent, resp, safeJsonParse } from "../_utils/state.js";

const ALLOWED = new Set([
  "portal_chamber_opened",
  "portal_returned",
  "tarot_chamber_drawn",
  "dream_chamber_opened",
  "dream_entry_opened",
  "dream_entry_created",
  "charm_chamber_opened",
  "charm_opened",
  "charm_equipped",
  "altar_piece_opened",
  "altar_chamber_saved",
  "altar_upgrade_clicked",
  "vault_upgrade_clicked",
  "generation_started",
  "generation_completed",
  "loki_provider_failed",
  "loki_degraded_mode",
  "loki_recovered",
  "memory_viewed",
  "memory_exported",
  "memory_disabled"
]);

export async function onRequestGet({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  await ensureStateTables(env);
  const { results } = await env.DB.prepare(
    "SELECT id, event_type, source, payload, created_at FROM pixie_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 80"
  ).bind(userId).all();
  return resp({ events: results.map(row => ({ ...row, payload: safeJsonParse(row.payload, {}) })) });
}

export async function onRequestPost({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const eventType = String(body.event_type || body.type || "").slice(0, 80);
  if (!ALLOWED.has(eventType)) return resp({ error: "invalid_event_type" }, 400);
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  await logPixieEvent(env, userId, eventType, payload, body.source || "site");
  return resp({ success: true });
}
