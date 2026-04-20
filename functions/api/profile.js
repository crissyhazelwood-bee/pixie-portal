import { getSessionUserId } from "../_utils/auth.js";
export async function onRequestPut({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const { display_name, bio, avatar_emoji } = await request.json();
  await env.DB.prepare("UPDATE users SET display_name=?, bio=?, avatar_emoji=? WHERE id=?").bind(display_name, bio, avatar_emoji, userId).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
