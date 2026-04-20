export async function onRequestGet({ params, env }) {
  const { results } = await env.DB.prepare(
    "SELECT s.score, s.created_at, u.display_name, u.avatar_emoji FROM scores s JOIN users u ON s.user_id = u.id WHERE s.game = ? ORDER BY s.score DESC LIMIT 20"
  ).bind(params.game).all();
  return new Response(JSON.stringify({ leaderboard: results }), {
    headers: { "Content-Type": "application/json" },
  });
}
