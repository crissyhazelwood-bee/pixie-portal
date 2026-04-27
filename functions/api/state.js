import { getSessionUserId } from "../_utils/auth.js";
import { getUserById } from "../_utils/db.js";
import { ensureStateTables, getOrCreatePortalPlayer, resp, safeJsonParse } from "../_utils/state.js";

export async function onRequestGet({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return resp({ user: null }, 401);
  await ensureStateTables(env);

  const user = await getUserById(env, userId);
  if (!user) return resp({ user: null }, 404);

  const player = await getOrCreatePortalPlayer(env, userId);
  const { results: memoryRows } = await env.DB.prepare(
    "SELECT * FROM pixie_memory_state WHERE user_id = ?"
  ).bind(userId).all();
  const { results: inventoryRows } = await env.DB.prepare(
    "SELECT item_id, item_type, item_json, equipped, created_at, updated_at FROM pixie_inventory WHERE user_id = ? ORDER BY updated_at DESC, created_at DESC LIMIT 200"
  ).bind(userId).all();
  const { results: jobRows } = await env.DB.prepare(
    "SELECT id, job_type, provider, status, cost, prompt, result_url, external_id, metadata, created_at, updated_at FROM generation_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 30"
  ).bind(userId).all();

  const memory = memoryRows[0] || { disabled: 0, memory_json: "{}" };
  const appearance = safeJsonParse(user.appearance, {});

  return resp({
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      bio: user.bio,
      avatar_emoji: user.avatar_emoji,
      animation_credits: user.animation_credits ?? 0,
      fairy_purchased: !!user.fairy_purchased,
      first_purchase_done: !!user.first_purchase_done,
      appearance
    },
    portal: {
      points: player.points || 0,
      sparkles: player.points || 0,
      streak: player.streak || 0,
      last_daily_at: player.last_daily_at || 0,
      garden: safeJsonParse(player.garden, {}),
      plot: safeJsonParse(player.plot, []),
      placed: safeJsonParse(player.placed_json, [])
    },
    memory: {
      disabled: !!memory.disabled,
      data: safeJsonParse(memory.memory_json, {})
    },
    inventory: inventoryRows.map(row => ({
      item_id: row.item_id,
      item_type: row.item_type,
      item: safeJsonParse(row.item_json, {}),
      equipped: !!row.equipped,
      created_at: row.created_at,
      updated_at: row.updated_at
    })),
    generation_jobs: jobRows.map(row => ({
      ...row,
      metadata: safeJsonParse(row.metadata, {})
    }))
  });
}
