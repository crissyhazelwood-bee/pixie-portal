import { getSessionUserId } from "../../_utils/auth.js";
export async function onRequestGet({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const { results } = await env.DB.prepare("SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
  return new Response(JSON.stringify({ entries: results }), { headers: { "Content-Type": "application/json" } });
}
export async function onRequestPost({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const { title, content, mood } = await request.json();
  await env.DB.prepare("INSERT INTO journal_entries (user_id, title, content, mood, created_at) VALUES (?, ?, ?, ?, ?)").bind(userId, title, content, mood || "neutral", Date.now() / 1000).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
