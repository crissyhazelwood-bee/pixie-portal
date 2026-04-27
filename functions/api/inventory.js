import { getSessionUserId } from "../_utils/auth.js";
import { clampText, ensureStateTables, logPixieEvent, nowSeconds, resp, safeJsonParse } from "../_utils/state.js";

function sanitizeItem(body = {}) {
  const itemId = clampText(body.item_id || body.id, 80);
  const itemType = clampText(body.item_type || body.type || "charm", 40);
  const item = body.item && typeof body.item === "object" ? body.item : {};
  return {
    itemId,
    itemType,
    item: JSON.stringify(item).slice(0, 3000)
  };
}

export async function onRequestGet({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  await ensureStateTables(env);
  const { results } = await env.DB.prepare(
    "SELECT item_id, item_type, item_json, equipped, created_at, updated_at FROM pixie_inventory WHERE user_id = ? ORDER BY updated_at DESC, created_at DESC"
  ).bind(userId).all();
  return resp({ inventory: results.map(row => ({ ...row, item: safeJsonParse(row.item_json, {}), equipped: !!row.equipped })) });
}

export async function onRequestPost({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  await ensureStateTables(env);
  const body = await request.json().catch(() => ({}));
  const { itemId, itemType, item } = sanitizeItem(body);
  if (!itemId) return resp({ error: "missing_item_id" }, 400);
  const now = nowSeconds();
  await env.DB.prepare(
    "INSERT INTO pixie_inventory (user_id, item_id, item_type, item_json, equipped, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?) ON CONFLICT(user_id, item_id) DO UPDATE SET item_type = excluded.item_type, item_json = excluded.item_json, updated_at = excluded.updated_at"
  ).bind(userId, itemId, itemType, item, now, now).run();
  return resp({ success: true, item_id: itemId, item_type: itemType });
}

export async function onRequestPatch({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ error: "Unauthorized" }, 401);
  await ensureStateTables(env);
  const body = await request.json().catch(() => ({}));
  const itemId = clampText(body.item_id || body.id, 80);
  if (!itemId) return resp({ error: "missing_item_id" }, 400);
  const equip = body.equipped !== false;
  const { results } = await env.DB.prepare(
    "SELECT item_type FROM pixie_inventory WHERE user_id = ? AND item_id = ?"
  ).bind(userId, itemId).all();
  if (!results[0]) return resp({ error: "item_not_found" }, 404);
  if (equip) {
    await env.DB.prepare("UPDATE pixie_inventory SET equipped = 0, updated_at = ? WHERE user_id = ? AND item_type = ?")
      .bind(nowSeconds(), userId, results[0].item_type).run();
  }
  await env.DB.prepare("UPDATE pixie_inventory SET equipped = ?, updated_at = ? WHERE user_id = ? AND item_id = ?")
    .bind(equip ? 1 : 0, nowSeconds(), userId, itemId).run();
  await logPixieEvent(env, userId, equip ? "charm_equipped" : "charm_opened", { item_id: itemId, item_type: results[0].item_type }, "inventory");
  return resp({ success: true, item_id: itemId, equipped: equip });
}
