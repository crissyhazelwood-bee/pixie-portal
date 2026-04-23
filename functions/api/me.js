import { getSessionUserId } from "../_utils/auth.js";
import { getUserById } from "../_utils/db.js";
export async function onRequestGet({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ user: null }), { headers: { "Content-Type": "application/json" } });
  const user = await getUserById(env, userId);
  if (!user) return new Response(JSON.stringify({ user: null }), { headers: { "Content-Type": "application/json" } });
  return new Response(JSON.stringify({ user: { id: user.id, username: user.username, display_name: user.display_name, bio: user.bio, avatar_emoji: user.avatar_emoji, animation_credits: user.animation_credits ?? 0, fairy_purchased: !!user.fairy_purchased, is_admin: !!user.is_admin } }), { headers: { "Content-Type": "application/json" } });
}
