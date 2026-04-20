export async function getUserById(env, id) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).bind(id).all();
  return results[0] || null;
}
