import { getSessionUserId } from "../../_utils/auth.js";
export async function onRequestGet({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const { results } = await env.DB.prepare("SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").bind(userId).all();
  return new Response(JSON.stringify({ scores: results }), { headers: { "Content-Type": "application/json" } });
}
export async function onRequestPost({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const { game, score, details } = await request.json();
  await env.DB.prepare("INSERT INTO scores (user_id, game, score, details, created_at) VALUES (?, ?, ?, ?, ?)").bind(userId, game, score, JSON.stringify(details || {}), Date.now() / 1000).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
