import { getSessionUserId } from "../../_utils/auth.js";
import { analyzeSafety } from "../../_utils/filter.js";

function withSafety(entry) {
  const safety = analyzeSafety(`${entry.title || ""}\n${entry.content || ""}`);
  return safety.flagged ? { ...entry, safety } : entry;
}

export async function onRequestGet({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const { results } = await env.DB.prepare("SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
  return new Response(JSON.stringify({ entries: results.map(withSafety) }), { headers: { "Content-Type": "application/json" } });
}
export async function onRequestPost({ request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const { title, content, mood } = await request.json();
  const safety = analyzeSafety(`${title || ""}\n${content || ""}`);
  const result = await env.DB.prepare("INSERT INTO journal_entries (user_id, title, content, mood, created_at) VALUES (?, ?, ?, ?, ?)").bind(userId, title, content, mood || "neutral", Date.now() / 1000).run();
  return new Response(JSON.stringify({
    success: true,
    id: result.meta.last_row_id,
    safety: safety.flagged ? safety : null,
    saved_private: true,
  }), { headers: { "Content-Type": "application/json" } });
}
