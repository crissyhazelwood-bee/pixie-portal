// BUG-16 fix: select only non-sensitive columns — never expose password_hash or recovery_code_hash to callers
export async function getUserById(env, id) {
  const { results } = await env.DB.prepare(
    "SELECT id, username, email, display_name, bio, avatar_emoji, animation_credits, fairy_purchased, is_admin, session_version, created_at FROM users WHERE id = ?"
  ).bind(id).all();
  return results[0] || null;
}
