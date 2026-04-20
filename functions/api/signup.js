import bcrypt from "bcryptjs";
import { createSessionCookie } from "../_utils/auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const { username, email, password, display_name } = await request.json();
    if (!username || !email || !password) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const hash = await bcrypt.hash(password, 10);
    const res = await env.DB.prepare("INSERT INTO users (username, email, password_hash, display_name, avatar_emoji, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(username.toLowerCase(), email.toLowerCase(), hash, display_name || username, "✦", Date.now() / 1000).run();
    const userId = res.meta.last_row_id;
    const cookie = await createSessionCookie(env, userId);
    return new Response(JSON.stringify({ success: true, user: { id: userId, username, display_name: display_name || username, avatar_emoji: "✦" } }), { headers: { "Content-Type": "application/json", "Set-Cookie": cookie } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Username or email already taken" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
