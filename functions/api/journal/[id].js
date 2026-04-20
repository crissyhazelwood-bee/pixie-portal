import { getSessionUserId } from "../../_utils/auth.js";
export async function onRequestDelete({ params, request, env }) {
  const userId = await getSessionUserId(env, request);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  await env.DB.prepare("DELETE FROM journal_entries WHERE id = ? AND user_id = ?").bind(params.id, userId).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
