import { getSessionUserId } from "../_utils/auth.js";
export async function onRequestPut({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const { display_name, bio, avatar_emoji } = await request.json();
  // BUG-14 fix: default missing fields to empty string so we never store NULL
  // BUG-18 fix: enforce field length limits
  const safeName = (display_name || "").slice(0, 40);
  const safeBio = (bio || "").slice(0, 500);
  const safeEmoji = (avatar_emoji || "✦").slice(0, 10);
  await env.DB.prepare("UPDATE users SET display_name=?, bio=?, avatar_emoji=? WHERE id=?").bind(safeName, safeBio, safeEmoji, userId).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
